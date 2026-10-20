> Live version: https://triport.io/docs/eth/json-rpc/eth_maxPriorityFeePerGas

# eth_maxPriorityFeePerGas

> Returns a suggested priority fee (miner tip), in wei, for inclusion in the next block under EIP-1559.

| | |
|---|---|
| **Method / Endpoint** | `eth_maxPriorityFeePerGas` (JSON-RPC, `POST /v1/eth`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free (10 RPS sustained · up to 20 burst) · basic 20 · pro 100 · business 250; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_maxPriorityFeePerGas` returns a suggested **priority fee** — the tip paid
directly to the validator on top of the protocol base fee — expressed in wei as
a hex-encoded quantity. It is the EIP-1559 complement to
[`eth_gasPrice`](./eth_gasPrice.md): where `eth_gasPrice` gives a single legacy
gas price, this method isolates just the tip portion so you can build a
`maxPriorityFeePerGas` value for a type-2 (EIP-1559) transaction.

Use it when constructing a transaction's fee fields. A common pattern is to read
the pending block's `baseFeePerGas`, add the value returned here as the tip, and
set `maxFeePerGas` to roughly `baseFee * 2 + tip` to absorb base-fee swings
between blocks.

The returned value is a node-side **suggestion** derived from recent block
history, not a guarantee of inclusion. During periods of volatile demand the
suggestion can change block-to-block, so re-query it close to the moment you
sign and broadcast.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | — | no | No parameters are accepted. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_maxPriorityFeePerGas",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x3b9aca00"
}
```

`0x3b9aca00` = 1,000,000,000 wei = 1 gwei.

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC version, always `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | string | Suggested priority fee in **wei**, hex-encoded (`0x`-prefixed quantity). |

## Errors

Errors follow the standard JSON-RPC error envelope. See
[Errors](../../errors.md) for the full structure and handling guidance.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | The tier RPS limit (10 on free) was exceeded; back off and retry. |

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
    method: "eth_maxPriorityFeePerGas",
    params: [],
  }),
});

const { result } = await res.json();
const tipWei = BigInt(result);
console.log(`suggested tip: ${tipWei} wei (${tipWei / 1_000_000_000n} gwei)`);
```

## Notes

- Returns **only the tip**, not the total gas price. To estimate a full
  EIP-1559 `maxFeePerGas`, combine this value with the pending block's
  `baseFeePerGas` (available from
  [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) with `"pending"`).
- For a legacy single-value gas price, use
  [`eth_gasPrice`](./eth_gasPrice.md).
- The value is hex-encoded wei. Parse it with `BigInt(...)` in JS/TS or
  `int(x, 16)` in Python before doing arithmetic.
- This is a read method available from the Free trial up; no scope is required.
