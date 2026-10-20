> Live version: https://triport.io/docs/sol/json-rpc/getFirstAvailableBlock

# getFirstAvailableBlock

> Returns the slot of the lowest confirmed block that has not been purged from the ledger.

| | |
|---|---|
| **Method / Endpoint** | `getFirstAvailableBlock` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — free 20 / basic 60 / pro 200 / business 600 RPS sustained · up to 1200 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getFirstAvailableBlock` returns the slot of the **oldest confirmed block that
is still retained** in the ledger — i.e. the lower bound of the history you can
currently query. Older blocks have been purged and can no longer be fetched
with methods such as [`getBlock`](./getBlock.md) or
[`getBlockTime`](./getBlockTime.md).

Use it to discover the earliest slot you may pass to range or per-block queries
before paginating forward with [`getBlocks`](./getBlocks.md). Treating any slot
below this value as available will result in "block not available" errors.

> **Gotchas**
> - Contrast with `minimumLedgerSlot`, which reports the lowest slot for which
>   the node has *any* ledger data — that value may include slots that were
>   never confirmed. `getFirstAvailableBlock` only counts **confirmed** blocks,
>   so it is the correct floor for block-fetching requests.
> - The returned slot advances over time as the ledger is trimmed. Do not cache
>   it as a permanent value; re-query before long-running backfills.

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
    "method": "getFirstAvailableBlock",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 347500000
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer | Slot number of the lowest confirmed block still retained in the ledger. |

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
    method: "getFirstAvailableBlock",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Oldest retained slot: ${result}`);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const firstSlot: number = await client.solana.getFirstAvailableBlock();
console.log(`Oldest retained slot: ${firstSlot}`);
```

## Notes

- **History floor:** use this value as the lower bound when enumerating slots
  with [`getBlocks`](./getBlocks.md); requesting a block below it will fail.
- **`minimumLedgerSlot` vs. this method:** `minimumLedgerSlot` may report a
  lower slot because it counts unconfirmed ledger data. Prefer
  `getFirstAvailableBlock` whenever you intend to fetch full blocks.
- **Moving target:** the floor rises as the ledger is pruned — re-query it
  rather than caching it across a long backfill.
