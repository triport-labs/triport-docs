> Live version: https://triport.io/docs/polygon/json-rpc/eth_maxPriorityFeePerGas

# eth_maxPriorityFeePerGas

> Returns the suggested EIP-1559 priority fee (validator tip) for Polygon, in wei, as a hex-encoded string.

| | |
|---|---|
| **Method / Endpoint** | `eth_maxPriorityFeePerGas` (JSON-RPC, `POST https://triport.io/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | Free and up — free 15 rps · basic 20 rps · pro 100 rps · business 250 rps |

## Description

`eth_maxPriorityFeePerGas` returns a suggested **priority fee** — the tip paid
directly to the validator on top of the protocol base fee — for inclusion in an
upcoming Polygon block. The value is a `0x`-prefixed hexadecimal quantity
denominated in **wei**. It is the EIP-1559 complement to
[`eth_gasPrice`](./eth_gasPrice.md): where `eth_gasPrice` gives a single legacy
gas price, this method isolates just the tip portion so you can build the
`maxPriorityFeePerGas` field of a type-2 (EIP-1559) transaction.

Since the **Bhilai hardfork**, EIP-1559 is the primary fee model on Polygon, and
this method is the canonical way to obtain a tip suggestion rather than relying
on the legacy `eth_gasPrice`. The returned value is a node-side **suggestion**
derived from recent block history, not a guarantee of inclusion. To build a full
fee envelope, read the pending block's `baseFeePerGas` and add the tip returned
here, typically setting `maxFeePerGas ≈ baseFee * 2 + tip` to absorb base-fee
swings between blocks.

Polygon produces a block roughly every **~2.1 seconds**, and the suggested tip
can change block-to-block during volatile demand. Re-query it close to the moment
you sign and broadcast so the tip reflects current network conditions. The method
takes no parameters and is available on the **Free** trial under the
`polygon_read_rpc` scope.

## Parameters

This method takes **no parameters**. Pass an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | — | — | `params` must be an empty array `[]`. |

## Request

```bash
curl https://triport.io/polygon \
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
  "result": "0x6fc23ac00"
}
```

`0x6fc23ac00` = 30,000,000,000 wei = 30 gwei. Polygon tips commonly sit higher
than on Ethereum mainnet due to more frequent inclusion.

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version, always `"2.0"`. |
| `id` | number \| string | Echoes the `id` from the request. |
| `result` | string | Suggested priority fee in **wei**, as a `0x`-prefixed hex string. Parse with `parseInt(result, 16)` / `int(result, 16)` (or `BigInt(result)` to avoid precision loss). |

## Errors

Errors are returned in the standard JSON-RPC envelope under the `error` object
(`{ "code": <int>, "message": <string> }`). See [errors.md](../../errors.md)
for the full error envelope and shared semantics.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` (HTTP 401) | The free trial window for the key has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` (HTTP 403) | The key's tier is not entitled to this method. (`eth_maxPriorityFeePerGas` is included in the Free trial, so this normally only surfaces on disabled keys.) |
| `429` | `rate_limited` (HTTP 429) | Requests exceeded the per-second limit for the key's tier (free 15 · basic 20 · pro 100 · business 250 rps). Back off and retry. |
| `401` | `subscription_expired` (HTTP 401) | The paid subscription tied to the key has lapsed. |
| `401` | `unauthorized` (HTTP 401) | The `Authorization` credential is missing, malformed, or invalid. |
| `-32601` | `method_unknown` (HTTP 403) | The `method` name was misspelled or is not exposed on this network. |

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
    method: "eth_maxPriorityFeePerGas",
    params: [],
  }),
});

const { result } = await res.json();
const tipWei = BigInt(result);
console.log(`suggested tip: ${tipWei} wei (${tipWei / 1_000_000_000n} gwei)`);
```

## Notes

- **Tip only, not total gas.** This returns just the priority fee. To estimate a
  full EIP-1559 `maxFeePerGas`, combine it with the pending block's
  `baseFeePerGas` (from [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) with
  `"pending"`).
- **Post-Bhilai default.** EIP-1559 is the primary fee model on Polygon; prefer
  this method over the legacy [`eth_gasPrice`](./eth_gasPrice.md) for tip
  selection. For richer percentile-based fee strategy, use
  [`eth_feeHistory`](./eth_feeHistory.md).
- **Re-query before signing.** The suggestion is derived from recent blocks and
  can shift block-to-block (~2.1 s block time) during volatile demand. Fetch it
  immediately before you sign and broadcast.
- **Hex encoding.** The result is always a `0x`-prefixed hex string in wei, never
  a decimal number — parse it with `BigInt(...)` in JS/TS or `int(x, 16)` in
  Python before doing arithmetic.
