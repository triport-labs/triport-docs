> Live version: https://triport.io/docs/base/json-rpc/eth_feeHistory

# eth_feeHistory

> Return fee-market history.

## Purpose and interpretation

Fee history describes a bounded sequence of blocks ending at the requested newest block. The block count controls the window, while reward percentiles request samples of transaction priority fees within that window. Correlate each returned array with its documented position rather than assuming every array has the same length. This method supplies historical inputs for a fee policy; it is not a promise about the next block's fee and is not a full rollup cost calculation.

| Contract field | Frozen value |
|---|---|
| Canonical method | `eth_feeHistory` |
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
    "name": "blockCount",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/Quantity"
    }
  },
  {
    "name": "newestBlock",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BlockTag"
    }
  },
  {
    "name": "rewardPercentiles",
    "required": true,
    "schema": {
      "items": {
        "maximum": 100,
        "minimum": 0,
        "type": "number"
      },
      "type": "array"
    }
  }
]
```

## Result schema

```json
{
  "name": "history",
  "schema": {
    "$ref": "#/components/schemas/FeeHistory"
  }
}
```

Schema status: `canonical_evm_schema`; complete: `true`.

## Parameter limits

| JSON path | Frozen limit | Source |
|---|---|---|
| `$[2].schema.items.maximum` | `100` | OpenRPC schema constraint |
| `$[2].schema.items.minimum` | `0` | OpenRPC schema constraint |

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
