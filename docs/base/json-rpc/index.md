> Live version: https://triport.io/docs/base/json-rpc

# Base JSON-RPC methods

The 28 JSON-RPC methods served on Base mainnet (chain ID 8453) at `POST https://triport.io/rpc/base`. Minimum tiers come from the enforced tier matrix.

## heavy_rpc (2)

- [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) — `pro` and above
- [`debug_traceTransaction`](./debug_traceTransaction.md) — `pro` and above

## core_rpc (25)

- [`eth_blockNumber`](./eth_blockNumber.md) — `free` and above
- [`eth_call`](./eth_call.md) — `free` and above
- [`eth_chainId`](./eth_chainId.md) — `free` and above
- [`eth_estimateGas`](./eth_estimateGas.md) — `free` and above
- [`eth_feeHistory`](./eth_feeHistory.md) — `free` and above
- [`eth_gasPrice`](./eth_gasPrice.md) — `free` and above
- [`eth_getBalance`](./eth_getBalance.md) — `free` and above
- [`eth_getBlockByHash`](./eth_getBlockByHash.md) — `free` and above
- [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) — `free` and above
- `eth_getBlockByNumber+Receipts` — `free` and above
- [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) — `free` and above
- [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md) — `free` and above
- [`eth_getBlockTransactionCountByNumber`](./eth_getBlockTransactionCountByNumber.md) — `free` and above
- [`eth_getCode`](./eth_getCode.md) — `free` and above
- [`eth_getLogs`](./eth_getLogs.md) — `free` and above
- [`eth_getStorageAt`](./eth_getStorageAt.md) — `free` and above
- [`eth_getTransactionByBlockHashAndIndex`](./eth_getTransactionByBlockHashAndIndex.md) — `free` and above
- [`eth_getTransactionByBlockNumberAndIndex`](./eth_getTransactionByBlockNumberAndIndex.md) — `free` and above
- [`eth_getTransactionByHash`](./eth_getTransactionByHash.md) — `free` and above
- [`eth_getTransactionCount`](./eth_getTransactionCount.md) — `free` and above
- [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) — `free` and above
- [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md) — `free` and above
- [`eth_syncing`](./eth_syncing.md) — `free` and above
- [`net_version`](./net_version.md) — `free` and above
- [`web3_clientVersion`](./web3_clientVersion.md) — `free` and above

## transactions (1)

- [`eth_sendRawTransaction`](./eth_sendRawTransaction.md) — `free` and above

See the [Base overview](../index.md), [limits](../limits.md) and [errors](../errors.md).
