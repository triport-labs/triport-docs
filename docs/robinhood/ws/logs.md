> Live version: https://triport.io/docs/robinhood/ws/logs

# Robinhood logs subscription

> Stream Robinhood Chain event logs over WebSocket: address and topic filters, mandatory client-side de-duplication, reorg handling with `removed`, and backfill through `eth_getLogs`.

`logs` delivers matching event logs as they are observed. It is available from Basic tier on `wss://triport.io/ws/robinhood` with scope `robinhood:rpc`. See [WebSocket overview](../ws.md) for the connection and close codes.

## Subscribe

```json
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["logs",{"address":"0xa0b8…","topics":["0xddf252ad…"]}]}
```

| Filter field | Type | Notes |
|---|---|---|
| `address` | string or array of strings | Contract address(es) to match. Omit to match every contract. |
| `topics` | array | Positional topic matchers; `null` is a wildcard for that position, and a nested array means "any of these" at that position. |

A Transfer filter for one token contract uses `topics[0]` = the `Transfer(address,address,uint256)` signature hash; the indexed sender and recipient are `topics[1]` and `topics[2]`.

An invalid filter is rejected with a JSON-RPC error rather than a silent empty stream:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32602,"message":"invalid filter"}}
```

Notifications use the standard `eth_subscription` envelope; each result is a log object with `address`, `topics`, `data`, `blockNumber`, `blockHash`, `transactionHash`, `logIndex` and `removed`.

## De-duplicate on the client

**Do not assume logs arrive exactly once or in `logIndex` order.** Delivery is assembled from upstream channels, and a reconnect replays nothing but can repeat a block you already saw. Key every log on the tuple `(blockHash, transactionHash, logIndex)` and track the **state** of each tuple rather than keeping a plain set of keys you have seen. The distinction matters: a cancellation (`removed: true`) carries the *same* tuple as the log it cancels, so a seen-set silently drops it and the undo below never runs. Order your own processing by `blockNumber`, then `logIndex`, rather than by arrival.

## Reorgs

A log delivered with `removed: true` belongs to a block that is no longer canonical: undo whatever you did for that tuple. Because `blockHash` is part of the key, the replacement log from the new canonical block is a different tuple and will be processed normally.

A cancellation can also arrive **before** the log it cancels. Cancellations are released as soon as they are observed, while an ordinary log may be held briefly to close a gap in `logIndex`, so the two can swap places on the wire. Treat a cancellation as a tombstone for its tuple: record it even when you are holding nothing for that tuple yet, do not run an undo for work that was never applied, and never apply a tuple that is already tombstoned. Sorting does not help here — both deliveries carry the same `blockNumber` and `logIndex`.

## Backfill after a disconnect

A subscription buffers nothing for a disconnected client and has no cursor. Persist the last fully processed block number and, after reconnecting and resubscribing, fetch the gap with [`eth_getLogs`](../json-rpc/eth_getLogs.md) using the same address and topic filter.

Range limits for `eth_getLogs` depend on the serving channel, and deep ranges may be split or reconstructed from block receipts — reconstruction is slower and can fail when no eligible historical channel exists. Split the range and retry on an error or timeout instead of assuming one call covers it; see [Limits](../limits.md).

## Not part of this contract

`newPendingTransactions` is not available, and `txpool_*` methods are not part of the Robinhood contract — there is no pre-inclusion log or mempool stream here. The [pending-block extension](../pending.md) is an operator-controlled snapshot, disabled by default, not a log stream.
