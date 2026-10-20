> Live version: https://triport.io/docs/sol/json-rpc/getSlot

# getSlot

> Returns the slot that has reached the given (or default) commitment level on Solana.

| | |
|---|---|
| **Method / Endpoint** | `getSlot` (JSON-RPC, `POST /` Solana endpoint) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — 20 rps (free) · 60 rps (basic) · 200 rps (pro) · 600 rps (business) |

## Description

`getSlot` returns the current slot — a single `u64` integer — that has reached
the requested commitment level. It is the cheapest method on the Solana RPC
surface and carries no parameters in its simplest form, which makes it the
go-to **health check / liveness probe** for confirming that your endpoint and
API key are working and that the node is keeping up with the cluster.

The value you get back depends on the **commitment** level. With the default
(`finalized`) you receive the highest slot the cluster has finalized; with
`confirmed` or `processed` you get a higher, more recent slot that has had less
time to settle. Use a lower commitment when you want the freshest possible slot
number and a higher one when you need certainty that the slot will not be rolled
back.

Pair it with `minContextSlot` when you want the call to fail fast unless the
node has already progressed to at least a given slot — useful for detecting a
lagging backend.

## Parameters

A single optional positional parameter: a `config` object.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Configuration object (see fields below). Omit it entirely to use defaults. |

### `config` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. Defaults to `finalized`. Determines which slot is returned. |
| `minContextSlot` | integer | no | Minimum slot the request should be evaluated at. If the node has not yet reached this slot, the request returns an error instead of a stale result. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSlot",
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
    "method": "getSlot",
    "params": [{ "commitment": "confirmed" }]
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
| `result` | integer (`u64`) | The current slot number at the requested commitment level. |

## Errors

`getSlot` uses the standard JSON-RPC error envelope. See [errors](../../errors.md)
for the full structure.

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
    method: "getSlot",
    params: [],
  }),
});

const { result } = await res.json();
console.log("current slot:", result); // 348392041
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const slot: number = await client.solana.getSlot({ commitment: "confirmed" });
console.log("current slot:", slot);
```

## Notes

- **Cheapest health check.** Because it takes no required params and returns a
  single integer, `getSlot` is the recommended liveness probe for monitoring
  endpoint availability and key validity.
- **Commitment matters.** `processed` ≥ `confirmed` ≥ `finalized` in slot
  number. Don't compare slots taken at different commitment levels.
- **Related methods:** [`getSlotLeader`](./getSlotLeader.md) (identity of the
  leader for a slot), [`getBlockHeight`](./getBlockHeight.md), and
  [`getBalance`](./getBalance.md) for the canonical balance read.
