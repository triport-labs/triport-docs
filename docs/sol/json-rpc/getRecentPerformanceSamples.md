> Live version: https://triport.io/docs/sol/json-rpc/getRecentPerformanceSamples

# getRecentPerformanceSamples

> Returns a list of recent cluster performance samples, in reverse slot order.

| | |
|---|---|
| **Method / Endpoint** | `getRecentPerformanceSamples` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getRecentPerformanceSamples` returns a list of recent performance samples taken
across the cluster. Each sample summarizes the number of transactions and slots
that occurred over a fixed `samplePeriodSecs` window (typically 60 seconds), and
is taken roughly once per sample period.

This is the canonical way to estimate recent throughput — transactions per
second (TPS) and non-vote TPS — without polling individual slots. Divide a
sample's `numTransactions` (or `numNonVoteTransactions`) by `samplePeriodSecs`
to get the average TPS for that window.

Samples are returned newest-first, **ordered by `slot` descending**. Use the
optional `limit` parameter to request fewer than the maximum number of samples.

## Parameters

JSON-RPC `params` is a positional array: `[limit?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | no | Number of samples to return, newest first. The maximum is set by the **serving node**, not by Triport — we do not pin a value in this spec revision, so treat a rejected `limit` as the node's bound rather than a product limit. Omit it to get the node's default. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getRecentPerformanceSamples",
    "params": [4]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "slot": 348392041,
      "numTransactions": 126503,
      "numNonVoteTransactions": 78211,
      "numSlots": 148,
      "samplePeriodSecs": 60
    },
    {
      "slot": 348391893,
      "numTransactions": 131044,
      "numNonVoteTransactions": 80127,
      "numSlots": 150,
      "samplePeriodSecs": 60
    },
    {
      "slot": 348391743,
      "numTransactions": 128817,
      "numNonVoteTransactions": 79460,
      "numSlots": 149,
      "samplePeriodSecs": 60
    },
    {
      "slot": 348391594,
      "numTransactions": 124902,
      "numNonVoteTransactions": 77033,
      "numSlots": 147,
      "samplePeriodSecs": 60
    }
  ]
}
```

### Response fields

`result` is an array of `PerformanceSample` objects, ordered by `slot`
descending. Each element has the following fields:

| Field | Type | Description |
|---|---|---|
| `slot` | integer | The slot in which the sample was taken. |
| `numTransactions` | integer | Total number of transactions processed during the sample period. |
| `numNonVoteTransactions` | integer | Number of non-vote transactions processed during the sample period. |
| `numSlots` | integer | Number of slots completed during the sample period. |
| `samplePeriodSecs` | integer | Length of the sample window, in seconds. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `limit` is not an integer, or is outside the range the serving node accepts. The upper bound belongs to the node, so read it from the error message rather than hard-coding a number. |
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
    method: "getRecentPerformanceSamples",
    params: [4],
  }),
});

const { result } = await res.json();
const latest = result[0];
const tps = latest.numTransactions / latest.samplePeriodSecs;
console.log(`Recent TPS at slot ${latest.slot}: ${tps.toFixed(0)}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const samples = await client.solana.getRecentPerformanceSamples(4);

const latest = samples[0];
const tps = latest.numTransactions / latest.samplePeriodSecs;
console.log(`Recent TPS at slot ${latest.slot}: ${tps.toFixed(0)}`);
```

## Notes

- **Ordering:** samples are returned newest-first (`slot` descending), so
  `result[0]` is always the most recent window.
- **Computing TPS:** divide `numTransactions` by `samplePeriodSecs` for total
  TPS, or use `numNonVoteTransactions` to exclude consensus vote traffic — the
  latter is usually the more meaningful measure of user activity.
- **`limit` is a maximum:** the cluster retains a bounded history, so fewer than
  the requested number of samples may be returned if not enough have accumulated.
- **Related methods:** use [`getSlot`](./getSlot.md) to read the current slot and
  [`getRecentPrioritizationFees`](./getRecentPrioritizationFees.md) to estimate the
  priority fee needed to land a transaction during periods of high throughput.
