> Live version: https://triport.io/docs/sol/json-rpc/getInflationGovernor

# getInflationGovernor

> Returns the cluster's current inflation governor — the set of fractions that
> govern how SOL is issued as staking rewards.

| | |
|---|---|
| **Method / Endpoint** | `getInflationGovernor` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getInflationGovernor` returns the cluster's inflation governor: the rule-set
that determines the annual inflation rate over time. Unlike
[`getInflationRate`](./getInflationRate.md), which reports the realized
inflation values for the *current* epoch, the governor describes the
**parameters** that those values are derived from — the starting rate, the
floor it tapers down to, the rate of that taper, and the share routed to the
foundation.

Every field is a fraction in the range `0.0`–`1.0` (for example, `0.08` means
8% annual inflation). These values are governed by cluster configuration and
change only rarely, so the result is effectively static between protocol
parameter changes. Use it to model expected staking yields or to display the
network's long-term issuance schedule.

The reading is taken relative to a slot governed by the optional `commitment`
config. Pass `minContextSlot` to require that the serving node has already
reached at least a given slot before it answers.

## Parameters

JSON-RPC `params` is a positional array: `[config?]`. The single argument is
optional — omit it (send `params: []`) to use the node defaults.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getInflationGovernor",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "initial": 0.08,
    "terminal": 0.015,
    "taper": 0.15,
    "foundation": 0.05,
    "foundationTerm": 7.0
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `InflationGovernor` object. |
| `result.initial` | number | The initial inflation rate applied at the start of the schedule, as a fraction (e.g. `0.08` = 8%). |
| `result.terminal` | number | The terminal (floor) inflation rate the schedule tapers down to, as a fraction. |
| `result.taper` | number | The rate at which inflation tapers from `initial` toward `terminal` each year, as a fraction. |
| `result.foundation` | number | The fraction of total inflation allocated to the foundation. |
| `result.foundationTerm` | number | The duration, in years, over which the foundation allocation applies. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `config` is malformed (e.g. an unknown `commitment` value). |
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
    method: "getInflationGovernor",
    params: [],
  }),
});

const { result } = await res.json();
console.log(`Initial ${result.initial * 100}% tapering to ${result.terminal * 100}%`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const gov = await client.solana.getInflationGovernor({ commitment: "finalized" });

console.log(`Initial ${gov.initial * 100}% → terminal ${gov.terminal * 100}% (taper ${gov.taper})`);
```

## Notes

- **Governor vs. rate:** `getInflationGovernor` returns the *parameters* of the
  inflation schedule; [`getInflationRate`](./getInflationRate.md) returns the
  *realized* total / validator / foundation values for the current epoch.
- **All values are fractions:** results are in the `0.0`–`1.0` range
  (`0.08` = 8%), except `foundationTerm`, which is expressed in years.
- **Effectively static:** these values are governed by cluster configuration
  and change only when protocol parameters change, so the result is safe to
  cache for long periods.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** see [`getInflationReward`](./getInflationReward.md) for
  per-address staking rewards in a given epoch.
