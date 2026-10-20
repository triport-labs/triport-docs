> Live version: https://triport.io/docs/sol/json-rpc/slotsUpdatesUnsubscribe

# slotsUpdatesUnsubscribe

> Cancels an active `slotsUpdatesSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `slotsUpdatesUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | pro+ — per-method tier gating on `/ws/sol` |

## Description

`slotsUpdatesUnsubscribe` shuts down a slot-lifecycle stream opened with
[`slotsUpdatesSubscribe`](./slotsUpdatesSubscribe.md) on the same WebSocket
connection. Pass the integer subscription id from the subscribe ack; the
server answers `result: true` and stops emitting `slotsUpdatesNotification`
frames for that id. Other subscriptions sharing the connection are not
affected.

Because the updates stream fires for every stage of every slot — routinely
ten or more frames per second, around a million a day — it is the kind of
subscription you should treat as a scoped measurement instrument, not ambient
background noise. Turn it on for the duration of a task and turn it off when
the task ends: a propagation-latency benchmark that has collected its sample
window, a leader-skip monitor that only runs during your validator's assigned
slots, an incident investigation that was watching for `dead` slots while a
cluster event unfolded, or a trading system that only consumes
`optimisticConfirmation` timing during active sessions. Leaving the firehose
attached to a connection that also carries application subscriptions inflates
parse latency for everything else on the socket, so releasing it promptly is
a performance measure as much as a hygiene one.

Lifecycle semantics follow the common Pub/Sub contract. The id exists only
within the current WebSocket session; after a reconnect the server has
already discarded the subscription, and replaying the old id yields `-32602`
(invalid subscription id) — the same error a duplicate unsubscribe produces.
Given the stream's rate, expect a burst of already-buffered notifications to
arrive after your unsubscribe frame and before (or even just after) the ack;
route by known subscription ids and silently drop the rest. There is no
replay on resubscribe — the events that occurred while you were detached are
gone, which is fine for an instrumentation stream. Closing the socket
releases this and all other subscriptions in one step.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `slotsUpdatesSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "slotsUpdatesUnsubscribe", "params": [9932] }
```

## Response

```json
{ "jsonrpc": "2.0", "id": 2, "result": true }
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | boolean | `true` when the subscription was found and removed. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The subscription id does not exist on this connection (already unsubscribed or from a previous session). |
| `4001` | `unauthorized` | The connection was never successfully authenticated. |

## Notes

- **Scoped instrument:** subscribe for the measurement window, unsubscribe
  when it closes — don't leave the firehose running.
- **Post-unsubscribe burst:** buffered frames will trail the request; filter
  by ids you still track.
- **No replay:** detached time is lost; that is expected for this stream.
- **Related methods:** [`slotsUpdatesSubscribe`](./slotsUpdatesSubscribe.md).
