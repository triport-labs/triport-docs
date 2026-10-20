> Live version: https://triport.io/docs/guides/watch-a-solana-wallet

# Watch a Solana wallet over WebSocket

> Know when a Solana wallet changes, list the transactions behind it, and wait for finality with accountSubscribe, signatureSubscribe and a gap-fill read.

| | |
|---|---|
| **Method / Endpoint** | `n/a — tutorial` (`wss://triport.io/ws/sol` + `POST https://triport.io/sol`) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request and on every HTTP call |
| **Required scope** | `solana:rpc` |
| **Tier / rate limit** | Every plan, from the 7-day Free trial (`free`) up; reads share the `sol_read_rpc` budget |

This tutorial builds a small wallet watcher. It is the design a deposit
notifier or a wallet backend needs: a push channel that says *something
changed*, a read that says *what* changed, and a cursor that makes a dropped
socket harmless. Everything runs against live routes; the output samples come
from a probe on 2026-09-22.

## What you need

- **An API key.** Create one in the [console](https://triport.io/app/keys). The
  examples read it from `TRIPORT_API_KEY`.
- **A plan.** `accountSubscribe` and `signatureSubscribe` are in every plan's
  Solana WebSocket set, including the 7-day Free trial. Other subscriptions are
  gated higher: `logsSubscribe` and `programSubscribe` need Basic, and
  `blockSubscribe` needs Pro. This tutorial uses only the two that every plan
  has.
- **A read budget.** `getSignaturesForAddress` and `getTransaction` both count
  against `sol_read_rpc`: 20 requests/s on the Free trial, 60 on Basic, 200 on
  Pro and 600 on Business, with a 2× burst
  ([rate limits and tiers](../rate-limits-and-tiers.md)).
- **Node.js 18 or newer** with the `ws` package (`npm install ws`). Node's
  built-in `fetch` covers the HTTP calls.

## 1. Subscribe from the command line

Before writing code, confirm the key and the subscription with `wscat`:

```bash
wscat -c "wss://triport.io/ws/sol" -H "x-token: $TRIPORT_API_KEY"
> {"jsonrpc":"2.0","id":1,"method":"accountSubscribe","params":["5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",{"encoding":"base64","commitment":"confirmed"}]}
```

The server first acknowledges with a numeric subscription id. After that it
pushes an `accountNotification` whenever the account's state changes at the
chosen commitment:

```json
{"jsonrpc":"2.0","result":1,"id":1}
{"jsonrpc":"2.0","method":"accountNotification","params":{"result":{"context":{"slot":449504578},"value":{"lamports":1450455511477811,"data":["","base64"],"owner":"11111111111111111111111111111111","executable":false,"rentEpoch":18446744073709551615,"space":0}},"subscription":1}}
```

The notification carries the account's **new state** — its lamports, owner and
data — and the slot. It does not name the transaction that caused the change.
Several writes in one slot can arrive as a single notification, so the lamport
difference between two notifications can be the sum of several transfers.
That is why step 2 treats the notification as a trigger and reads the
transactions separately.

## 2. Turn the trigger into a list of transactions

The watcher keeps one cursor: the newest signature it has fully processed.
Each notification, and each reconnect, runs a catch-up that asks
[`getSignaturesForAddress`](../sol/json-rpc/getSignaturesForAddress.md) for
everything newer than that cursor (`until`), fetches each transaction with
[`getTransaction`](../sol/json-rpc/getTransaction.md), and only then advances
the cursor.

Save this as `watch-wallet.ts` and run it with
`npx tsx watch-wallet.ts <wallet>`:

```ts
import WebSocket from "ws";

const KEY = process.env.TRIPORT_API_KEY!;
const WALLET = process.argv[2] ?? "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9";
const RPC = "https://triport.io/sol";
const PAGE = 100;

interface SigInfo { signature: string; slot: number; err: unknown; blockTime: number | null }

let started = false;             // false until the first catch-up has run
let lastSeen: string | undefined; // newest processed signature; persist it in production

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  for (;;) {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json", "x-token": KEY },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (res.status === 429) {
      // Plan limit reached: wait as long as the server says, then retry.
      const wait = Number(res.headers.get("retry-after") ?? "1");
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${body.error}: ${body.message}`);
    if (body.error) throw new Error(`RPC ${body.error.code}: ${body.error.message}`);
    return body.result as T;
  }
}

