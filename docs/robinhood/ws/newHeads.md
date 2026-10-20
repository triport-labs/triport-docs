> Live version: https://triport.io/docs/robinhood/ws/newHeads

# Robinhood newHeads subscription

> Subscribe to Robinhood Chain block headers over WebSocket: `eth_subscribe("newHeads")`, the notification envelope, reconnect behaviour and how to reconcile a gap.

`newHeads` delivers a notification for each new L2 block header. It is available from Basic tier on `wss://triport.io/ws/robinhood` with scope `robinhood:rpc`. See [WebSocket overview](../ws.md) for the connection, close codes and the pending-block extension.

## Subscribe

```json
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}
```

```json
{"jsonrpc":"2.0","id":1,"result":"0x9cef7a1b2c3d4e5f"}
```

The result is the subscription id. Notifications then arrive as standard `eth_subscription` envelopes:

```json
{"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"0x9cef7a1b2c3d4e5f","result":{"number":"0x1f4a2c","hash":"0x…","parentHash":"0x…","timestamp":"0x68c8…","gasUsed":"0x5208","gasLimit":"0x…","baseFeePerGas":"0x…"}}}
```

Header fields are standard EVM hex quantities. Stop the stream with the subscription id:

```json
{"jsonrpc":"2.0","id":2,"method":"eth_unsubscribe","params":["0x9cef7a1b2c3d4e5f"]}
```

## How headers are sourced

`newHeads` is normally served from a continuously warm, earliest-wins fan of header sources shared by the whole process: the first copy of a block header wins and later copies are dropped. The subscription id is issued locally, so client sessions do not each open their own upstream header socket.

If the shared layer goes silent, affected sessions reconnect and new subscriptions temporarily use the previous per-session upstream route; the local path resumes once the layer produces a new head. This removes the per-socket tail — it is not a latency guarantee, and no per-block delivery time is promised.

## Reconnect and reconcile

A subscription is a live view, not a queue: nothing is buffered for a disconnected client, and `newHeads` has no cursor or resume parameter. After any disconnect:

1. Reconnect with backoff and re-issue `eth_subscribe`.
2. Read the last header you processed, then fetch the missing range with [`eth_getBlockByNumber`](../json-rpc/eth_getBlockByNumber.md) until you reach the first header from the new subscription.
3. Treat a repeated block number as possible — dedupe by `hash` before acting on a header.

If you need block bodies or receipts for the gap, [`eth_getBlockReceipts`](../json-rpc/eth_getBlockReceipts.md) returns a whole block's receipts in one call. For an ordered stream of assembled blocks with an explicit cursor, use the [sequencer feed](../feed.md) instead.

## Close codes

| Code | Meaning | What to do |
|---|---|---|
| `4001 unauthorized` | No API key on the connection | Send the `x-token` header, or use `/ws/robinhood/<API_KEY>` |
| `4003 scope_missing` | Key lacks `robinhood:rpc` | Add the scope to the key |
| `1012` | Stream interrupted after an active subscription | Reconnect and resubscribe |
| `1013 upstream_unavailable` | No eligible upstream completed setup | Retry with backoff |
| `1013 client_backpressure` | The client-facing queue could not drain | Consume faster or filter less; reconnect, resubscribe and backfill |

WebSocket messages are capped at 4 MiB, the same ceiling as HTTP request bodies; see [Limits](../limits.md).
