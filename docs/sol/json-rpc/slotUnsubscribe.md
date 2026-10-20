> Live version: https://triport.io/docs/sol/json-rpc/slotUnsubscribe

# slotUnsubscribe

> Cancels an active `slotSubscribe` heartbeat stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `slotUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`slotUnsubscribe` stops a slot heartbeat opened with
[`slotSubscribe`](./slotSubscribe.md) on the same WebSocket connection. Pass
the integer subscription id from the subscribe ack; the server responds
`result: true` and the ~2.5-per-second `slotNotification` frames for that id
cease. The connection itself, and any other subscriptions multiplexed on it,
continue unaffected.

A slot stream is unusual among Pub/Sub families in that it never goes quiet
on its own — it produces a frame for every slot the node processes, around
216,000 frames a day, whether or not anyone is looking. That makes explicit
teardown worthwhile the moment the consumer disappears: a dashboard tab
showing the live slot ticker is closed, a benchmark that was measuring
notification latency has finished its run, or a transaction-expiry countdown
completed because the transaction confirmed. Applications that only needed
the heartbeat as a temporary liveness probe during startup should also drop
it once their real subscriptions are flowing, rather than paying the
per-frame overhead for the life of the connection.

The standard lifecycle caveats apply. The id is only valid on the session
that created it: after a reconnect the server has forgotten every
subscription, so calling `slotUnsubscribe` with a remembered id fails with
`-32602` (invalid subscription id) — the correct recovery is simply not to
resubscribe. The same error appears if you unsubscribe twice, since the
first call already removed the id. Because slot frames are emitted so
frequently, it is normal for one or two notifications to arrive after you
send the unsubscribe but before the ack — drop frames for ids you no longer
track. If the whole session is ending anyway, closing the socket releases
this and every other subscription in one step; no per-id cleanup is required.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `slotSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "slotUnsubscribe", "params": [3114] }
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

- **High-frequency stream:** slot heartbeats never idle, so unsubscribe as
  soon as the consumer is gone.
- **Trailing frames are normal:** a couple of notifications may race the ack;
  filter by known ids.
- **Ids die with the session:** never replay ids across reconnects.
- **Related methods:** [`slotSubscribe`](./slotSubscribe.md).
