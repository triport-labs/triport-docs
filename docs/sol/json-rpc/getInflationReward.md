> Live version: https://triport.io/docs/sol/json-rpc/getInflationReward

# getInflationReward

> Returns the inflation / staking reward earned by a list of addresses for a given Solana epoch.

| | |
|---|---|
| **Method / Endpoint** | `getInflationReward` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getInflationReward` returns the inflation (staking) reward credited to each of
a list of addresses for a single epoch. Each address in the request maps to one
entry in the returned array, in the **same order** as the input. The reward
`amount` is reported in **lamports** (1 SOL = 1,000,000,000 lamports), so divide
by `1e9` to display a SOL figure.

Only stake accounts and vote accounts earn inflation rewards. If an address is
not a reward-bearing account, or earned no reward for the requested epoch, its
slot in the result array is `null`. The array length always equals the number of
addresses you passed.

By default the reward for the **previous** epoch is returned. Pass `epoch` in
the config object to query a specific historical epoch. Note that nodes only
retain reward data for a limited window of recent epochs; very old epochs may no
longer be available.

## Parameters

JSON-RPC `params` is a positional array: `[addresses, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `addresses` | array of string (base-58) | yes | List of account public keys to look up rewards for. Each must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `epoch` | integer | no | The epoch to query rewards for. Defaults to the previous epoch. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getInflationReward",
    "params": [
      [
        "6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu",
        "BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2"
      ],
      { "epoch": 612 }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "amount": 2500000,
      "effectiveSlot": 264384012,
      "epoch": 612,
      "postBalance": 502500000,
      "commission": 5
    },
    null
  ]
}
```

The first address earned a reward of `2500000` lamports (0.0025 SOL) for epoch
`612`. The second address is not a reward-bearing account for that epoch, so its
entry is `null`.

### Response fields

`result` is an array with one entry per requested address, in input order. Each
entry is either `null` or an `InflationReward` object:

| Field | Type | Description |
|---|---|---|
| `amount` | integer | Reward amount credited, in lamports. |
| `effectiveSlot` | integer | The slot at which the reward became effective. |
| `epoch` | integer | The epoch for which the reward was paid. |
| `postBalance` | integer | The account balance, in lamports, after the reward was applied. |
| `commission` | integer | Vote-account commission, as a percentage, in effect when the reward was credited. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `addresses` is missing, contains an invalid base-58 string, or `config` is malformed. |
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
    method: "getInflationReward",
    params: [
      [
        "6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu",
        "BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2",
      ],
      { epoch: 612 },
    ],
  }),
});

const { result } = await res.json();
result.forEach((reward, i) => {
  if (reward === null) console.log(`address ${i}: no reward`);
  else console.log(`address ${i}: ${reward.amount / 1e9} SOL @ epoch ${reward.epoch}`);
});
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const rewards = await client.solana.getInflationReward(
  [
    "6dmNQ5jwLeLk5REvio1JcMshcbvkYMwy26sJ8pbkvStu",
    "BGsqMegLpV6n6Ve146sSX2dTjUMj3M92HnU8BbNRMhF2",
  ],
  { epoch: 612 }
);

for (const [i, reward] of rewards.entries()) {
  if (reward === null) console.log(`address ${i}: no reward`);
  else console.log(`address ${i}: ${reward.amount / 1e9} SOL @ epoch ${reward.epoch}`);
}
```

## Notes

- **Order and length are preserved:** the result array has exactly one entry per
  requested address, in the same order. A `null` entry means that address earned
  no reward for the epoch (e.g. it is not a stake or vote account).
- **Lamports, not SOL:** `amount` and `postBalance` are integer lamport counts.
  Divide by `1e9` for a SOL figure.
- **Default epoch:** when `epoch` is omitted, the reward for the previous epoch
  is returned.
- **History window:** reward data is only retained for a limited number of
  recent epochs; requests for very old epochs may return `null`.
- **Related methods:** use [`getEpochInfo`](./getEpochInfo.md) to discover the
  current epoch and [`getInflationRate`](./getInflationRate.md) for the
  cluster-wide inflation rate.
