> Live version: https://triport.io/docs/sol/json-rpc/accountUnsubscribe

# accountUnsubscribe

> Cancels an active `accountSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `accountUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | free+ — per-method tier gating on `/ws/sol` |

## Description

`accountUnsubscribe` tears down one account-change stream that was opened with
[`accountSubscribe`](./accountSubscribe.md) on the same WebSocket connection.
Its single parameter is the integer subscription id — the `result` value the
server returned in the subscribe ack. On success the server replies
`result: true` and stops pushing `accountNotification` frames for that id; the
socket itself stays open, and any other subscriptions on it keep flowing.

Use it whenever a watch outlives its usefulness while the connection does not:
a user navigates away from a wallet view but keeps the app open, a deposit you
were waiting for has landed, or you are rotating a large watchlist and want to
swap tracked accounts without paying the cost of a reconnect. Explicitly
unsubscribing keeps the server-side subscription count down, which matters on
connections juggling hundreds of account watches.

Three details are worth knowing. First, the id must belong to the current
session — subscription ids are per-connection, so after a reconnect the old
ids are meaningless and unsubscribing them returns an error (`-32602`,
invalid subscription id); simply resubscribe instead. Second, unsubscribing is
idempotent in effect but not in response: the first call returns `true`, a
repeat call with the same id fails because the subscription no longer exists.
Third, you never need to unsubscribe before closing the socket — dropping the
connection frees every subscription tied to it automatically. Reserve
`accountUnsubscribe` for surgically stopping one stream while the rest of the
session continues.

A stray notification can still arrive in the small window between sending the
unsubscribe and receiving the ack; treat unknown subscription ids in incoming
frames as ignorable rather than as errors.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `accountSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "accountUnsubscribe", "params": [23784] }
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
| `-32602` | Invalid params | The subscription id does not exist on this connection (already unsubscribed, or created on a previous session). |
| `4001` | `unauthorized` | The connection was never successfully authenticated. |

## Notes

- **Ids are session-local:** after a reconnect, do not try to unsubscribe old
  ids — they died with the previous socket.
- **In-flight frames:** one last notification may race the unsubscribe ack;
  drop frames whose `params.subscription` you no longer track.
- **Closing the socket** cancels all subscriptions at once — no bulk
  unsubscribe call is needed.
- **Related methods:** [`accountSubscribe`](./accountSubscribe.md).
