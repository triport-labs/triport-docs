> Live version: https://triport.io/docs/eth

# Ethereum RPC & APIs

One key covers Ethereum `eth_*`, `debug_*`, `trace_*`, and `txpool_*` JSON-RPC, REST wallet/mempool/MEV/validator/peer products, beacon access, and WebSocket Pub/Sub.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/eth` | Ethereum mainnet | `1` | `x-token: $TRIPORT_API_KEY` | `eth:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/eth` | Backend path `/rpc` |
| WSS | `wss://triport.io/ws/eth` | Registry path `/ws/eth` |
| REST | Product routes | [REST catalog](./rest/index.md) |
| Stream contract | eth ws | [AsyncAPI](https://triport.io/api-specs/streaming/eth-ws.asyncapi.yaml) |

## Quickstart

```bash
curl https://triport.io/eth \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## What's available

**58 JSON-RPC methods** in the OpenRPC catalog:

- `eth_peergraph`: 5
- `eth_trace`: 6
- `eth_debug`: 7
- `eth_read_rpc`: 32
- `eth_send_bundle`: 2
- `eth_getproof`: 1
- `eth_send_tx`: 1
- `eth_trace_filter`: 1
- `eth_txpool`: 3

Deep inspection, pending-pool visibility, MEV submission and intelligence, peer topology, and consensus-layer access are part of the published catalogs.

## Limits

See [network limits](./limits.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `eth_debug` | — | — | 5 RPS sustained · up to 10 burst | 15 RPS sustained · up to 30 burst | unlimited |
| `eth_getproof` | — | — | 5 RPS sustained · up to 10 burst | 15 RPS sustained · up to 30 burst | unlimited |
| `eth_mempool_live` | — | 100 RPS sustained · up to 200 burst | 800 RPS sustained · up to 1600 burst | 1130 RPS sustained · up to 2260 burst | unlimited |
| `eth_peergraph` | — | — | — | 20 RPS sustained · up to 40 burst | unlimited |
| `eth_read_rpc` | 10 RPS sustained · up to 20 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `eth_send_bundle` | — | — | 5 RPS sustained · up to 10 burst | 15 RPS sustained · up to 30 burst | unlimited |
| `eth_send_tx` | 3 RPS sustained · up to 6 burst | 5 RPS sustained · up to 10 burst | 30 RPS sustained · up to 60 burst | 80 RPS sustained · up to 160 burst | unlimited |
| `eth_trace` | — | — | 5 RPS sustained · up to 10 burst | 15 RPS sustained · up to 30 burst | unlimited |
| `eth_txpool` | — | — | 1 RPS sustained · up to 2 burst | 2 RPS sustained · up to 4 burst | unlimited |
| `eth_txpool_snapshot_min_interval_sec` | — | — | 5 | 2 | unlimited |
| `eth_validator_registry` | — | — | — | 50 RPS sustained · up to 100 burst | unlimited |

`debug_*` and `trace_*` use heavier, premium categories.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

## Methods

### eth trace (6)

- [`trace_block`](./json-rpc/trace_block.md)
- [`trace_call`](./json-rpc/trace_call.md)
- [`trace_replayBlockTransactions`](./json-rpc/trace_replayBlockTransactions.md)
- [`trace_transaction`](./json-rpc/trace_transaction.md)

### eth debug (7)

- [`debug_getRawBlock`](./json-rpc/debug_getRawBlock.md)
- [`debug_getRawHeader`](./json-rpc/debug_getRawHeader.md)
- [`debug_storageRangeAt`](./json-rpc/debug_storageRangeAt.md)
- [`debug_traceBlockByHash`](./json-rpc/debug_traceBlockByHash.md)
- [`debug_traceBlockByNumber`](./json-rpc/debug_traceBlockByNumber.md)
- [`debug_traceCall`](./json-rpc/debug_traceCall.md)
- [`debug_traceTransaction`](./json-rpc/debug_traceTransaction.md)

### eth read rpc (32)

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
- [`eth_getLogs`](./json-rpc/eth_getLogs.md)
- [`eth_getStorageAt`](./json-rpc/eth_getStorageAt.md)
- [`eth_getTransactionByBlockHashAndIndex`](./json-rpc/eth_getTransactionByBlockHashAndIndex.md)
- [`eth_getTransactionByBlockNumberAndIndex`](./json-rpc/eth_getTransactionByBlockNumberAndIndex.md)
- [`eth_getTransactionByHash`](./json-rpc/eth_getTransactionByHash.md)
- [`eth_getTransactionCount`](./json-rpc/eth_getTransactionCount.md)
- [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md)
- [`eth_getUncleByBlockHashAndIndex`](./json-rpc/eth_getUncleByBlockHashAndIndex.md)
- [`eth_getUncleByBlockNumberAndIndex`](./json-rpc/eth_getUncleByBlockNumberAndIndex.md)
- [`eth_getUncleCountByBlockHash`](./json-rpc/eth_getUncleCountByBlockHash.md)
- [`eth_getUncleCountByBlockNumber`](./json-rpc/eth_getUncleCountByBlockNumber.md)
- [`eth_maxPriorityFeePerGas`](./json-rpc/eth_maxPriorityFeePerGas.md)
- [`eth_protocolVersion`](./json-rpc/eth_protocolVersion.md)
- [`eth_syncing`](./json-rpc/eth_syncing.md)
- [`net_listening`](./json-rpc/net_listening.md)
- [`net_peerCount`](./json-rpc/net_peerCount.md)
- [`net_version`](./json-rpc/net_version.md)
- [`web3_clientVersion`](./json-rpc/web3_clientVersion.md)
- [`web3_sha3`](./json-rpc/web3_sha3.md)

### eth send bundle (1)

- `eth_sendBundle` — sent through the [private RPC forwarder](./rest/mev-private-rpc.md), not the shared endpoint

### eth getproof (1)

- [`eth_getProof`](./json-rpc/eth_getProof.md)

### eth send tx (1)

- [`eth_sendRawTransaction`](./json-rpc/eth_sendRawTransaction.md)

### eth trace filter (1)

- [`trace_filter`](./json-rpc/trace_filter.md)

### eth txpool (3)

- [`txpool_content`](./json-rpc/txpool_content.md)
- [`txpool_inspect`](./json-rpc/txpool_inspect.md)
- [`txpool_status`](./json-rpc/txpool_status.md)

## Streams

- [eth ws](https://triport.io/api-specs/streaming/eth-ws.asyncapi.yaml)

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.eth.call("eth_blockNumber", []);
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
- [REST API](./rest/index.md)
- [Streaming overview](../streaming/index.md)

Tutorial: [stream pending Ethereum and Polygon transactions](../guides/stream-pending-evm-transactions.md) — full transaction objects over `/ws/eth`, and the read budget behind body fetches.