async function catchUp(): Promise<void> {
  if (!started) {
    // First run: start from "now" instead of replaying the wallet's history.
    const [newest] = await rpc<SigInfo[]>("getSignaturesForAddress", [WALLET, { limit: 1 }]);
    lastSeen = newest?.signature;
    started = true;
    return;
  }
  // Walk back from the newest signature until the cursor, a page at a time.
  const fresh: SigInfo[] = [];
  let before: string | undefined;
  for (;;) {
    const page = await rpc<SigInfo[]>("getSignaturesForAddress", [
      WALLET,
      { limit: PAGE, until: lastSeen, before, commitment: "confirmed" },
    ]);
    fresh.push(...page);
    if (page.length < PAGE) break;
    before = page[page.length - 1].signature;
  }
  // Process oldest first, and advance the cursor only after each one is handled.
  for (const s of fresh.reverse()) {
    const tx = await rpc<any>("getTransaction", [
      s.signature,
      { encoding: "jsonParsed", maxSupportedTransactionVersion: 1, commitment: "confirmed" },
    ]);
    if (tx === null) return; // not readable yet: stop here, the next trigger retries
    const i = tx.transaction.message.accountKeys.findIndex((k: any) => k.pubkey === WALLET);
    const delta = (tx.meta.postBalances[i] - tx.meta.preBalances[i]) / 1e9;
    console.log(`${s.signature} slot=${s.slot} ok=${s.err === null} SOL change=${delta}`);
    lastSeen = s.signature;
  }
}

// Run catch-ups one at a time; a trigger that arrives mid-run schedules one more.
let running = false;
let again = false;
async function trigger(): Promise<void> {
  if (running) { again = true; return; }
  running = true;
  try {
    do { again = false; await catchUp(); } while (again);
  } catch (e) {
    console.error("catch-up failed:", (e as Error).message);
  } finally {
    running = false;
  }
}

function connect(): void {
  const ws = new WebSocket("wss://triport.io/ws/sol", { headers: { "x-token": KEY } });
  let ping: NodeJS.Timeout | undefined;

  ws.on("open", () => {
    ws.send(JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "accountSubscribe",
      params: [WALLET, { encoding: "base64", commitment: "confirmed" }],
    }));
    ping = setInterval(() => ws.ping(), 30_000);
    void trigger(); // close the gap left by a previous connection
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id === 1 && typeof msg.result === "number") {
      console.log("subscribed, id", msg.result);
    } else if (msg.method === "accountNotification") {
      const { context, value } = msg.params.result;
      console.log(`account changed at slot ${context.slot}, lamports ${value.lamports}`);
      void trigger();
    } else if (msg.error) {
      console.error("server:", JSON.stringify(msg)); // error frame before a close
    }
  });

  // A bad key is refused before the upgrade, with an HTTP status and a JSON body.
  ws.on("unexpected-response", (_req, res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => console.error(`refused: HTTP ${res.statusCode} ${body}`));
  });

  ws.on("close", (code, reason) => {
    clearInterval(ping);
    console.log(`closed ${code} ${reason.toString()}`);
    if ([4001, 4003, 4030].includes(code)) return; // key, plan or trial problem: retrying will not help
    setTimeout(connect, 2_000);
  });
  ws.on("error", (e) => console.error("socket:", e.message));
}

connect();
```

Expected output: one `subscribed` line, then `account changed` lines, and
after each catch-up one line per new transaction, oldest first. This excerpt
is from a run against a busy account on 2026-09-22:

```text
subscribed, id 1
account changed at slot 449506827, lamports 8814763864917
account changed at slot 449506828, lamports 8814768910946
ZooBgrSopWEu5hbzc5Vgsju5CVtxoj4WzjBVv52DtG7bTFvq2kT4gUHJ1FCjASgnfze1P11UTXkBf2VcJWwe7Ph slot=449506796 ok=true SOL change=0.000045939
4XVTGtvHzkZRhaE2DjbvFbBqnyhFcYhPWDd3DzinBbNd2g8rgbhndhMCfPHUQ4P4ckw96J4LjhF7nsd7n4xwD1UC slot=449506796 ok=true SOL change=0.002934474
```

On a busy account, new notifications keep arriving while a catch-up is still running.
`trigger()` folds them into one more pass instead of starting a pass per
notification.

**Set `maxSupportedTransactionVersion` to `1`.** Version 1 transactions are on
mainnet: the same run met `legacy`, `0` and `1` transactions within a few
slots. With the value `0`, `getTransaction` on a version 1 transaction
returns this `error` object instead of a result, and the catch-up stops on it
every time:

```json
{"code":-32015,"message":"Transaction version (1) is not supported by the requesting client. Please try the request again with the following configuration parameter: \"maxSupportedTransactionVersion\": 1"}
```

Three details in that code carry the design:

- **The cursor moves after the work, never before.** If the process dies
  between handling a transaction and saving the cursor, the next run handles it
  again. Make `handle` idempotent by signature and a replay is harmless.
- **Reconnect equals catch-up.** Subscriptions end with their socket and
  nothing is replayed. The `open` handler therefore calls `trigger()` itself, so
  whatever happened while you were disconnected is read from history. This is
  the pattern described in
  [why a WebSocket subscription goes silent](https://triport.io/learn/websocket-subscription-reconnect).
- **`until` bounds the walk from the old side.** Paging with `before` covers a
  burst of more than one page between triggers. The mechanics of `before` and
  `until` are covered in
  [paging getSignaturesForAddress](https://triport.io/learn/getsignaturesforaddress-pagination).

## 3. Wait for one transaction to finalize

The watcher reads at `confirmed`. To credit a deposit only once it is final,
follow that one signature with
[`signatureSubscribe`](../sol/json-rpc/signatureSubscribe.md) at `finalized`:

```ts
import WebSocket from "ws";

