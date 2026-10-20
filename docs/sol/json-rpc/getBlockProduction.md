> Live version: https://triport.io/docs/sol/json-rpc/getBlockProduction

# getBlockProduction

> Returns recent block-production information for the current or previous epoch, broken down per validator.

| | |
|---|---|
| **Method / Endpoint** | `getBlockProduction` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlockProduction` reports how many leader slots each validator was assigned
and how many of those slots actually produced a block, over a slot range within
the current (or previous) epoch. It is the canonical way to measure a
validator's **skip rate** — the gap between `slotsAssigned` and `blocksProduced`
— and to inspect overall leader-schedule performance.

The result is returned as an `RpcResponse` envelope: a `context` with the slot
the data was evaluated against, and a `value` containing a `byIdentity` map
(keyed by validator identity pubkey) plus the `range` the figures cover.

By default the call returns data for every validator over the current epoch so
far. Narrow it with the optional `config`: pass `identity` to restrict the
result to a single validator pubkey, and `range` (`firstSlot` / `lastSlot`) to
bound the slot window. When `range` is omitted, the range starts at the first
slot of the current epoch and ends at the highest slot the node has reached.

## Parameters

JSON-RPC `params` is a positional array: `[config?]`. The single element is an
optional configuration object; omit it (or pass `[]`) to query the full current
epoch.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `identity` | string (base-58) | no | Restrict results to a single validator identity pubkey. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `range` | object | no | Slot range to report over. |
| `range.firstSlot` | integer | no | First slot to report production for (inclusive). Must be within the current or previous epoch. |
| `range.lastSlot` | integer | no | Last slot to report production for (inclusive). Defaults to the highest slot reached. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlockProduction",
    "params": [
      {
        "identity": "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM",
        "range": { "firstSlot": 348364800 }
      }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 348392041,
      "apiVersion": "2.0.18"
    },
    "value": {
      "byIdentity": {
        "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM": [2048, 2039]
      },
      "range": {
        "firstSlot": 348364800,
        "lastSlot": 348392041
      }
    }
  }
}
```

The validator `Awes4Tr6…` was assigned `2048` leader slots in the queried range
and produced `2039` blocks (9 skipped slots, a ~0.44% skip rate).

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `BlockProduction` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the data was read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | object | The block-production payload. |
| `result.value.byIdentity` | object | Map of validator identity pubkey → `[slotsAssigned, blocksProduced]` (a two-element integer array). |
| `result.value.range` | object | The slot range the figures cover. |
| `result.value.range.firstSlot` | integer | First slot of the reported range (inclusive). |
| `result.value.range.lastSlot` | integer | Last slot of the reported range (inclusive). |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `identity` is not a valid base-58 pubkey, `range` is malformed, or `firstSlot`/`lastSlot` fall outside the current or previous epoch. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

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
    method: "getBlockProduction",
    params: [
      { identity: "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM" },
    ],
  }),
});

const { result } = await res.json();
for (const [pubkey, [assigned, produced]] of Object.entries(result.value.byIdentity)) {
  const skipRate = ((assigned - produced) / assigned) * 100;
  console.log(`${pubkey}: ${produced}/${assigned} (${skipRate.toFixed(2)}% skipped)`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.getBlockProduction({
  identity: "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM",
  commitment: "finalized",
});

const [assigned, produced] = value.byIdentity[
  "Awes4Tr6TX8JDzEhCZY2QVNimT6iD1zWHzf1vNyGvpLM"
];
console.log(`${produced}/${assigned} slots produced (slot ${context.slot})`);
```

## Notes

- **`[slotsAssigned, blocksProduced]` order:** each `byIdentity` entry is a
  two-element array — leader slots assigned first, blocks produced second. The
  difference is the validator's skipped-slot count.
- **Current epoch by default:** with no `range`, the window covers the current
  epoch from its first slot up to the latest slot the node has reached. `range`
  may only reference the current or previous epoch.
- **Filter early:** pass `identity` to retrieve a single validator instead of
  the full cluster map — much smaller responses for per-validator dashboards.
- **Related methods:** use [`getEpochInfo`](./getEpochInfo.md) to find the
  current epoch's slot boundaries before constructing a `range`, and
  `getLeaderSchedule` to see which slots a validator is assigned ahead of time.
