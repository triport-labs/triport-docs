> Live version: https://triport.io/docs/guides/stream-pending-evm-transactions

# Stream pending Ethereum and Polygon transactions

> Subscribe to pending Ethereum and Polygon transactions, get full objects where the stream serves them, and fetch bodies by hash within your read budget.

| | |
|---|---|
| **Method / Endpoint** | `n/a — tutorial` (`wss://triport.io/ws/eth`, `wss://triport.io/ws/poly` + JSON-RPC reads) |
| **Network** | Ethereum, Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request and on every HTTP call |
| **Required scope** | `eth:rpc`, `polygon:rpc` |
| **Tier / rate limit** | `newPendingTransactions` is in every plan, from the 7-day Free trial (`free`) up; body reads use `eth_read_rpc` / `polygon_read_rpc` |

A pending-transaction stream is a firehose: it tells you that a transaction
has entered the node's mempool, and nothing about whether it will be
included. This tutorial connects to it on both EVM networks, keeps only the
transactions you care about, and shows where the two networks differ. The
differences are measured, not assumed. Each output sample below comes from a
probe on 2026-09-22.

## What you need

- **An API key** from the [console](https://triport.io/app/keys), exported as
  `TRIPORT_API_KEY`.
- **A plan.** `newPendingTransactions` is allowed on every plan, including the
  7-day Free trial. `logs` needs Basic, and `newHeads` and `syncing` need Pro.
  This tutorial uses only `newPendingTransactions` and plain reads.
- **A read budget**, if you fetch bodies. `eth_getTransactionByHash` counts
  against `eth_read_rpc` (10 requests/s on the Free trial, 20 on Basic, 100 on
  Pro, 250 on Business) or `polygon_read_rpc` (15, 20, 100 and 250). Both allow
  a 2× burst. See [rate limits and tiers](../rate-limits-and-tiers.md).
- **Node.js 18 or newer** with `ws` (`npm install ws`).

## 1. What each network sends

| | Ethereum — `/ws/eth` | Polygon — `/ws/poly` |
|---|---|---|
| `["newPendingTransactions"]` | Transaction hashes | Transaction hashes |
| `["newPendingTransactions", true]` | **Full transaction objects** | Hashes. The flag is accepted and ignored. |
| `["newPendingTransactions", {"includeFullTx": true}]` | **No reply at all** — no id, no error | Hashes. The object is accepted and ignored. |

The practical consequence: on Ethereum, filter full objects locally and spend
no reads. On Polygon, you get hashes only, and every body costs one
`eth_getTransactionByHash` call from your read budget.

Try the hash stream first:

```bash
wscat -c "wss://triport.io/ws/poly" -H "x-token: $TRIPORT_API_KEY"
> {"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newPendingTransactions"]}
```

```json
{"id":1,"jsonrpc":"2.0","result":"0x366f5055757336dae269abc195e35cf9f04dc87e"}
{"jsonrpc":"2.0","method":"eth_subscription","params":{"result":"0xdb53ada11f8ec35c50170b63a1881790cc7574b5b466ce2a2acb651b19caff8d","subscription":"0x366f5055757336dae269abc195e35cf9f04dc87e"}}
```

Then fetch one body by hash with `curl`:

```bash
curl -s https://triport.io/polygon \
  -H "x-token: $TRIPORT_API_KEY" -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionByHash","params":["0xdb53ada11f8ec35c50170b63a1881790cc7574b5b466ce2a2acb651b19caff8d"]}'
```

The result is a standard transaction object: `hash`, `from`, `to`, `nonce`,
`input`, `value`, `gas`, `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas`,
`type`, `chainId`, `v`, `r`, `s`, and `blockHash` / `blockNumber` /
`transactionIndex`. By the time the probe's Polygon read ran, that
transaction had already been included, so `blockNumber` was set. The Ethereum
read of a fresh hash still had `blockNumber: null`. Handle both, and handle
`result: null`, which means the node answering the read does not know the
hash: it was dropped, replaced, or has not reached that node.

On Ethereum, `true` as the second parameter makes each notification carry the
object itself. From the probe (fields abbreviated):

```json
{"jsonrpc":"2.0","method":"eth_subscription","params":{"result":{"blockHash":null,"blockNumber":null,"chainId":"0x1","from":"0x5e2f880e09ad163120fa1cbbfe20365650bb3d35","gas":"0x5208","gasPrice":"0x77359400","hash":"0xe7ebb73d4b00deef34cfdaf22f5f8b7180258197272f677625d1b17424ca8cb1","input":"0x","nonce":"0x0","to":"0xde2b3a574af6c81cacdf89e72b30d77cb94ce7b0","transactionIndex":null,"type":"0x0","value":"0x4070ce54eeec00"},"subscription":"0x7c4659375bda93b5bff0dc5de7499a5c"}}
```

## 2. A filtered pending-transaction watcher

This program watches one or more `to` addresses. The default is each network's
native USDC contract. On Ethereum it subscribes to full objects. On Polygon it
queues hashes and fetches bodies at a fixed rate that you set below your
plan's limit. Save it as `pending.ts` and run `npx tsx pending.ts eth` or
`npx tsx pending.ts polygon`:

```ts
import WebSocket from "ws";

const KEY = process.env.TRIPORT_API_KEY!;
const CHAIN = process.argv[2] === "polygon" ? "polygon" : "eth";
const WS_URL = CHAIN === "eth" ? "wss://triport.io/ws/eth" : "wss://triport.io/ws/poly";
const RPC_URL = CHAIN === "eth" ? "https://triport.io/eth" : "https://triport.io/polygon";
const USDC = CHAIN === "eth"
  ? "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  : "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
const WATCH = new Set((process.env.WATCH_TO ?? USDC).toLowerCase().split(","));
// Keep this below your plan's eth_read_rpc / polygon_read_rpc limit.
const READS_PER_SEC = Number(process.env.READS_PER_SEC ?? 5);
const MAX_QUEUE = 1_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const seen = new Set<string>();
const queue: string[] = [];

function onTx(tx: any): void {
  if (!tx.to || !WATCH.has(tx.to.toLowerCase())) return;
  const where = tx.blockNumber === null ? "pending" : `in block ${BigInt(tx.blockNumber)}`;
  console.log(`${tx.hash} from ${tx.from} nonce ${BigInt(tx.nonce)} ${where}`);
}

async function getTx(hash: string): Promise<any> {
  for (;;) {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-token": KEY },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [hash] }),
    });
    if (res.status === 429) {
      await sleep(Number(res.headers.get("retry-after") ?? "1") * 1000);
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${body.error}: ${body.message}`);
    if (body.error) throw new Error(`RPC ${body.error.code}: ${body.error.message}`);
    return body.result; // null: dropped, replaced, or not on the node that answered
  }
}

