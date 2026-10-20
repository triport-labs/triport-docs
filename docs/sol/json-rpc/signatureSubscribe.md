> Live version: https://triport.io/docs/sol/json-rpc/signatureSubscribe

# signatureSubscribe

> Subscribes to a transaction signature and fires a one-shot notification when the transaction reaches the requested commitment level.

| | |
|---|---|
| **Method / Endpoint** | `signatureSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | free+ — per-method tier gating on `/ws/sol` |

## Description

`signatureSubscribe` watches a single transaction signature and pushes a
`signatureNotification` the moment the transaction is processed at the
commitment level you asked for. It is the push-based alternative to polling
`getSignatureStatuses` in a loop after `sendTransaction`: submit, subscribe,
and wait for one frame instead of hammering the HTTP endpoint.

The notification carries `context.slot` and a `value` object whose `err` field
is `null` on success or a `TransactionError` object if the transaction failed
on-chain — a failed transaction still *confirms*, so always inspect `err`
rather than treating the notification itself as success. With
`enableReceivedNotification: true` you additionally get an early frame with
`value` set to the string `"receivedSignature"` when the node first sees the
signature, useful for showing a "propagating…" state in a UI before the real
confirmation lands.

The defining quirk: this subscription is **one-shot**. After the notification
at the requested commitment fires, the server cancels the subscription
automatically — you do not need to call
[`signatureUnsubscribe`](./signatureUnsubscribe.md) afterwards, and attempting
to will fail because the id is already gone. `signatureUnsubscribe` is only
for abandoning a wait early (for example, when your blockhash expires and you
are about to re-send).

Two gotchas. The signature must be the transaction's *first* signature (the
fee payer's) as a base-58 string. And the subscription only sees what happens
from now on: if the transaction already reached the requested commitment
before you subscribed, no notification will ever arrive — pair the
subscription with one `getSignatureStatuses` check to close that race, and put
a deadline on the wait tied to blockhash expiry.

## Parameters

Positional params array: `[signature, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `signature` | string (base-58) | yes | The transaction's first signature, as returned by `sendTransaction`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | `processed`, `confirmed` (default), or `finalized` — the level at which the final notification fires. |
| `enableReceivedNotification` | boolean | no | When `true`, also notify when the node first receives the signature. |

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"signatureSubscribe","params":["5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",{"commitment":"finalized","enableReceivedNotification":false}]}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 5207 }
```

The confirmation notification (after which the subscription self-cancels):

```json
{
  "jsonrpc": "2.0",
  "method": "signatureNotification",
  "params": {
    "subscription": 5207,
    "result": {
      "context": { "slot": 348392055 },
      "value": { "err": null }
    }
  }
}
```

With `enableReceivedNotification: true`, an earlier frame may carry
`"result": { "context": {...}, "value": "receivedSignature" }`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id. |
| `params.result.context.slot` | integer | Slot in which the transaction reached the commitment. |
| `params.result.value.err` | object \| null | `null` = executed successfully; otherwise the on-chain `TransactionError`. |
| `params.result.value` | string | The literal `"receivedSignature"` on the optional received-notification frame. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `signature` is not a valid base-58 transaction signature. |
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **One-shot:** the subscription auto-cancels after the final notification —
  no unsubscribe needed on the happy path.
- **Failed ≠ missing:** a transaction that errored on-chain still triggers the
  notification, with `value.err` populated. Check it.
- **Already confirmed:** subscribing to a signature that has already reached
  the requested commitment returns the notification right away (measured
  2026-09-22 on an already-finalized signature). A signature the node does not
  know produces no notification at all, so put a timeout on the wait and check
  with [`getTransaction`](./getTransaction.md) when it expires.
- **Related methods:** [`signatureUnsubscribe`](./signatureUnsubscribe.md) to
  abandon a wait early, `sendTransaction` to submit, and
  [`logsSubscribe`](./logsSubscribe.md) to stream the transaction's logs
  instead of just its status.
- **Tutorials:** [wait for a deposit to finalize](../../guides/watch-a-solana-wallet.md#3-wait-for-one-transaction-to-finalize)
  and [confirm pre-execution transactions](../../guides/filter-solana-pre-execution-by-account.md).
