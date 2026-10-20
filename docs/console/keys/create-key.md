> Live version: https://triport.io/docs/console/keys/create-key

# Create an API key

> Mint a new API key for your account and receive its secret value — returned exactly once, at creation time.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/keys` |
| **Type** | Triport Console API |
| **Network** | — (account-level; the key itself can be scoped to any network) |
| **Authentication** | Session cookie (console / dashboard session) |
| **Required scope** | — (any authenticated session may manage its own keys) |
| **Tier / rate limit** | — (console management endpoint) |

## Description

Creates a new API key bound to the currently signed-in account and returns it.
The response contains both the key's metadata object and a `raw` field holding
the full secret value (e.g. `tri_live_…`). **This is the only time the full key
is ever returned** — every later call (list, rotate metadata, endpoint
catalogue) exposes only the short `key_prefix`. Capture and store `raw`
immediately; if you lose it, you must rotate or create a new key.

This endpoint is part of the console surface and is authenticated with your
**session cookie**, not with a Bearer key. (The key you create here is what you
then use as `Authorization: Bearer …` against the RPC endpoints.)

## Parameters

### Request body (`application/json`)

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Human-readable label. Trimmed; must be 1–80 characters after trimming. |
| `scopes` | string[] | no | Public scope aliases granted to the key. Max **32** entries. Defaults to `["*"]` (all networks) when omitted or empty. |
| `rate_limit` | integer | no | Per-key request rate limit. Negative values are clamped to `0` (no per-key override). Omit to inherit the account/tier default. |

### Scope aliases

Submit the **public alias**, never the internal identifier. A non-exhaustive list:

| Alias | Grants |
|---|---|
| `*` | All networks (wildcard — the default) |
| `solana:rpc` | Solana JSON-RPC |
| `eth:rpc` | Ethereum JSON-RPC |
| `polygon:rpc` | Polygon JSON-RPC |
| `sol.rpc`, `sol.rpc.heavy`, `sol.pubsub` | Solana RPC / heavy RPC / pubsub tiers |
| `stream.grpc.solana` | Solana gRPC streaming |
| `stream.eth.validator_grpc` | Ethereum validator gRPC stream |
| `provider.gateway_a.*`, `provider.gateway_b.*`, `provider.gateway_c.*` | Per-gateway provider passthrough (per chain) |

> Passing an internal/vendor scope identifier instead of its public alias is
> rejected with `invalid_scope`.

## Request

```bash
# Console endpoint: authenticated with your dashboard session cookie.
curl https://triport.io/v1/keys \
  -X POST \
  -H "Content-Type: application/json" \
  --cookie "triport_session=$TRIPORT_SESSION" \
  -d '{
    "name": "prod-backend",
    "scopes": ["eth:rpc", "solana:rpc", "stream.grpc.solana"],
    "rate_limit": 200
  }'
```

## Response

`200 OK`

```json
{
  "key": {
    "id": "9f1c2e7a-3b44-4c8e-9d21-7a6f0b5e1c33",
    "name": "prod-backend",
    "key_prefix": "tri_live_4a3f9c1b",
    "scopes": ["eth:rpc", "solana:rpc", "stream.grpc.solana"],
    "rate_limit": 200,
    "status": "active",
    "created_at": "2026-05-29T12:00:00Z",
    "is_default": false
  },
  "raw": "tri_live_your_key_here"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `raw` | string | **The full secret key. Shown only here, only once.** Store it now. |
| `key.id` | string (uuid) | Stable identifier for the key (used in revoke/rotate paths). |
| `key.name` | string | The label you supplied. |
| `key.key_prefix` | string | Short, non-secret prefix (`tri_live_` + 8 hex) for identifying the key in lists and logs. |
| `key.scopes` | string[] | Granted scopes, returned as **public aliases**. |
| `key.rate_limit` | integer | Effective per-key rate limit (`0` = no per-key override). |
| `key.status` | string | Lifecycle status; `active` on creation. |
| `key.created_at` | string (RFC 3339) | Creation timestamp. |
| `key.last_used_at` | string (RFC 3339) | Last use; omitted until the key is first used. |
| `key.is_default` | boolean | Whether this is the account's default key (always `false` for keys created here). |

## Errors

| Code | HTTP | When it happens |
|---|---|---|
| `invalid_json` | 400 | Body is not valid JSON or exceeds the 4 KB limit. |
| `invalid_name` | 400 | `name` is empty (after trimming) or longer than 80 characters. |
| `too_many_scopes` | 400 | More than 32 scopes supplied. |
| `invalid_scope` | 400 | A scope is not a recognized public alias (includes passing an internal/vendor identifier). |
| `unauthenticated` | 401 | No valid session cookie. |
| `method_not_allowed` | 405 | A method other than `POST` was used. |
| `internal` | 500 | Key generation or persistence failed. |

See the shared [errors reference](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)

```js
// Runs in the authenticated console (session cookie sent automatically).
const res = await fetch("https://triport.io/v1/keys", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "prod-backend",
    scopes: ["eth:rpc", "solana:rpc", "stream.grpc.solana"],
    rate_limit: 200,
  }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(`create key failed: ${error}`);
}

const { key, raw } = await res.json();
// Persist `raw` now — it is never returned again.
console.log("store this secret:", raw, "prefix:", key.key_prefix);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { ConsoleClient } from "@triport/sdk";

// ConsoleClient operates on the active dashboard session.
const console = new ConsoleClient();

const { key, raw } = await console.keys.create({
  name: "prod-backend",
  scopes: ["eth:rpc", "solana:rpc", "stream.grpc.solana"],
  rateLimit: 200,
});

// `raw` is your only chance to read the full key — save it immediately.
saveSecret(raw);
```

### Python (`triport-sdk`)

```python
from triport import ConsoleClient

console = ConsoleClient()  # uses the active session

result = console.keys.create(
    name="prod-backend",
    scopes=["eth:rpc", "solana:rpc", "stream.grpc.solana"],
    rate_limit=200,
)

# result["raw"] is shown exactly once — store it now.
save_secret(result["raw"])
print("prefix:", result["key"]["key_prefix"])
```

## Notes

- **Store `raw` immediately.** It is unrecoverable after this response. If lost,
  use [rotate](./rotate-key.md) to mint a fresh secret, or create a new key.
- The default scope (`["*"]`) grants every network. Supply an explicit scope
  list to follow least-privilege.
- `key_prefix` is safe to log and display; the full `raw` value must never be
  logged or placed in a URL.
- Related: [list keys](./list-keys.md), [revoke a key](./revoke-key.md),
  [rotate a key](./rotate-key.md), [per-key endpoint catalogue](./key-endpoints.md),
  [usage aggregates](./usage.md).
