> Live version: https://triport.io/docs/sol/json-rpc/getMaxShredInsertSlot

# getMaxShredInsertSlot

> Returns the highest slot the node has observed after inserting shreds, before the slot is fully processed.

| | |
|---|---|
| **Method / Endpoint** | `getMaxShredInsertSlot` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 / basic 60 / pro 200 / business 600 RPS sustained · up to 1200 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getMaxShredInsertSlot` returns the highest slot number that the node has seen
**after shred insert** — that is, after the raw block fragments (shreds) for a
slot have been received and written to the blockstore, but before the slot has
been replayed and fully processed.

Because shreds arrive on the network ahead of full block processing, the value
returned here is typically **higher than [`getSlot`](./getSlot.md)** (which
reports the most recent processed slot). Use it as a leading indicator of how
far the node has received block data, for example when monitoring ingest
freshness or estimating how far behind processing is from the network tip.

> **Gotchas**
> - This is *not* a confirmed or finalized slot. Data for the returned slot may
>   still be incomplete or may not survive replay — never treat it as a slot
>   you can safely fetch a full block for. Use [`getSlot`](./getSlot.md) or
>   [`getFirstAvailableBlock`](./getFirstAvailableBlock.md) for that.
> - The gap between this value and `getSlot` reflects shred-ingest lead time;
>   it fluctuates and is not a fixed offset.

## Parameters

None. The `params` array is empty.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This method takes no parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getMaxShredInsertSlot",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 348392043
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer | Highest slot number seen after shred insert. May be greater than the latest processed slot from [`getSlot`](./getSlot.md). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `429` | Rate limit exceeded | More than your tier's RPS for `sol_read_rpc` (free 20 / basic 60 / pro 200 / business 600); a burst up to 2× is allowed before throttling. Rejected before the RPC layer, so this is a plain HTTP error with `Retry-After` — not a JSON-RPC envelope. |
| `-32601` | Method not recognised | The method name was misspelled or is not in the Solana catalog. |
| `-32602` | Invalid params | A non-empty `params` array was sent — this method accepts no parameters. |

See the shared [errors reference](../../errors.md) for the full error envelope
and the `error.data` fields.

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
    method: "getMaxShredInsertSlot",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Max shred-insert slot: ${result}`);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const maxShredSlot: number = await client.solana.getMaxShredInsertSlot();
console.log(`Max shred-insert slot: ${maxShredSlot}`);
```

## Notes

- **Ingest lead indicator:** compare this value with [`getSlot`](./getSlot.md) to
  gauge how far shred ingest is ahead of full processing. The two are related to
  [`getMaxRetransmitSlot`](./getMaxRetransmitSlot.md), which reports the highest
  slot seen from the retransmit stage.
- **Not fetchable:** the returned slot is pre-processing — do not pass it to
  block-fetching methods such as [`getBlock`](./getBlock.md); use a confirmed
  slot instead.
