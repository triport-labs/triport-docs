> Live version: https://triport.io/docs/polygon/json-rpc/eth_gasPrice

# eth_gasPrice

> Returns the node's current legacy gas-price suggestion, in wei, as a hex string.

| | |
|---|---|
| **Method / Endpoint** | `eth_gasPrice` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 RPS sustained · up to 30 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_gasPrice` returns the node's current best estimate of the gas price on
Polygon mainnet (chain ID `0x89` / 137), encoded as a `0x`-prefixed hexadecimal
string in **wei**. It takes no parameters. The value represents what the node
considers a competitive price for a *legacy* (pre-EIP-1559) transaction.

Use it when you need a single, simple gas-price figure — for example, when
constructing a legacy `type: 0x0` transaction that carries a flat `gasPrice`
field, or for a quick fee-level readout in a dashboard.

**Prefer EIP-1559 fee methods on Polygon.** Since the Bhilai hardfork, Polygon
uses the EIP-1559 fee market (a per-block `baseFeePerGas` plus a priority tip),
so a single `gasPrice` value is a coarse fallback. For accurate fee estimation
on EIP-1559 transactions (`maxFeePerGas` / `maxPriorityFeePerGas`), use
[`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md) or
[`eth_feeHistory`](./eth_feeHistory.md) and add a tip. `eth_gasPrice` remains
useful for legacy transactions and for rough, human-readable estimates. Note
that Polygon gas prices typically sit well above Ethereum's — values around
`30` gwei are common.

## Parameters

This method takes no parameters; pass an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | `array` | yes | Must be `[]`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_gasPrice",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x6fc23ac00"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `string` | Current gas-price estimate in wei as a `0x`-prefixed hex string (e.g. `0x6fc23ac00` = `30000000000` wei = `30` gwei). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | The current tier may not call this method. (`eth_gasPrice` is available from the Free trial up, so this is rare here.) |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry after `data.retry_after_sec`. |
| `401` | `subscription_expired` | The account's subscription has lapsed. |
| `401` | `unauthorized` | The API key is missing, malformed, or invalid. |
| HTTP `403` | `method_unknown` | The method name is not recognized on this chain. |

See [errors.md](../../errors.md) for the full error envelope and handling guidance.

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
    method: "eth_gasPrice",
    params: [],
  }),
});

const { result } = await res.json();
const wei = BigInt(result);
console.log("gas price:", Number(wei) / 1e9, "gwei"); // 30 gwei
```

## Notes

- The result is a hex string in **wei**, not a number — convert with base 16
  (or `BigInt`) before arithmetic, and divide by `1e9` to get gwei.
- `eth_gasPrice` is available on the **Free** trial (`polygon_read_rpc`
  category).
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- This is a **legacy** method on a post-Bhilai EIP-1559 chain. For accurate fee
  estimation use [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md) or
  [`eth_feeHistory`](./eth_feeHistory.md); to read the latest chain head, see
  [`eth_blockNumber`](./eth_blockNumber.md).
