> Live version: https://triport.io/docs/robinhood/guides/consume-the-sequencer-feed

# Consume the sequencer feed with cursor-based recovery

> Connect to the Robinhood sequencer feed, keep a durable cursor, resume after a disconnect with `from_sequence`, read the `resume` frame correctly, and reconcile the range the replay window cannot cover.

The sequencer feed delivers **already assembled L2 blocks** as they are produced. It is the earliest source of transaction data on this chain, and the correct way to consume it is not "connect and read" — it is "connect, read, and always know which sequence you have durably processed", because the replay window that protects you is small and lives in memory.

This guide builds that consumer. For the connection basics see the [Quickstart](../quickstart.md); for the protocol reference see [Sequencer feed](../feed.md).

| | |
|---|---|
| **Endpoint** | `wss://triport.io/ws/robinhood-feed` |
| **Tier** | Pro and above |
| **Required scope** | `robinhood:feed` (separate from `robinhood:rpc`) |
| **Cursor parameter** | `?from_sequence=<unsigned decimal>` |
| **Concurrent streams** | 2 on Pro, 4 on Business and Enterprise — see [Limits](../limits.md) |

## 1. What the feed is, and what it is not

`sequenceNumber` is **the L2 block number**. It is not a pre-inclusion transaction sequence, and the feed is not a mempool: every frame describes a block the sequencer has already assembled. If you are looking for transactions before they are in a block, this is the wrong surface and there is no right one here — see [Pending data](../pending.md).

That one fact drives the whole design below, and in a useful direction: because `sequenceNumber` equals the block number, anything the stream fails to deliver can be fetched over JSON-RPC by number. The feed is a fast path, not a unique source.

## 2. Frames

Data frames carry `version: 1` and a non-empty `messages` array. Each message has a `sequenceNumber`, a `blockHash`, a signature field, and a nested message with `header.kind` and one of `l2Msg`, `rawTransaction` or `rawTransactions`.

Two control frames also arrive on the same socket: `resume` (section 4) and `confirmedSequenceNumberMessage` (section 6). **Branch on frame type before you touch `messages`** — a consumer that assumes every frame is data will crash on the first control frame, which is also the very first frame after a resume.

## 3. The cursor is the whole design

Keep one number: the last sequence you have **fully processed**, meaning your downstream work is committed and not merely received.

```ts
// Correct order. Reversing these two lines is the classic data-loss bug.
await handleBlock(msg);          // commit downstream work
await saveCursor(msg.sequenceNumber); // only then advance the cursor
```

Persist the cursor before acknowledging downstream work, never after receiving a frame. A cursor written too early converts a crash into permanent loss; a cursor written late costs a replay, and replays are cheap because you can de-duplicate on `sequenceNumber`.

The value must be an unsigned decimal integer. A hex quantity, a negative number or a float is rejected **before the WebSocket upgrade**, so you get an HTTP error rather than a socket that silently misbehaves:

```text
HTTP 400  from_sequence must be an unsigned decimal integer
```

If the cursor is lost entirely, connect without the parameter and backfill over JSON-RPC.

## 4. Reconnect and read the `resume` frame

```text
wss://triport.io/ws/robinhood-feed?from_sequence=56798024
```

Replay starts strictly **after** the cursor. The first frame back is control, not data:

```json
{"version":1,
 "resume":{"requestedAfterSequence":56798024,"earliestAvailableSequence":56797001,"latestAvailableSequence":56798130,"bufferComplete":true},
 "reconciliation":{"status":"confirmed","latestConfirmedSequence":56798120,"frameLastSequence":56798130,"confirmationLag":10,"sourceGapsObserved":0}}
```

Replayed data frames carry `replay: true` and contain only sequence numbers greater than your cursor. `bufferComplete` is `true` only when the window covers your boundary with no holes; see [Resume](../feed/resume.md) for the field-by-field reference.

## 5. When `bufferComplete` is false

It is `false` in three situations you can act on, plus a degenerate fourth described below. The three call for the same *kind* of response — reconcile through RPC — but **the range differs**, and taking it from the wrong field reconciles nothing at all while looking like it worked:

