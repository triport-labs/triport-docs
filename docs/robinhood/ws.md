> Live version: https://triport.io/docs/robinhood/ws

# Robinhood JSON-RPC WebSocket

Connect to `wss://triport.io/ws/robinhood` with the `x-token` header and the `robinhood:rpc` scope. The surface is available from Basic tier. The separate sequencer feed uses `robinhood:feed`.

## Supported subscriptions

| Subscription | Parameters | Delivery |
|---|---|---|
| `newHeads` | `["newHeads"]` | Locally fanned-out block-header notifications. |
| `logs` | `["logs", {"address": ..., "topics": [...]}]` | Matching log notifications through the existing upstream path. |
| `robinhood_pendingBlock` | `["robinhood_pendingBlock"]` | Operator-controlled snapshots of the currently assembling block. |

```json
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}
```

Per-subscription pages: [newHeads](./ws/newHeads.md) (header sourcing, reconnect, reconciliation) and [logs](./ws/logs.md) (filters, de-duplication, reorgs, backfill).

`newHeads` normally comes from the continuously warm earliest-wins fan of header sources. The subscription id is issued locally, and client sessions do not each open their own header socket. If the shared layer is silent, affected sessions reconnect and new subscriptions temporarily use the previous per-session upstream route; the local path resumes when the layer produces a new head.

`newPendingTransactions` is **not available**. Measurements acknowledged subscriptions but delivered no messages, so it remains absent from the streaming contract.

## Pending-block extension

`robinhood_pendingBlock` is disabled by default and only an operator can enable it. When disabled, `eth_subscribe` returns:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"robinhood_pendingBlock is not enabled"}}
```

When enabled, notifications use the standard `eth_subscription` envelope. The result is:

```json
{"number":42,"parentHash":"0x…","txHashes":["0x…"],"at_ms":1789467000123}
```

`number` is a JSON number, not a hex quantity. `txHashes` is always an array (an empty array is valid); `at_ms` is Unix time in milliseconds. This is a changing snapshot, not a mempool or finality signal. See [Pending data](./pending.md).

## Limits and recovery

Subscriptions are live views. Reconnect with backoff and resubscribe after a disconnect; use JSON-RPC reads to reconcile gaps. The message and client-concurrency limits are unchanged by the shared fan; see [Limits](./limits.md).

`1012` after an active subscription means the stream was interrupted. `1013 upstream_unavailable` means no eligible upstream completed setup. `1013 client_backpressure` means the client-facing queue could not drain; it does not mark upstream transport unavailable.

Clients unable to send the header can use `/ws/robinhood/<API_KEY>`. Keep this URL out of logs. Ordinary JSON-RPC reads over this WebSocket use the HTTP RPC pool.
