> Live version: https://triport.io/docs/base/json-rpc/eth_call

# eth_call

> Execute a read-only EVM call.

## Purpose and interpretation

A call evaluates a transaction-shaped message against the selected state without submitting a signed transaction. Set the destination and encoded calldata for contract reads; the returned bytes still need the contract ABI for interpretation. The block argument fixes the state context. The optional state override belongs to this simulation only and does not change on-chain balances or storage. Successful simulation does not guarantee that a later transaction succeeds, because state and transaction conditions can change.

| Contract field | Frozen value |
|---|---|
| Canonical method | `eth_call` |
| Handler / public template | `POST /rpc/base` / `{HTTPSBase}/r/{key}/rpc/base` |
| Network | Base mainnet, chain ID `8453` |
| Scope | `base:rpc` |
| Availability | `unknown` |
| Minimum tier | `free` — enforced matrix policy, not measured capacity or runtime publication |

Canonical contract: [Base OpenRPC](https://triport.io/api-specs/json-rpc/base.openrpc.json) — the frozen machine-readable source this page is generated from.

## Params schema

Positional JSON-RPC parameters:

```json
[
  {
    "name": "call",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BaseR03_call"
    }
  },
  {
    "name": "block",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BaseR03_blockTag"
    }
  },
  {
    "name": "stateOverride",
    "required": false,
    "schema": {
      "type": "object"
    }
  }
]
```

## Result schema

```json
{
  "name": "result",
  "schema": {
    "$ref": "#/components/schemas/BaseR03_data"
  }
}
```

Schema status: `official_documentation`; complete: `true`.

## Parameter limits

| JSON path | Frozen limit | Source |
|---|---|---|
| — | `unknown` | No numeric parameter ceiling is frozen; enforce the declared schema shape and deny an unknown oversized/range profile. |

Historical block retrieval is not an archive-state guarantee. Selectors must be preserved; do not substitute `pending`, `safe`, or `finalized` with `latest`.

## Rate limits and tier

These are enforced product-policy values, not measured upstream capacity or an SLA. Enterprise is finite, never physical “unlimited” capacity.

| Tier | Limit / access | Category |
|---|---:|---|
| Free | 10 RPS sustained · up to 20 burst | base_read_rpc |
| Basic | 20 RPS sustained · up to 40 burst | base_read_rpc |
| Pro | 100 RPS sustained · up to 200 burst | base_read_rpc |
| Business | 250 RPS sustained · up to 500 burst | base_read_rpc |
| Enterprise | 250 RPS sustained · up to 500 burst | base_read_rpc |

See [Base limits](../limits.md) and [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity). The included buffer refills at sustained RPS; there is no quota on the number of bursts.

## Errors

| Code | Meaning here | Client action |
|---|---|---|
| `-32602` | Parameters fail the declared schema or upstream parser. | Fix the positional parameters; parser acceptance is not execution success. |

Tier and budget rejections are not JSON-RPC errors: the gate decides them before the request reaches the RPC layer and answers with a plain HTTP envelope — `403` `tier_insufficient` (with an `X-Required-Tier` header) or `429` `rate_limited` (honor `Retry-After`). Both are enforced product policy, not measured capacity or an SLA.

Authentication/transport failures use the shared client error envelope. See [Base errors](../errors.md).

## Limitations

- Base-specific overrides and historical state need proof.