export function waitFinalized(signature: string, timeoutMs = 120_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://triport.io/ws/sol", {
      headers: { "x-token": process.env.TRIPORT_API_KEY! },
    });
    const timer = setTimeout(() => { ws.close(); reject(new Error("no notification")); }, timeoutMs);
    ws.on("open", () => ws.send(JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "signatureSubscribe",
      params: [signature, { commitment: "finalized" }],
    })));
    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.method === "signatureNotification") {
        clearTimeout(timer);
        ws.close();
        resolve(msg.params.result.value.err); // null means it succeeded
      }
    });
    ws.on("error", (e) => { clearTimeout(timer); reject(e); });
  });
}
```

The probe subscribed to an already-finalized signature and got the ack and
then one notification:

```json
{"jsonrpc":"2.0","result":2,"id":2}
{"jsonrpc":"2.0","method":"signatureNotification","params":{"result":{"context":{"slot":449504545},"value":{"err":null}},"subscription":2}}
```

A signature subscription fires **once** and is then removed by the server, so
there is nothing to unsubscribe. A signature the node has never seen never
produces a notification, which is why the helper has a timeout; when it fires,
fall back to `getTransaction` to find out whether the transaction exists.

## 4. Errors you will actually see

**A missing or wrong key** is refused before the WebSocket upgrade, as HTTP 401
with a JSON body — not as a close code. The same body comes back from the HTTP
endpoint:

```json
{"error":"unauthorized","message":"Missing or unknown API key. Pass your key as ?api-key=<key> or the header Authorization: Bearer <key>. Create or copy a key at https://triport.io/app/keys","keys_url":"https://triport.io/app/keys"}
```

**A subscription above your plan**, for example `blockSubscribe` on a Basic
key, gets a JSON error frame with `current_tier` and `required_tier`, and then
close code `4003`. The watcher stops reconnecting on 4001, 4003 and 4030
because repeating the same request cannot succeed. The close codes are listed
in the [Solana pub/sub reference](../streaming/sol-pubsub.md).

**Too many reads per second** returns HTTP 429 with a `Retry-After` header. On
a Free-trial key the body is:

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 20 requests/s for sol_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "sol_read_rpc",
  "limit_rps": 20,
  "burst_capacity": 40,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

The `rpc()` helper above already waits for `Retry-After` and retries. A very
busy wallet on a small plan can still outrun the budget, because each change
costs one `getSignaturesForAddress` call plus one `getTransaction` call per
new signature. If that happens, batch the triggers — for example, run the
catch-up at most once per second.

## What this does not do

- **It does not see token deposits.** SPL token balances live in token
  accounts, not in the wallet account. To watch USDC arriving, subscribe to the
  wallet's associated token account as well
  ([associated token account](https://triport.io/learn/glossary/associated-token-account)).
- **It is not exactly-once delivery.** The guarantee comes from the cursor and
  an idempotent handler, not from the socket.
- **It does not replay history.** On the first run it starts from the newest
  signature. To import older history, use the
  [backfill tutorial](./backfill-solana-address-history.md).
- **It does not reach past the node's history window.** If
  `getSignaturesForAddress` comes back empty for an address you know is active,
  see [empty address history](https://triport.io/learn/empty-address-history).
- **It does not choose the commitment for you.** `confirmed` is used to
  trigger reads, and `finalized` is used before crediting; see
  [commitment levels](https://triport.io/learn/glossary/commitment-level).

## Related

- Reference: [`accountSubscribe`](../sol/json-rpc/accountSubscribe.md),
  [`signatureSubscribe`](../sol/json-rpc/signatureSubscribe.md),
  [`getSignaturesForAddress`](../sol/json-rpc/getSignaturesForAddress.md),
  [`getTransaction`](../sol/json-rpc/getTransaction.md), and the
  [`/ws/sol` channel](../streaming/sol-pubsub.md).
- Concepts: [pub/sub subscription](https://triport.io/learn/glossary/pubsub-subscription),
  [pagination cursor](https://triport.io/learn/glossary/pagination-cursor).
- Network: [Solana docs overview](../sol/index.md) and the
  [Solana RPC page](https://triport.io/solana-rpc).
- Plans: [pricing](https://triport.io/pricing).
