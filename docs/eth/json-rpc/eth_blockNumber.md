> Live version: https://triport.io/docs/eth/json-rpc/eth_blockNumber

# eth_blockNumber

> Returns the number of the most recent block on the Ethereum chain.

| | |
|---|---|
| **Method / Endpoint** | `eth_blockNumber` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_blockNumber` returns the index of the latest block the node has seen,
encoded as a `0x`-prefixed hexadecimal string. It takes no parameters and is the
canonical way to learn the current chain head.

Use it to track chain progress, to pick a concrete `latest` block height before
issuing a batch of historical reads, or as a lightweight liveness/health probe
against the RPC endpoint. The value advances roughly once every ~12 seconds on
Ethereum mainnet.

Because the result is hex, remember to convert it before using it as a decimal
number — e.g. `parseInt("0x149e2c1", 16)` → `21619393`.

## Parameters

This method takes no parameters; pass an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | `array` | yes | Must be `[]`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_blockNumber",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x149e2c1"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `string` | Latest block number as a `0x`-prefixed hex string (e.g. `0x149e2c1` = `21619393`). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `403` | `tier_insufficient` | The account's tier does not grant access to this method. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |
| `401` | `subscription_expired` | The account's paid subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | The method name is not recognized. |

See [errors.md](../../errors.md) for the full error envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_blockNumber",
    params: [],
  }),
});

const { result } = await res.json();
console.log("latest block:", parseInt(result, 16)); // 21619393
```

## Notes

- The result is a hex string, not a number — convert with base 16 before arithmetic.
- `eth_blockNumber` is available on the **Free** trial (`eth_read_rpc` category).
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An HTTP `429` `rate_limited`
  error means you should back off and retry shortly.
- To fetch the block itself, follow up with `eth_getBlockByNumber`. To read the
  current gas price alongside the head, see `eth_gasPrice`.
