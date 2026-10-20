> Live version: https://triport.io/docs/bsc/json-rpc

# BSC JSON-RPC methods

All methods use JSON-RPC 2.0 over `POST https://triport.io/rpc/bsc` and require the `bsc:rpc` scope. BSC has no REST product surface. The configured category limits are defaults marked unmeasured in the tier matrix.

## bsc_read_rpc_heavy

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`eth_call`](./eth_call.md) | `bsc_read_rpc_heavy` | Execute a read-only EVM call. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getBalance`](./eth_getBalance.md) | `bsc_read_rpc_heavy` | Return an account balance at a block. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) | `bsc_read_rpc_heavy` | Return all transaction receipts in a block. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getLogs`](./eth_getLogs.md) | `bsc_read_rpc_heavy` | Return event logs matching a filter. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |

## bsc_read_rpc

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`eth_blockNumber`](./eth_blockNumber.md) | `bsc_read_rpc` | Return the latest block number. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_chainId`](./eth_chainId.md) | `bsc_read_rpc` | Return the chain identifier. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_estimateGas`](./eth_estimateGas.md) | `bsc_read_rpc` | Estimate gas for an EVM call. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_feeHistory`](./eth_feeHistory.md) | `bsc_read_rpc` | Return fee-market history. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_gasPrice`](./eth_gasPrice.md) | `bsc_read_rpc` | Return the current gas-price estimate. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) | `bsc_read_rpc` | Return a block by number or tag. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getBlockTransactionCountByNumber`](./eth_getBlockTransactionCountByNumber.md) | `bsc_read_rpc` | Return the transaction count in a block. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getCode`](./eth_getCode.md) | `bsc_read_rpc` | Return account bytecode at a block. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getProof`](./eth_getProof.md) | `bsc_read_rpc` | Return an account and storage Merkle proof. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getStorageAt`](./eth_getStorageAt.md) | `bsc_read_rpc` | Return a contract storage slot at a block. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getTransactionByHash`](./eth_getTransactionByHash.md) | `bsc_read_rpc` | Return a transaction by hash. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getTransactionCount`](./eth_getTransactionCount.md) | `bsc_read_rpc` | Return an account nonce at a block. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) | `bsc_read_rpc` | Return a transaction receipt by hash. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md) | `bsc_read_rpc` | Return a priority-fee estimate. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`eth_syncing`](./eth_syncing.md) | `bsc_read_rpc` | Return node sync progress or false. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`net_listening`](./net_listening.md) | `bsc_read_rpc` | Return whether the node listens for peers. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`net_peerCount`](./net_peerCount.md) | `bsc_read_rpc` | Return the selected node peer count. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`net_version`](./net_version.md) | `bsc_read_rpc` | Return the decimal network identifier. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`txpool_content`](./txpool_content.md) | `bsc_read_rpc` | Return pending and queued transaction maps. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`txpool_inspect`](./txpool_inspect.md) | `bsc_read_rpc` | Return pending and queued transaction summaries. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`txpool_status`](./txpool_status.md) | `bsc_read_rpc` | Return pending and queued transaction counts. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |
| [`web3_clientVersion`](./web3_clientVersion.md) | `bsc_read_rpc` | Return the selected node client version. | 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited |

## Network constraints

- `eth_getLogs` routing enforces measured per-node windows: 25 blocks for the limited class and 100 blocks for standard classes; one standard class requires `address`.
- Historical state is confirmed on two archive-state nodes.
- Upstream `-32000` is ambiguous; classify `header not found` separately from pruned or unsupported historical state.
- Trace/debug methods are best-effort through a single public source with a shared quota and no SLA.
- The BSC surface is read-only; raw transaction submission is not exposed.

See [BSC errors](../errors.md), [BSC limits](../limits.md), and the [network overview](../index.md).
