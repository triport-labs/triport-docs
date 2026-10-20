> Live version: https://triport.io/docs/guides/filter-solana-pre-execution-by-account

# Filter the Solana pre-execution stream by account

> Connect to /ws/sol-preexec with an accounts filter, read transactions before they execute, and confirm which landed with signatureSubscribe. Pro and up.

| | |
|---|---|
| **Method / Endpoint** | `n/a — tutorial` (`wss://triport.io/ws/sol-preexec?accounts=…` + `wss://triport.io/ws/sol`) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request |
| **Required scope** | `solana:rpc` |
| **Tier / rate limit** | Pro (2 concurrent streams, filter required, up to 50 accounts) · Business (4 streams, filter optional, up to 200 accounts) |

The pre-execution stream — Triport's Solana [shred stream](../streaming/sol-preexec.md),
`wss://triport.io/ws/sol-preexec` — sends a Solana transaction as soon as it has been
reassembled from the leader's shreds, before the runtime has executed it. That
makes it an *intent* feed. It tells you which transactions touching your
accounts are in flight, but not whether they will succeed. This tutorial
connects with an account filter, decodes what a frame gives you, and pairs the
stream with a normal commitment channel that says what actually happened. The
frames shown come from a probe on 2026-09-22.

## What you need

- **A Pro or Business key.** The stream is not part of the Free trial or
  Basic, and on Enterprise the stream counts are set by contract. The limits
  per plan are in the table above. They come from the plan matrix and are
  enforced when you connect.
- **The accounts you care about.** They can be program ids, pools, vaults or
  wallets: any address that appears in a transaction's account list. On Pro
  the filter is mandatory.
- **Node.js 18 or newer** with `ws` (`npm install ws`).

## 1. Connect with a filter

The filter is a query parameter: comma-separated base58 addresses. It is fixed
for the life of the connection. There is no subscribe message and nothing to
send after the upgrade. To change the filter, reconnect with a new URL.

```bash
wscat -c "wss://triport.io/ws/sol-preexec?accounts=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" \
  -H "x-token: $TRIPORT_API_KEY"
```

Each frame is one JSON object per transaction. From the probe, filtered on the
Jupiter v6 program id (the protobuf field shortened):

```json
{
  "signature": "2ZqGCSamffLd1Dyd2pwf99GhBHbA1hiAypo6QeuYnUqo3o6nzTHoFG2k2tGzJyLYdaj8fPSeGp3amgi37LKU1Zbh",
  "slot": 449505019,
  "is_vote": false,
  "tx_pb_base64": "CkB+GEth0fw93Saq1JukcHEHQKiCHAE8sie1Awy5N6LDqqt7…",
  "account_keys": ["…33 addresses, including JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4…"],
  "pre_exec": true,
  "ts": 1790113886351
}
```

| Field | What to do with it |
|---|---|
| `signature` | Your key for everything else: de-duplication, confirmation, and `getTransaction` later. |
| `slot` | The slot the transaction was reassembled in. It is not proof of inclusion. |
| `account_keys` | Static keys first, then addresses resolved from lookup tables. Match your filter here. |
| `tx_pb_base64` | The transaction as **protobuf**, not Solana wire format. Decode it with the Solana storage protobuf schema. You cannot pass it to `sendTransaction`. |
| `pre_exec` | Always `true`, so code that mixes feeds cannot mistake this for an executed transaction. |
| `ts` | Unix milliseconds on Triport's clock when the frame was built for you (after receive, de-duplication and filtering, before your send buffer). Comparing it with your own clock includes clock skew. |

The full field reference is on the
[pre-execution stream page](../streaming/sol-preexec.md).

## 2. Stream, then confirm the outcome

A pre-execution frame has no status, logs, balances or error. The transaction
may still fail, be dropped, or land in a slot that is skipped. To know which
ones landed, follow each signature on the ordinary pub/sub channel with
[`signatureSubscribe`](../sol/json-rpc/signatureSubscribe.md). One `/ws/sol`
connection can hold many signature subscriptions, and each fires once.

Save as `preexec.ts` and run `npx tsx preexec.ts <address>[,<address>…]`:

