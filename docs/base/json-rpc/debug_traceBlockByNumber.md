> Live version: https://triport.io/docs/base/json-rpc/debug_traceBlockByNumber

# debug_traceBlockByNumber

> Trace every transaction in a block.

## Purpose and interpretation

Block-number tracing selects the block at a height or accepted tag at evaluation time. A recent height can resolve to a different hash after a reorganization, which matters when comparing two trace runs. Record the resolved block identity alongside the output. The result is a collection of traces, not a single receipt. Choose a narrow diagnostic target and use transaction tracing when only one transaction is relevant, avoiding unnecessary work on every transaction in the block.

| Contract field | Frozen value |
|---|---|
| Canonical method | `debug_traceBlockByNumber` |
| Handler / public template | `POST /rpc/base` / `{HTTPSBase}/r/{key}/rpc/base` |
| Network | Base mainnet, chain ID `8453` |
| Scope | `base:rpc` |
| Availability | `unknown` |
| Minimum tier | `pro` — enforced matrix policy, not measured capacity or runtime publication |

Canonical contract: [Base OpenRPC](https://triport.io/api-specs/json-rpc/base.openrpc.json) — the frozen machine-readable source this page is generated from.

## Params schema

Positional JSON-RPC parameters:

```json
[
  {
    "name": "block",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BlockTag"
    }
  },
  {
    "name": "options",
    "required": false,
    "schema": {
      "$ref": "#/components/schemas/TraceOptions"
    }
  }
]
```

## Result schema

```json
{
  "name": "traces",
  "schema": {
    "$ref": "#/components/schemas/TraceList"
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
| Free | — (tier gated) | base_read_rpc_heavy |
| Basic | — (tier gated) | base_read_rpc_heavy |
| Pro | 2 RPS sustained · up to 4 burst | base_read_rpc_heavy |
| Business | 5 RPS sustained · up to 10 burst | base_read_rpc_heavy |
| Enterprise | 5 RPS sustained · up to 10 burst | base_read_rpc_heavy |

See [Base limits](../limits.md) and [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity). The included buffer refills at sustained RPS; there is no quota on the number of bursts.

## Errors

| Code | Meaning here | Client action |
|---|---|---|
| `-32602` | Parameters fail the declared schema or upstream parser. | Fix the positional parameters; parser acceptance is not execution success. |

Tier and budget rejections are not JSON-RPC errors: the gate decides them before the request reaches the RPC layer and answers with a plain HTTP envelope — `403` `tier_insufficient` (with an `X-Required-Tier` header) or `429` `rate_limited` (honor `Retry-After`). Both are enforced product policy, not measured capacity or an SLA.

Authentication/transport failures use the shared client error envelope. See [Base errors](../errors.md).
