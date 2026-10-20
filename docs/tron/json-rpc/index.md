> Live version: https://triport.io/docs/tron/json-rpc

# Tron JSON-RPC methods

Send every method below to `POST /rpc/tron` in a JSON-RPC 2.0 envelope. All
methods require `x-token: $TRIPORT_API_KEY` and the `tron:rpc` scope.

## Standard reads

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`eth_blockNumber`](./eth_blockNumber.md) | `tron_read_rpc` | Return the latest block height as a hex quantity. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_call`](./eth_call.md) | `tron_read_rpc` | Execute a read-only call against `latest` EVM state. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_chainId`](./eth_chainId.md) | `tron_read_rpc` | Return the EVM chain identifier as a hex quantity. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_gasPrice`](./eth_gasPrice.md) | `tron_read_rpc` | Return the current EVM gas price quantity. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_getBalance`](./eth_getBalance.md) | `tron_read_rpc` | Read the native balance at `latest`. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) | `tron_read_rpc` | Return an EVM block by quantity or `latest`. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_getCode`](./eth_getCode.md) | `tron_read_rpc` | Read contract bytecode at `latest`. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_getStorageAt`](./eth_getStorageAt.md) | `tron_read_rpc` | Read one contract storage word at `latest`. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`eth_syncing`](./eth_syncing.md) | `tron_read_rpc` | Return the selected node's synchronization status. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`net_version`](./net_version.md) | `tron_read_rpc` | Return the network identifier as a decimal string. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`web3_clientVersion`](./web3_clientVersion.md) | `tron_read_rpc` | Return the selected node's client version. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Heavy reads

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`eth_getLogs`](./eth_getLogs.md) | `tron_read_rpc_heavy` | Return matching EVM logs for a range of at most 100 blocks. | free+; 2 / 5 / 20 / 80 RPS sustained · short burst 4 / 10 / 40 / 160 (default, unmeasured) |

## Network constraints

- EVM state methods accept only the `latest` block tag; historical quantity
  tags are unavailable for state.
- `eth_getLogs` accepts at most 100 blocks per request.
- Tron has no WebSocket or public mempool surface in this product.
- TRC20 event-oriented REST access is part of the separate wallet/REST layer.

See [Tron errors](../errors.md), [Tron limits](../limits.md), and the
[wallet HTTP methods](../wallet/index.md).
