> Live version: https://triport.io/docs/robinhood/json-rpc

# Robinhood JSON-RPC methods

This index is generated from the approved 27-method OpenRPC catalog. Every catalogued method has one page, and no page exists for a method outside the catalog.

## `robinhood_read_rpc_heavy` (7)

| Method | Category | Summary |
|---|---|---|
| [`debug_traceBlockByHash`](./debug_traceBlockByHash.md) | `robinhood_read_rpc_heavy` | Trace every transaction in a block selected by hash. |
| [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) | `robinhood_read_rpc_heavy` | Trace every transaction in a block selected by number. |
| [`debug_traceCall`](./debug_traceCall.md) | `robinhood_read_rpc_heavy` | Trace a read-only EVM call. |
| [`debug_traceTransaction`](./debug_traceTransaction.md) | `robinhood_read_rpc_heavy` | Trace one transaction. |
| [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) | `robinhood_read_rpc_heavy` | Return all transaction receipts in a block. |
| [`eth_getLogs`](./eth_getLogs.md) | `robinhood_read_rpc_heavy` | Return event logs matching a filter. |
| [`eth_getProof`](./eth_getProof.md) | `robinhood_read_rpc_heavy` | Return an account and storage Merkle proof. |

## `robinhood_read_rpc` (18)

| Method | Category | Summary |
|---|---|---|
| [`eth_blockNumber`](./eth_blockNumber.md) | `robinhood_read_rpc` | Return the latest block number. |
| [`eth_call`](./eth_call.md) | `robinhood_read_rpc` | Execute a read-only EVM call. |
| [`eth_chainId`](./eth_chainId.md) | `robinhood_read_rpc` | Return the chain identifier. |
| [`eth_estimateGas`](./eth_estimateGas.md) | `robinhood_read_rpc` | Estimate gas for an EVM call. |
| [`eth_feeHistory`](./eth_feeHistory.md) | `robinhood_read_rpc` | Return fee-market history. |
| [`eth_gasPrice`](./eth_gasPrice.md) | `robinhood_read_rpc` | Return the current gas-price estimate. |
| [`eth_getBalance`](./eth_getBalance.md) | `robinhood_read_rpc` | Return an account balance at a block. |
| [`eth_getBlockByHash`](./eth_getBlockByHash.md) | `robinhood_read_rpc` | Return a block by hash. |
| [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) | `robinhood_read_rpc` | Return a block by number or tag. |
| [`eth_getCode`](./eth_getCode.md) | `robinhood_read_rpc` | Return account bytecode at a block. |
| [`eth_getStorageAt`](./eth_getStorageAt.md) | `robinhood_read_rpc` | Return a contract storage slot at a block. |
| [`eth_getTransactionByHash`](./eth_getTransactionByHash.md) | `robinhood_read_rpc` | Return a transaction by hash. |
| [`eth_getTransactionCount`](./eth_getTransactionCount.md) | `robinhood_read_rpc` | Return an account nonce at a block. |
| [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) | `robinhood_read_rpc` | Return a transaction receipt by hash. |
| [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md) | `robinhood_read_rpc` | Return a priority-fee estimate. |
| [`eth_syncing`](./eth_syncing.md) | `robinhood_read_rpc` | Return node sync progress or false. |
| [`net_version`](./net_version.md) | `robinhood_read_rpc` | Return the decimal network identifier. |
| [`web3_clientVersion`](./web3_clientVersion.md) | `robinhood_read_rpc` | Return the selected node client version. |

## `robinhood_send_tx` (2)

| Method | Category | Summary |
|---|---|---|
| [`eth_sendRawTransaction`](./eth_sendRawTransaction.md) | `robinhood_send_tx` | Submit a signed raw transaction. |
| [`eth_sendRawTransactionConditional`](./eth_sendRawTransactionConditional.md) | `robinhood_send_tx` | Submit a signed transaction with sequencer inclusion conditions. |

See the [Robinhood overview](../index.md), [limits](../limits.md), and [errors](../errors.md).
