> Live version: https://triport.io/docs/base/json-rpc/eth_getTransactionByBlockNumberAndIndex

# eth_getTransactionByBlockNumberAndIndex

> scaffold — described by api.2.2/2.3/2.4

## Purpose and interpretation

This method selects a transaction by block selector and position. Index zero means the first transaction, not the first successful execution. A recent block number or moving tag can resolve differently after a reorganization, so record and check the returned block identity when processing multiple positions. Handle null before reading transaction fields. If the application already has an exact block hash, the hash-and-index variant gives a more stable identity for repeatable retrieval.

| Contract field | Frozen value |
|---|---|
| Canonical method | `eth_getTransactionByBlockNumberAndIndex` |
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
    "name": "block",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BlockTag"
    }
  },
  {
    "name": "index",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/Quantity"
    }
  }
]
```

## Result schema

```json
{
  "name": "transaction",
  "schema": {
    "$ref": "#/components/schemas/TransactionOrNull"
  }
}
```

Schema status: `documented_shape`; complete: `true`.

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
