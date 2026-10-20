> Live version: https://triport.io/docs/sol/json-rpc/getTokenSupply

# getTokenSupply

> Returns the total circulating supply of an SPL token mint.

| | |
|---|---|
| **Method / Endpoint** | `getTokenSupply` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTokenSupply` returns the total supply currently in circulation for a single
SPL token mint. The amount is reported both as a raw integer string (in the
token's smallest indivisible unit) and as a human-readable value scaled by the
mint's `decimals`.

Use it to display a token's circulating supply, to compute market cap alongside
a price feed, or to confirm a mint's decimal precision before formatting other
balances. The value reflects the supply as recorded on-chain at the slot named
in the response `context` — pass a stricter `commitment` (e.g. `finalized`) when
you need a confirmed, rollback-safe number.

This is a lightweight read; it is rate limited under the standard
`sol_read_rpc` bucket and is available on every tier including free.

## Parameters

Positional params array: `[mint, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `mint` | string (Pubkey, base-58) | yes | The token mint account to query. |
| `config` | object | no | Optional configuration (see below). |

### `config` object

| Name | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level for the read: `processed`, `confirmed`, or `finalized`. Defaults to the node default if omitted. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenSupply",
    "params": [
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      { "commitment": "finalized" }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 348392041,
      "apiVersion": "2.0.18"
    },
    "value": {
      "amount": "4827361029847562",
      "decimals": 6,
      "uiAmount": 4827361029.847562,
      "uiAmountString": "4827361029.847562"
    }
  }
}
```

The example above queries the USDC mint and returns a total supply of
`4827361029847562` base units, i.e. `4827361029.847562` USDC at 6 decimals.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `TokenBalanceResponse` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the supply was read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value.amount` | string | Raw total supply in the token's smallest unit, as a decimal string. |
| `result.value.decimals` | integer | Number of base-10 digits to the right of the decimal place for this mint. |
| `result.value.uiAmount` | number \| null | Supply scaled by `decimals` as a JSON number. May be `null` if the value is not safely representable. |
| `result.value.uiAmountString` | string | Supply scaled by `decimals` as a string — prefer this for display to avoid floating-point loss. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `mint` is missing, malformed, or not a valid base-58 Pubkey, or the account is not an SPL Token mint. |
| `401` | Unauthorized | Missing or invalid `Authorization` bearer token. |
| `403` | Forbidden | The API key lacks the `sol_read_rpc` scope. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

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
    method: "getTokenSupply",
    params: ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", { commitment: "finalized" }],
  }),
});

const { result } = await res.json();
console.log(result.value.uiAmountString);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const supply = await client.solana.getTokenSupply(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  { commitment: "finalized" }
);

console.log(supply.value.uiAmountString, "decimals:", supply.value.decimals);
```

## Notes

- For display and arithmetic, prefer `value.uiAmountString` over `value.uiAmount`:
  the string form preserves precision, while the numeric form can be `null` or
  lossy for very large supplies.
- `value.amount` is denominated in the smallest unit; divide by `10 ** decimals`
  to get the human-readable supply (which is exactly what `uiAmountString`
  already gives you).
- To read a single holder's balance instead of the whole supply, use
  [getTokenAccountBalance](./getTokenAccountBalance.md). For the largest holders
  of a mint, see [getTokenLargestAccounts](./getTokenLargestAccounts.md).
- A stale or unexpected supply is often a `commitment` issue — request
  `finalized` for a confirmed, rollback-safe number.
