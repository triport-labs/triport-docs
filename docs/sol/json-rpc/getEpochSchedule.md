> Live version: https://triport.io/docs/sol/json-rpc/getEpochSchedule

# getEpochSchedule

> Returns the epoch schedule information from this Solana cluster's genesis config.

| | |
|---|---|
| **Method / Endpoint** | `getEpochSchedule` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getEpochSchedule` returns the parameters that define how the cluster maps slots
to epochs. These values come from the cluster's **genesis configuration** and do
not change for the life of the cluster, so the response is effectively static —
you can fetch it once at startup and cache it indefinitely.

Use it to convert between slots and epochs on the client side without an extra
round trip: knowing `slotsPerEpoch`, `firstNormalEpoch`, and `firstNormalSlot`
lets you compute which epoch any given slot belongs to. The `warmup` flag and
the leader-schedule offset describe the cluster's early bootstrap behavior, where
epochs ramp up in length before reaching the steady-state `slotsPerEpoch`.

This method takes no parameters and is not commitment-sensitive — the schedule
is the same regardless of slot or finality.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getEpochSchedule",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "slotsPerEpoch": 432000,
    "leaderScheduleSlotOffset": 432000,
    "warmup": false,
    "firstNormalEpoch": 0,
    "firstNormalSlot": 0
  }
}
```

The example above reflects a mainnet-style genesis config: 432,000 slots per
epoch with warmup disabled, so the first normal epoch and slot are both `0`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | The `EpochSchedule` object. |
| `result.slotsPerEpoch` | integer | The maximum number of slots in each epoch. |
| `result.leaderScheduleSlotOffset` | integer | The number of slots before the start of an epoch at which its leader schedule is computed. |
| `result.warmup` | boolean | Whether epochs ramp up in length at cluster start (`true`) or all epochs are full length (`false`). |
| `result.firstNormalEpoch` | integer | The first epoch with `slotsPerEpoch` slots. When `warmup` is `false`, this is `0`. |
| `result.firstNormalSlot` | integer | The slot at which `firstNormalEpoch` begins (`MINIMUM_SLOTS_PER_EPOCH * (2^firstNormalEpoch - 1)`). |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
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
    method: "getEpochSchedule",
    params: [],
  }),
});

const { result } = await res.json();

// Convert an arbitrary slot to its epoch (warmup disabled).
const slot = 348392041;
const epoch = Math.floor(
  (slot - result.firstNormalSlot) / result.slotsPerEpoch
) + result.firstNormalEpoch;
console.log(`Slot ${slot} is in epoch ${epoch}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const schedule = await client.solana.getEpochSchedule();

console.log(`Slots per epoch: ${schedule.slotsPerEpoch}`);
console.log(`Warmup: ${schedule.warmup}`);
```

## Notes

- **Cache it:** the schedule is fixed for the life of the cluster. Fetch once
  and reuse rather than calling on every request.
- **No commitment parameter:** unlike most read methods, the result does not
  depend on slot or commitment, so there is no `config` object.
- **Warmup epochs:** when `warmup` is `true`, epochs before `firstNormalEpoch`
  are shorter than `slotsPerEpoch`; account for `firstNormalSlot` when mapping
  early slots to epochs.
- **Related methods:** use [`getEpochInfo`](./getEpochInfo.md) for the *current*
  epoch, slot, and progress, and [`getSlot`](./getSlot.md) to read the slot the
  cluster has currently reached.
