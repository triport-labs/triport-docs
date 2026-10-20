> Live version: https://triport.io/docs/sol/json-rpc/getTokenLargestAccounts

# getTokenLargestAccounts

> Returns the 20 largest accounts holding a particular SPL Token mint.

| | |
|---|---|
| **Method / Endpoint** | `getTokenLargestAccounts` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTokenLargestAccounts` returns the up-to-20 largest **token accounts** for a
given SPL Token mint, ranked by balance in descending order. Each entry reports
the token account `address`, the raw integer `amount`, the mint's `decimals`,
and the human-readable `uiAmount` / `uiAmountString` already scaled by those
decimals. Use it to surface a token's top holders, estimate holder
concentration, or locate large liquidity / treasury accounts for a mint.

The `mint` you pass must be the address of the **token mint** — not a wallet and
not an individual token account. The method returns holdings *of that mint*
across the largest accounts; it does not enumerate the accounts owned by a
wallet. To go from a wallet to its token accounts instead, use
`getTokenAccountsByOwner`.

Results are reported relative to a particular slot, returned in the `context`
object. Use the optional `commitment` config to control how finalized that slot
must be, and `minContextSlot` to require the node has reached at least a given
slot before serving the request. The list is capped at 20 entries and cannot be
paginated — it always reflects the largest accounts at the queried slot.

## Parameters

JSON-RPC `params` is a positional array: `[mint, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `mint` | string (base-58) | yes | The SPL Token **mint** address to query. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenLargestAccounts",
    "params": ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"]
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
    "value": [
      {
        "address": "Fn6TXqJ8ZbiYK5fa3HUbiTUbi4kkpRJ9LcGF9YgMcQ8",
        "amount": "771000000000",
        "decimals": 6,
        "uiAmount": 771000.0,
        "uiAmountString": "771000"
      },
      {
        "address": "9QgXqrgdbVU8KcpfskqJpAXKzbaYQJecgMAruSWoXDkM",
        "amount": "229001000000",
        "decimals": 6,
        "uiAmount": 229001.0,
        "uiAmountString": "229001"
      }
    ]
  }
}
```

> The `value` array contains up to 20 entries; two are shown here for brevity.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `TokenLargestAccountsResponse` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the accounts were read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | array | Up to 20 token accounts, largest first. |
| `result.value[].address` | string (base-58) | The token account address holding this balance. |
| `result.value[].amount` | string | The raw balance in base units, without decimals applied. Returned as a string to preserve `u64` precision. |
| `result.value[].decimals` | integer | Number of base-10 digits to the right of the decimal place for this mint. |
| `result.value[].uiAmount` | number | The balance scaled by `decimals`, as a JSON number. May lose precision for very large balances — prefer `uiAmountString`. |
| `result.value[].uiAmountString` | string | The balance scaled by `decimals`, as a string. The precision-safe field to display. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `mint` is missing, not valid base-58, or is not an SPL Token mint, or `config` is malformed. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
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
    method: "getTokenLargestAccounts",
    params: ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"],
  }),
});

const { result } = await res.json();
for (const holder of result.value) {
  console.log(`${holder.address}: ${holder.uiAmountString}`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.getTokenLargestAccounts(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  { commitment: "finalized" }
);

console.log(`Top ${value.length} holders at slot ${context.slot}:`);
for (const holder of value) {
  console.log(`${holder.address}: ${holder.uiAmountString}`);
}
```

## Notes

- **Mint, not wallet or token account:** pass the token **mint** address. To
  list the token accounts owned by a wallet, use `getTokenAccountsByOwner`; to
  read a single account's balance, use
  [`getTokenAccountBalance`](./getTokenAccountBalance.md).
- **Capped at 20, no pagination:** the response always returns at most the 20
  largest accounts at the queried slot. There is no cursor or offset — this is
  the complete top-of-list view, not a page of a larger set.
- **Use `amount` for math, `uiAmountString` for display:** `amount` is the exact
  `u64` base-unit count (string to avoid precision loss); `uiAmountString`
  applies `decimals` safely. Avoid the floating-point `uiAmount` for accounting.
- **Holder concentration is approximate:** the largest *token accounts* are not
  necessarily distinct holders — one entity may control several accounts, and a
  single account (e.g. an exchange or AMM pool) may custody many users' funds.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** [`getTokenAccountBalance`](./getTokenAccountBalance.md)
  reads one account; [`getTokenAccounts`](./getTokenAccounts.md) and
  [`getSupply`](./getSupply.md) cover account enumeration and total supply.
