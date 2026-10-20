> Live version: https://triport.io/docs/polygon/json-rpc/bor_getSnapshot

# bor_getSnapshot

> Returns the full Bor consensus snapshot at a block — the validator set, the recent-signers map, and the block context — in a single call.

| | |
|---|---|
| **Method / Endpoint** | `bor_getSnapshot` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro and above — metered on the `polygon_bor` category (sustained RPS per tier, 2× burst) |

## Description

`bor_getSnapshot` returns the complete Polygon **Bor** consensus snapshot as of a
given block. A snapshot is the richest of the `bor_*` methods: it bundles the
block context (`number`, `hash`), the current `validators` set with their stake
weights and proposer-rotation accumulators, and a `recents` map of recently
seen signers keyed by block number. It is the single best entry point for
observability and indexing tooling that needs the full proposer schedule for an
epoch rather than just the current validator list or current proposer.

Use it when you want one authoritative read of consensus state — for building a
validator-set dashboard, reconstructing the epoch proposer rotation, or
auditing signer behavior. The `recents` map together with `validators` lets you
derive who has signed recently and whose turn is coming up, without polling
[`bor_getCurrentProposer`](./bor_getCurrentProposer.md) block-by-block.

Bor consensus rotates its validator set roughly every epoch (~1024 blocks,
about 36 minutes), so the snapshot is broadly stable within an epoch and changes
at epoch boundaries. This is a Polygon-only, Bor-fork-specific method — it does
not exist on standard Geth/Erigon Ethereum nodes. The response is heavier than
the other `bor_*` methods (roughly **50–100 KB** for a full snapshot), so cache
results client-side rather than calling it in a hot loop.

## Parameters

Positional parameters: a single optional block reference at which to take the
snapshot.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | no | The block to snapshot, as a `0x`-prefixed hex block number (e.g. `"0x2DC6C0"`) or a block tag such as `"latest"`. When omitted, the snapshot is taken at the latest block. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bor_getSnapshot",
    "params": ["latest"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": 50000000,
    "hash": "0x4f3c2b1a9d8e7c6b5a4938271605f4e3d2c1b0a99887766554433221100ffeedd",
    "validators": [
      {
        "ID": 8,
        "signer": "0x0375b1f8f9b7a3a3b4f1c3d2e1a0b9c8d7e6f504",
        "power": 12000,
        "accum": -340
      },
      {
        "ID": 12,
        "signer": "0x5973918bdc0aef5e0d6f1c2b3a49587665544332",
        "power": 9800,
        "accum": 1180
      }
    ],
    "recents": {
      "49999998": "0x0375b1f8f9b7a3a3b4f1c3d2e1a0b9c8d7e6f504",
      "49999999": "0x5973918bdc0aef5e0d6f1c2b3a49587665544332",
      "50000000": "0x0375b1f8f9b7a3a3b4f1c3d2e1a0b9c8d7e6f504"
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.number` | integer | Block number the snapshot was taken at. |
| `result.hash` | string | Hash of that block. |
| `result.validators` | array | The validator set in effect at the block. |
| `result.validators[].ID` | integer | Validator ID within the set. |
| `result.validators[].signer` | string | Validator's signer address (`0x`-prefixed). |
| `result.validators[].power` | integer | Stake weight used for proposer selection. |
| `result.validators[].accum` | integer | Proposer-rotation accumulator; drives which validator proposes next. |
| `result.recents` | object | Map of recent block numbers → the signer address that produced each block. Used to enforce the "no recent re-signing" rule. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; the `polygon_bor` namespace is not enabled for it. |
| `429` | `rate_limited` | You exceeded your tier's sustained + burst RPS on the `polygon_bor` category. Back off `Retry-After` (currently `1`) seconds and retry. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "bor_getSnapshot",
    params: ["latest"],
  }),
});

const { result } = await res.json();
console.log(`snapshot @ block ${result.number}: ${result.validators.length} validators`);
```

## Notes

- This is the most complete `bor_*` method. For lighter, single-purpose reads
  prefer [`bor_getCurrentValidators`](./bor_getCurrentValidators.md) (just the
  validator set), [`bor_getCurrentProposer`](./bor_getCurrentProposer.md) (the
  current proposer address), or [`bor_getSigners`](./bor_getSigners.md) (the
  authorized signer list — a subset of `validators`).
- `validators` is broadly stable within an epoch (~1024 blocks, ~36 min) and
  changes at epoch boundaries. A client-side cache TTL of ~30 minutes is a good
  default; re-fetch on epoch rollover.
- Because the full snapshot can be 50–100 KB, avoid calling it per block. If you
  only need the live proposer, poll
  [`bor_getCurrentProposer`](./bor_getCurrentProposer.md) instead.
- All `bor_*` methods are Polygon-specific Bor consensus reads and require the
  **Pro** tier. See [Rate Limits and Tiers](../../rate-limits-and-tiers.md) for
  how the `polygon_bor` category is metered.
