> Live version: https://triport.io/docs/sol/json-rpc/getAsset

# getAsset

> Fetches a single Digital Asset Standard (DAS) asset by its ID.

> **Scaffold notice.** This method is published as a scaffold in the current
> spec revision (`0.2.0-api-vector-s2-scaffold`). Its full parameter and result
> schemas are deferred to a later spec revision (api.2.2+) and will be expanded
> there. The contract below documents the intended shape; treat field-level
> details as provisional until the schema is finalized.

| | |
|---|---|
| **Method / Endpoint** | `getAsset` (JSON-RPC) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_das` |
| **Tier / rate limit** | **basic+** (not on the Free trial); per-tier RPS not yet pinned in this spec revision — see [rate-limits](../../rate-limits-and-tiers.md) |

## Description

`getAsset` returns the full record for a single Digital Asset Standard asset,
looked up by its asset ID. The DAS family of methods provides a unified view
over Solana assets — including compressed NFTs, regular NFTs, and fungible
tokens — so you can read an asset's metadata, ownership, and on-chain grouping
through one call rather than stitching together several lower-level account
reads.

Use this when you already hold an asset ID (for example one returned by another
DAS method such as `getAssetsByOwner`) and need the canonical details for that
one asset.

This method belongs to the `sol_das` category and requires the **basic** tier or
higher. It is not available on the Free trial — a Free-trial key will be rejected
with an authorization error.

## Parameters

The parameter schema for this method is a scaffold in the current spec revision
and will be expanded in api.2.2+. The intended call takes a single DAS asset ID.

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The Digital Asset Standard asset ID to fetch. |

> Once the schema is finalized, additional optional fields (such as display /
> grouping options) may be added. Until then, send only the asset `id`.

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAsset",
    "params": {
      "id": "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk"
    }
  }'
```

## Response

The result is a DAS asset object. The current spec revision declares the result
as an open object (`additionalProperties: true`); the representative shape below
will be tightened in api.2.2+.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
    "interface": "V1_NFT",
    "ownership": {
      "owner": "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      "delegated": false
    },
    "compression": {
      "compressed": true
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | The DAS asset record. The exact field set is provisional pending the api.2.2+ schema. |
| `result.id` | string | The asset ID that was requested. |

> Because the result is currently an open object, additional fields beyond `id`
> may be present. Read only the fields you need and tolerate unknown keys.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The `id` is missing or malformed. |
| `401` | Unauthorized | Missing, invalid, or revoked API key. |
| `403` | Forbidden | Key lacks the `sol_das` scope or is below the **basic** tier (e.g. a Free-trial key). |
| `429` | Rate limited | Per-tier RPS exceeded; retry after backoff. |

See [errors](../../errors.md) for the full error envelope and shared codes.

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
    method: "getAsset",
    params: { id: "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk" },
  }),
});

const { result } = await res.json();
console.log(result);
```

## Notes

- **Spec status:** scaffold. Params and result will be expanded in api.2.2+ —
  pin to a spec version in production and re-check this page when the schema is
  finalized.
- **Tier:** requires **basic+**; the Free trial has no access to `sol_das`
  methods.
- **Related DAS methods:** [`getAssetProof`](./getAssetProof.md),
  [`getAssetsByGroup`](./getAssetsByGroup.md),
  [`getAssetsByOwner`](./getAssetsByOwner.md). Use one of the list methods to
  discover asset IDs, then `getAsset` to fetch the full record for one.
