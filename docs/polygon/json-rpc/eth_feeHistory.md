> Live version: https://triport.io/docs/polygon/json-rpc/eth_feeHistory

# eth_feeHistory

> Returns a window of historical base fees, gas-usage ratios, and priority-fee percentiles for Polygon, used to estimate EIP-1559 fees.

| | |
|---|---|
| **Method / Endpoint** | `eth_feeHistory` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 RPS sustained · up to 30 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_feeHistory` returns fee-market data for a contiguous range of blocks ending
at `newestBlock` on Polygon mainnet (chain id `0x89` / `137`). For each block in
the window it reports the base fee per gas, the gas-used ratio, and — when you
pass `rewardPercentiles` — the effective priority fee (tip) at each requested
percentile. The response also includes the projected base fee for the block
immediately after the window, so the `baseFeePerGas` array always has one more
entry than the number of blocks requested.

This is the primary input for a bot fee strategy: read recent base fees to
anticipate the next block's base fee, and read tip percentiles to pick a
`maxPriorityFeePerGas` that matches how aggressively you want a transaction
included. A common pattern is to request the last few blocks at the
`[10, 50, 90]` percentiles and choose a tip from the median or upper band
depending on urgency. Since Polygon's post-Bhilai fee market keeps base fees
higher and more volatile than Ethereum's, sampling a short recent window each
block is usually preferable to a single spot price from `eth_gasPrice`.

All numeric values are returned as `0x`-prefixed hexadecimal strings (wei),
including the entries inside the `reward` arrays. The `gasUsedRatio` field is the
exception — it is a JSON number between `0` and `1`.

## Parameters

Positional `params` array, in order:

| Name | Type | Required | Description |
|---|---|---|---|
| `blockCount` | `string` \| `number` | yes | Number of blocks in the requested window, `1`–`1024`. Accepts a hex-encoded string (e.g. `"0x5"`) or an integer. |
| `newestBlock` | `string` | yes | Highest block of the window: a `0x`-prefixed block number or a tag (`"latest"`, `"pending"`, `"earliest"`, `"safe"`, `"finalized"`). |
| `rewardPercentiles` | `number[]` | no | Monotonically increasing list of percentiles (`0`–`100`) at which to sample effective priority fees per block. Omit to skip the `reward` array. |

> **Payload size.** The response grows linearly with `blockCount`. At Polygon's
> ~2 s block time, the maximum `blockCount` of `1024` spans roughly **34 minutes**
> of history — request only the window you need to keep responses small and
> stay well within your RPS budget.

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_feeHistory",
    "params": ["0x4", "latest", [10, 50, 90]]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "oldestBlock": "0x42d8a1c",
    "baseFeePerGas": [
      "0x6fc23ac00",
      "0x71f4d2680",
      "0x6e8b1d900",
      "0x70a2c5b18",
      "0x6d8f1a4c2"
    ],
    "gasUsedRatio": [
      0.5821,
      0.6093,
      0.4744,
      0.7012
    ],
    "reward": [
      ["0x6fc23ac00", "0x826299e00", "0xba43b7400"],
      ["0x6fc23ac00", "0x77359400", "0x9502f9000"],
      ["0x59682f000", "0x6fc23ac00", "0x826299e00"],
      ["0x6fc23ac00", "0x826299e00", "0xdf8475800"]
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `object` | The fee-history window. |
| `result.oldestBlock` | `string` | Block number of the lowest (oldest) block in the window, as a `0x`-prefixed hex string. |
| `result.baseFeePerGas` | `string[]` | Base fee per gas (wei, hex) for each block in the window **plus** the projected base fee for the next block. Length = `blockCount + 1`. |
| `result.gasUsedRatio` | `number[]` | Ratio of gas used to gas limit (`0`–`1`) for each block in the window. Length = `blockCount`. |
| `result.reward` | `string[][]` | Per-block array of effective priority fees (wei, hex), one entry per requested percentile. Length = `blockCount`. Omitted when `rewardPercentiles` is not supplied. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's free trial period has ended; upgrade to continue. |
| `403` | `tier_insufficient` | Your key's tier is below the minimum for this method (not normally reachable — `eth_feeHistory` is available on the Free trial). |
| `429` | `rate_limited` | The per-tier RPS limit for `polygon_read_rpc` was exceeded. Back off using `Retry-After` and retry. |
| `-32602` | `invalid_params` | `blockCount` is outside `1`–`1024`, `rewardPercentiles` is not increasing or out of range, or `newestBlock` is malformed. |
| HTTP `403` | `method_unknown` | The method name was not recognised on the `polygon` chain (typo or unsupported method). |

See [errors.md](../../errors.md) for the full error envelope, the `error.data`
fields, and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_feeHistory",
    params: ["0x4", "latest", [10, 50, 90]],
  }),
});

const { result } = await res.json();

// Suggest a tip from the median (50th percentile) of the most recent block.
const recentReward = result.reward.at(-1);
const medianTip = parseInt(recentReward[1], 16);
const nextBaseFee = parseInt(result.baseFeePerGas.at(-1), 16);
console.log({ nextBaseFee, medianTip });
```

## Notes

- `baseFeePerGas` is always one element longer than `blockCount` — the last entry
  is the *predicted* base fee for the block after `newestBlock`, which is what you
  feed into a `maxFeePerGas` estimate.
- `gasUsedRatio` values near `1.0` indicate full blocks and an upward-trending
  base fee; values well below `0.5` indicate the base fee is likely to fall.
- Keep `blockCount` small for real-time fee strategy. Because Polygon produces a
  block roughly every 2 s, a short window (4–32 blocks) tracks the live fee market
  closely; the `1024` maximum (~34 min) is for historical analysis, not per-block
  polling.
- Omitting `rewardPercentiles` returns a lighter response without the `reward`
  array — useful when you only need base-fee trends.
- All wei amounts (base fees and rewards) are hex strings; convert with base 16
  before arithmetic. `gasUsedRatio` is already a decimal number.
- `eth_feeHistory` is available on the **Free** trial (`polygon_read_rpc`
  category). Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- For a single spot price instead of a window, see
  [`eth_gasPrice`](./eth_gasPrice.md). For the suggested EIP-1559 tip directly,
  see [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md). To learn the
  current chain head before requesting a historical window, see
  [`eth_blockNumber`](./eth_blockNumber.md).
