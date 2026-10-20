> Live version: https://triport.io/docs/tron

# Tron RPC & APIs

Tron has three transport layers: 12 EVM JSON-RPC methods, 12 native wallet HTTP methods, and a separate REST `/v1/*` product surface. JSON-RPC uses EVM hex quantities; wallet block numbers are decimal JSON numbers. Wallet addresses default to hex-41; Base58 requires `visible=true`.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/rpc/tron` | Tron mainnet | `728126428` | `x-token: $TRIPORT_API_KEY` | `tron:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/rpc/tron` | Backend path `/rpc/tron` |
| REST | Product routes | Contract: `docs/api/product-rest/tron.yaml` |

## Quickstart

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## What's available

**12 JSON-RPC methods** in the OpenRPC catalog:

- `tron_read_rpc`: 11
- `tron_read_rpc_heavy`: 1

## Limits

See [network limits](./limits.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `tron_read_rpc` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `tron_read_rpc_heavy` | 2 RPS sustained · up to 4 burst | 5 RPS sustained · up to 10 burst | 20 RPS sustained · up to 40 burst | 80 RPS sustained · up to 160 burst | unlimited |

`eth_getLogs` accepts at most 100 blocks. REST `/v1` uses one public gateway at no more than 3 RPS, best-effort.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

## Methods

### tron read rpc (11)

- [`eth_blockNumber`](./json-rpc/eth_blockNumber.md)
- [`eth_call`](./json-rpc/eth_call.md)
- [`eth_chainId`](./json-rpc/eth_chainId.md)
- [`eth_gasPrice`](./json-rpc/eth_gasPrice.md)
- [`eth_getBalance`](./json-rpc/eth_getBalance.md)
- [`eth_getBlockByNumber`](./json-rpc/eth_getBlockByNumber.md)
- [`eth_getCode`](./json-rpc/eth_getCode.md)
- [`eth_getStorageAt`](./json-rpc/eth_getStorageAt.md)
- [`eth_syncing`](./json-rpc/eth_syncing.md)
- [`net_version`](./json-rpc/net_version.md)
- [`web3_clientVersion`](./json-rpc/web3_clientVersion.md)

### tron read rpc heavy (1)

- [`eth_getLogs`](./json-rpc/eth_getLogs.md)

## Streams

No mounted stream is published for this network.

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.tron.call("eth_blockNumber", []);
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)

## Pages in this section

- [Tron wallet HTTP methods](./wallet/index.md)
