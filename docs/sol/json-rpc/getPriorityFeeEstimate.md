> Live version: https://triport.io/docs/sol/json-rpc/getPriorityFeeEstimate

# getPriorityFeeEstimate

> Returns a recommended priority (compute-unit) fee estimate for landing a Solana transaction.

| | |
|---|---|
| **Status** | 🚧 **Beta — preliminary**, schema subject to change (`api.2.2`+) |
| **Method / Endpoint** | `getPriorityFeeEstimate` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 / basic 60 / pro 200 / business 600 RPS sustained · up to 1200 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

> **⚠ Schema pending.** This method is currently a **scaffold** in the Solana
> JSON-RPC spec (`version 0.2.0-api-vector-s2-scaffold`). Its final parameter and
> result schemas are deferred to a later spec release (**api.2.2+**). The
> method, network, authentication, scope and rate limits below are stable; the
> **parameters and response shape below describe the *intended* contract and are
> subject to change** when the full schema lands. Pin your integration to the
> published spec version before relying on specific request or response fields.

## Description

`getPriorityFeeEstimate` returns a **recommended priority fee** — the per-compute-unit
price (in micro-lamports) that a transaction should attach so that it lands
reliably given recent network conditions. Solana orders pending transactions in
part by the priority fee they bid, so a sender uses this estimate to set a
`ComputeBudgetProgram.setComputeUnitPrice` instruction before signing.

Use it just before submitting a transaction: query the estimate, apply it to the
compute-budget instruction, then send via
[`sendTransaction`](./sendTransaction.md). Because network demand shifts from
slot to slot, fetch a fresh estimate per submission rather than caching one.

This is a read method in the `sol_read_rpc` category (Free trial and up). It does
not submit or simulate anything — it only reports a fee recommendation.

## Parameters

In the current scaffold the spec declares **no parameters** (`params` is an empty
array `[]`), so the request below sends `"params": []`. The finalized api.2.2+
schema is expected to accept an optional options object identifying the
transaction (e.g. the accounts it touches, or a serialized transaction) and a
target priority level. **Treat the table below as preliminary** — it documents
the intended shape, not a guaranteed contract.

| Name | Type | Required | Description |
|---|---|---|---|
| `options` *(pending)* | object | no | Reserved. Final fields are defined by spec api.2.2+; until then send no parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getPriorityFeeEstimate",
    "params": []
  }'
```

## Response

The result is a JSON object. The current scaffold types it as an open object
(`type: object`, additional properties allowed); the field names below illustrate
the **intended** shape and are **pending finalization in api.2.2+**.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "priorityFeeEstimate": 12000
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Fee-estimate envelope. Currently an open object; concrete fields are pending api.2.2+. |
| `result.priorityFeeEstimate` *(pending)* | number | Recommended priority fee in micro-lamports per compute unit. Field name/shape may change when the schema is finalized. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and the
`error.data` fields.

| Code | Meaning | When it happens |
|---|---|---|
| `429` | Rate limit exceeded | More than your tier's RPS for `sol_read_rpc` (free 20 / basic 60 / pro 200 / business 600); a burst up to 2× is allowed before throttling. Rejected before the RPC layer, so this is a plain HTTP error with `Retry-After` — not a JSON-RPC envelope. |
| `-32601` | Method not recognised | The method name was misspelled or is not in the Solana catalog. |
| `-32602` | Invalid params | Parameters were sent that the (pending) schema does not accept. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |

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
    method: "getPriorityFeeEstimate",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Suggested priority fee: ${result.priorityFeeEstimate} µ-lamports/CU`);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

// Result shape is pending spec api.2.2+ — typed loosely until then.
const estimate = await client.solana.getPriorityFeeEstimate();
console.log(`Suggested priority fee: ${estimate.priorityFeeEstimate} µ-lamports/CU`);
```

## Notes

- **Scaffold method:** the request and response details above are provisional
  and finalized by spec api.2.2/2.3/2.4. Re-check this page once your target spec
  version ships before depending on specific fields.
- **Micro-lamports per compute unit:** priority fees are priced per CU. Multiply
  the estimate by your transaction's compute-unit limit to size the total
  priority cost, then set it with `ComputeBudgetProgram.setComputeUnitPrice`.
- **Fetch fresh, don't cache:** the recommendation tracks recent demand and
  moves slot to slot; request a new estimate per submission.
- **Related methods:** apply the estimate, then submit with
  [`sendTransaction`](./sendTransaction.md). For the base (non-priority) fee of a
  specific message, see [`getFeeForMessage`](./getFeeForMessage.md).