```ts
import WebSocket from "ws";

const KEY = process.env.TRIPORT_API_KEY!;
const ACCOUNTS = process.argv[2] ?? "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const headers = { "x-token": KEY };

// --- outcome channel: one /ws/sol socket, one signatureSubscribe per signature ---
const outcome = new WebSocket("wss://triport.io/ws/sol", { headers });
let nextId = 1;
const byRequest = new Map<number, string>();  // request id -> signature
const bySub = new Map<number, string>();      // subscription id -> signature

outcome.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (typeof msg.id === "number" && typeof msg.result === "number") {
    bySub.set(msg.result, byRequest.get(msg.id)!);
    byRequest.delete(msg.id);
  } else if (msg.method === "signatureNotification") {
    const sig = bySub.get(msg.params.subscription);
    bySub.delete(msg.params.subscription); // the server removes it after this one notification
    const err = msg.params.result.value.err;
    console.log(`${sig} landed at slot ${msg.params.result.context.slot}: ${err === null ? "ok" : JSON.stringify(err)}`);
  } else if (msg.error) {
    console.error("pubsub:", JSON.stringify(msg));
  }
});

function confirm(signature: string): void {
  if (outcome.readyState !== WebSocket.OPEN) return;
  const id = nextId++;
  byRequest.set(id, signature);
  outcome.send(JSON.stringify({
    jsonrpc: "2.0", id, method: "signatureSubscribe",
    params: [signature, { commitment: "confirmed" }],
  }));
}

// --- intent channel: the pre-execution stream, filtered by account ---
const seen = new Set<string>();

function connectPreexec(): void {
  const url = `wss://triport.io/ws/sol-preexec?accounts=${encodeURIComponent(ACCOUNTS)}`;
  const ws = new WebSocket(url, { headers });

  ws.on("message", (data) => {
    const frame = JSON.parse(data.toString());
    if (frame.error) {                  // refusal frame, sent just before the close
      console.error("preexec:", JSON.stringify(frame));
      return;
    }
    if (frame.is_vote || seen.has(frame.signature)) return;
    seen.add(frame.signature);
    if (seen.size > 50_000) seen.clear();
    console.log(`${frame.signature} seen before execution in slot ${frame.slot} (${frame.account_keys.length} accounts)`);
    confirm(frame.signature);
  });

  ws.on("unexpected-response", (_req, res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => console.error(`refused: HTTP ${res.statusCode} ${body}`));
  });

  ws.on("close", (code, reason) => {
    const why = reason.toString();
    console.log(`preexec closed ${code} ${why}`);
    // 4029 superseded_by_new_connection: a newer stream on this key replaced this one — stop here.
    if (code === 4029 && why === "superseded_by_new_connection") return;
    // 4001/4003/4030: credentials, plan or filter problem. Fix, do not loop.
    if ([4001, 4003, 4030].includes(code)) return;
    // 4029 stream_limit: all stream slots are in use (a dropped connection holds its
    // slot until the server times it out) — retry slowly. Anything else: reconnect.
    setTimeout(connectPreexec, code === 4029 ? 5_000 : 2_000); // live only: nothing missed is replayed
  });
  ws.on("error", (e) => console.error("socket:", e.message));
}

