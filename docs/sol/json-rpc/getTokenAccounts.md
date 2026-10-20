> Live version: https://triport.io/docs/sol/json-rpc/getTokenAccounts

# getTokenAccounts

> Digital Asset Standard (DAS) lookup that returns the token accounts associated with a mint or owner in a single call.

> **Scaffold method.** This method is registered on the Solana JSON-RPC surface but its full parameter and result schemas are deferred to spec version **api.2.2** and later. The method name, network, authentication, required tier, and tier category below are final; the exact request/response shapes shown here describe the **intended contract** and may be refined when the full schema ships. Build against it defensively (treat `result` as an open object) until the finalized schema is published.

| | |
|---|---|
| **Status** | 🚧 **Beta — preliminary**, schema subject to change (`api.2.2`+) |
| **Method / Endpoint** | `getTokenAccounts` |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_das` |
| **Tier / rate limit** | basic+ (DAS category) |

## Description

`getTokenAccounts` is part of the Digital Asset Standard (DAS) family of methods.
It is intended to return the SPL token accounts tied to a given mint or owner,
combining the token-account enumeration that would otherwise require multiple
`getTokenAccountsByOwner` / `getTokenAccountsByDelegate` calls into a single
DAS-indexed query.

Use it when you need to enumerate token holdings without first knowing the exact
program-account filters, or when you want the DAS index's faster, paginated view
of large account sets. Because DAS methods are served from an index rather than
the validator directly, they require at least the **basic** tier.

> This is a **scaffold** entry (`summary: "scaffold — described by api.2.2/2.3/2.4"`).
> The parameter list is currently empty in the spec and the result is typed as an
> open object (`{ "type": "object", "additionalProperties": true }`). The
> parameters and response fields documented below reflect the intended DAS
> contract and the shape used by the related `getTokenAccountsByOwner` /
> `getTokenAccountsByDelegate` methods. Do not rely on field names until the
> api.2.2+ schema is finalized.

## Parameters

JSON-RPC named/object parameters (intended contract — subject to change at api.2.2+):

| Name | Type | Required | Description |
|---|---|---|---|
| `mint` | string (base-58 pubkey) | no* | Mint address to enumerate token accounts for. |
| `owner` | string (base-58 pubkey) | no* | Owner address to enumerate token accounts for. |
| `page` | integer | no | 1-based page number for paginated results. |
| `limit` | integer | no | Maximum number of token accounts to return per page. |

\* At least one of `mint` or `owner` is expected to be required once the full
schema lands. The current spec declares no parameters; treat the above as
provisional.

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenAccounts",
    "params": {
      "owner": "4Nd1mYpQ8Z3vR2sK9bXcW7gH5fT6jL1aP0eU8nQ2dVx",
      "page": 1,
      "limit": 100
    }
  }'
```

## Response

The finalized result is expected to follow the DAS token-account shape used by
the sibling read methods — a `context` slot plus a `value` array of
`{ pubkey, account }` entries:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 264912803
    },
    "value": [
      {
        "pubkey": "7uG3Q9pXr5kVmN2hWcT4bL8aD1eF6sJ0yP3nX9cKqRzt",
        "account": {
          "lamports": 2039280,
          "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "data": {
            "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "owner": "4Nd1mYpQ8Z3vR2sK9bXcW7gH5fT6jL1aP0eU8nQ2dVx",
            "tokenAmount": {
              "amount": "1500000",
              "decimals": 6,
              "uiAmount": 1.5,
              "uiAmountString": "1.5"
            }
          },
          "executable": false,
          "rentEpoch": 361,
          "space": 165
        }
      }
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.context.slot` | integer | Slot at which the data was read. |
| `result.value` | array | List of matching token accounts. |
| `result.value[].pubkey` | string | Base-58 address of the token account. |
| `result.value[].account` | object | The decoded account (`lamports`, `owner`, `data`, `executable`, `rentEpoch`, `space`). |

Because this is a scaffold method, the live response is currently an open object;
the structure above is provisional pending the api.2.2+ schema.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` API key. |
| `403` | Forbidden / tier too low | Your plan is below the **basic** tier required for `sol_das` methods. |
| `429` | Rate limited | You exceeded the requests-per-second limit for your tier (RPS + burst; there is no daily quota). |
| `-32601` | Method not found | The method is unavailable on the connected spec version. |
| `-32602` | Invalid params | Parameters did not match the (finalized) schema. |

See the shared [errors reference](../../errors.md) for the full error envelope.

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
    method: "getTokenAccounts",
    params: {
      owner: "4Nd1mYpQ8Z3vR2sK9bXcW7gH5fT6jL1aP0eU8nQ2dVx",
      page: 1,
      limit: 100,
    },
  }),
});

const { result } = await res.json();
console.log(result.value);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

// Scaffold method: pass params as an object; result is typed as `unknown`
// until the api.2.2+ schema is released.
const result = await client.solana.rpc("getTokenAccounts", {
  owner: "4Nd1mYpQ8Z3vR2sK9bXcW7gH5fT6jL1aP0eU8nQ2dVx",
  page: 1,
  limit: 100,
});

console.log(result);
```

## Notes

- **Scaffold status:** params and result are deferred to spec **api.2.2 / 2.3 / 2.4**.
  Pin your client to a spec version and re-check this page when the finalized
  schema ships before depending on specific field names.
- **Tier:** `sol_das` methods require the **basic** tier or higher. The Free trial
  cannot call this method (`403`).
- **Pagination:** DAS lookups are expected to be paginated via `page` / `limit`;
  iterate pages until the returned `value` array is shorter than `limit`.
- **Related methods:** for the validator-direct (non-DAS, available on the Free trial) equivalents
  see `getTokenAccountsByOwner` and `getTokenAccountsByDelegate`. Other DAS
  methods in the same category include `getAsset`, `getAssetProof`,
  `getAssetsByGroup`, and `getAssetsByOwner`.
