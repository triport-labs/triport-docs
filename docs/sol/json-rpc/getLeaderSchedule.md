> Live version: https://triport.io/docs/sol/json-rpc/getLeaderSchedule

# getLeaderSchedule

> Returns the leader schedule for an epoch — which slots each validator is assigned to produce blocks in.

| | |
|---|---|
| **Method / Endpoint** | `getLeaderSchedule` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getLeaderSchedule` returns the leader schedule for an epoch: a map keyed by
validator identity pubkey, where each value is the array of slot indices
(relative to the start of the epoch) that the validator is assigned to lead.
This is the canonical way to know, ahead of time, which validator will be the
leader for a given slot — useful for transaction-routing optimizations, leader
forecasting, and validator-performance dashboards.

The slot indices are **epoch-relative**: index `0` is the first slot of the
epoch. To convert an index into an absolute slot, add it to the epoch's first
slot (use [`getEpochInfo`](./getEpochInfo.md) /
[`getEpochSchedule`](./getEpochSchedule.md) to find epoch boundaries).

By default the call returns the schedule for the epoch that contains the current
slot. Pass an optional `slot` to query the epoch containing that slot, and an
optional `config` to set a commitment level or to filter the result to a single
validator via `identity`. If the requested slot does not correspond to a known
epoch, the result is `null`.

## Parameters

JSON-RPC `params` is a positional array: `[slot?, config?]`. Both elements are
optional — pass `[]` to get the schedule for the current epoch.

| Name | Type | Required | Description |
|---|---|---|---|
| `slot` | integer | no | A slot within the target epoch. Defaults to the current epoch when omitted. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `identity` | string (base-58) | no | Restrict the result to a single validator identity pubkey. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getLeaderSchedule",
    "params": [
      null,
      { "identity": "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM" }
    ]
  }'
```

> Passing `null` as the first element queries the current epoch while still
> supplying a `config`. To query a specific epoch, replace `null` with a slot
> inside that epoch.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM": [
      0, 1, 2, 3,
      8192, 8193, 8194, 8195,
      40960, 40961, 40962, 40963
    ]
  }
}
```

When the requested slot belongs to no known epoch, `result` is `null`:

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
| `result` | object \| null | `LeaderSchedule` map, or `null` if the epoch is not found. |
| `result.<pubkey>` | array of integers | For each validator identity pubkey (the map key), the list of epoch-relative slot indices that validator is assigned to lead. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `slot` is not an integer, or `identity` is not a valid base-58 pubkey. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

Note: a slot that does not map to a known epoch is **not** an error — it returns
`result: null`. Always null-check the result.

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
    method: "getLeaderSchedule",
    params: [null, { identity: "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM" }],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("epoch not found");
} else {
  for (const [pubkey, slots] of Object.entries(result)) {
    console.log(`${pubkey} leads ${slots.length} slots this epoch`);
  }
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const schedule = await client.solana.getLeaderSchedule({
  identity: "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM",
  commitment: "finalized",
});

if (schedule === null) {
  console.log("epoch not found");
} else {
  for (const [pubkey, slots] of Object.entries(schedule)) {
    console.log(`${pubkey}: ${slots.length} leader slots`);
  }
}
```

## Notes

- **Epoch-relative indices:** the integers in each array are offsets from the
  first slot of the epoch, not absolute slot numbers. Add the epoch's first slot
  (from [`getEpochInfo`](./getEpochInfo.md)) to get an absolute slot.
- **Current epoch by default:** omit `slot` (or pass `null`) to get the schedule
  for the epoch containing the current slot.
- **Filter early:** pass `identity` to return only one validator's slots instead
  of the full cluster map — far smaller responses for per-validator views.
- **Null on unknown epoch:** a `slot` outside any known epoch yields
  `result: null` rather than an error — always null-check before iterating.
- **Related methods:** [`getEpochInfo`](./getEpochInfo.md) and
  [`getEpochSchedule`](./getEpochSchedule.md) for epoch boundaries;
  [`getBlockProduction`](./getBlockProduction.md) to see how many assigned slots
  a validator actually produced.