outcome.on("open", connectPreexec);
```

Expected output: a `seen before execution` line from the intent feed, and a
`landed` line from the outcome channel once the same signature reaches
`confirmed`. The two feeds interleave. This excerpt is from a run on
2026-09-22 with the default filter:

```text
2VDBphiTovTmPma4AdSJikLWxnxhPHycgdEpG5sAhfsY3c4mY9jDSP3u3SWajuue6SWesdxo5GJcsMPhznJrhYgi seen before execution in slot 449507646 (30 accounts)
2VDBphiTovTmPma4AdSJikLWxnxhPHycgdEpG5sAhfsY3c4mY9jDSP3u3SWajuue6SWesdxo5GJcsMPhznJrhYgi landed at slot 449507646: ok
bTfgvMdmrxzu8v385U1EZoXjdwjU66vK36XQ43pqpteUwdEhNKpuVMFRYRTNFggh25CNxrJU5WBJuE8JgQsbLnZ seen before execution in slot 449507649 (33 accounts)
4KH3Eckj6duybnfbacC8C2KqCMSiTy8jSkwYWPYQsbPQxNZfWziZbjgSxRQ3H8WjU1ABnZN7nmhZnLe6jtCF6GRs seen before execution in slot 449507650 (53 accounts)
bTfgvMdmrxzu8v385U1EZoXjdwjU66vK36XQ43pqpteUwdEhNKpuVMFRYRTNFggh25CNxrJU5WBJuE8JgQsbLnZ landed at slot 449507649: ok
4KH3Eckj6duybnfbacC8C2KqCMSiTy8jSkwYWPYQsbPQxNZfWziZbjgSxRQ3H8WjU1ABnZN7nmhZnLe6jtCF6GRs landed at slot 449507650: ok
```

A signature without a `landed` line has not reached `confirmed`, or never
will. For production, put a timeout on each pending confirmation, unsubscribe
(`signatureUnsubscribe`) when it expires, and treat the transaction as not
landed unless a later `getTransaction` finds it.

## 3. Keep the confirmation side within your plan

The two channels have separate limits:

- **Pre-execution streams** count against the plan's concurrent-stream limit
  (2 on Pro, 4 on Business). The watcher opens exactly one.
- **Signature subscriptions** run on `/ws/sol` and are part of every plan's
  WebSocket set. Their cost is volume: an unfiltered Business stream on a busy
  program can produce more signatures than you want to track. Confirm only the
  transactions you act on, for example those that touch *your* vault rather
  than every swap through a program.

## 4. Errors you will actually see

**A missing or wrong key** is refused before the upgrade with HTTP 401 and this
body (measured on this route):

```json
{"error":"unauthorized","message":"Missing or unknown API key. Pass your key as ?api-key=<key> or the header Authorization: Bearer <key>. Create or copy a key at https://triport.io/app/keys","keys_url":"https://triport.io/app/keys"}
```

**Plan and filter refusals** complete the upgrade, send one JSON frame, and
close. They come from the route's own checks:

| Close | `error` | Cause |
|---|---|---|
| `4003` | `filter_required` | A Pro key connected without `accounts`. |
| `4003` | `filter_too_wide` | More addresses than the plan allows (50 on Pro, 200 on Business). |
| `4029` | `stream_limit` | The key already holds its plan's number of concurrent pre-execution streams. |

For example, a Pro key without a filter receives:

```json
{"error":"filter_required","message":"Forbidden","current_tier":"pro","required_tier":"pro","method":"/ws/sol-preexec","category":"sol_preexec"}
```

A key below Pro is refused because the stream is not in its plan. Reconnecting
will not change any of these outcomes, which is why the watcher stops on
`4003` and `4029` instead of looping. Free a stream, narrow the filter, or
change plan.

## What this does not do

- **It does not tell you the result.** No status, logs, inner instructions,
  balances or compute units exist before execution. The second channel is
  what supplies the outcome.
- **It does not guarantee delivery.** The stream is at-most-once and live
  only. On a reconnect, you resume from the current moment, and frames missed
  while disconnected are not replayed.
- **It does not change the filter in flight.** A new filter means a new
  connection, and that connection counts toward the stream limit while it is
  open.
- **It does not give you a submittable transaction.** `tx_pb_base64` is
  protobuf. Re-encode it before you do anything that expects Solana's wire
  format.

## Related

- Reference: [pre-execution stream](../streaming/sol-preexec.md),
  [`signatureSubscribe`](../sol/json-rpc/signatureSubscribe.md),
  [`signatureUnsubscribe`](../sol/json-rpc/signatureUnsubscribe.md),
  [`getTransaction`](../sol/json-rpc/getTransaction.md).
- Product page: [Solana pre-execution stream](https://triport.io/streams/pre-execution).
- Concepts: [shred](https://triport.io/learn/glossary/shred),
  [leader](https://triport.io/learn/glossary/leader),
  [commitment levels](https://triport.io/learn/glossary/commitment-level).
- Network: [Solana docs overview](../sol/index.md) and the
  [Solana RPC page](https://triport.io/solana-rpc).
- Plans: [pricing](https://triport.io/pricing).
