> Live version: https://triport.io/docs/sol/json-rpc/getTokenAccountBalance

# getTokenAccountBalance

> Returns the token balance of a single SPL Token account.

| | |
|---|---|
| **Method / Endpoint** | `getTokenAccountBalance` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTokenAccountBalance` returns the balance held by one **SPL Token account**:
the raw integer `amount`, the token's `decimals`, and the human-readable
`uiAmount` / `uiAmountString` already scaled by those decimals.

The `pubkey` you pass must be the address of a **token account** — not the
wallet that owns it, and not the token mint. A token account is the per-mint
holding account derived for an owner (commonly the associated token account).
Passing a wallet or a mint address yields an invalid-params error rather than a
balance. To go from a wallet to its token accounts, resolve them first with
`getTokenAccountsByOwner`, then call this method on the resulting account
addresses.

The balance is reported relative to a particular slot, returned in the
`context` object. Use the optional `commitment` config to control how finalized
that slot must be, and `minContextSlot` to require the node has reached at least
a given slot before serving the request.

## Parameters

JSON-RPC `params` is a positional array: `[pubkey, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `pubkey` | string (base-58) | yes | The SPL Token **account** address to query (not a wallet or mint). Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
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
    "method": "getTokenAccountBalance",
    "params": ["7fUAJdStEuGbc3sM84cKRL6yYaaSstyLSU4ve5oovLS7"]
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
      "amount": "9864",
      "decimals": 2,
      "uiAmount": 98.64,
      "uiAmountString": "98.64"
    }
  }
}
```

The example above reads a token account holding `9864` base units of a 2-decimal
token, i.e. `98.64` tokens.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `TokenBalanceResponse` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the balance was read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | object | The token balance (`TokenAmount`). |
| `result.value.amount` | string | The raw balance in base units, without decimals applied. Returned as a string to preserve `u64` precision. |
| `result.value.decimals` | integer | Number of base-10 digits to the right of the decimal place for this mint. |
| `result.value.uiAmount` | number | The balance scaled by `decimals`, as a JSON number. May lose precision for very large balances — prefer `uiAmountString`. |
| `result.value.uiAmountString` | string | The balance scaled by `decimals`, as a string. The precision-safe field to display. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `pubkey` is missing, not valid base-58, or is not an SPL Token account (e.g. a wallet or mint was passed), or `config` is malformed. |
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
    method: "getTokenAccountBalance",
    params: ["7fUAJdStEuGbc3sM84cKRL6yYaaSstyLSU4ve5oovLS7"],
  }),
});

const { result } = await res.json();
console.log(`Balance: ${result.value.uiAmountString} (slot ${result.context.slot})`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.getTokenAccountBalance(
  "7fUAJdStEuGbc3sM84cKRL6yYaaSstyLSU4ve5oovLS7",
  { commitment: "finalized" }
);

console.log(`Balance: ${value.uiAmountString} (slot ${context.slot})`);
```

## Notes

- **Token account, not wallet or mint:** the most common mistake is passing a
  wallet address. Resolve a wallet's holdings with `getTokenAccountsByOwner`
  first, then query each returned account here.
- **Use `amount` for math, `uiAmountString` for display:** `amount` is the exact
  `u64` base-unit count (string to avoid precision loss); `uiAmountString`
  applies `decimals` safely. Avoid the floating-point `uiAmount` for accounting.
- **Closed or non-existent accounts:** querying an address that is not a live
  token account returns an invalid-params error rather than a zero balance.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** [`getTokenAccountsByOwner`](./getTokenAccountsByOwner.md)
  and `getTokenAccountsByDelegate` enumerate token accounts; `getAccountInfo`
  returns the full parsed account data.