- the cursor is **too old** — the oldest retained sequence has already passed it. Read `cursor + 1 … earliestAvailableSequence − 1`; the replay delivers everything from `earliestAvailableSequence` onwards.
- the window is **empty** — the normal state right after a service restart on our side. Both bounds come back as `0`, so there is no `earliestAvailableSequence` to read up to: take the chain head from [`eth_blockNumber`](../json-rpc/eth_blockNumber.md) and read `cursor + 1 … head`. This is the case that punishes a consumer which reconciles up to `earliestAvailableSequence` unconditionally: the range degenerates to an empty one and the gap is lost in silence.
- the cursor is **ahead** of the window, for example after your side restarted with a stored future value. There is nothing to reconcile — the cursor itself is wrong. Alert and investigate rather than continuing quietly.

There is a fourth, degenerate cause: a retained frame that fails to parse on our side also clears the flag (`feed/hub.go:761-763`), even though the window still covers your boundary. **The plan below deliberately asks for nothing in that case** — the range is unknown, and the hole sits inside the window rather than before it. What catches it is the per-message continuity check in section 9: the next sequence you receive will not be `cursor + 1`, and that path reconciles `cursor + 1 … seq − 1`. Continuity is the net; the resume plan is not.

Deciding the range is the part that goes wrong, so keep it in one small function instead of inline:

```ts
// Inclusive block range to read over RPC, or null when there is nothing to
// reconcile. `head` is the current chain head (eth_blockNumber).
function planReconcile(cursor, resume, head) {
  if (cursor === null) return null;                 // first run: no gap to fill
  if (resume.bufferComplete) return null;           // replay covers your boundary

  const earliest = resume.earliestAvailableSequence;
  const latest = resume.latestAvailableSequence;

  if (earliest === 0 && latest === 0) {             // window empty: replay brings nothing
    return head > cursor ? { from: cursor + 1, to: head } : null;
  }
  if (cursor > latest) return null;                 // cursor ahead of the window
  return earliest > cursor + 1 ? { from: cursor + 1, to: earliest - 1 } : null;
}
```

Do not treat `false` as an error to retry. Consume the tail you were given, then reconcile the missing range yourself. Because `sequenceNumber` is the block number, the mapping is direct: [`eth_getBlockByNumber`](../json-rpc/eth_getBlockByNumber.md) for the block, [`eth_getBlockReceipts`](../json-rpc/eth_getBlockReceipts.md) for its receipts, [`eth_getLogs`](../json-rpc/eth_getLogs.md) for events over a range.

The window holds at most **8,192 frames, 64 MiB or five minutes**, whichever comes first, and it lives in process memory — so the five minutes are a ceiling, not a promise. Design for "reconcile through RPC" as the normal path after any non-trivial outage, not as an exception.

## 6. Track continuity yourself, and read the watermark for what it is

Every frame carries a `reconciliation` object: `status`, `latestConfirmedSequence`, `frameLastSequence`, `confirmationLag` and `sourceGapsObserved`.

`status` moves through `watermark_unavailable` → `watermark` → `pending_confirmation` → `confirmed`. Treat `confirmed` as **the upstream feed's own confirmation signal, forwarded and annotated** — not as an independent finality proof. If your product needs settlement assurance, confirm the block through JSON-RPC.

`sourceGapsObserved` counts discontinuities the merge layer noticed. It is an observability signal, not a guarantee that every gap was detected, so keep your own check: compare each `sequenceNumber` with the previous one and fill any hole through RPC before advancing the cursor past it. See [Reconciliation](../feed/reconciliation.md).

Worth alerting on: a `confirmationLag` that keeps growing, `sourceGapsObserved` rising alongside your own detected gaps, and time since the last frame.

## 7. Backpressure

The server buffers a bounded outbound queue per client. If yours cannot drain, the connection is closed with an explicit reason:

```text
client buffer is full; reconnect with from_sequence to resume buffered data
```

The fix is to do less work inline: enqueue locally and process asynchronously so the socket is always drained. Then reconnect with your stored cursor — which is exactly the path section 4 already describes, so a well-built consumer treats this as routine rather than as an incident.

## 8. Optional: early headers

Adding `early_heads=1` produces an early header control frame when the merged header layer sees a block before its feed body:

```text
wss://triport.io/ws/robinhood-feed?early_heads=1
```

