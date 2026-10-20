> Live version: https://triport.io/docs/sol/json-rpc/rootUnsubscribe

# rootUnsubscribe

> Cancels an active `rootSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `rootUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`rootUnsubscribe` stops a finality stream opened with
[`rootSubscribe`](./rootSubscribe.md) on the same WebSocket connection. Its
only parameter is the integer subscription id from the subscribe ack; on
success the server replies `result: true` and no further `rootNotification`
frames are delivered for that id. The connection stays up and any other
subscriptions on it are untouched.

Root streams are steady rather than bursty — the root advances nearly every
slot — so the reasons to unsubscribe are about scope, not volume. The classic
pattern is a bounded finality wait: a payment backend subscribes, waits until
the root passes the slot that contains a deposit, credits the account, and
then has no further use for the stream — unsubscribing there keeps
long-lived connections from accumulating forgotten watchers. Other cases: a
reorg-safe indexer switches from live tailing to batch mode during a
backfill, or a monitoring panel showing finality lag is closed while the rest
of the app's subscriptions stay active on the shared socket.

The lifecycle semantics are the standard Pub/Sub contract. Subscription ids
belong to the session that issued them: after a disconnect every subscription
is already gone server-side, so replaying a stored id on a new socket fails
with `-32602` (invalid subscription id) — resubscribe instead, and
re-baseline with a `finalized`-commitment `getSlot` call to cover the gap.
Unsubscribing the same id twice fails the same way. A final notification can
cross paths with the unsubscribe request, so treat frames for unknown ids as
noise to drop, not errors to raise. And when tearing down the whole
connection, skip the per-id ceremony — closing the socket releases every
subscription attached to it in one step.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `rootSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "rootUnsubscribe", "params": [1804] }
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

- **Bounded waits:** unsubscribe as soon as the root passes your target slot —
  don't leave finality watchers running forever.
- **Re-baseline after reconnect:** old ids are dead; resubscribe and check
  `getSlot(finalized)` to close the gap.
- **Closing the socket** frees all subscriptions at once.
- **Related methods:** [`rootSubscribe`](./rootSubscribe.md).
