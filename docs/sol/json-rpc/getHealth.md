> Live version: https://triport.io/docs/sol/json-rpc/getHealth

# getHealth

> Reports whether the serving node is caught up with the cluster.

| | |
|---|---|
| **Method / Endpoint** | `getHealth` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getHealth` returns the current health of the node serving your request. It is
the cheapest liveness probe on the Solana surface: no parameters, and the result
is a single short string. Use it for load-balancer health checks, readiness
gates before sending traffic, or to decide whether to fall back to a stricter
commitment.

The result is one of three values:

- **`ok`** — the node is within the cluster's accepted slot distance of the
  highest known slot and is safe to read from.
- **`behind`** — the node is lagging: it is *not* within `HEALTH_CHECK_SLOT_DISTANCE`
  slots of the highest known slot. Reads may return stale data; prefer a
  `finalized` commitment or retry against a healthy node.
- **`unknown`** — the node cannot currently determine its own health (for
  example, it has not yet established its position relative to the cluster).

A `behind` or `unknown` result is still delivered as a normal JSON-RPC `result`
(HTTP 200), not an error — inspect the string value rather than relying on the
status code.

## Parameters

None. Send an empty positional array, `params: []`.

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
    "method": "getHealth",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "ok"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Node health: `"ok"`, `"behind"`, or `"unknown"`. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

Note: a lagging node reports `"behind"` as a successful `result`, **not** as a
JSON-RPC error — there is no dedicated health error code.

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
    method: "getHealth",
    params: [],
  }),
});

const { result } = await res.json();
if (result !== "ok") {
  console.warn(`Node not healthy: ${result}`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const health = await client.solana.getHealth();

if (health !== "ok") {
  console.warn(`Node not healthy: ${health}`);
}
```

## Notes

- **Cheapest health check:** `getHealth` takes no params and returns a single
  string — prefer it over [`getSlot`](./getSlot.md) or
  [`getEpochInfo`](./getEpochInfo.md) when you only need a yes/no liveness signal.
- **`behind` threshold:** the node is reported `behind` when it falls more than
  `HEALTH_CHECK_SLOT_DISTANCE` slots short of the highest known slot. The exact
  distance is set on the serving node, so treat `behind` as "do not rely on this
  node for fresh reads" rather than a fixed slot count.
- **Polling:** when using this as a load-balancer probe, mind the `sol_read_rpc`
  RPS limits for your tier so health checks don't consume your throughput budget.
- **Related methods:** [`getSlot`](./getSlot.md) returns the node's current slot
  and [`getEpochInfo`](./getEpochInfo.md) reports both `absoluteSlot` and
  `blockHeight` if you need the actual lag magnitude rather than a health label.
