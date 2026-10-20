> Live version: https://triport.io/docs/sol/json-rpc/slotSubscribe

# slotSubscribe

> Subscribes to slot progression and streams a notification each time the node processes a new slot.

| | |
|---|---|
| **Method / Endpoint** | `slotSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

It replaces polling `getSlot` in any latency-sensitive loop. Common uses:
driving a "current slot" ticker in an explorer or dashboard; timestamping
events from other subscriptions on the same socket; measuring your own
pipeline lag by comparing the streamed tip against the slots your data
arrives at; building blockhash-expiry countdowns for pending transactions;
and acting as an application-level liveness signal — if slot notifications
stall for more than a couple of seconds, the node or your connection is in
trouble, which makes this the cheapest health probe a WebSocket session can
carry.

Interpret the stream carefully. Slots arrive at the node's `processed` level,
so the sequence tracks the tip of the fork the node is currently on — it is
not a finality signal. The `slot` sequence is not guaranteed to be strictly
consecutive from the client's point of view: skipped slots (leaders that
produced no block) and minor fork switches mean you may observe gaps, and
`parent` is how you stitch the true chain together. If you need to know when
slots become *final* rather than merely processed, subscribe to
[`rootSubscribe`](./rootSubscribe.md) instead, or watch the `root` field
here. For fine-grained per-slot lifecycle events (shreds received, banks
frozen, dead slots), the heavier [`slotsUpdatesSubscribe`](./slotsUpdatesSubscribe.md)
exists. As with all Pub/Sub streams, a reconnect requires a fresh
`slotSubscribe`; stop the stream with [`slotUnsubscribe`](./slotUnsubscribe.md).

## Parameters

None — `params` is an empty array (or omitted).

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"slotSubscribe"}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 3114 }
```

```json
{
  "jsonrpc": "2.0",
  "method": "slotNotification",
  "params": {
    "subscription": 3114,
    "result": {
      "parent": 348392040,
      "root": 348392008,
      "slot": 348392041
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `slotUnsubscribe`. |
| `params.result.slot` | integer | The newly processed slot. |
| `params.result.parent` | integer | Parent slot of `slot`. |
| `params.result.root` | integer | Latest rooted (finalized) slot known to the node. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `4003` | `forbidden` | Your tier is below `basic` (`tier_insufficient`). |
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **Processed, not final:** the stream follows the node's current fork tip;
  use `root` (or `rootSubscribe`) for finality.
- **Gaps are normal:** skipped slots and fork switches make the sequence
  non-consecutive; chain by `parent` when ordering matters.
- **~2.5 frames/sec, forever:** cheap individually, but unsubscribe when the
  consumer goes away.
- **Related methods:** [`slotUnsubscribe`](./slotUnsubscribe.md),
  [`rootSubscribe`](./rootSubscribe.md),
  [`slotsUpdatesSubscribe`](./slotsUpdatesSubscribe.md), and `getSlot` for
  one-shot reads.
