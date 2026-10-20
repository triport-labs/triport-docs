> Live version: https://triport.io/docs/sol/json-rpc/searchAssets

# searchAssets

> Full-text and filter search across the Solana Digital Asset Standard (DAS) asset index.

> **⚠️ Scaffold method.** `searchAssets` is reserved and routable on the
> Solana JSON-RPC surface, but its full parameter and result schemas are
> **deferred to spec version `api.2.2+`**. The contract below describes the
> intended behavior and the standard DAS shape this method implements. Treat
> field-level details as provisional until the `api.2.2` spec is published —
> the method name, tier, and scope are stable.

| | |
|---|---|
| **Method / Endpoint** | `searchAssets` (JSON-RPC 2.0) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_das` |
| **Tier / rate limit** | **basic+** (RPS published with the `api.2.2` spec) |

## Description

`searchAssets` queries Triport's Digital Asset Standard (DAS) index, returning
a paginated list of assets that match a combination of filters — owner,
creator, authority, collection grouping, compression state, royalty
configuration, interface type, and more. Unlike point lookups such as
`getAsset` (single asset by id) or `getAssetsByOwner` (assets for one wallet),
`searchAssets` lets you compose several criteria in one request, making it the
right tool for building marketplace listings, portfolio views, and collection
explorers.

Use it when you need to filter the asset universe by attributes rather than
fetch a known id. Results are returned in pages; iterate with the `page`
parameter (or cursor parameters) until fewer than `limit` items are returned.

Because this method requires the **basic** tier or higher, Free-trial API keys
will receive an authorization error. The method shares the `sol_das` scope with
the other Digital Asset Standard methods.

## Parameters

JSON-RPC `params` is a **single named object** (not a positional array). All
fields are optional, but at least one filter should be supplied to avoid
scanning the entire index.

| Name | Type | Required | Description |
|---|---|---|---|
| `ownerAddress` | string | no | Base58 owner wallet to filter by. |
| `creatorAddress` | string | no | Base58 address of a creator on the asset. |
| `authorityAddress` | string | no | Base58 update-authority address. |
| `grouping` | [string, string] | no | Collection grouping as `["collection", "<mint>"]`. |
| `compressed` | boolean | no | `true` to return only compressed (cNFT) assets. |
| `burnt` | boolean | no | Filter by burn state. |
| `frozen` | boolean | no | Filter by frozen state. |
| `interface` | string | no | DAS interface, e.g. `"V1_NFT"`, `"ProgrammableNFT"`. |
| `royaltyTargetType` | string | no | `"creators"`, `"fanout"`, or `"single"`. |
| `royaltyTarget` | string | no | Address royalties are paid to. |
| `royaltyAmount` | integer | no | Royalty basis points to match. |
| `tokenType` | string | no | `"fungible"`, `"nonFungible"`, `"compressedNft"`, `"regularNft"`, or `"all"`. |
| `page` | integer | no | 1-based page number. Defaults to `1`. |
| `limit` | integer | no | Page size, max `1000`. Defaults to `1000`. |
| `sortBy` | object | no | `{ "sortBy": "created" \| "updated" \| "recentAction" \| "id", "sortDirection": "asc" \| "desc" }`. |
| `before` | string | no | Cursor — return assets before this id (cursor pagination). |
| `after` | string | no | Cursor — return assets after this id (cursor pagination). |

> Field names and the exact enum sets above follow the public DAS convention
> and are **provisional** until finalized in `api.2.2`.

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "searchAssets",
    "params": {
      "ownerAddress": "N4f6zftYsuu4yT7icsjLwh4i6pB1zvvKbseHj2NmSQw",
      "compressed": true,
      "page": 1,
      "limit": 100
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "total": 2,
    "limit": 100,
    "page": 1,
    "items": [
      {
        "interface": "V1_NFT",
        "id": "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
        "content": {
          "$schema": "https://schema.metaplex.com/nft1.0.json",
          "json_uri": "https://example.com/metadata/1.json",
          "metadata": {
            "name": "Example Asset #1",
            "symbol": "EXMPL"
          }
        },
        "compression": {
          "compressed": true,
          "tree": "BvR8...tree",
          "leaf_id": 12
        },
        "grouping": [
          { "group_key": "collection", "group_value": "J1S9H...coll" }
        ],
        "ownership": {
          "owner": "N4f6zftYsuu4yT7icsjLwh4i6pB1zvvKbseHj2NmSQw",
          "ownership_model": "single",
          "frozen": false,
          "delegated": false
        },
        "royalty": {
          "royalty_model": "creators",
          "basis_points": 500,
          "primary_sale_happened": true
        },
        "mutable": true,
        "burnt": false
      }
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.total` | integer | Number of items in this page. |
| `result.limit` | integer | Page size that was applied. |
| `result.page` | integer | Page number echoed back. |
| `result.items` | array | Matched assets. |
| `items[].id` | string | Asset id (mint / cNFT leaf id). |
| `items[].interface` | string | DAS interface type. |
| `items[].content` | object | Metadata: `json_uri`, `metadata.name`, `metadata.symbol`, files, attributes. |
| `items[].compression` | object | Compression state — `compressed`, `tree`, `leaf_id`. |
| `items[].grouping` | array | Collection grouping entries (`group_key`/`group_value`). |
| `items[].ownership` | object | `owner`, `ownership_model`, `frozen`, `delegated`. |
| `items[].royalty` | object | `royalty_model`, `basis_points`, `primary_sale_happened`. |
| `items[].burnt` | boolean | Whether the asset has been burned. |

