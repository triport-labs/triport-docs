> Live version: https://triport.io/docs/robinhood/feed/reconciliation

# Robinhood feed reconciliation

> The `reconciliation` object on Robinhood feed frames: confirmation status, `latestConfirmedSequence`, `frameLastSequence`, `confirmationLag` and `sourceGapsObserved` — and what they do and do not prove.

Triport annotates feed frames with reconciliation state so a consumer can tell how far the upstream confirmation watermark has advanced and whether continuity gaps were observed. The object appears on data frames, on `confirmedSequenceNumberMessage` control frames and on the [`resume`](./resume.md) frame. The normative schema is the [feed AsyncAPI contract](https://triport.io/api-specs/streaming/robinhood-feed.asyncapi.yaml).

## Fields

```json
{"status":"pending_confirmation","latestConfirmedSequence":56798120,"frameLastSequence":56798130,"confirmationLag":10,"sourceGapsObserved":0}
```

| Field | Meaning |
|---|---|
| `status` | `watermark_unavailable`, `watermark`, `pending_confirmation` or `confirmed` (see below). |
| `latestConfirmedSequence` | Highest sequence covered by the upstream confirmation watermark. |
| `frameLastSequence` | Highest sequence Triport has delivered on this stream. |
| `confirmationLag` | `frameLastSequence − latestConfirmedSequence`, or `0` when the watermark is not behind. |
| `sourceGapsObserved` | Count of sequence discontinuities observed while merging sources. |

## Status values

| Status | Read it as |
|---|---|
| `watermark_unavailable` | No confirmation watermark has been seen yet — treat delivered frames as unconfirmed. |
| `watermark` | A watermark exists, but this frame is not covered by it. |
| `pending_confirmation` | The frame is ahead of the watermark: `confirmationLag` tells you by how much. |
| `confirmed` | The watermark covers this frame's sequence. |

## What this is not

The watermark is **the upstream feed's own confirmation signal, forwarded and annotated**. It is not an independent finality proof and must not be treated as stronger than what Robinhood Chain itself provides. If your application needs settlement assurances beyond the feed, confirm through JSON-RPC reads of the block in question.

`sourceGapsObserved` counts what the merge layer noticed; it is an observability signal, not a guarantee that every gap was detected. A consumer should still track its own continuity: compare each frame's `sequenceNumber` with the previous one and fill holes through RPC.

## Suggested consumer checks

- Persist `latestConfirmedSequence` next to your own processed cursor; act on business logic only once the sequence you care about is `confirmed`, if your use case needs that.
- Alert on a `confirmationLag` that keeps growing — it means delivery is running ahead of upstream confirmation.
- Alert on `sourceGapsObserved` increasing together with your own detected gaps.
- Track time since the last frame, decode failures and reconnects, as described in [Sequencer feed](../feed.md).

Feed access is Pro and above with scope `robinhood:feed`; see [Limits](../limits.md).
