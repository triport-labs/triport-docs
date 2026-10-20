> Live version: https://triport.io/docs/sol/json-rpc/getSlotLeader

# getSlotLeader

> Returns the identity public key of the validator that leads the current slot.

| | |
|---|---|
| **Method / Endpoint** | `getSlotLeader` (JSON-RPC, Solana) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ · 20 / 60 / 200 / 600 rps (free / basic / pro / business) |

## Description

`getSlotLeader` returns a single `Pubkey` — the base-58 encoded identity public
key of the validator scheduled to produce the block for the slot currently being
processed by the node.

Use it for a quick, point-in-time answer to "who is leader right now?" — for
example to label live transaction routing or to surface the active validator in
a dashboard. The result reflects the slot resolved at the requested commitment
level, so it tracks the leader as the cluster advances.

To look up leaders for a **range** of upcoming slots rather than just the
current one, use [`getSlotLeaders`](./getSlotLeaders.md), or fetch the full
epoch schedule with [`getLeaderSchedule`](./getLeaderSchedule.md).

All Solana JSON-RPC methods POST to the same base path `/v1/sol`; the `method`
field in the request body selects the call.

## Parameters

The single positional parameter is an optional `config` object.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Configuration object (see fields below). Omit it entirely for defaults. |
| `config.commitment` | string | no | Commitment level for the query: `processed`, `confirmed`, or `finalized`. Defaults to `finalized`. |
| `config.minContextSlot` | integer (`u64`) | no | The minimum slot at which the request may be evaluated. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSlotLeader",
    "params": [{ "commitment": "finalized" }]
  }'
```

To call with defaults, send an empty params array: `"params": []`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "ENJ7iD7BsFrFzaXTrbAVbDYZ12Z4BuRMpfGd3GPnaQbm"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | string \| integer | Echoes the `id` from the request, for correlating responses. |
| `result` | string (`Pubkey`) | Base-58 encoded identity public key of the current slot leader (32–44 chars). |

## Errors

Errors arrive in the standard JSON-RPC `error` object (`code`, `message`,
`data`).

| Code | Triport code | When it happens |
|---|---|---|
| `-32602` | `invalid_params` | The `config` object contains an unknown field or a malformed value (e.g. an invalid `commitment` enum value). |
| `429` | `rate_limited` | You exceeded your tier's sustained RPS for `sol_read_rpc`. An HTTP error, not a JSON-RPC one — the request is rejected before the RPC layer: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |

See the shared [errors reference](../../errors.md) for the full envelope, the
`data` fields, and which errors are plain HTTP rather than JSON-RPC.

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
    method: "getSlotLeader",
    params: [{ commitment: "finalized" }],
  }),
});

const { result: leader } = await res.json();
console.log(leader); // "ENJ7iD7BsFrFzaXTrbAVbDYZ12Z4BuRMpfGd3GPnaQbm"
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const leader = await client.sol.getSlotLeader({ commitment: "finalized" });
console.log(leader); // "ENJ7iD7BsFrFzaXTrbAVbDYZ12Z4BuRMpfGd3GPnaQbm"
```

## Notes

- `commitment` defaults to `finalized` when omitted; pass `processed` for the
  most up-to-date (but least settled) view of the current leader.
- The leader changes as the cluster advances — each leader produces a fixed run
  of consecutive slots — so the value is only accurate for the moment it was
  observed. For forward-looking lookups use a range method instead.
- `id` may be any client-chosen string or integer; it is echoed back so you can
  correlate responses.
- This is a `sol_read_rpc` method available from the Free trial up; throughput
  scales with your plan (20 → 600 rps) with burst allowance. There is no daily
  quota.
- Related: [`getSlotLeaders`](./getSlotLeaders.md),
  [`getLeaderSchedule`](./getLeaderSchedule.md), [`getSlot`](./getSlot.md).
