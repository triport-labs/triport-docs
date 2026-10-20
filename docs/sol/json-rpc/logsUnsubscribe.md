> Live version: https://triport.io/docs/sol/json-rpc/logsUnsubscribe

# logsUnsubscribe

> Cancels an active `logsSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `logsUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`logsUnsubscribe` stops one log stream that was opened with
[`logsSubscribe`](./logsSubscribe.md) on the same WebSocket connection. It
takes the integer subscription id from the subscribe ack, returns
`result: true`, and the server stops pushing `logsNotification` frames for
that id. Everything else on the connection — other log filters, account
watches, slot ticks — keeps flowing.

Log streams are among the chattiest subscriptions on Solana, especially with
the `"all"` filter or a `mentions` filter on a busy program, so releasing them
promptly matters more here than for most families. Typical moments to call it:
an indexer finished its catch-up phase and is switching from the firehose
`"all"` filter to targeted `mentions` filters; a monitoring dashboard closed
the panel that was tailing a program's activity; or you are rotating the set
of tracked addresses — since a `mentions` filter accepts exactly one pubkey
and cannot be edited in place, changing what you watch always means
subscribing to the new address first, then unsubscribing the old id.

The usual Pub/Sub lifecycle rules apply. Subscription ids are scoped to the
current WebSocket session: after a disconnect the server has already discarded
every subscription, so replaying stored ids into `logsUnsubscribe` on a fresh
socket fails with `-32602` — just resubscribe and track the new ids. A second
unsubscribe of the same id fails the same way, because the first call removed
it. And notifications already in flight when you send the unsubscribe may
still be delivered for a moment; drop frames whose `params.subscription` you
no longer recognise instead of treating them as protocol errors. Closing the
socket outright releases all subscriptions at once, so shutdown paths need no
explicit unsubscribes.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `logsSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "logsUnsubscribe", "params": [41902] }
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

- **Swap, then drop:** when changing a `mentions` address, subscribe to the
  new one before unsubscribing the old to avoid a coverage gap.
- **In-flight frames:** a few notifications may still arrive after the ack;
  filter by known subscription ids.
- **No bulk call needed:** closing the WebSocket frees every subscription.
- **Related methods:** [`logsSubscribe`](./logsSubscribe.md).