> The result envelope follows the DAS asset shape and is **provisional**
> pending `api.2.2`.

## Errors

Errors use the standard JSON-RPC error envelope. The cases most relevant to
this method:

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Called with a Free-trial key — `searchAssets` requires **basic** tier or higher. An HTTP error, not a JSON-RPC one: plain body with `current_tier`, `required_tier`, `method`, `category` and `upgrade_url`, plus an `X-Required-Tier` header. |
| `429` | `rate_limited` | Sustained RPS for the `sol_das` category exceeded. Plain HTTP body with `limit_rps`, `burst_capacity` and `retry_after_sec`; honor `Retry-After` and `X-RateLimit-Reset`. |
| `-32601` | `method_unknown` (HTTP 403) | Method name misspelled or not part of the Solana product. |
| `-32602` | Invalid params | Malformed filter object, bad address, or `limit` out of range. |

Example `tier_insufficient` response (a Free-trial key calling a DAS method) — HTTP `403` with a plain body, not a JSON-RPC envelope:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'searchAssets' requires basic tier or higher",
  "current_tier": "free",
  "required_tier": "basic",
  "method": "searchAssets",
  "category": "sol_das",
  "upgrade_url": "https://triport.io/upgrade/basic"
}
```

See the shared [errors reference](../../errors.md) for the full error envelope
and the typed error schemas. Rate limiting is RPS-per-tier with burst — there is
no daily quota.

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
    id: "1",
    method: "searchAssets",
    params: {
      ownerAddress: "N4f6zftYsuu4yT7icsjLwh4i6pB1zvvKbseHj2NmSQw",
      compressed: true,
      page: 1,
      limit: 100,
    },
  }),
});

const { result } = await res.json();
console.log(`${result.total} assets on page ${result.page}`);
```

## Notes

- **Pagination:** start at `page: 1` and increment until a page returns fewer
  than `limit` items. For deep result sets, prefer the `before`/`after` cursor
  parameters over page numbers for stable iteration.
- **Combine filters narrowly.** Supplying several criteria (owner + grouping +
  `tokenType`) keeps responses small and fast; an unfiltered search scans a
  large index and is more likely to hit rate limits.
- **Related methods:** `getAsset` (single asset by id), `getAssetsByOwner` and
  `getAssetsByGroup` — all in the `sol_das` scope, all **basic+**.
- **Tier:** Free-trial keys cannot call any `sol_das` method; upgrade to
  **basic** or higher.
- **Stability:** finalized parameter and result schemas, plus the published
  per-tier RPS limits, arrive with spec version `api.2.2`.
