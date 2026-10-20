> Live version: https://triport.io/docs/sol/json-rpc/getAssetsByGroup

# getAssetsByGroup

> Look up every Digital Asset Standard (DAS) asset that belongs to a group — most commonly all NFTs in a collection.

> **Schema status — scaffold.** This method is available on the production
> endpoint, but its exact `params` and `result` schemas are still being
> finalized and will be pinned in a later spec version (`api.2.2`+). The
> request/response shapes below describe the **intended DAS contract** so you
> can build against it today; treat field-level details as provisional until
> the schema is published. The tier requirement, category, and error behavior
> documented here are authoritative now.

| | |
|---|---|
| **Method / Endpoint** | `getAssetsByGroup` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token` header (preferred) or `Authorization: Bearer` |
| **Required scope** | — (gated by tier, not scope) |
| **Tier / rate limit** | **basic+** required; category `sol_das` (see [Rate Limits](../../rate-limits-and-tiers.md)) |

## Description

`getAssetsByGroup` is a Digital Asset Standard (DAS) read method. Given a
group key and value, it returns every asset assigned to that group. By far the
most common use is enumerating an NFT collection: pass the group key
`collection` and the collection's mint address to page through all assets that
belong to it.

This is a **basic-tier method**. DAS methods (category `sol_das`) are not
available on the Free trial — calling them with a Free-trial key returns a
`tier_insufficient` error (see [Errors](./getAssetsByGroup.md#errors)). Upgrade to **basic** or
higher to use it.

Because the result set for a popular collection can be large, the method is
paginated. Request one page at a time and continue until a page returns fewer
items than your requested `limit`.

## Parameters

DAS methods take a single object parameter (named-object form). The intended
fields are:

| Name | Type | Required | Description |
|---|---|---|---|
| `groupKey` | string | yes | The group dimension to match on. The supported value is `"collection"`. |
| `groupValue` | string | yes | The value for that group — for `collection`, the collection mint address (base-58). |
| `page` | integer | no | 1-based page number to fetch. Defaults to `1`. |
| `limit` | integer | no | Max assets per page. Defaults to `1000`. |
| `sortBy` | object | no | Sort options, e.g. `{ "sortBy": "created", "sortDirection": "asc" }`. |
| `before` / `after` | string | no | Cursor bounds for cursor-style pagination, as an alternative to `page`. |

> The precise parameter object — including which optional fields are accepted
> and their defaults — is finalized in spec `api.2.2`+. The fields above reflect
> the standard DAS shape.

## Request

```bash
curl https://triport.io/sol \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAssetsByGroup",
    "params": {
      "groupKey": "collection",
      "groupValue": "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w",
      "page": 1,
      "limit": 1000
    }
  }'
```

> You can also authenticate with `Authorization: Bearer $TRIPORT_API_KEY` — see
> [Authentication](../../authentication.md) for all supported forms.

## Response

A successful call returns a paginated list of assets:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "total": 1000,
    "limit": 1000,
    "page": 1,
    "items": [
      {
        "interface": "V1_NFT",
        "id": "5q1qZ7v...assetMint...",
        "grouping": [
          {
            "group_key": "collection",
            "group_value": "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w"
          }
        ],
        "ownership": {
          "owner": "Dfw...owner...",
          "frozen": false,
          "delegated": false
        }
      }
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.total` | integer | Number of items returned on this page. |
| `result.limit` | integer | The page size used for this response. |
| `result.page` | integer | The 1-based page number returned. |
| `result.items` | array | The assets in this page. Each entry is a DAS asset object. |
| `result.items[].id` | string | The asset's mint / ID (base-58). |
| `result.items[].interface` | string | Asset interface type, e.g. `V1_NFT`. |
| `result.items[].grouping` | array | Group memberships; includes the queried `group_key` / `group_value`. |
| `result.items[].ownership` | object | Owner address and delegation/frozen flags. |

> The full DAS asset object carries many more fields (content, metadata,
> royalty, compression, etc.). Their exact names and types are pinned in spec
> `api.2.2`+.

## Errors

Errors are returned as a standard JSON-RPC error envelope. The cases most
relevant to this method:

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Called with a Free-trial key — `getAssetsByGroup` requires **basic** tier or higher. An HTTP error, not a JSON-RPC one: plain body with `current_tier`, `required_tier`, `method`, `category` and `upgrade_url`, plus an `X-Required-Tier` header. |
| `429` | `rate_limited` | Sustained RPS for the `sol_das` category exceeded. Plain HTTP body with `limit_rps`, `burst_capacity` and `retry_after_sec`; honor `Retry-After` and `X-RateLimit-Reset`. |
| `-32602` | Invalid params | `groupKey` / `groupValue` missing or malformed. |
| `-32601` | `method_unknown` (HTTP 403) | Method name misspelled or not part of the Solana product. |

Example `tier_insufficient` response (a Free-trial key calling a DAS method) — HTTP `403` with a plain body, not a JSON-RPC envelope:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'getAssetsByGroup' requires basic tier or higher",
  "current_tier": "free",
  "required_tier": "basic",
  "method": "getAssetsByGroup",
  "category": "sol_das",
  "upgrade_url": "https://triport.io/upgrade/basic"
}
```

See the [Errors](../../errors.md) page for the full envelope and the typed
error schemas.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getAssetsByGroup",
    params: {
      groupKey: "collection",
      groupValue: "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w",
      page: 1,
      limit: 1000,
    },
  }),
});

const { result } = await res.json();
console.log(`page ${result.page}: ${result.items.length} assets`);
```

## Notes

- **Pagination.** Keep incrementing `page` until a response returns fewer than
  `limit` items — that page is the last one. For large collections, prefer the
  cursor form (`before` / `after`) if you need stable iteration while the
  collection changes.
- **Tier gate.** This is a `sol_das` method, so a basic-tier (or higher) key is
  required; Free-trial keys get HTTP `403` `tier_insufficient`. See [Rate Limits](../../rate-limits-and-tiers.md)
  for the per-tier RPS budget on the `sol_das` category.
- **Related DAS methods:** [`getAsset`](./getAsset.md) (single asset),
  [`getAssetProof`](./getAssetProof.md) (merkle proof for compressed assets),
  and [`getAssetsByOwner`](./getAssetsByOwner.md) (assets held by a wallet).
- **Schema finalization.** This page documents the intended contract while the
  method is a scaffold. When the `api.2.2`+ schema lands, re-check parameter
  defaults and the full asset object shape against the updated reference.
