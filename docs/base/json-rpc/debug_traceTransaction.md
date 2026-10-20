> Live version: https://triport.io/docs/base/json-rpc/debug_traceTransaction

# debug_traceTransaction

> Trace one transaction.

## Purpose and interpretation

This method inspects execution for one transaction hash. It is useful when a receipt's success flag does not explain which nested call reverted or consumed gas. Trace frames describe execution and must not be treated as independently submitted transactions. The options object selects the permitted tracing behavior; decode the result according to that choice. A transaction being visible through a normal lookup does not by itself prove that the historical execution data needed for tracing remains available.

| Contract field | Frozen value |
|---|---|
| Canonical method | `debug_traceTransaction` |
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
    "name": "transactionHash",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/Hash"
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
  "name": "trace",
  "schema": {
    "$ref": "#/components/schemas/TraceFrame"
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