// Fetch queued hashes at a steady rate instead of as fast as they arrive.
async function drain(): Promise<void> {
  for (;;) {
    const hash = queue.shift();
    if (!hash) { await sleep(100); continue; }
    const t0 = Date.now();
    try {
      const tx = await getTx(hash);
      if (tx) onTx(tx);
    } catch (e) {
      console.error("read failed:", (e as Error).message);
    }
    await sleep(Math.max(0, 1000 / READS_PER_SEC - (Date.now() - t0)));
  }
}

function connect(): void {
  const ws = new WebSocket(WS_URL, { headers: { "x-token": KEY } });
  const params = CHAIN === "eth" ? ["newPendingTransactions", true] : ["newPendingTransactions"];
  let acked = false;
  // A subscribe that gets no reply at all should fail loudly, not hang.
  const ackTimer = setTimeout(() => { if (!acked) { console.error("no subscribe ack"); ws.close(); } }, 10_000);

  ws.on("open", () => ws.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_subscribe", params })));

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id === 1) {
      acked = true;
      clearTimeout(ackTimer);
      if (msg.error) { console.error("subscribe failed:", msg.error); ws.close(); return; }
      console.log(`subscribed on ${CHAIN}, id ${msg.result}`);
    } else if (msg.method === "eth_subscription") {
      const r = msg.params.result;
      if (typeof r !== "string") return onTx(r); // full object (Ethereum with `true`)
      if (seen.has(r)) return;                   // skip a hash already queued
      seen.add(r);
      if (seen.size > 100_000) seen.clear();
      if (queue.length >= MAX_QUEUE) queue.shift(); // drop the oldest, never block the socket
      queue.push(r);
    } else if (msg.error) {
      console.error("server:", JSON.stringify(msg)); // error frame before a close
    }
  });

  ws.on("unexpected-response", (_req, res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => console.error(`refused: HTTP ${res.statusCode} ${body}`));
  });

  ws.on("close", (code) => {
    clearTimeout(ackTimer);
    console.log(`closed ${code}`);
    if ([4001, 4003, 4030].includes(code)) return;
    setTimeout(connect, 2_000);
  });
  ws.on("error", (e) => console.error("socket:", e.message));
}

