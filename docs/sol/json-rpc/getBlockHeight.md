> Live version: https://triport.io/docs/sol/json-rpc/getBlockHeight

# getBlockHeight

> Returns the current block height of the node — the number of confirmed blocks beneath the latest confirmed block.

| | |
|---|---|
| **Method / Endpoint** | `getBlockHeight` (JSON-RPC, Solana) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ · 20 / 60 / 200 / 600 rps (free / basic / pro / business) |

## Description

`getBlockHeight` returns the current block height as a `u64` integer. The block
height is the count of **confirmed blocks** below the current block — it
increments by one for every block that is actually produced.

Use it when you need a monotonic, gap-free measure of chain progress. A common
use is to compare a transaction's `lastValidBlockHeight` against the current
height to decide whether the transaction's blockhash has expired.

All Solana JSON-RPC methods POST to the same base path `/v1/sol`; the `method`
field in the request body selects the call.

## Parameters

The single positional parameter is an optional `config` object.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Configuration object (see fields below). Omit it entirely for defaults. |
| `config.commitment` | string | no | Commitment level for the query: `processed`, `confirmed`, or `finalized`. Defaults to `finalized`. |
| `config.minContextSlot` | integer (`u64`) | no | The minimum slot at which the request may be evaluated. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlockHeight",
    "params": [{ "commitment": "finalized" }]
  }'
```

To call with defaults, send an empty params array: `"params": []`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 285432109
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | string \| integer | Echoes the `id` from the request, for correlating responses. |
| `result` | integer (`u64`) | Current block height — the count of confirmed blocks. |

## Errors

Errors arrive in the standard JSON-RPC `error` object (`code`, `message`,
`data`).

| Code | Triport code | When it happens |
|---|---|---|
| `-32602` | `invalid_params` | The `config` object contains an unknown field or a malformed value (e.g. an invalid `commitment` enum value). |
| `429` | `rate_limited` | You exceeded your tier's sustained RPS for `sol_read_rpc`. An HTTP error, not a JSON-RPC one — the request is rejected before the RPC layer: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |

See the shared [errors reference](../../errors.md) for the full envelope, the
`data` fields, and which errors are plain HTTP rather than JSON-RPC.

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
    method: "getBlockHeight",
    params: [{ commitment: "finalized" }],
  }),
});

const { result: blockHeight } = await res.json();
console.log(blockHeight); // 285432109
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const blockHeight = await client.sol.getBlockHeight({ commitment: "finalized" });
console.log(blockHeight); // 285432109
```

## Notes

- `commitment` defaults to `finalized` when omitted.
- Block height is gap-free and monotonically increasing; slot numbers are not
  (skipped slots leave gaps). Use this method, not `getSlot`, when you need a
  count of actual blocks.
- `id` may be any client-chosen string or integer; it is echoed back so you can
  correlate responses.
- This is a `sol_read_rpc` method available from the Free trial up; throughput
  scales with your plan (20 → 600 rps) with burst allowance. There is no daily
  quota.
- Related: [`getBlockTime`](./getBlockTime.md), [`getBlocks`](./getBlocks.md),
  [`getLatestBlockhash`](./getLatestBlockhash.md).
- **Slot vs block height:** skipped slots make the slot number run ahead of
  block height — see [Solana slot vs block height](https://triport.io/learn/solana-slot-vs-block-height).