The frame is emitted at most once per block number and only before the corresponding body; `number` is a JSON number calibrated to `sequenceNumber`. This reflects a property of an external source whose path may be closer to the sequencer — it is not a Triport timing guarantee. Omit the parameter to receive the unchanged stream.

## 9. A compact consumer

Everything above, in one place. It is deliberately small: reconnect with backoff, branch on frame type, check continuity, commit before advancing.

```ts
import WebSocket from "ws";

const URL = "wss://triport.io/ws/robinhood-feed";
let cursor = await loadCursor();      // last FULLY processed sequence, or null
let backoff = 500;

function connect() {
  const qs = cursor === null ? "" : `?from_sequence=${cursor}`;
  const ws = new WebSocket(`${URL}${qs}`, { headers: { "x-token": process.env.TRIPORT_API_KEY! } });

  ws.on("open", () => { backoff = 500; });

  ws.on("message", async (raw) => {
    const frame = JSON.parse(raw.toString());

    if (frame.resume) {                       // control frame, always first on resume
      const plan = planReconcile(cursor, frame.resume, await rpcHead());
      if (plan) await reconcileViaRpc(plan);  // section 5: the range differs per cause
      return;
    }
    if (!Array.isArray(frame.messages)) return; // other control frames

    for (const msg of frame.messages) {
      const seq = msg.sequenceNumber;
      if (cursor !== null && seq <= cursor) continue;        // replay overlap
      if (cursor !== null && seq > cursor + 1) {
        await reconcileViaRpc({ from: cursor + 1, to: seq - 1 }); // hole the layer did not report
      }
      await handleBlock(msg);                                // your work, committed
      cursor = seq;
      await saveCursor(seq);                                 // only now
    }
  });

  ws.on("close", () => setTimeout(connect, (backoff = Math.min(backoff * 2, 30_000))));
  ws.on("error", () => ws.close());
}

connect();
```

`reconcileViaRpc({ from, to })` reads blocks `from … to` **inclusive** with `eth_getBlockByNumber` and whatever else your pipeline needs, then returns; `rpcHead()` is a plain [`eth_blockNumber`](../json-rpc/eth_blockNumber.md) call. Inclusive bounds are deliberate: the earlier version of this guide passed two loose numbers and documented them as exclusive, which is how an empty replay window turned into a range of `5001 … −1` — a reconciliation that silently did nothing. Ranges are decided in `planReconcile` (section 5) and consumed here unchanged. `handleBlock` must be idempotent: after any reconnect you may legitimately see a sequence you have already handled.

## Frequently asked questions

**Is the feed a mempool?**
No. It carries assembled L2 blocks, and `sequenceNumber` is the block number. There is no pre-inclusion view on this chain.

**Can I replay yesterday?**
No. The window is bounded by frames, bytes and minutes, and it is lost when the process restarts. Anything older is an RPC read or your own store.

**`bufferComplete` came back false right after I reconnected quickly. Why?**
Most likely the window was empty because the service restarted, not because your cursor was wrong. Consume the tail, reconcile the gap and carry on — the causes, and the range each one needs, are in section 5.

**Does `confirmed` mean the block is final?**
It means the upstream watermark covers that sequence. It is forwarded and annotated by us, not an independent finality proof.

**Do I need a separate key for the feed?**
You need the `robinhood:feed` scope on the key, in addition to a Pro or higher plan. A key with only `robinhood:rpc` is refused at the handshake.

## Related

- [Sequencer feed](../feed.md) · [Resume](../feed/resume.md) · [Reconciliation](../feed/reconciliation.md)
- [`eth_getBlockByNumber`](../json-rpc/eth_getBlockByNumber.md) · [`eth_getBlockReceipts`](../json-rpc/eth_getBlockReceipts.md) · [`eth_getLogs`](../json-rpc/eth_getLogs.md) · [`eth_getBlockByHash`](../json-rpc/eth_getBlockByHash.md) · [`eth_blockNumber`](../json-rpc/eth_blockNumber.md)
- [Pending data](../pending.md) · [Limits](../limits.md)
- [Build a wallet backend](./build-a-wallet-backend.md) · [Track Stock Token transfers](./track-stock-token-transfers.md)
