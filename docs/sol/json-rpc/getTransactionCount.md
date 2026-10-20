> Live version: https://triport.io/docs/sol/json-rpc/getTransactionCount

# getTransactionCount

> Returns the total number of transactions processed by the Solana ledger as a single integer.

| | |
|---|---|
| **Method / Endpoint** | `getTransactionCount` (JSON-RPC, `POST /` Solana endpoint) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — 20 rps (free) · 60 rps (basic) · 200 rps (pro) · 600 rps (business) |

## Description

`getTransactionCount` returns the current transaction count from the ledger — a
single `u64` integer representing the total number of transactions the cluster
has processed since genesis. The number only ever increases, so it is useful as
a monotonic, cluster-wide activity counter.

The value you get back depends on the **commitment** level. With the default
(`finalized`) you receive the count as of the highest finalized slot; with
`confirmed` or `processed` you get a higher, more recent count that has had less
time to settle. Because the counter is global and grows continuously, treat the
result as a snapshot at the moment of the call rather than a stable value —
consecutive calls will normally return larger numbers.

Pair it with `minContextSlot` when you want the call to fail fast unless the
node has already progressed to at least a given slot, which avoids reading a
stale count from a lagging backend.

## Parameters

A single optional positional parameter: a `config` object.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Configuration object (see fields below). Omit it entirely to use defaults. |

### `config` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. Defaults to `finalized`. Determines the slot the count is evaluated at. |
| `minContextSlot` | integer | no | Minimum slot the request should be evaluated at. If the node has not yet reached this slot, the request returns an error instead of a stale result. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransactionCount",
    "params": []
  }'
```

With an explicit commitment level:

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransactionCount",
    "params": [{ "commitment": "confirmed" }]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": 268134591842
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | integer (`u64`) | Total number of transactions processed by the ledger at the requested commitment level. |

## Errors

`getTransactionCount` uses the standard JSON-RPC error envelope. See
[errors](../../errors.md) for the full structure.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `commitment` is not one of `processed` / `confirmed` / `finalized`, or `config` is malformed. |
| `-32016` | Minimum context slot not reached | `minContextSlot` is higher than the node's current slot. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` token. |
| `429` | Rate limited | You exceeded your tier's RPS for `sol_read_rpc`. |

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
    method: "getTransactionCount",
    params: [],
  }),
});

const { result } = await res.json();
console.log("transactions processed:", result); // 268134591842
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const count: number = await client.solana.getTransactionCount({ commitment: "confirmed" });
console.log("transactions processed:", count);
```

## Notes

- **Monotonic counter.** The result is cluster-wide and only increases. Two
  successive calls will normally return different (larger) values — don't treat
  it as a stable identifier.
- **Commitment matters.** A `processed` count is ≥ a `confirmed` count, which is
  ≥ a `finalized` count. Don't compare counts taken at different commitment
  levels.
- **Related methods:** [`getSlot`](./getSlot.md) (current slot at a commitment
  level), [`getBlockHeight`](./getBlockHeight.md), and
  [`getEpochInfo`](./getEpochInfo.md), which also surfaces a `transactionCount`
  field scoped to the epoch context.
