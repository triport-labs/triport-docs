> Live version: https://triport.io/docs/sol/json-rpc/signatureUnsubscribe

# signatureUnsubscribe

> Cancels a pending `signatureSubscribe` wait before its notification has fired, using the subscription id from the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `signatureUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | free+ — per-method tier gating on `/ws/sol` |

## Description

`signatureUnsubscribe` cancels a signature watch opened with
[`signatureSubscribe`](./signatureSubscribe.md) on the same WebSocket
connection. Pass the integer subscription id from the subscribe ack; the
server answers `result: true` and the pending wait is abandoned. The
connection and any other subscriptions on it are unaffected.

Unlike the other Pub/Sub families, you rarely call this method on the happy
path. A signature subscription is one-shot: once the transaction reaches the
requested commitment and the `signatureNotification` is delivered, the server
cancels the subscription by itself. `signatureUnsubscribe` exists for the
*unhappy* paths — the cases where the notification is never going to come or
you have stopped caring. Typical scenarios: the transaction's blockhash
expired and you are about to rebuild and re-send it (the old signature will
never confirm, so the watch would dangle forever), a user cancelled the
checkout flow that was waiting on payment confirmation, or your own timeout
fired and you are switching to a polling fallback.

Because of the auto-cancel behaviour, a race is built into this method: if
the confirmation lands while your unsubscribe frame is in flight, the
subscription id is already gone by the time the server processes your request,
and the call fails with an invalid-subscription error (`-32602`). Treat that
error as benign — it simply means the notification beat you to it, and you
should check whether a `signatureNotification` for that id arrived just before.
Ids are also session-local: after a reconnect the old id is dead, and the
right recovery is a fresh `getSignatureStatuses` poll plus, if still pending,
a new subscribe — not an unsubscribe.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `signatureSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "signatureUnsubscribe", "params": [5207] }
```

## Response

```json
{ "jsonrpc": "2.0", "id": 2, "result": true }
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | boolean | `true` when the pending subscription was found and cancelled. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The subscription id does not exist — most often because the notification already fired and the subscription self-cancelled. |
| `4001` | `unauthorized` | The connection was never successfully authenticated. |

## Notes

- **Expect benign failures:** an error here usually means the confirmation
  arrived first. Handle it as "already done", not as a fault.
- **No cleanup needed after a notification** — signature subscriptions cancel
  themselves once delivered.
- **Session-local ids:** ids from a previous connection cannot be
  unsubscribed; a reconnect already cleared them.
- **Related methods:** [`signatureSubscribe`](./signatureSubscribe.md).
