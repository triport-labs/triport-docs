> Live version: https://triport.io/docs/sol/json-rpc/getMaxRetransmitSlot

# getMaxRetransmitSlot

> Returns the highest slot the node has observed coming out of its retransmit stage.

| | |
|---|---|
| **Method / Endpoint** | `getMaxRetransmitSlot` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 / basic 60 / pro 200 / business 600 RPS sustained · up to 1200 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getMaxRetransmitSlot` returns the **highest slot seen from the retransmit
stage** — the point in the validator's turbine pipeline where shreds received
from peers are forwarded on. It is a single slot number reflecting how far the
node has progressed in propagating blocks across the cluster.

This is a low-level **diagnostic** metric, primarily useful for observing a
node's ingest/forwarding progress rather than for application data. To track the
slot a node will actually serve confirmed reads from, prefer
[`getSlot`](./getSlot.md); to see how far shred insertion has advanced, compare
with [`getMaxShredInsertSlot`](./getMaxShredInsertSlot.md).

> **Gotchas**
> - The value is node-local and reflects pipeline state, not network finality —
>   it is not a confirmed or finalized slot and should not be used as a read
>   floor for fetching block data.
> - It advances continuously as the node receives shreds; do not cache it.

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
    "method": "getMaxRetransmitSlot",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 348392041
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer | The highest slot seen from the retransmit stage. |

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
    method: "getMaxRetransmitSlot",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Max retransmit slot: ${result}`);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const slot: number = await client.solana.getMaxRetransmitSlot();
console.log(`Max retransmit slot: ${slot}`);
```

## Notes

- **Diagnostic, not finality:** this reports turbine pipeline progress. For the
  slot the node serves reads from, use [`getSlot`](./getSlot.md).
- **Related metric:** [`getMaxShredInsertSlot`](./getMaxShredInsertSlot.md)
  reports the highest slot seen after shred insertion; comparing the two shows
  how retransmit and insert stages are tracking relative to each other.
- **Moving target:** the value climbs as shreds arrive — re-query rather than
  caching it.
