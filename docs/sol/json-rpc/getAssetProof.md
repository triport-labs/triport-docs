> Live version: https://triport.io/docs/sol/json-rpc/getAssetProof

# getAssetProof

> Returns the Merkle proof for a compressed NFT asset, for on-chain verification.

> **Scaffold notice.** This method is published as a scaffold in the current
> spec revision (`0.2.0-api-vector-s2-scaffold`). Its full parameter and result
> schemas are deferred to a later spec revision (api.2.2+) and will be expanded
> there. The contract below documents the intended shape; treat field-level
> details as provisional until the schema is finalized.

| | |
|---|---|
| **Method / Endpoint** | `getAssetProof` (JSON-RPC) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_das` |
| **Tier / rate limit** | **basic+** (not on the Free trial); per-tier RPS not yet pinned in this spec revision — see [rate-limits](../../rate-limits-and-tiers.md) |

## Description

`getAssetProof` returns the Merkle proof for a single compressed NFT (cNFT),
looked up by its Digital Asset Standard (DAS) asset ID. Compressed NFTs are not
stored as individual on-chain accounts — they live as leaves in a concurrent
Merkle tree, and their authenticity is established by a proof against that
tree's root. This method gives you exactly that proof: the leaf, the tree's
current root, and the sibling hashes along the path from the leaf to the root.

Use it whenever you need to verify or act on a compressed NFT on-chain — for
example, when constructing a Bubblegum transfer, burn, or delegate instruction,
which require the proof as input so the program can recompute and check the root.
Pair it with [`getAsset`](./getAsset.md), which returns the asset's metadata and
ownership, while `getAssetProof` returns the cryptographic proof for the same
asset.

This method belongs to the `sol_das` category and requires the **basic** tier or
higher. It is not available on the Free trial — a Free-trial key will be rejected
with an authorization error.

## Parameters

The parameter schema for this method is a scaffold in the current spec revision
and will be expanded in api.2.2+. The intended call takes a single DAS asset ID.

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The Digital Asset Standard asset ID of the compressed NFT to fetch a proof for. |

> Once the schema is finalized, additional optional fields may be added. Until
> then, send only the asset `id`.

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAssetProof",
    "params": {
      "id": "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk"
    }
  }'
```

## Response

The result is a Merkle-proof object for the requested asset. The current spec
revision declares the result as an open object (`additionalProperties: true`);
the representative shape below will be tightened in api.2.2+.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "root": "2nbWQa9zSGr3jJ2v8b4n1y8Yp1tSXkB7m9p7c2Cv2Xp",
    "proof": [
      "EmJXiXEAhEN3FfNQtBa5hwR8LC5kHvdLsaGCoERosZjK",
      "9z2pSqW2K7r5J3qg7m1bV5sQk8nQp4Tz1RdXuY6cN4Lo"
    ],
    "node_index": 16384,
    "leaf": "7Lq3wVnGv9dB1c8s2KpYx4mZ6Tn5RfHj0aQ8eWoP1Ud",
    "tree_id": "5xMfBpVxg9z2pSqW2K7r5J3qg7m1bV5sQk8nQp4Tz1Rd"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | The Merkle-proof record. The exact field set is provisional pending the api.2.2+ schema. |
| `result.root` | string | Base-58 current root of the Merkle tree the asset belongs to. |
| `result.proof` | string[] | Ordered list of base-58 sibling node hashes from the leaf up to the root. |
| `result.node_index` | integer | Index of the leaf node within the tree. |
| `result.leaf` | string | Base-58 hash of the asset's leaf. |
| `result.tree_id` | string | Base-58 address of the Merkle tree account holding the asset. |

> Because the result is currently an open object, additional fields may be
> present. Read only the fields you need and tolerate unknown keys.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The `id` is missing or malformed. |
| `403` | Tier insufficient | Key is below the **basic** tier (e.g. a Free-trial key) for the `sol_das` category. The call is rejected before it reaches the RPC layer, so this is an HTTP error, not a JSON-RPC one: body `{"error":"tier_insufficient", …}` with `current_tier`, `required_tier`, `method`, `category` and `upgrade_url`, plus an `X-Required-Tier` header. |
| `429` | Rate limited | Per-tier RPS exceeded. Also an HTTP error: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |
| `401` | Unauthorized | Missing, invalid, or revoked API key. |

A tier rejection is an HTTP 403 with a plain JSON body — there is no JSON-RPC
envelope, because the request never reaches the RPC layer:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'getAssetProof' requires basic tier or higher",
  "current_tier": "free",
  "required_tier": "basic",
  "method": "getAssetProof",
  "category": "sol_das",
  "upgrade_url": "https://triport.io/upgrade/basic"
}
```

The same response carries an `X-Required-Tier: basic` header.

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
    method: "getAssetProof",
    params: { id: "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk" },
  }),
});

const { result } = await res.json();
console.log(result.root, result.proof);
```

## Notes

- **Spec status:** scaffold. Params and result will be expanded in api.2.2+ —
  pin to a spec version in production and re-check this page when the schema is
  finalized.
- **Tier:** requires **basic+**; the Free trial has no access to `sol_das`
  methods.
- **Compressed NFTs only:** a proof exists only for assets stored in a Merkle
  tree (compressed NFTs). Requesting a proof for a regular (uncompressed) asset
  will not return tree data.
- **Pair with metadata:** use [`getAsset`](./getAsset.md) to read the asset's
  metadata and ownership; use this method to obtain the proof needed to verify
  or transact with it on-chain.
- **Related DAS methods:** [`getAsset`](./getAsset.md),
  [`getAssetsByGroup`](./getAssetsByGroup.md),
  [`getAssetsByOwner`](./getAssetsByOwner.md).
- **Tutorial:** [list a wallet's assets and fetch cNFT proofs](../../guides/list-solana-wallet-assets-and-cnft-proofs.md).
