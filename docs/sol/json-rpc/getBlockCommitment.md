> Live version: https://triport.io/docs/sol/json-rpc/getBlockCommitment

# getBlockCommitment

> Returns the amount of cluster stake, in lamports, that has voted on a particular Solana block (slot).

| | |
|---|---|
| **Method / Endpoint** | `getBlockCommitment` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlockCommitment` reports how much of the cluster's stake has voted on the
block produced at a given **slot**. It returns a `commitment` array describing
the stake-weighted vote depth for that block, plus the `totalStake` active in
the current epoch. Together these let you judge how finalized a block is: the
more stake concentrated at the highest lockout depth, the less likely the block
is to be rolled back.

Pass the target `slot` as the single positional parameter. If the node has no
commitment information for the requested slot — for example a slot it never
saw, or one already purged from its ledger — the `commitment` field is returned
as `null` while `totalStake` still reflects the epoch's active stake.

This is a low-level inspection method. For everyday "is this transaction
final?" checks, prefer querying with a `commitment` config of `finalized` on the
relevant read method; reach for `getBlockCommitment` when you need the raw
stake-weighted vote distribution for a specific block.

## Parameters

JSON-RPC `params` is a positional array: `[slot]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `slot` | integer | yes | The slot number of the block to query. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlockCommitment",
    "params": [348392041]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "commitment": [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      10000000000, 32000000000
    ],
    "totalStake": 42000000000
  }
}
```

For a slot the node knows nothing about, `commitment` is `null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "commitment": null,
    "totalStake": 42000000000
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `BlockCommitment` object. |
| `result.commitment` | integer[] \| null | Array logging the amount of cluster stake, in lamports, voting on the block at each lockout depth. `null` when the node has no commitment data for the slot. |
| `result.totalStake` | integer | Total active stake, in lamports, for the current epoch. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `slot` is missing or not an integer. |
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
    method: "getBlockCommitment",
    params: [348392041],
  }),
});

const { result } = await res.json();
if (result.commitment === null) {
  console.log("No commitment data for that slot");
} else {
  const voted = result.commitment.reduce((a, b) => a + b, 0);
  console.log(`${voted} / ${result.totalStake} lamports voted on the block`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { commitment, totalStake } = await client.solana.getBlockCommitment(348392041);

console.log(commitment === null
  ? "No commitment data for that slot"
  : `voted stake across depths: ${commitment.join(", ")} (total ${totalStake})`);
```

## Notes

- **Lamports, not SOL:** every value in `commitment` and `totalStake` is an
  integer count of lamports. Divide by `1e9` for a SOL figure.
- **Unknown slots:** always handle `commitment === null` before reducing or
  indexing the array — it is the documented signal that the node has no vote
  data for the requested slot.
- **Related methods:** use [`getSlot`](./getSlot.md) to find the cluster's
  current slot, and [`getBalance`](./getBalance.md) for account balances. To
  confirm transaction finality directly, pass a `commitment` config rather than
  inspecting raw vote depths here.
