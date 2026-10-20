> Live version: https://triport.io/docs/eth/json-rpc

# Ethereum JSON-RPC

> The Ethereum JSON-RPC surface on `POST https://triport.io/eth` — the standard `eth_*` set plus `debug_`, `trace_`, `txpool_`, `net_` and `web3_` namespaces, with node-admin namespaces explicitly documented as not supported.

| | |
|---|---|
| **Method / Endpoint** | `POST https://triport.io/eth` |
| **Network** | Ethereum |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../../authentication.md) |
| **Required scope** | — (tier-gated per method) |
| **Tier / rate limit** | Any tier; `debug_`/`trace_` sit in heavier categories — see [Rate Limits](../../rate-limits-and-tiers.md) |

## How to call

Every method takes the same envelope — only `method` and `params` change:

```bash
curl https://triport.io/eth \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance",
       "params":["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045","latest"]}'
```

Batching (a JSON array of request objects) is supported; each entry is
tier-checked and rate-limited individually.

## Support semantics

| Status | Meaning |
|---|---|
| **Supported** | Routed to an upstream node, result returned unchanged (`eth_*`, `debug_*`, `trace_*`, `txpool_*`, `net_*`, `web3_*`). |
| **Extension** | Provider-specific additions that are not base chain RPC (e.g. bundle submission). |
| **Not supported** | Node-admin namespaces (`admin_*`, `personal_*`) return `-32601` (`method_unknown`) by design; their pages document that behavior so the response is never a surprise. |

See [Errors](../../errors.md) for the full error envelope.

## Method reference

The pages below are grouped by namespace — `eth_`, `debug_`, `trace_`,
`txpool_`, `net_`, `web3_`, and the documented-unsupported `admin_`/`personal_`
set. Subscriptions (`newHeads`, `logs`, `newPendingTransactions`, `syncing`)
live on the WebSocket channel — see [Ethereum WS](../../streaming/eth-ws.md).

## Pages in this section

- [debug_getRawBlock](./debug_getRawBlock.md)
- [debug_getRawHeader](./debug_getRawHeader.md)
- [debug_storageRangeAt](./debug_storageRangeAt.md)
- [debug_traceBlockByHash](./debug_traceBlockByHash.md)
- [debug_traceBlockByNumber](./debug_traceBlockByNumber.md)
- [debug_traceCall](./debug_traceCall.md)
- [debug_traceTransaction](./debug_traceTransaction.md)
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
- [eth_getLogs](./eth_getLogs.md)
- [eth_getProof](./eth_getProof.md)
- [eth_getStorageAt](./eth_getStorageAt.md)
- [eth_getTransactionByBlockHashAndIndex](./eth_getTransactionByBlockHashAndIndex.md)
- [eth_getTransactionByBlockNumberAndIndex](./eth_getTransactionByBlockNumberAndIndex.md)
- [eth_getTransactionByHash](./eth_getTransactionByHash.md)
- [eth_getTransactionCount](./eth_getTransactionCount.md)
- [eth_getTransactionReceipt](./eth_getTransactionReceipt.md)
- [eth_getUncleByBlockHashAndIndex](./eth_getUncleByBlockHashAndIndex.md)
- [eth_getUncleByBlockNumberAndIndex](./eth_getUncleByBlockNumberAndIndex.md)
- [eth_getUncleCountByBlockHash](./eth_getUncleCountByBlockHash.md)
- [eth_getUncleCountByBlockNumber](./eth_getUncleCountByBlockNumber.md)
- [eth_maxPriorityFeePerGas](./eth_maxPriorityFeePerGas.md)
- [eth_protocolVersion](./eth_protocolVersion.md)
- [eth_sendRawTransaction](./eth_sendRawTransaction.md)
- [eth_syncing](./eth_syncing.md)
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
