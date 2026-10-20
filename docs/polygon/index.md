> Live version: https://triport.io/docs/polygon

# Polygon RPC & APIs

One key covers the Ethereum-compatible surface, Polygon-native `bor_*` methods, `trace_*` and `debug_*` tracing, the Heimdall consensus-layer REST proxy, and WebSocket Pub/Sub.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/polygon` | Polygon mainnet | `137` | `x-token: $TRIPORT_API_KEY` | `polygon:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/polygon` | Backend path `/rpc` |
| WSS | `wss://triport.io/ws/poly` | Registry path `/ws/poly` |
| REST | Product routes | [REST catalog](./rest/index.md) |
| Stream contract | poly ws | [AsyncAPI](https://triport.io/api-specs/streaming/poly-ws.asyncapi.yaml) |

## Quickstart

```bash
curl https://triport.io/polygon \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## What's available

**50 JSON-RPC methods** in the OpenRPC catalog:

- `polygon_bor`: 7
- `polygon_trace`: 7
- `polygon_read_rpc`: 32
- `polygon_send_tx`: 1
- `polygon_txpool`: 3

The Polygon surface adds Bor validator and sprint introspection, Heimdall data, tracing, mempool data, and firehose-related REST operations.

## Limits

See [network limits](./limits.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `polygon_read_rpc` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `polygon_send_tx` | 3 RPS sustained · up to 6 burst | 5 RPS sustained · up to 10 burst | 30 RPS sustained · up to 60 burst | 80 RPS sustained · up to 160 burst | unlimited |
| `polygon_trace` | — | — | 3 RPS sustained · up to 6 burst | 10 RPS sustained · up to 20 burst | unlimited |
| `polygon_txpool` | — | — | 1 RPS sustained · up to 2 burst | 2 RPS sustained · up to 4 burst | unlimited |
| `polygon_txpool_snapshot_min_interval_sec` | — | — | 5 | 2 | unlimited |

`bor_*`, trace, and txpool operations have category-specific tier gates.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

## Methods

### polygon bor (7)

- [`bor_getAuthor`](./json-rpc/bor_getAuthor.md)
- [`bor_getCurrentProposer`](./json-rpc/bor_getCurrentProposer.md)
- [`bor_getCurrentValidators`](./json-rpc/bor_getCurrentValidators.md)
- [`bor_getRootHash`](./json-rpc/bor_getRootHash.md)
- [`bor_getSigners`](./json-rpc/bor_getSigners.md)
- [`bor_getSnapshot`](./json-rpc/bor_getSnapshot.md)
- [`eth_getRootHash`](./json-rpc/eth_getRootHash.md)

### polygon trace (7)

- [`debug_traceBlockByNumber`](./json-rpc/debug_traceBlockByNumber.md)
- [`debug_traceCall`](./json-rpc/debug_traceCall.md)
- [`trace_block`](./json-rpc/trace_block.md)
- [`trace_call`](./json-rpc/trace_call.md)
- [`trace_filter`](./json-rpc/trace_filter.md)
- [`trace_replayBlockTransactions`](./json-rpc/trace_replayBlockTransactions.md)
- [`trace_transaction`](./json-rpc/trace_transaction.md)

### polygon read rpc (32)

- [`eth_blockNumber`](./json-rpc/eth_blockNumber.md)
- [`eth_call`](./json-rpc/eth_call.md)
- [`eth_chainId`](./json-rpc/eth_chainId.md)
- [`eth_estimateGas`](./json-rpc/eth_estimateGas.md)
- [`eth_feeHistory`](./json-rpc/eth_feeHistory.md)
- [`eth_gasPrice`](./json-rpc/eth_gasPrice.md)
- [`eth_getBalance`](./json-rpc/eth_getBalance.md)
- [`eth_getBlockByHash`](./json-rpc/eth_getBlockByHash.md)
- [`eth_getBlockByNumber`](./json-rpc/eth_getBlockByNumber.md)
- [`eth_getBlockReceipts`](./json-rpc/eth_getBlockReceipts.md)
- [`eth_getBlockTransactionCountByHash`](./json-rpc/eth_getBlockTransactionCountByHash.md)
- [`eth_getBlockTransactionCountByNumber`](./json-rpc/eth_getBlockTransactionCountByNumber.md)
- [`eth_getCode`](./json-rpc/eth_getCode.md)
- [`eth_getFilterChanges`](./json-rpc/eth_getFilterChanges.md)
- [`eth_getLogs`](./json-rpc/eth_getLogs.md)
- [`eth_getProof`](./json-rpc/eth_getProof.md)
- [`eth_getStorageAt`](./json-rpc/eth_getStorageAt.md)
- [`eth_getTransactionByBlockHashAndIndex`](./json-rpc/eth_getTransactionByBlockHashAndIndex.md)
- [`eth_getTransactionByBlockNumberAndIndex`](./json-rpc/eth_getTransactionByBlockNumberAndIndex.md)
- [`eth_getTransactionByHash`](./json-rpc/eth_getTransactionByHash.md)
- [`eth_getTransactionCount`](./json-rpc/eth_getTransactionCount.md)
- [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md)
- [`eth_maxPriorityFeePerGas`](./json-rpc/eth_maxPriorityFeePerGas.md)
- [`eth_newBlockFilter`](./json-rpc/eth_newBlockFilter.md)
- [`eth_protocolVersion`](./json-rpc/eth_protocolVersion.md)
- [`eth_syncing`](./json-rpc/eth_syncing.md)
- [`eth_uninstallFilter`](./json-rpc/eth_uninstallFilter.md)
- [`net_listening`](./json-rpc/net_listening.md)
- [`net_peerCount`](./json-rpc/net_peerCount.md)
- [`net_version`](./json-rpc/net_version.md)
- [`web3_clientVersion`](./json-rpc/web3_clientVersion.md)
- [`web3_sha3`](./json-rpc/web3_sha3.md)

### polygon send tx (1)

- [`eth_sendRawTransaction`](./json-rpc/eth_sendRawTransaction.md)

### polygon txpool (3)

- [`txpool_content`](./json-rpc/txpool_content.md)
- [`txpool_inspect`](./json-rpc/txpool_inspect.md)
- [`txpool_status`](./json-rpc/txpool_status.md)

## Streams

- [poly ws](https://triport.io/api-specs/streaming/poly-ws.asyncapi.yaml)

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.polygon.call("eth_blockNumber", []);
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
- [REST API](./rest/index.md)
- [Streaming overview](../streaming/index.md)

Tutorial: [stream pending Ethereum and Polygon transactions](../guides/stream-pending-evm-transactions.md) — Polygon's hash-only stream, and fetching bodies within your plan's read budget.
