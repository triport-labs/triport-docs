> Live version: https://triport.io/docs/polygon/json-rpc

# Polygon JSON-RPC

> The Polygon PoS JSON-RPC surface on `POST https://triport.io/polygon` — the Ethereum-compatible `eth_*` set plus the Polygon-native `bor_*` namespace for validator and sprint introspection.

| | |
|---|---|
| **Method / Endpoint** | `POST https://triport.io/polygon` |
| **Network** | Polygon (PoS) |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../../authentication.md) |
| **Required scope** | — (tier-gated per method) |
| **Tier / rate limit** | Any tier; see [Rate Limits](../../rate-limits-and-tiers.md) |

## How to call

Every method takes the same envelope — only `method` and `params` change:

```bash
curl https://triport.io/polygon \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"bor_getAuthor","params":["latest"]}'
```

Batching (a JSON array of request objects) is supported; each entry is
tier-checked and rate-limited individually.

## Support semantics

| Status | Meaning |
|---|---|
| **Supported** | Routed to an upstream node, result returned unchanged — Ethereum-compatible `eth_*`, `net_*`, `web3_*` plus Polygon-native `bor_*`. |
| **Not supported** | Methods outside the catalog return `-32601` (`method_unknown`). |

See [Errors](../../errors.md) for the full error envelope.

## Method reference

The pages below are grouped by namespace — the Ethereum-compatible set and the
`bor_` namespace (`bor_getAuthor`, `bor_getCurrentValidators`,
`bor_getSnapshot`, …). Subscriptions live on the WebSocket channel — see
[Polygon WS](../../streaming/poly-ws.md).

## Pages in this section

- [bor_getAuthor](./bor_getAuthor.md)
- [bor_getCurrentProposer](./bor_getCurrentProposer.md)
- [bor_getCurrentValidators](./bor_getCurrentValidators.md)
- [bor_getRootHash](./bor_getRootHash.md)
- [bor_getSigners](./bor_getSigners.md)
- [bor_getSnapshot](./bor_getSnapshot.md)
- [debug_traceBlockByNumber](./debug_traceBlockByNumber.md)
- [debug_traceCall](./debug_traceCall.md)
- [eth_blockNumber](./eth_blockNumber.md)
- [eth_call](./eth_call.md)
- [eth_chainId](./eth_chainId.md)
- [eth_estimateGas](./eth_estimateGas.md)
- [eth_feeHistory](./eth_feeHistory.md)
- [eth_gasPrice](./eth_gasPrice.md)
- [eth_getBalance](./eth_getBalance.md)
- [eth_getBlockByHash](./eth_getBlockByHash.md)
- [eth_getBlockByNumber](./eth_getBlockByNumber.md)
- [eth_getBlockReceipts](./eth_getBlockReceipts.md)
- [eth_getBlockTransactionCountByHash](./eth_getBlockTransactionCountByHash.md)
- [eth_getBlockTransactionCountByNumber](./eth_getBlockTransactionCountByNumber.md)
- [eth_getCode](./eth_getCode.md)
- [eth_getFilterChanges](./eth_getFilterChanges.md)
- [eth_getLogs](./eth_getLogs.md)
- [eth_getProof](./eth_getProof.md)
- [eth_getRootHash (deprecated)](./eth_getRootHash.md)
- [eth_getStorageAt](./eth_getStorageAt.md)
- [eth_getTransactionByBlockHashAndIndex](./eth_getTransactionByBlockHashAndIndex.md)
- [eth_getTransactionByBlockNumberAndIndex](./eth_getTransactionByBlockNumberAndIndex.md)
- [eth_getTransactionByHash](./eth_getTransactionByHash.md)
- [eth_getTransactionCount](./eth_getTransactionCount.md)
- [eth_getTransactionReceipt](./eth_getTransactionReceipt.md)
- [eth_maxPriorityFeePerGas](./eth_maxPriorityFeePerGas.md)
- [eth_newBlockFilter](./eth_newBlockFilter.md)
- [eth_protocolVersion](./eth_protocolVersion.md)
- [eth_sendRawTransaction](./eth_sendRawTransaction.md)
- [eth_syncing](./eth_syncing.md)
- [eth_uninstallFilter](./eth_uninstallFilter.md)
- [net_listening](./net_listening.md)
- [net_peerCount](./net_peerCount.md)
- [net_version](./net_version.md)
- [trace_block](./trace_block.md)
- [trace_call](./trace_call.md)
- [trace_filter](./trace_filter.md)
- [trace_replayBlockTransactions](./trace_replayBlockTransactions.md)
- [trace_transaction](./trace_transaction.md)
- [txpool_content](./txpool_content.md)
- [txpool_inspect](./txpool_inspect.md)
- [txpool_status](./txpool_status.md)
- [web3_clientVersion](./web3_clientVersion.md)
- [web3_sha3](./web3_sha3.md)
