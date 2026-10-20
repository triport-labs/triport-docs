> Live version: https://triport.io/docs/authentication

# Authentication

> How to obtain a Triport API key and present it on every request — across the four accepted token forms, in priority order.

| | |
|---|---|
| **Method / Endpoint** | `n/a — applies to every API call` |
| **Network** | Any network in the registry |
| **Authentication** | `x-token` header (preferred) · `Authorization: Bearer` · `?api-key=` query · path-form `/<chain>/<key>` |
| **Required scope** | per-chain (`solana:rpc`, `eth:rpc`, `polygon:rpc`) |
| **Tier / rate limit** | tier resolved from the key — see [Rate limits](./rate-limits-and-tiers.md) |

## Description

Every request to the Triport API must carry a valid API key. There is no
anonymous access. The platform accepts the key in four different forms so that
existing clients, SDKs, and copy-pasted endpoint URLs all keep working — but
they are tried in a fixed **priority order**, and the first one present wins.

Authenticate against the base URL:

| Environment | Base URL |
|---|---|
| **Production** | `https://triport.io` |

A key is scoped to one or more chains. When you call a chain-specific endpoint,
the key must hold the matching scope (or the wildcard `*`); otherwise the
request is rejected with `403 Forbidden`. Missing or invalid credentials are
rejected with `401 Unauthorized` and a `WWW-Authenticate: Bearer` challenge.

> The SDKs (`@triport/sdk`, `triport-sdk`) default to the `x-token` header.
> Use it for new integrations; the other forms exist for compatibility.

## Obtaining a key

1. Sign in to the **Triport portal** at `https://triport.io`.
2. Create a project and generate an API key. Production keys are issued with the
   `tri_live_` prefix (e.g. `tri_live_1a2b3c4d…`).

   > **Legacy keys.** Keys issued before the 2026 rebrand carry the `nl_live_`
   > prefix. They remain valid indefinitely, and both spellings of the same key
   > are accepted interchangeably: `nl_live_<hex>` and `tri_live_<hex>` refer to
   > the same credential. No rotation is required.
3. Assign the chains the key may call. Each chain grants the corresponding scope
   (see the mapping below).
4. Store the key as an environment variable — never commit it to source:

   ```bash
   export TRIPORT_API_KEY="tri_live_your_key_here"
   ```

## Token forms (priority order)

The server checks for a token in the following order and uses the **first** one
it finds:

| # | Form | Where | Example | Notes |
|---|---|---|---|---|
| 1 | `x-token` header | Request header | `x-token: $TRIPORT_API_KEY` | ✅ **Recommended — SDK default.** Key stays in the header. |
| 2 | `Authorization: Bearer` header | Request header | `Authorization: Bearer $TRIPORT_API_KEY` | ✅ Recommended. Standard Bearer scheme. |
| 3 | `?api-key=` query parameter | URL query | `?api-key=$TRIPORT_API_KEY` | ⚠️ **Legacy / discouraged** — key travels in the URL. |
| 4 | Path-form `/<chain>/<key>` | URL path | `POST /eth/tri_live_…` | ⚠️ **Discouraged** — key in URL path; `tri_live_*` keys only. |

