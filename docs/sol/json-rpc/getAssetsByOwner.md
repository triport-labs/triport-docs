> Live version: https://triport.io/docs/sol/json-rpc/getAssetsByOwner

# getAssetsByOwner

> Returns every Digital Asset Standard (DAS) asset — NFTs, compressed NFTs, and fungible tokens — owned by a given Solana wallet.

> **Provisional schema.** `getAssetsByOwner` is published as a scaffold. Its
> parameter and result shapes are finalized in spec version `api.2.2+`. The
> contract below describes the intended request/response and follows standard
> DAS conventions, but field names and defaults may change before the schema is
> locked. The method is reachable today on **basic+** tier.

| | |
|---|---|
| **Method / Endpoint** | `getAssetsByOwner` (JSON-RPC, `POST /` ) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_das` |
| **Tier / rate limit** | basic+ (per-tier RPS published with the finalized `api.2.2+` schema) |

## Description

`getAssetsByOwner` is a Digital Asset Standard (DAS) read method. Given a wallet
address it returns the full set of assets that wallet owns — standard NFTs,
compressed NFTs (cNFTs), and, where indexed, fungible token positions — in a
single paginated call. Use it to render a wallet's portfolio or collection view
without issuing one lookup per mint.

Because the result set for an active wallet can be large, responses are
paginated. Request one page at a time and walk forward until a page returns
fewer items than the requested `limit`.

This method belongs to the `sol_das` tier category and therefore requires at
least a **basic** tier API key; Free-trial keys are rejected with an
authorization error (see [Errors](./getAssetsByOwner.md#errors)).

## Parameters

JSON-RPC `params` is a single object (named parameters).

| Name | Type | Required | Description |
|---|---|---|---|
| `ownerAddress` | string | yes | Base-58 wallet address whose assets to return. |
| `page` | integer | no | 1-based page number to fetch. Defaults to `1`. |
| `limit` | integer | no | Maximum assets per page. |
| `sortBy` | object | no | Sort options for the returned page (e.g. by created date or recent action). |

> The exact optional fields and their defaults are finalized in `api.2.2+`.
> Send `ownerAddress` and paginate with `page` / `limit`; treat everything else
> as provisional.

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAssetsByOwner",
    "params": {
      "ownerAddress": "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      "page": 1,
      "limit": 100
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "total": 2,
    "limit": 100,
    "page": 1,
    "items": [
      {
        "id": "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
        "interface": "V1_NFT",
        "ownership": {
          "owner": "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
          "frozen": false
        }
      }
    ]
  }
}
```

> The `result` is an object. The example above shows the shape DAS clients
> expect (`total`, `limit`, `page`, and an `items` array of asset objects);
> the precise asset object schema is finalized in `api.2.2+`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Container for the paginated asset list. |
| `result.total` | integer | Number of assets returned in this page. |
| `result.limit` | integer | The `limit` that was applied. |
| `result.page` | integer | The page number that was returned. |
| `result.items` | array | The assets owned by the wallet for this page. |

## Errors

Errors use the standard JSON-RPC error envelope. See [errors.md](../../errors.md)
for the full envelope and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing or invalid `Authorization` bearer token. |
| `403` | Forbidden | Key is below the required **basic** tier, or lacks the `sol_das` scope. |
| `-32602` | Invalid params | `ownerAddress` is missing or not a valid base-58 address. |
| `429` | Too many requests | Tier RPS exceeded; retry after backing off. |

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
    method: "getAssetsByOwner",
    params: {
      ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      page: 1,
      limit: 100,
    },
  }),
});

const { result } = await res.json();
console.log(result.items);
```

## Notes

- **Pagination:** start at `page: 1` and increment until a page returns fewer
  than `limit` items. Keep `limit` constant across the walk.
- **Tier:** `sol_das` methods require a **basic** tier key or higher. Free-trial
  keys are rejected (`403`).
- **Provisional contract:** parameter and result schemas are finalized in spec
  version `api.2.2+`. Pin to that version once published to rely on field names
  beyond `ownerAddress`, `page`, and `limit`.
- **Related DAS methods:** [`getAsset`](./getAsset.md),
  [`getAssetProof`](./getAssetProof.md),
  [`getAssetsByGroup`](./getAssetsByGroup.md).
- **Tutorial:** [list a wallet's assets and fetch cNFT proofs](../../guides/list-solana-wallet-assets-and-cnft-proofs.md)
  pages through every asset and recovers from an oversized page.
