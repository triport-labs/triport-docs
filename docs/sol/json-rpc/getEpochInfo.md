> Live version: https://triport.io/docs/sol/json-rpc/getEpochInfo

# getEpochInfo

> Returns information about the current epoch on the Solana cluster.

| | |
|---|---|
| **Method / Endpoint** | `getEpochInfo` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getEpochInfo` returns a snapshot of the cluster's current epoch: which epoch
is active, how far through it the cluster is, and the related slot and block
heights. Use it to display network progress, estimate time until the next
epoch boundary, or as a lightweight liveness probe that also reports the
node's current `absoluteSlot` and `blockHeight`.

`slotIndex` is the cluster's position **within** the current epoch, while
`slotsInEpoch` is that epoch's total length — so `slotsInEpoch - slotIndex`
slots remain before the epoch rolls over. `absoluteSlot` is the slot count
since genesis (it keeps climbing across epochs), and `blockHeight` is the
number of confirmed blocks beneath the current one.

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
    "method": "getEpochInfo",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "epoch": 806,
    "slotIndex": 152041,
    "slotsInEpoch": 432000,
    "absoluteSlot": 348392041,
    "blockHeight": 326710118,
    "transactionCount": 401234567890
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `EpochInfo` object. |
| `result.epoch` | integer | The current epoch number. |
| `result.slotIndex` | integer | The cluster's slot position relative to the start of the current epoch. |
| `result.slotsInEpoch` | integer | The total number of slots in the current epoch. |
| `result.absoluteSlot` | integer | The current slot, counted from genesis. |
| `result.blockHeight` | integer | The number of confirmed blocks beneath the current block. |
| `result.transactionCount` | integer | The total number of transactions processed by the cluster since genesis. |

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
    method: "getEpochInfo",
    params: [],
  }),
});

const { result } = await res.json();
const remaining = result.slotsInEpoch - result.slotIndex;
console.log(`Epoch ${result.epoch}: ${remaining} slots remaining`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const info = await client.solana.getEpochInfo({ commitment: "finalized" });

const remaining = info.slotsInEpoch - info.slotIndex;
console.log(`Epoch ${info.epoch}: ${remaining} slots remaining (slot ${info.absoluteSlot})`);
```

## Notes

- **`absoluteSlot` vs `slotIndex`:** `absoluteSlot` is monotonic since genesis
  and never resets; `slotIndex` resets to `0` at each epoch boundary.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** use [`getEpochSchedule`](./getEpochSchedule.md) for the
  cluster's static epoch layout (slots per epoch, warmup), and
  [`getBlock`](./getBlock.md) / `getSlot` to inspect specific slots and blocks.
