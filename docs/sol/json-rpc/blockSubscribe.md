> Live version: https://triport.io/docs/sol/json-rpc/blockSubscribe

# blockSubscribe

> Subscribes to new blocks and streams each full block — optionally filtered to blocks mentioning a given account or program — as it is confirmed or finalized.

| | |
|---|---|
| **Method / Endpoint** | `blockSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | pro+ — per-method tier gating on `/ws/sol` |

## Description

`blockSubscribe` pushes entire blocks over the WebSocket as the cluster
produces them, sparing you the poll-`getBlocks`-then-fetch-each-`getBlock`
loop. Each `blockNotification` carries the slot and a `block` object in the
same shape `getBlock` returns — blockhash, parent linkage, timestamp,
rewards, and the transaction list at the detail level you configure.

The first parameter is a filter: the string `"all"` streams every block,
while `{"mentionsAccountOrProgram": "<pubkey>"}` narrows the stream to blocks
containing at least one transaction that references the given account or
program — and in that case the notification's transaction list includes only
the matching transactions, not the whole block's. The config object then
controls payload weight: `transactionDetails` (`full`, `accounts`,
`signatures`, or `none`), `encoding` (`json`, `jsonParsed`, `base58`,
`base64`), `showRewards`, and `maxSupportedTransactionVersion` — set the
latter to `0` or versioned transactions in the block will make decoding fail.
`commitment` may be `confirmed` (default) or `finalized`; `processed` is
**not supported** for block subscriptions.

Use it when you genuinely need block-granular data live: feeding a real-time
indexer or analytics pipeline, computing per-block metrics (fees, compute
units, transaction counts), or tailing all activity of one program with
block-level ordering guarantees. If you only care about individual account
changes or log lines, `accountSubscribe`/`logsSubscribe` are far lighter.

Caveats worth planning around. In stock Solana this method is marked
**unstable** and only works on nodes started with the block-subscription flag
enabled — Triport routes `/ws/sol` block subscriptions to capable nodes, but
portability of your code to other RPC setups is not guaranteed. Full-detail
notifications are large (hundreds of KB, easily multiple MB per block), so
budget bandwidth and parsing time, and prefer `transactionDetails:
"signatures"` or a mentions filter when you can. Skipped slots produce no
notification. The stream is session-scoped: after a reconnect, resubscribe
and backfill missed slots with `getBlocks` + `getBlock`. Stop with
[`blockUnsubscribe`](./blockUnsubscribe.md).

## Parameters

Positional params array: `[filter, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | string \| object | yes | `"all"`, or `{"mentionsAccountOrProgram": "<base-58 pubkey>"}` to receive only blocks (and within them, only transactions) referencing the account/program. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | `confirmed` (default) or `finalized`. `processed` is not supported. |
| `encoding` | string | no | Transaction encoding: `json` (default), `jsonParsed`, `base58`, `base64`. |
| `transactionDetails` | string | no | `full` (default), `accounts`, `signatures`, or `none`. |
| `showRewards` | boolean | no | Whether to include the block's `rewards` array (default `true`). |
| `maxSupportedTransactionVersion` | integer | no | Set to `0` to accept versioned transactions; omitting it makes blocks containing them error. |

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"blockSubscribe",
 "params":[{"mentionsAccountOrProgram":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},
           {"commitment":"confirmed","encoding":"json","transactionDetails":"signatures","showRewards":false,"maxSupportedTransactionVersion":0}]}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 79015 }
```

Each matching block is pushed as a `blockNotification`:

```json
{
  "jsonrpc": "2.0",
  "method": "blockNotification",
  "params": {
    "subscription": 79015,
    "result": {
      "context": { "slot": 348392090 },
      "value": {
        "slot": 348392090,
        "err": null,
        "block": {
          "blockhash": "8qVzLxkQdWmnFDdVfKG2o1CwhQ5padJetGz9EYiHiHUV",
          "previousBlockhash": "5y2SSSY2ZJcpk1963PmdcTQjAyMevMSqYbwyR7oAR5oS",
          "parentSlot": 348392089,
          "blockTime": 1755500000,
          "blockHeight": 330122456,
          "signatures": [
            "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW"
          ]
        }
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `blockUnsubscribe`. |
| `params.result.context.slot` | integer | Slot of the notification. |
| `params.result.value.slot` | integer | Slot of the block. |
| `params.result.value.err` | object \| null | Set when the node failed to produce the block payload. |
| `params.result.value.block` | object | The block, in `getBlock` shape at the configured detail level. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Malformed filter/config — e.g. `commitment: "processed"`, or a versioned transaction with no `maxSupportedTransactionVersion`. |
| `4003` | `forbidden` | Your tier is below `pro` (`tier_insufficient`; the frame carries `required_tier` and `upgrade_url`). |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **Unstable in stock Solana:** requires nodes started with the
  block-subscription flag; Triport routes to capable nodes, but don't assume
  the method exists on arbitrary RPC endpoints.
- **Payloads are heavy:** prefer a mentions filter and
  `transactionDetails: "signatures"` unless you truly need full transactions.
- **No `processed` commitment**, and skipped slots emit nothing.
- **Related methods:** [`blockUnsubscribe`](./blockUnsubscribe.md),
  `getBlock` / `getBlocks` for backfill, and
  [`logsSubscribe`](./logsSubscribe.md) /
  [`programSubscribe`](./programSubscribe.md) for lighter targeted streams.