> ⚠️ **Do not put API keys in URLs in production.** The `?api-key=` query and
> path-form place your secret in the request URL, which is routinely persisted
> in server/proxy access logs, browser history, `Referer` headers, and analytics
> — a well-known credential-leak vector ([OWASP API Security: never carry
> tokens in the URL](https://owasp.org/API-Security/)). Use the **`x-token`** (or
> `Authorization: Bearer`) header instead; reserve the URL forms for quick local
> testing only, and rotate any key that has appeared in a URL.

Because the order is fixed, sending both an `x-token` header and an
`?api-key=` query parameter means the header is used and the query value is
ignored.

### Path-form details

The path-form `POST /<chain>/<key>` is accepted only for keys with the
`tri_live_` prefix. The chain URL segment must be one of:

The generated chain-to-scope mapping below is authoritative.

A trailing slash is permitted (`/eth/tri_live_…/`). When you use the path-form,
the chain segment also drives the scope check: the key must hold the scope shown
above (or `*`), or the request returns `403 Forbidden`.

## Request

The recommended form — `x-token` header against production:

```bash
curl https://triport.io/ \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[]}'
```

The equivalent using the standard Bearer scheme:

```bash
curl https://triport.io/ \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[]}'
```

The path-form (Ethereum, `tri_live_*` keys only):

```bash
curl https://triport.io/eth/$TRIPORT_API_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## Response

A successful, authenticated request returns the normal method result. When
authentication fails, the body is a minimal JSON envelope and the response
carries a `WWW-Authenticate` challenge header:

```json
{
  "error": "unauthorized"
}
```

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Bearer realm="proxy"
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `error` | string | Machine-readable error code. `unauthorized` on missing or invalid credentials. |

> The 401 body is intentionally minimal — it never reveals whether the key was
> missing, malformed, or simply unknown.

## Chain-to-scope mapping

A key carries one scope per chain it may call. The chain segment used in the
path-form maps to the full scope stored on the key:

The generated mapping below is authoritative for path IDs and required scopes.

A single key may be used across networks. New keys use `*` by default, and a
key holding `*` satisfies every scope check. A key created with an explicit
scope list receives `scope_missing` when it calls a network outside that list.
The production audit on 2026-09-07 found 54 of 55 keys using `*`.

## Errors

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `unauthorized` | 401 | Missing or invalid credentials | No token in any of the four forms, or the token is unknown. Response includes `WWW-Authenticate: Bearer realm="proxy"`. |
| `trial_expired` | 401 | Free trial ended | The key was on the free trial and its 7-day window has passed. |
| `subscription_expired` | 401 | Subscription lapsed | A paid subscription is no longer active. |
| `tier_insufficient` | 403 | Tier too low for method | The key's tier does not include the requested method's category. |
| `method_unknown` | 403 | Method not in product | The method is not part of the product for that chain. |
| `rate_limited` | 429 | Sustained RPS exceeded | Too many requests; retry after `Retry-After` seconds. |

See [Errors](./errors.md) for the full error envelope and the typed fields on
each error code.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getSlot",
    params: [],
  }),
});

if (res.status === 401) {
  throw new Error("Authentication failed — check TRIPORT_API_KEY");
}
const { result } = await res.json();
```

## Notes

- **Pick one form.** Forms are tried in priority order (`x-token` →
  `Authorization: Bearer` → `?api-key=` → path-form); sending more than one
  means the lower-priority forms are ignored.
- **Path-form is `tri_live_*` only.** Keys without the `tri_live_` prefix cannot
  authenticate through `/<chain>/<key>` — use a header form instead.
- **Auth headers stop at Triport.** The `x-token` and `Authorization` headers
  are stripped before any request is forwarded downstream; your key is never
  echoed to the response or onward.
- **Keep keys out of URLs.** The `?api-key=` query and path-form place the key
  in the URL, where it is routinely captured by proxy/access logs, browser
  history, and `Referer` headers (OWASP flags tokens-in-URL as a credential-leak
  vector). Prefer the `x-token` header; treat the URL forms as local-testing
  conveniences and rotate any key that has leaked into a URL.
- Related: [Rate limits](./rate-limits-and-tiers.md) · [Errors](./errors.md) ·
  [Getting started](./getting-started.md)

| ID | Network | Required scope | Errors |
|---|---|---|---|
| `sol` | Solana | `solana:rpc` | [Errors](./sol/errors.md) |
| `eth` | Ethereum | `eth:rpc` | [Errors](./eth/errors.md) |
| `polygon` | Polygon | `polygon:rpc` | [Errors](./polygon/errors.md) |
| `bsc` | BNB Smart Chain | `bsc:rpc` | [Errors](./bsc/errors.md) |
| `base` | Base | `base:rpc` | [Errors](./base/errors.md) |
| `tron` | Tron | `tron:rpc` | [Errors](./tron/errors.md) |
| `robinhood` | Robinhood Chain | `robinhood:rpc` | [Errors](./robinhood/errors.md) |
| `stellar` | Stellar | `stellar:rpc` | [Errors](./stellar/errors.md) |
| `ton` | TON | `ton:rpc` | [Errors](./ton/errors.md) |
