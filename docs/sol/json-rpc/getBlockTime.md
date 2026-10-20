> Live version: https://triport.io/docs/sol/json-rpc/getBlockTime

# getBlockTime

> Returns the estimated production time of a Solana block as a Unix timestamp.

| | |
|---|---|
| **Method / Endpoint** | `getBlockTime` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 / basic 60 / pro 200 / business 600 RPS sustained · up to 1200 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlockTime` returns the **estimated production time** of the block at a
given slot, expressed as a Unix timestamp (whole seconds since the epoch). The
estimate is derived from validator vote timestamps, so it is an approximation
rather than an exact clock reading.

Use it when you have a slot (for example from [`getSlot`](./getSlot.md) or from
a transaction's `slot` field) and need a wall-clock time to display or to
correlate on-chain activity with off-chain events.

> **Gotchas**
> - The result is `null` when the block time is not available — most commonly
>   for slots older than the network's retained history, or for a slot that was
>   skipped / not yet rooted.
> - Timestamps are estimates and can differ by a few seconds from any other
>   time source. Do not use them for ordering within a single block.

## Parameters

Positional `params` array — a single required element:

| Name | Type | Required | Description |
|---|---|---|---|
| `slot` | integer | yes | Slot number to look up. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlockTime",
    "params": [348392041]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 1746950400
}
```

When no estimate is available, `result` is `null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer \| null | Estimated production time of the block, in Unix seconds since the epoch. `null` if not available for the requested slot. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `429` | Rate limit exceeded | More than your tier's RPS for `sol_read_rpc` (free 20 / basic 60 / pro 200 / business 600); a burst up to 2× is allowed before throttling. Rejected before the RPC layer, so this is a plain HTTP error with `Retry-After` — not a JSON-RPC envelope. |
| `-32601` | Method not recognised | The method name was misspelled or is not in the Solana catalog. |
| `-32602` | Invalid params | `slot` missing or not an integer. |

A slot that simply has no recorded time is **not** an error — it returns
`result: null`. See the shared [errors reference](../../errors.md) for the full
error envelope and the `error.data` fields.

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
    method: "getBlockTime",
    params: [348392041],
  }),
});

const { result } = await res.json();
// result is a Unix timestamp in seconds, or null
const when = result === null ? null : new Date(result * 1000);
console.log(when);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const blockTime: number | null = await client.solana.getBlockTime(348392041);
if (blockTime !== null) {
  console.log(new Date(blockTime * 1000).toISOString());
}
```

## Notes

- **Nullable result:** always handle the `null` case before doing date math —
  older or skipped slots have no estimate.
- **Estimate accuracy:** the timestamp comes from validator vote times and is
  approximate; treat it as "around when this block was produced," not an exact
  timestamp.
- **Related methods:** [`getSlot`](./getSlot.md) for the current slot,
  [`getBlocks`](./getBlocks.md) to enumerate confirmed slots in a range.
