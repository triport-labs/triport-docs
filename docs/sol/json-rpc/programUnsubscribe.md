> Live version: https://triport.io/docs/sol/json-rpc/programUnsubscribe

# programUnsubscribe

> Cancels an active `programSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `programUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`programUnsubscribe` removes one program-account stream that was opened with
[`programSubscribe`](./programSubscribe.md) on the same WebSocket connection.
Send the integer subscription id from the subscribe ack; the server replies
`result: true` and stops delivering `programNotification` frames for that id.
The socket stays open and every other subscription on it continues untouched.

The most common reason to call it is filter rotation. A program subscription's
`filters` are fixed the moment it is created — there is no way to add a
`memcmp` needle or tighten a `dataSize` on a live stream. The working pattern
is make-before-break: open a new subscription with the updated filters, wait
for its ack, then unsubscribe the old id. Done in that order there is no
window where matching account changes can slip past both streams (you may
briefly receive duplicates instead — de-duplicate by `pubkey` + slot). Other
natural moments: an indexer that bootstrapped from a `getProgramAccounts`
snapshot and has caught up no longer needs its wide catch-all stream; a
liquidation bot unwinds coverage of a market it exited; a dashboard tab
watching a pool closes.

The lifecycle rules are the standard Pub/Sub ones. Ids are private to the
current WebSocket session — after a reconnect the server has already dropped
every subscription, so an unsubscribe with a stale id fails with `-32602`
(invalid subscription id), as does a second unsubscribe of the same id.
Notifications already queued when the unsubscribe lands may still be
delivered for a brief moment; ignore frames whose `params.subscription` is no
longer in your routing table. And if you are shutting the whole connection
down, just close the socket — that releases all subscriptions server-side in
one step.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `programSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "programUnsubscribe", "params": [60214] }
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

- **Make-before-break:** when changing filters, ack the replacement
  subscription before dropping the old one; de-duplicate the overlap.
- **Stale ids fail:** after a reconnect, resubscribe — do not replay old ids.
- **Socket close = mass unsubscribe:** shutdown paths need no per-id calls.
- **Related methods:** [`programSubscribe`](./programSubscribe.md).
