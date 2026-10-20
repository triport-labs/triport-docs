> Live version: https://triport.io/docs/robinhood/feed

# Robinhood sequencer feed

## Warm merged delivery

Triport keeps a receive layer warm even when no client is connected. It fans out across feed sockets, publishes the first arrival for each `sequenceNumber`, and deduplicates later copies. Replay is therefore already populated when a client connects; there is no upstream catch-up blind start on the client path.

## Early headers

Add `early_heads=1` to receive an early header control frame when the merged header fan sees a block before its feed body:

```text
wss://triport.io/ws/robinhood-feed?early_heads=1
```

```json
{"version":1,"head":{"number":123,"hash":"0x…","source":"ext-1","at_ms":1789468016629}}
```

The frame is emitted at most once per block number and only before the corresponding body. `number` is a JSON number calibrated to `sequenceNumber`; `source` is a sanitized source id; `at_ms` is the layer observation time in Unix milliseconds. The early source is an external operator whose path may be closer to the sequencer. That is a source property, not a Triport timing guarantee. Omit `early_heads` to receive the unchanged feed stream.

## Resume window

The service keeps a bounded in-memory replay window: at most 8,192 frames, 64 MiB, or five minutes, whichever limit is reached first. It is not a historical API and the buffer is lost on process restart.

After a disconnect, reconnect with the last fully processed sequence number:

```text
wss://triport.io/ws/robinhood-feed?from_sequence=56798024
```

The first response is a `resume` control frame. If `resume.bufferComplete` is true, the retained buffer covers the requested boundary; replayed data frames have `replay: true` and contain only sequence numbers greater than the cursor. If it is false, consume the available tail but reconcile the missing range through RPC or your own durable store. A cursor ahead of the current window is not reported as complete.

## Frame shape

Data frames have `version: 1` and a non-empty `messages` array. A message includes `sequenceNumber`, `blockHash`, a signature field, and a nested message with `header.kind` and one of `l2Msg`, `rawTransaction`, or `rawTransactions`.

The feed also carries `confirmedSequenceNumberMessage` and `resume` control frames. Triport adds reconciliation state for the upstream confirmation watermark and observed continuity. Treat it as upstream-feed confirmation, not stronger independent finality.

Track reconnects, the last processed and confirmed sequence numbers, gaps, decode failures, and time since the last frame. Persist the processed cursor before acknowledging downstream work. The normative schema is the [Robinhood feed AsyncAPI contract](https://triport.io/api-specs/streaming/robinhood-feed.asyncapi.yaml).

Detail pages: [Resume](./feed/resume.md) — the `from_sequence` cursor, the `resume` frame and what to do when `bufferComplete` is false; [Reconciliation](./feed/reconciliation.md) — the confirmation watermark fields and their limits.
