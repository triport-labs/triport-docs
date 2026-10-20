> Live version: https://triport.io/docs/sol/json-rpc/getRecentPrioritizationFees

# getRecentPrioritizationFees

> Returns the per-block prioritization fees paid over the most recent blocks, for estimating the priority fee to attach before sending a transaction.

| | |
|---|---|
| **Method / Endpoint** | `getRecentPrioritizationFees` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getRecentPrioritizationFees` returns a list of the prioritization fees observed
in recent blocks — up to the last **150 blocks**. Each entry pairs a `slot` with
the `prioritizationFee` (in **micro-lamports per compute unit**) that was
sufficient to land a transaction in that block.

Use this method to size the priority fee before submitting a transaction. A
common strategy is to fetch the recent fees, take a percentile (for example the
median or the 75th percentile of the non-zero values), and set your compute-unit
price accordingly via a `ComputeBudget` instruction.

The optional `addresses` parameter narrows the result to blocks where a
transaction wrote to one of the given accounts (write-locked them). This yields
a fee estimate tailored to the accounts your transaction will touch — useful
when a specific account is contended. Omit `addresses` to get the global
recent-fee picture across the cluster.

## Parameters

JSON-RPC `params` is a positional array: `[addresses?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `addresses` | array of string (base-58) | no | Up to **128** account public keys. Fees are reported for blocks in which one of these accounts was write-locked. Omit for global recent fees. Each key must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getRecentPrioritizationFees",
    "params": [["So11111111111111111111111111111111111111112"]]
  }'
```

To request global fees, omit the `addresses` array entirely:

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getRecentPrioritizationFees",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    { "slot": 348391892, "prioritizationFee": 0 },
    { "slot": 348391893, "prioritizationFee": 12000 },
    { "slot": 348391894, "prioritizationFee": 5000 },
    { "slot": 348391895, "prioritizationFee": 0 },
    { "slot": 348391896, "prioritizationFee": 18250 }
  ]
}
```

The array is ordered by `slot` (ascending) and covers up to the most recent 150
blocks. Entries with `prioritizationFee: 0` represent blocks where no priority
fee was required.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array | List of `PrioritizationFee` objects, one per recent block. |
| `result[].slot` | integer | The slot the fee observation is for. |
| `result[].prioritizationFee` | integer | The per-compute-unit prioritization fee, in micro-lamports, paid in that slot. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `addresses` is not an array of valid base-58 keys, or contains more than 128 entries. |
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
    method: "getRecentPrioritizationFees",
    params: [["So11111111111111111111111111111111111111112"]],
  }),
});

const { result } = await res.json();

// Median of the non-zero recent fees, a common estimation strategy.
const fees = result.map((f) => f.prioritizationFee).filter((f) => f > 0).sort((a, b) => a - b);
const median = fees.length ? fees[Math.floor(fees.length / 2)] : 0;
console.log(`Suggested priority fee: ${median} micro-lamports/CU`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const fees = await client.solana.getRecentPrioritizationFees([
  "So11111111111111111111111111111111111111112",
]);

const nonZero = fees.map((f) => f.prioritizationFee).filter((f) => f > 0);
const max = nonZero.length ? Math.max(...nonZero) : 0;
console.log(`Peak recent priority fee: ${max} micro-lamports/CU`);
```

## Notes

- **Units:** `prioritizationFee` is denominated in **micro-lamports per compute
  unit**. Multiply by the compute-unit limit of your transaction to get the
  total priority fee in micro-lamports, then divide by 1,000,000 for lamports.
- **Up to 128 addresses:** the `addresses` array is capped at 128 entries.
  Supply only the accounts your transaction will write-lock for the most
  relevant estimate.
- **Up to 150 blocks:** the window is the most recent 150 blocks, so the result
  may contain fewer entries early after cluster restarts.
- **Applying the fee:** set the returned value as the compute-unit price using a
  `ComputeBudget` `SetComputeUnitPrice` instruction before sending the
  transaction.
- **Related methods:** use [`getFeeForMessage`](./getFeeForMessage.md) to compute
  the base fee for a compiled message, and [`getSlot`](./getSlot.md) to inspect
  the current slot the cluster has reached.
