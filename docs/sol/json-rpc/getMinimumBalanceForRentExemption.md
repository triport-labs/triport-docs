> Live version: https://triport.io/docs/sol/json-rpc/getMinimumBalanceForRentExemption

# getMinimumBalanceForRentExemption

> Returns the minimum balance, in lamports, required to make a Solana account of a given data size rent-exempt.

| | |
|---|---|
| **Method / Endpoint** | `getMinimumBalanceForRentExemption` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business), `sol_read_rpc` category; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getMinimumBalanceForRentExemption` tells you how many lamports an account must
hold to be exempt from rent collection, given the account's data size in bytes.
On Solana, an account whose balance is at or above this threshold is never
charged rent and is never reaped, so you should fund every new account you
create with at least this amount.

Use it before sending a transaction that creates or allocates an account
(`SystemProgram.createAccount`, a token account, a program-derived account,
etc.) so you can size the funding lamports exactly. The returned value depends
only on `dataLength` — the same input always yields the same result on a given
cluster — so it is safe to cache per data size.

The result is a single integer (lamports), not an object. There is no `context`
wrapper around it.

## Parameters

JSON-RPC `params` is a positional array: `[dataLength, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `dataLength` | integer | yes | Size of the account's data field, in bytes. |
| `config` | object | no | Commitment configuration (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot at which the request should be evaluated. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getMinimumBalanceForRentExemption",
    "params": [50]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 1238880
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer | Minimum lamports needed to make an account of `dataLength` bytes rent-exempt. |

## Errors

Errors use the standard JSON-RPC envelope. See [errors.md](../../errors.md) for
the full envelope and the complete code table.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `dataLength` missing, negative, or not an integer. |
| `429` | Rate limit exceeded | More than your tier's `sol_read_rpc` RPS (20 / 60 / 200 / 600); honor `Retry-After`. A plain HTTP error rejected before the RPC layer, not a JSON-RPC envelope. |
| `-32601` | Method not found | The method name is misspelled or not recognised on this chain. |

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
    method: "getMinimumBalanceForRentExemption",
    params: [50],
  }),
});

const { result } = await res.json();
console.log(`Rent-exempt minimum: ${result} lamports`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const lamports: number = await client.solana.getMinimumBalanceForRentExemption(50, {
  commitment: "confirmed",
});

console.log(lamports); // 1238880
```

## Notes

- The value scales with `dataLength`: a 0-byte account costs ~890,880 lamports,
  and the cost grows linearly with each additional byte. Always pass the exact
  byte size of the account you intend to allocate.
- The result is deterministic for a given data size, so cache it per
  `dataLength` rather than calling on every transaction build.
- Related: pair this with [getBalance](./getBalance.md) to check whether an
  existing account already meets the rent-exempt threshold, and with
  [getAccountInfo](./getAccountInfo.md) to read an account's current data size.
