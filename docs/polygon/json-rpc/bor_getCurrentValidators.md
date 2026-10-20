> Live version: https://triport.io/docs/polygon/json-rpc/bor_getCurrentValidators

# bor_getCurrentValidators

> Returns the current Polygon Bor consensus validator set — the active validators producing blocks this epoch, with their stake weight and proposer-rotation accumulator.

| | |
|---|---|
| **Method / Endpoint** | `bor_getCurrentValidators` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro (premium `bor` namespace); low RPS cap — budget a few requests/second and cache client-side |

## Description

`bor_getCurrentValidators` returns the validator set that is currently active in
Polygon's Bor consensus layer. On mainnet this is an array of roughly **100–150**
validator objects, each describing one staking validator: its sequential `ID`,
its `signer` address, its voting `power` (stake weight), and its `accum`
(the proposer-rotation accumulator used to decide who proposes the next block).

This is a Bor-consensus method, not a standard EVM call — it exposes Polygon's
proof-of-stake validator state that generic Geth-style endpoints do not provide.
Use it for validator-set monitoring, tracking stake distribution, anticipating
proposer rotation, or building governance/compliance snapshots.

The validator set rotates **once per epoch** — an epoch is ~1024 blocks
(64 sprints × 16 blocks), about **~36 minutes** on Polygon. Between epoch
boundaries the set is effectively static, so polling on every block is wasteful.
**Recommend a client-side cache with a TTL of ~30 minutes.** The response payload
is light (~10–15 KB for ~120 validators), so the cost is the request count, not
the body size.

The `bor` namespace requires the **Pro** tier. Calling it on a lower tier is
rejected with HTTP `403` `tier_insufficient`.

## Parameters

This method takes **no parameters**. Send an empty positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. `params` must be `[]`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bor_getCurrentValidators",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "ID": 1,
      "signer": "0x4ad84f7014b7b44f723f284a85b1662337971439",
      "power": 1100,
      "accum": 88500
    },
    {
      "ID": 2,
      "signer": "0xf30ee5b03f2c4ff66ba8aef2c4e87edc04dc6f95",
      "power": 950,
      "accum": -125000
    }
  ]
}
```

> The example above is trimmed to two entries; a live mainnet response contains
> ~100–150 validator objects in `result`.

### Response fields

`result` is an array of validator objects. Each object has the following fields:

| Field | Type | Description |
|---|---|---|
| `ID` | integer | Sequential validator ID within the current set. |
| `signer` | string | The validator's 20-byte signer address (`0x`-prefixed, hex). |
| `power` | integer | Voting power / stake weight of the validator. |
| `accum` | integer | Proposer-rotation accumulator; can be negative. The validator with the highest `accum` is selected to propose next, after which accumulators are rebalanced. |

## Errors

Errors follow the standard JSON-RPC error envelope (`code`, `message`, and a
`data` object carrying `category`, `current_tier`, `required_tier`,
`limit_rps`, `retry_after_sec`, and `upgrade_url`).

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your key is below the **Pro** tier required for the `bor` namespace. The `data.required_tier` / `data.upgrade_url` fields tell you how to upgrade. |
| `429` | `rate_limited` | You exceeded the RPS cap for this method on your tier. Honor `data.retry_after_sec` and back off; cache the result to stay under the cap. |

See the shared [errors reference](../../errors.md) for the full error envelope,
the complete code list, and retry guidance.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "bor_getCurrentValidators",
    params: [],
  }),
});

const { result: validators } = await res.json();
console.log(`active validators: ${validators.length}`);
console.log(`top stake: ${validators.sort((a, b) => b.power - a.power)[0].signer}`);
```

## Notes

- **Cache it.** The set is epoch-static (~36 min / ~1024 blocks). A ~30-minute
  client-side cache TTL keeps you well within the Pro-tier RPS cap and avoids
  needless HTTP `429` `rate_limited` responses.
- **Per-block vs. per-epoch.** `bor_getCurrentValidators` is epoch-scoped. For
  the live block proposer use [`bor_getCurrentProposer`](./bor_getCurrentProposer.md),
  and for the full consensus snapshot (validators + recent signers + block
  context) use [`bor_getSnapshot`](./bor_getSnapshot.md).
- **`accum` can be negative.** It is a signed rotation accumulator, not a balance
  — don't treat it as stake. Use `power` for stake weight.
- **Bor-only.** This is a Polygon Bor-fork method and has no Ethereum equivalent;
  it is not part of the standard Geth namespace.
