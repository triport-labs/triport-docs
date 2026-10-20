> Live version: https://triport.io/docs/bsc

# BNB Smart Chain RPC & APIs

BSC provides read-only JSON-RPC 2.0 access over HTTPS. The published method catalog covers current chain data and supported historical reads; historical availability depends on the requested method and block.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/rpc/bsc` | BNB Smart Chain mainnet | `56` | `x-token: $TRIPORT_API_KEY` | `bsc:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/rpc/bsc` | Backend path `/rpc/bsc` |

## Quickstart

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## What's available

**29 JSON-RPC methods** in the OpenRPC catalog:

- `bsc_read_rpc_heavy`: 7
- `bsc_read_rpc`: 22

Historical state reads are available within the retained history. Requests outside that history can return a pruned or unsupported-state error; handle these errors before retrying.

## Limits

See [network limits](./limits.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `bsc_read_rpc` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `bsc_read_rpc_heavy` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |

Keep `eth_getLogs` block ranges small and use an `address` filter where possible. If a range is rejected, split it into smaller requests. Consult the method reference and network limits for request budgets.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

Upstream `-32000` is ambiguous: `header not found` means a missing block, while pruned/unsupported text means missing historical state. Classify code and message together. invalid logs ranges or a missing required address are parameter errors.

## Methods

### bsc read rpc heavy (4)

- [`eth_call`](./json-rpc/eth_call.md)
- [`eth_getBalance`](./json-rpc/eth_getBalance.md)
- [`eth_getBlockReceipts`](./json-rpc/eth_getBlockReceipts.md)
- [`eth_getLogs`](./json-rpc/eth_getLogs.md)

### bsc read rpc (22)

- [`eth_blockNumber`](./json-rpc/eth_blockNumber.md)
- [`eth_chainId`](./json-rpc/eth_chainId.md)
- [`eth_estimateGas`](./json-rpc/eth_estimateGas.md)
- [`eth_feeHistory`](./json-rpc/eth_feeHistory.md)
- [`eth_gasPrice`](./json-rpc/eth_gasPrice.md)
- [`eth_getBlockByNumber`](./json-rpc/eth_getBlockByNumber.md)
- [`eth_getBlockTransactionCountByNumber`](./json-rpc/eth_getBlockTransactionCountByNumber.md)
- [`eth_getCode`](./json-rpc/eth_getCode.md)
- [`eth_getProof`](./json-rpc/eth_getProof.md)
- [`eth_getStorageAt`](./json-rpc/eth_getStorageAt.md)
- [`eth_getTransactionByHash`](./json-rpc/eth_getTransactionByHash.md)
- [`eth_getTransactionCount`](./json-rpc/eth_getTransactionCount.md)
- [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md)
- [`eth_maxPriorityFeePerGas`](./json-rpc/eth_maxPriorityFeePerGas.md)
- [`eth_syncing`](./json-rpc/eth_syncing.md)
- [`net_listening`](./json-rpc/net_listening.md)
- [`net_peerCount`](./json-rpc/net_peerCount.md)
- [`net_version`](./json-rpc/net_version.md)
- [`txpool_content`](./json-rpc/txpool_content.md)
- [`txpool_inspect`](./json-rpc/txpool_inspect.md)
- [`txpool_status`](./json-rpc/txpool_status.md)
- [`web3_clientVersion`](./json-rpc/web3_clientVersion.md)

## Streams

No mounted stream is published for this network.

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.bsc.call("eth_blockNumber", []);
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
