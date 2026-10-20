> Live version: https://triport.io/docs/sol/json-rpc/voteUnsubscribe

# voteUnsubscribe

> Cancels an active `voteSubscribe` stream, identified by the subscription id returned in the subscribe ack.

| | |
|---|---|
| **Method / Endpoint** | `voteUnsubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | pro+ — per-method tier gating on `/ws/sol` |

## Description

`voteUnsubscribe` stops a vote stream opened with
[`voteSubscribe`](./voteSubscribe.md) on the same WebSocket connection. Send
the integer subscription id from the subscribe ack; the server replies
`result: true` and stops delivering `voteNotification` frames for that id.
The connection and any other subscriptions it carries continue as before.

A vote stream cannot be narrowed server-side — it is always the full
firehose of every validator's votes — so the only volume control you have is
when you subscribe and when you unsubscribe. That makes this method part of
normal operation rather than an edge case. Typical patterns: a validator
health monitor subscribes, confirms its own `votePubkey` is appearing at the
expected cadence, and unsubscribes until the next probe interval, rather than
digesting mainnet's full vote traffic around the clock; a stake-weight
tracker samples a few minutes of votes per hour to estimate participation; a
research capture ends its collection window; or an optimistic-confirmation
estimator shuts down outside trading hours. In each case, dropping the
subscription frees substantial bandwidth and parsing load for whatever else
shares the socket.

The lifecycle contract is the same as every Pub/Sub family. Subscription ids
are meaningful only on the session that issued them: after a reconnect the
server has already dropped the stream, so unsubscribing a remembered id
fails with `-32602` (invalid subscription id) — as does unsubscribing the
same id twice. Given the stream's rate, a tail of buffered vote frames will
often arrive after your unsubscribe request; drop frames whose
`params.subscription` you no longer recognise. Nothing is replayed if you
later resubscribe — votes observed while detached are simply not seen, so
re-baseline validator state from `getVoteAccounts` when you reattach.
Closing the socket outright releases all subscriptions at once and needs no
per-id cleanup.

## Parameters

Positional params array: `[subscriptionId]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `subscriptionId` | integer | yes | Id returned by the `voteSubscribe` ack on this connection. |

## Request

Send the frame over the already-open WebSocket session:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "voteUnsubscribe", "params": [88110] }
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

- **Your only volume control:** vote streams can't be filtered server-side —
  sample in windows and unsubscribe between them.
- **Trailing frames:** expect buffered votes after the request; filter by
  known subscription ids.
- **Re-baseline on reattach:** use `getVoteAccounts` to rebuild state after a
  gap; nothing is replayed.
- **Related methods:** [`voteSubscribe`](./voteSubscribe.md).
