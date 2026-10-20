> Live version: https://triport.io/docs/robinhood/feed/resume

# Robinhood feed resume

> Resume the Robinhood sequencer feed after a disconnect: the `from_sequence` cursor, the `resume` control frame, what `bufferComplete` means and how to reconcile a gap it reports.

The feed keeps a bounded in-memory replay window, so a client that reconnects quickly can continue where it stopped instead of starting blind. This page covers the cursor protocol; see [Sequencer feed](../feed.md) for the connection, frame shape and delivery model.

## Reconnect with a cursor

```text
wss://triport.io/ws/robinhood-feed?from_sequence=56798024
```

Pass the **last fully processed** sequence number — replay starts strictly after it. The value must be an unsigned decimal integer; anything else is rejected before the WebSocket upgrade:

```text
HTTP 400  from_sequence must be an unsigned decimal integer
```

Persist the cursor before you acknowledge downstream work. If the cursor is lost, connect without the parameter and backfill the missing range through JSON-RPC.

## The resume control frame

The first frame after a resume request is a control frame, not data:

```json
{"version":1,
 "resume":{"requestedAfterSequence":56798024,"earliestAvailableSequence":56797001,"latestAvailableSequence":56798130,"bufferComplete":true},
 "reconciliation":{"status":"confirmed","latestConfirmedSequence":56798120,"frameLastSequence":56798130,"confirmationLag":10,"sourceGapsObserved":0}}
```

| Field | Meaning |
|---|---|
| `requestedAfterSequence` | The cursor you sent. |
| `earliestAvailableSequence` | Oldest sequence still in the replay window. |
| `latestAvailableSequence` | Newest sequence the window holds. |
| `bufferComplete` | `true` only when the window covers your boundary with no holes. |

Replayed data frames carry `replay: true` and contain only sequence numbers greater than the cursor. The `reconciliation` object is described in [Reconciliation](./reconciliation.md).

## When `bufferComplete` is false

`bufferComplete` is `true` only if the window is non-empty, your cursor is at or below `latestAvailableSequence`, and every sequence from `requestedAfterSequence + 1` up to the newest one is present. It is therefore `false` when:

- the cursor is **too old** — the oldest retained sequence is already past it;
- the cursor is **ahead** of the window (for example after a restart on your side that stored a future value);
- the window is **empty**, which is the normal state right after a service restart.

In that case consume the available tail and reconcile the missing range yourself: read the corresponding blocks over JSON-RPC ([`eth_getBlockByNumber`](../json-rpc/eth_getBlockByNumber.md), [`eth_getBlockReceipts`](../json-rpc/eth_getBlockReceipts.md), [`eth_getLogs`](../json-rpc/eth_getLogs.md)), or replay from your own durable store. `sequenceNumber` is the L2 block number, which makes that mapping direct.

## Window limits

At most **8,192 frames, 64 MiB or five minutes** — whichever limit is reached first. The window lives in process memory and is **lost on process restart**, so the five minutes are a ceiling, not a promise. It is an operational buffer for short interruptions, not a historical API: there is no replay of an arbitrary past day.

## If your client cannot keep up

A client whose outbound queue cannot drain is disconnected with an explicit reason:

```text
client buffer is full; reconnect with from_sequence to resume buffered data
```

Treat it as a signal to consume faster (or to do less work inline), then reconnect with your stored cursor. Stream concurrency per key is plan policy — 2 streams on Pro, 4 on Business and Enterprise; see [Limits](../limits.md).
