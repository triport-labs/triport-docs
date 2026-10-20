> Live version: https://triport.io/docs/sol/json-rpc/minimumLedgerSlot

# minimumLedgerSlot

> Returns the lowest slot for which the node currently has any ledger data.

| | |
|---|---|
| **Method / Endpoint** | `minimumLedgerSlot` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 / basic 60 / pro 200 / business 600 RPS sustained · up to 1200 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`minimumLedgerSlot` returns the **lowest slot the node has any information about
in its ledger**. As the ledger is trimmed by the node's retention policy, this
floor advances over time, so it marks the oldest point from which raw ledger
data may still be available.

Use it to discover the earliest slot you can attempt to query against a node —
for example, before walking historical slots or calling block/transaction reads
on old data. If you request data below this floor, the node no longer holds it.

> **Gotcha — not the same as the confirmed-block floor**
> This value may be **lower** than [`getFirstAvailableBlock`](./getFirstAvailableBlock.md).
> `minimumLedgerSlot` counts *any* ledger data the node retains, while
> `getFirstAvailableBlock` reports the earliest **confirmed block** available.
> A slot can be at or above `minimumLedgerSlot` yet still have no confirmed block
> to fetch. When you need a slot you can actually read a block from, prefer
> `getFirstAvailableBlock` as the floor.

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
    "method": "minimumLedgerSlot",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 348118092
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer | The lowest slot for which the node has any ledger data. |

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
    method: "minimumLedgerSlot",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Minimum ledger slot: ${result}`);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const slot: number = await client.solana.minimumLedgerSlot();
console.log(`Minimum ledger slot: ${slot}`);
```

## Notes

- **Moving floor:** the value rises as the node trims its ledger; re-query rather
  than caching it, and treat it as a lower bound that only ever increases.
- **Confirmed-block floor:** for the earliest slot you can fetch a block from,
  use [`getFirstAvailableBlock`](./getFirstAvailableBlock.md), which may report a
  higher slot than this method.
- **Related:** [`getSlot`](./getSlot.md) returns the *latest* processed slot —
  pair the two to bound the range of slots a node can serve.
