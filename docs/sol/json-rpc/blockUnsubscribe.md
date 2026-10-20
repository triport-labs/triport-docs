> Live version: https://triport.io/docs/sol/json-rpc/blockUnsubscribe

# blockUnsubscribe

> Cancels an active `blockSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `blockUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | pro+ — per-method tier gating on `/ws/sol` |

## Description

`blockUnsubscribe` tears down one block stream opened with
[`blockSubscribe`](./blockSubscribe.md) on the same WebSocket connection.
Pass the integer subscription id from the subscribe ack; the server replies
`result: true` and stops pushing `blockNotification` frames for that id,
while the socket and all other subscriptions on it stay live.

Of all the Pub/Sub families, block streams are the ones most worth
unsubscribing promptly. A full-detail `blockSubscribe` on `"all"` can move
multiple megabytes per second; even a filtered stream carries whole
transaction payloads. Leaving one running after its consumer is gone wastes
client bandwidth, server egress, and parser CPU in a way an idle account
watch never does. Typical teardown moments: an indexer completed its
real-time phase and is handing off to batch backfill via `getBlocks`; you are
reconfiguring the stream — filter and config are fixed at subscribe time, so
switching from `transactionDetails: "full"` to `"signatures"`, or changing
the `mentionsAccountOrProgram` target, means opening the new subscription
first and then unsubscribing the old id (make-before-break, de-duplicating
overlapping slots); or an analytics job simply reached the end of its
sampling window.

Standard lifecycle rules apply. Ids are valid only within the WebSocket
session that created them — after a reconnect the subscription is already
gone, so an unsubscribe with a stale id returns `-32602` (invalid
subscription id), the same error you get for a double unsubscribe. Because
block frames are large, one may already be buffered when your unsubscribe
lands: expect a final notification or two after the request and drop frames
whose `params.subscription` you no longer route. Closing the socket entirely
releases every subscription at once, so shutdown code does not need to
unsubscribe block streams individually — though on shared long-lived
connections, doing it explicitly keeps the remaining traffic clean.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `blockSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "blockUnsubscribe", "params": [79015] }
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

- **Heavy stream — drop it early:** block subscriptions are the most
  expensive to leave dangling; unsubscribe the moment the consumer stops.
- **Reconfigure = resubscribe:** filter and config can't be changed in place;
  ack the replacement before dropping the old id.
- **Buffered frames:** large block notifications may trail the ack briefly.
- **Related methods:** [`blockSubscribe`](./blockSubscribe.md).
