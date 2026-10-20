> Live version: https://triport.io/docs/sol/json-rpc/getInflationRate

# getInflationRate

> Returns the annualized inflation rates (total, validator, and foundation) for the current epoch on the Solana cluster.

| | |
|---|---|
| **Method / Endpoint** | `getInflationRate` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getInflationRate` returns the specific inflation values for the **current
epoch**: a `total` rate plus the split between the portion paid to validators
and the portion paid to the foundation. All three are annualized rates expressed
as fractions — `0.0846` means an 8.46% annualized rate, not 0.0846%.

Use it to display current network inflation, estimate staking yield, or feed
reward calculations. The values are epoch-scoped: the returned `epoch` field
tells you which epoch they apply to, so clients that cache the result should
re-fetch when the cluster advances to a new epoch.

This method takes no parameters and is inexpensive — it is a standard read
method available on every tier. For the parameters that govern how these rates
change over time, see [`getInflationGovernor`](./getInflationGovernor.md); for
per-account staking rewards, see [`getInflationReward`](./getInflationReward.md).

## Parameters

This method takes no parameters. Send an empty positional array (`params: []`).

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This method accepts no parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getInflationRate",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "total": 0.0846,
    "validator": 0.0846,
    "foundation": 0.0,
    "epoch": 806
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `InflationRate` object. |
| `result.total` | number | Total inflation rate, as an annualized fraction. |
| `result.validator` | number | Inflation allocated to validators, as an annualized fraction. |
| `result.foundation` | number | Inflation allocated to the foundation, as an annualized fraction. |
| `result.epoch` | integer | Epoch for which these inflation values are valid. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing, invalid, or revoked `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). An HTTP error, not a JSON-RPC one: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |
| `internal_error` (500) | Internal error | Transient upstream fault while fetching inflation data; safe to retry with backoff. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getInflationRate",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Epoch ${result.epoch}: ${(result.total * 100).toFixed(2)}% total inflation`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const rate = await client.solana.getInflationRate();
console.log(`Epoch ${rate.epoch}: validator ${(rate.validator * 100).toFixed(2)}%`);
```

## Notes

- **Annualized fractions.** All three rates are fractions, not percentages.
  Multiply by 100 to display a percent (e.g. `0.0846` → `8.46%`).
- **Epoch-scoped.** The returned `epoch` identifies which epoch the values apply
  to. Cache against this value and refresh when the cluster advances to a new
  epoch — pair with [`getEpochInfo`](./getEpochInfo.md) to track the boundary.
- **`foundation` may be `0`.** As foundation inflation tapers over time it can
  reach zero, in which case `total` equals `validator`.
- **Related methods:** [`getInflationGovernor`](./getInflationGovernor.md) for
  the governing parameters and [`getInflationReward`](./getInflationReward.md)
  for per-account staking rewards.
