> Live version: https://triport.io/docs/sol/json-rpc/getSlotLeaders

# getSlotLeaders

> Returns the ordered list of slot leaders (validator identity pubkeys) for a contiguous range of slots.

| | |
|---|---|
| **Method / Endpoint** | `getSlotLeaders` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` header (recommended); `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) and path-form also accepted |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 rps · basic 60 rps · pro 200 rps · business 600 rps (with 2× burst) |

## Description

`getSlotLeaders` returns the validator that is scheduled to produce each slot
over a window of the leader schedule. Given a `startSlot` and a `limit`, it
returns an ordered array of base-58 validator identity public keys: element `0`
is the leader of `startSlot`, element `1` of `startSlot + 1`, and so on.

Use it to predict which validator will produce upcoming slots — for example to
route a transaction toward the next leader's TPU, to attribute confirmed slots
to a validator, or to render an upcoming leader schedule. Because Solana assigns
leaders in fixed-size groups of consecutive slots, you will typically see the
same pubkey repeated for several entries in a row.

The window must fall within the leader schedule the cluster currently knows
about (the current and next epoch). Requesting a `startSlot` too far in the
future, or a `limit` outside the `1–5000` range, returns an invalid-params
error rather than a partial list.

## Parameters

Positional params array: `[startSlot, limit]`. Both are required.

| Name | Type | Required | Description |
|---|---|---|---|
| `startSlot` | integer (`u64` slot number) | yes | First slot of the range. Element `0` of the result is this slot's leader. |
| `limit` | integer | yes | Number of consecutive slots to return leaders for. Must be between `1` and `5000` inclusive. |

## Request

```bash
curl https://triport.io/sol \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSlotLeaders",
    "params": [348392041, 10]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    "DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP",
    "DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP",
    "DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP",
    "DWvDTSh3qfn88UoQTEKRV2JnLt5jtJAVoiCo3ivtMwXP",
    "GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ",
    "GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ",
    "GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ",
    "GdnSyH3YtwcxFvQrVVJMm1JhTS4QVX7MFsX56uJLUfiZ",
    "CakcnaRDHka2gXyfbEd2d3xsvkJkqsLw2akB3zsN1D2S",
    "CakcnaRDHka2gXyfbEd2d3xsvkJkqsLw2akB3zsN1D2S"
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array of string | Ordered list of base-58 validator identity pubkeys. Length equals `limit`. `result[i]` is the leader of slot `startSlot + i`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `limit` is outside `1–5000`, `startSlot` is negative, or a param is missing/wrong type. |
| `429` | Rate limit exceeded | You exceeded your tier's `sol_read_rpc` RPS (e.g. 20 rps sustained on free). A plain HTTP error rejected before the RPC layer, not a JSON-RPC envelope; retry after `Retry-After`. |
| `-32601` | Method not found | The method name was misspelled or sent to the wrong chain path. |

Example rate-limit response (HTTP `429`, plain body — not a JSON-RPC envelope):

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 20 requests/s for sol_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "sol_read_rpc",
  "limit_rps": 20,
  "burst_capacity": 40,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

See [errors.md](../../errors.md) for the full error envelope and the complete code list.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getSlotLeaders",
    params: [348392041, 10],
  }),
});

const { result } = await res.json();
console.log(result); // ["DWvDTSh3...", "DWvDTSh3...", ...]
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const leaders: string[] = await client.solana.getSlotLeaders({
  startSlot: 348392041,
  limit: 10,
});

console.log(leaders[0]); // leader of slot 348392041
```

## Notes

- **Range cap:** `limit` is hard-capped at `5000`. To cover a wider window, page
  forward by advancing `startSlot` by the previous `limit`.
- **Repeated entries are expected:** leaders are assigned in groups of
  consecutive slots, so the same pubkey commonly appears multiple times in a
  row.
- **Schedule horizon:** queries outside the currently-known leader schedule
  (roughly the current and next epoch) fail with `-32602` rather than returning
  a truncated list.
- **Related methods:** [`getSlot`](./getSlot.md) for the current slot,
  [`getBlockProduction`](./getBlockProduction.md) for which leaders actually
  produced blocks. See [getting-started.md](../../getting-started.md) for auth
  and chain-path basics and [rate-limits-and-tiers.md](../../rate-limits-and-tiers.md)
  for per-tier RPS.
