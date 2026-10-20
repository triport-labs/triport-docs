> Live version: https://triport.io/docs/ton

# TON RPC & APIs

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/rpc/ton` | TON mainnet | — | `x-token: $TRIPORT_API_KEY` | `ton:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/rpc/ton` | Backend path `/rpc/ton` |

## Quickstart

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAddressInformation","params":{}}'
```

## What's available

**13 JSON-RPC methods** in the OpenRPC catalog:

- `ton_read_rpc_heavy`: 10
- `ton_read_rpc`: 3

## Limits

See [network limits](./rate-limits-and-tiers.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `ton_read_rpc` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `ton_read_rpc_heavy` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

## Methods

### ton read rpc heavy (10)

- [`getAddressInformation`](./json-rpc/getAddressInformation.md)
- [`getBlock`](./json-rpc/getBlock.md)
- [`getBlockHeader`](./json-rpc/getBlockHeader.md)
- [`getConfigAll`](./json-rpc/getConfigAll.md)
- [`getConfigParam`](./json-rpc/getConfigParam.md)
- [`getShards`](./json-rpc/getShards.md)
- [`getTransactions`](./json-rpc/getTransactions.md)
- [`lookupBlock`](./json-rpc/lookupBlock.md)
- [`runGetMethod`](./json-rpc/runGetMethod.md)
- [`runSmcMethod`](./json-rpc/runSmcMethod.md)

### ton read rpc (3)

- [`getMasterchainInfo`](./json-rpc/getMasterchainInfo.md)
- [`getTime`](./json-rpc/getTime.md)
- [`getVersion`](./json-rpc/getVersion.md)

## Streams

No mounted stream is published for this network.

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.ton.call("getAddressInformation", {});
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
