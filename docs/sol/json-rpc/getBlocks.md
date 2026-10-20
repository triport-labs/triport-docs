> Live version: https://triport.io/docs/sol/json-rpc/getBlocks

# getBlocks

> Returns the list of confirmed block slots between two slots on the Solana ledger.

| | |
|---|---|
| **Method / Endpoint** | `getBlocks` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlocks` returns an array of slot numbers for every **confirmed block**
between `startSlot` and `endSlot` (inclusive). It is the discovery counterpart
to [`getBlock`](./getBlock.md): use it to enumerate which slots actually
produced a block over a range, then fetch each one's contents individually.

Not every slot has a block — slots can be skipped — so the returned array is
typically shorter than `endSlot - startSlot + 1`. Use the array length and its
values to drive an indexing loop without probing skipped slots one at a time.

If `endSlot` is omitted it defaults to the current slot. The range is bounded:
`endSlot` may be at most **500,000 slots** greater than `startSlot`. Requesting
a wider range returns an invalid-params error — page through large histories in
≤500,000-slot windows.

## Parameters

JSON-RPC `params` is a positional array: `[startSlot, endSlot?, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `startSlot` | integer (u64) | yes | First slot of the range to scan. |
| `endSlot` | integer (u64) | no | Last slot of the range. Defaults to the current slot. Must be ≥ `startSlot` and no more than 500,000 slots above it. |
| `config` | object | no | Optional commitment configuration (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `confirmed` or `finalized`. **`processed` is not supported** for this method. Defaults to `finalized`. |
| `minContextSlot` | integer | no | Minimum slot the request should be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlocks",
    "params": [
      348392035,
      348392041,
      { "commitment": "finalized" }
    ]
  }'
```

## Response

The result is a flat array of the confirmed slot numbers in the range. Here the
scanned range was 348392035–348392041 (7 slots) but only 5 produced a block —
the gaps are skipped slots.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    348392035,
    348392036,
    348392038,
    348392040,
    348392041
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array of integer (u64) | Confirmed block slots in `[startSlot, endSlot]`, ascending. Empty if no slot in the range produced a block. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `startSlot` is missing or not an integer, `endSlot` < `startSlot`, the range exceeds 500,000 slots, or `commitment: "processed"` was passed. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). An HTTP error, not a JSON-RPC one: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |
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
    method: "getBlocks",
    params: [348392035, 348392041, { commitment: "finalized" }],
  }),
});

const { result: slots } = await res.json();
console.log(`${slots.length} blocks produced in range; first=${slots[0]}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const slots = await client.solana.getBlocks(348392035, 348392041, {
  commitment: "finalized",
});

console.log(`Confirmed block slots: ${slots.join(", ")}`);
```

## Notes

- **`processed` is not a valid commitment** here — use `confirmed` or
  `finalized`. Passing `processed` yields an invalid-params error.
- **Max range is 500,000 slots.** To scan a longer history, loop in windows:
  call `getBlocks(start, start + 500_000)`, then advance `start` to one past the
  last returned slot.
- **`endSlot` is optional.** Omit it to scan from `startSlot` up to the current
  slot — but mind the 500,000-slot ceiling relative to `startSlot`.
- **Gaps are expected.** The returned array skips slots that produced no block;
  do not assume consecutive values.
- **Related methods:** [`getBlock`](./getBlock.md) to fetch each slot's contents,
  [`getBlockTime`](./getBlockTime.md) to map a slot to a wall-clock time,
  [`getBlockProduction`](./getBlockProduction.md) for production stats, and
  [`getSlot`](./getSlot.md) for the slot the cluster has currently reached.