void drain();
connect();
```

Expected output: a `subscribed` line, then one line per matching transaction.
This is from a run of `npx tsx pending.ts eth` on 2026-09-22:

```text
subscribed on eth, id 0x8486b8a84a7be2df7c980cf2fca03ab3
0x7785ff131c5352f0b41eb977314994437305df976def41408fe37a8e4032e205 from 0x902f8395b7755e6372c51ef79177d3c8aaf139c7 nonce 16 pending
0xc0834206839a9631c7190144e4490f5c96c199d7765fa4c5f3a99385d72f5d61 from 0x754e4ed3a547d2dc4e30da5bebae62b6a3b4b9fd nonce 784 pending
```

On Polygon, a line can end in `in block <n>` instead of `pending`: the
transaction was included between the hash arriving and the body being read.
A quiet watch list may print nothing for a while. That is the filter working,
not a stalled socket.

## 3. Why the queue drops instead of waiting

On Polygon, every body costs a read, and the hash stream does not slow down
to match your plan. Whether a given read budget keeps up depends on the plan
and on how busy the network is at that moment, so the watcher is built not to
depend on it:

- **reads at a fixed rate** (`READS_PER_SEC`) that you set below your plan's
  `*_read_rpc` limit, so reads never run into 429 in normal operation;
- **drops the oldest queued hash** when the queue is full, so the socket is
  never blocked by slow reads;
- **de-duplicates hashes** before queueing, so a repeated announcement never
  costs a second read.

If you need *every* transaction to or from an address rather than a sample of
pending ones, use included blocks instead: `eth_getLogs` for token events, or
`logs` over WebSocket on Basic and above
([Ethereum pub/sub](../streaming/eth-ws.md)).

## 4. Errors you will actually see

**Missing or wrong key:** HTTP 401 before the WebSocket upgrade, with this
body:

```json
{"error":"unauthorized","message":"Missing or unknown API key. Pass your key as ?api-key=<key> or the header Authorization: Bearer <key>. Create or copy a key at https://triport.io/app/keys","keys_url":"https://triport.io/app/keys"}
```

**A subscription type above your plan**, for example `newHeads` on a Free-trial
key, is stopped before it reaches the node. The server sends this frame and
closes with `4003`:

```json
{"error":"tier_insufficient","message":"Method 'newHeads' is not included in your free plan; it needs the pro plan or higher. Upgrade at https://triport.io/app/pricing?plan=pro","current_tier":"free","required_tier":"pro","method":"newHeads","category":"eth_ws_pubsub","upgrade_url":"https://triport.io/app/pricing?plan=pro"}
```

**Reads above your plan's rate** return HTTP 429 with `Retry-After`. On an
Ethereum Free-trial key:

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 10 requests/s for eth_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "eth_read_rpc",
  "limit_rps": 10,
  "burst_capacity": 20,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

**No acknowledgement at all** after the subscribe on Ethereum means the second
parameter was an object. Send the boolean `true`. The watcher's 10-second ack
timer turns that silent case into a visible error.

## What this does not do

- **It does not predict inclusion.** A pending transaction can be replaced by
  one with the same nonce, dropped, or never included. Confirm with the
  receipt once it is mined
  ([receipt returns null](https://triport.io/learn/transaction-receipt-null)).
- **It does not see every pending transaction.** It sees the mempool of the
  node behind the stream. The [mempool](https://triport.io/learn/glossary/mempool)
  differs from node to node.
- **It does not read the txpool.** `txpool_*` methods are not part of this
  stream, and on Ethereum and Polygon they carry a limited status. This
  tutorial does not depend on them.
- **It does not replay after a reconnect.** Pending transactions you missed
  while disconnected are gone from this stream. Read included blocks if you
  need completeness
  ([reconnects](https://triport.io/learn/websocket-subscription-reconnect)).
- **It does not cover other networks.** This stream is served for Ethereum and
  Polygon. BSC and Base are not part of this tutorial.

## Related

- Reference: [Ethereum pub/sub `/ws/eth`](../streaming/eth-ws.md),
  [Polygon pub/sub `/ws/poly`](../streaming/poly-ws.md),
  [`eth_getTransactionByHash` on Ethereum](../eth/json-rpc/eth_getTransactionByHash.md)
  and [on Polygon](../polygon/json-rpc/eth_getTransactionByHash.md).
- Concepts: [nonce](https://triport.io/learn/glossary/nonce),
  [nonce gaps and stuck transactions](https://triport.io/learn/evm-transaction-stuck-nonce-gap).
- Networks: [Ethereum docs](../eth/index.md), [Polygon docs](../polygon/index.md),
  the [Ethereum RPC page](https://triport.io/ethereum-rpc) and the
  [Polygon RPC page](https://triport.io/polygon-rpc).
- Plans: [pricing](https://triport.io/pricing).
