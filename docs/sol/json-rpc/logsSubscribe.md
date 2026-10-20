> Live version: https://triport.io/docs/sol/json-rpc/logsSubscribe

# logsSubscribe

> Subscribes to transaction log messages, streaming the logs of every transaction — or only those that mention a given account — as they are committed.

| | |
|---|---|
| **Method / Endpoint** | `logsSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`logsSubscribe` streams the log output of transactions as they execute. Each
`logsNotification` delivers one transaction's worth of logs: the transaction
`signature`, its `err` status (`null` on success), and the ordered `logs`
array — the same `Program ... invoke` / `Program log: ...` lines you see in
`getTransaction` metadata, but pushed to you in real time instead of fetched
after the fact.

The first parameter is a filter. The string `"all"` subscribes to every
non-vote transaction on the cluster; `"allWithVotes"` includes vote
transactions too (a torrent — rarely what you want); and
`{"mentions": ["<pubkey>"]}` narrows the stream to transactions that reference
a specific account. The `mentions` array accepts **exactly one** pubkey per
subscription — passing several is an error, so open one subscription per
address you track. The optional config object takes a `commitment` level
(`processed`, `confirmed` — the default — or `finalized`).

This is the workhorse method for event-driven indexing: watching a program id
for every interaction with your protocol, detecting new SPL token mints by
watching the token program, following a DEX pool address for swaps, or
alerting on any transaction that touches a treasury wallet. Since program
events on Solana are usually emitted as log lines, `logsSubscribe` on a
program id is the closest native equivalent to an EVM event subscription.

Mind the failure modes. A `mentions` filter matches *any* reference to the
account — including failed transactions, so check `err` before acting. Logs
can be truncated when a transaction exceeds the node's log budget (`Log
truncated` appears in the array). And like all Pub/Sub subscriptions, the
stream dies with the WebSocket session: on reconnect you must resubscribe and
backfill the gap with `getSignaturesForAddress` if you cannot afford to miss
events. Stop the stream with [`logsUnsubscribe`](./logsUnsubscribe.md).

## Parameters

Positional params array: `[filter, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | string \| object | yes | `"all"`, `"allWithVotes"`, or `{"mentions": ["<base-58 pubkey>"]}` (exactly one pubkey). |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | `processed`, `confirmed` (default), or `finalized`. |

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"logsSubscribe","params":[{"mentions":["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"]},{"commitment":"confirmed"}]}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 41902 }
```

Each matching transaction is pushed as a `logsNotification`:

```json
{
  "jsonrpc": "2.0",
  "method": "logsNotification",
  "params": {
    "subscription": 41902,
    "result": {
      "context": { "slot": 348392060 },
      "value": {
        "signature": "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
        "err": null,
        "logs": [
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [1]",
          "Program log: Instruction: Transfer",
          "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success"
        ]
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `logsUnsubscribe`. |
| `params.result.context.slot` | integer | Slot the transaction was committed in. |
| `params.result.value.signature` | string | The transaction's first signature (base-58). |
| `params.result.value.err` | object \| null | `null` on success, otherwise the `TransactionError`. |
| `params.result.value.logs` | array of string | Ordered program log lines emitted during execution. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Malformed filter — e.g. more than one pubkey in `mentions`. |
| `4003` | `forbidden` | Your tier is below `basic` (`tier_insufficient`; the frame carries `required_tier`). |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **One pubkey per `mentions` filter** — open multiple subscriptions on the
  same socket to track multiple addresses.
- **Failed transactions match too:** always branch on `value.err`.
- **Gaps on reconnect:** the stream has no replay; backfill with
  `getSignaturesForAddress` + `getTransaction` after resubscribing.
- **Related methods:** [`logsUnsubscribe`](./logsUnsubscribe.md),
  [`programSubscribe`](./programSubscribe.md) (account-state view of the same
  activity), and [`signatureSubscribe`](./signatureSubscribe.md) (status of
  one known transaction).
