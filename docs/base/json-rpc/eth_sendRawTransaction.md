> Live version: https://triport.io/docs/base/json-rpc/eth_sendRawTransaction

# eth_sendRawTransaction

> Submit a signed raw transaction.

## Purpose and interpretation

The input is an already signed, serialized transaction represented as hex data. This interface does not sign transactions and should never receive a private key. Before submission, verify that the signature, chain identifier and nonce describe the intended operation. A returned hash identifies the transaction; it does not establish successful execution or finality. Submission errors and timeouts require reconciliation by hash before a client decides whether to resubmit, because transport failure alone does not reveal acceptance.

| Contract field | Frozen value |
|---|---|
| Canonical method | `eth_sendRawTransaction` |
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
    "name": "rawTransaction",
    "required": true,
    "schema": {
      "$ref": "#/components/schemas/BaseR03_raw"
    }
  }
]
```

## Result schema

```json
{
  "name": "result",
  "schema": {
    "$ref": "#/components/schemas/BaseR03_hash"
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
| Free | 3 RPS sustained · up to 6 burst | base_send_tx |
| Basic | 5 RPS sustained · up to 10 burst | base_send_tx |
| Pro | 30 RPS sustained · up to 60 burst | base_send_tx |
| Business | 80 RPS sustained · up to 160 burst | base_send_tx |
| Enterprise | 80 RPS sustained · up to 160 burst | base_send_tx |

See [Base limits](../limits.md) and [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity). The included buffer refills at sustained RPS; there is no quota on the number of bursts.

## Errors

| Code | Meaning here | Client action |
|---|---|---|
| `-32602` | Parameters fail the declared schema or upstream parser. | Fix the positional parameters; parser acceptance is not execution success. |

Tier and budget rejections are not JSON-RPC errors: the gate decides them before the request reaches the RPC layer and answers with a plain HTTP envelope — `403` `tier_insufficient` (with an `X-Required-Tier` header) or `429` `rate_limited` (honor `Retry-After`). Both are enforced product policy, not measured capacity or an SLA.

Authentication/transport failures use the shared client error envelope. See [Base errors](../errors.md).

## Limitations

- Keyed originator endpoint; provider forwarding/searcher disclosure is not private method proof.
