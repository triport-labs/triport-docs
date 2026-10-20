> Live version: https://triport.io/docs/base/json-rpc/eth_getBalance

# eth_getBalance

> Return an account balance at a block.

## Purpose and interpretation

Balance lookup reads an account's native ETH balance at the selected Base block. The result is a hexadecimal quantity denominated in wei, so use integer arithmetic and apply the appropriate decimal conversion for display. This method does not return ERC-20 token balances; those require contract calls. Pin the block when reconciling balances across several addresses so that the reads describe one state snapshot. A zero native balance does not imply that the account has no tokens or activity.

| Contract field | Frozen value |
|---|---|
| Canonical method | `eth_getBalance` |
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
    "name": "address",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/Address"
    }
  },
  {
    "name": "block",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BlockTag"
    }
  }
]
```

## Result schema

```json
{
  "name": "balance",
  "schema": {
    "$ref": "#/components/schemas/Quantity"
  }
}
```

Schema status: `canonical_evm_schema`; complete: `true`.

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
