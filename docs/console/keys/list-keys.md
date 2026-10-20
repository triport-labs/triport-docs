> Live version: https://triport.io/docs/console/keys/list-keys

# List API keys

> Return every API key on the authenticated account, including its public prefix, scopes, and status — but never the raw secret.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/keys` |
| **Type** | Triport Console API |
| **Network** | — (account management) |
| **Authentication** | Session cookie (`nl_session`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/keys` returns all API keys belonging to the currently signed-in
console user — both `active` and `revoked` keys — newest first. Use it to render
the key-management screen in your dashboard: each entry carries enough metadata
(name, public prefix, scopes, rate limit, last-used timestamp) to display and
manage the key without ever exposing the secret value.

This is a **console endpoint**, not a data-plane RPC call. It is authenticated
by the browser session cookie established at sign-in, not by an API key. There
is no `Authorization: Bearer` header on this request and no per-tier RPS limit
applies.

The **raw key value is never returned here.** A key's full secret is shown
exactly once — in the response to [Create an API key](./create-key.md) — and
cannot be retrieved afterward. Every subsequent read, including this list call,
exposes only `key_prefix`, a short non-secret prefix you can use to visually
identify which key is which. If a user loses a key, the only path forward is to
[rotate](./rotate-key.md) or [revoke](./revoke-key.md) and create a new one.

## Parameters

This endpoint takes no path, query, or body parameters. The account is
determined entirely from the session cookie.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/v1/keys \
  -H "Content-Type: application/json" \
  --cookie "nl_session=$TRIPORT_SESSION"
```

> The session cookie is set automatically by the browser after sign-in; you do
> not normally construct this request by hand. The `--cookie` flag above is
> shown only for completeness when scripting against an authenticated session.

## Response

`200 OK`

```json
{
  "keys": [
    {
      "id": "9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
      "name": "production-frontend",
      "key_prefix": "tri_live_a1b2c3d4",
      "scopes": ["solana:rpc", "eth:rpc", "stream.grpc.solana"],
      "rate_limit": 0,
      "status": "active",
      "created_at": "2026-05-20T14:03:11Z",
      "last_used_at": "2026-05-29T08:47:52Z",
      "is_default": false
    },
    {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "name": "default",
      "key_prefix": "tri_live_77f0e9aa",
      "scopes": ["*"],
      "rate_limit": 0,
      "status": "active",
      "created_at": "2026-05-12T09:15:00Z",
      "is_default": true
    },
    {
      "id": "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e",
      "name": "old-staging-key",
      "key_prefix": "tri_live_0c4d8e1f",
      "scopes": ["solana:rpc"],
      "rate_limit": 50,
      "status": "revoked",
      "created_at": "2026-04-01T11:20:33Z",
      "last_used_at": "2026-05-02T18:00:01Z",
      "is_default": false
    }
  ]
}
```

### Response fields

The top-level object has a single `keys` array. Each element is a key object:

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Stable identifier for the key. Use this in [revoke](./revoke-key.md), [rotate](./rotate-key.md), and [per-key endpoint](./key-endpoints.md) calls. |
| `name` | string | Human-readable label set at creation (1–80 chars). |
| `key_prefix` | string | Non-secret prefix of the key (brand prefix + 8 hex chars), for visual identification. **Never the full secret.** |
| `scopes` | string[] | Public scope aliases granted to the key (e.g. `solana:rpc`, `eth:rpc`, `stream.grpc.solana`). `["*"]` means all networks. |
| `rate_limit` | integer | Per-key request-rate override; `0` means the account/tier default applies. |
| `status` | string | `active` or `revoked`. Revoked keys are listed for history but no longer authenticate. |
| `created_at` | string (RFC 3339) | When the key was created. |
| `last_used_at` | string (RFC 3339) | When the key last authenticated a request. Omitted if the key has never been used. |
| `is_default` | boolean | `true` for the account's auto-provisioned default key. The default key cannot be revoked. |

Keys are returned ordered by `created_at` descending (newest first).

## Errors

All errors share the envelope `{"error": "<tag>"}`. See [errors.md](../../errors.md)
for the full reference.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid session cookie. Sign in first; the stale cookie (if any) is cleared. |
| `405` | `method_not_allowed` | A verb other than `GET` was sent to `/v1/keys` for a read. |
| `500` | `internal` | Unexpected server-side error while loading keys. |

## Examples

### JavaScript (fetch)

```js
// Runs in the browser against an authenticated console session.
const res = await fetch("https://triport.io/v1/keys", {
  headers: { "Content-Type": "application/json" },
  credentials: "include", // send the nl_session cookie
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(`list keys failed: ${error}`);
}

const { keys } = await res.json();
for (const k of keys) {
  console.log(`${k.name} (${k.key_prefix}) — ${k.status}`);
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportConsole } from "@triport/sdk";

// Console client authenticates with the browser session, not an API key.
const console = new TriportConsole({ baseUrl: "https://triport.io" });

const keys = await console.keys.list();
const active = keys.filter((k) => k.status === "active");
console.log(`${active.length} active key(s)`);
```

### Python (`triport-sdk`)

```python
from triport import ConsoleClient

# Pass the session token captured at sign-in.
client = ConsoleClient(
    base_url="https://triport.io",
    session=os.environ["TRIPORT_SESSION"],
)

for key in client.keys.list():
    print(f"{key.name} ({key.key_prefix}) — {key.status}")
```

## Notes

- **Secrets are write-once.** Only [Create an API key](./create-key.md) ever
  returns the raw value. If you need a fresh secret for an existing key,
  [rotate](./rotate-key.md) it.
- **No pagination.** All of an account's keys are returned in a single response;
  the list is small by design.
- **Default key.** Exactly one key is flagged `is_default`. It is provisioned
  automatically on first sign-in and cannot be revoked — only rotated.
- **Scopes are public aliases.** The values in `scopes` are brand-neutral
  aliases (e.g. `stream.grpc.solana`); these are the same strings you pass when
  creating a key. See [Create an API key](./create-key.md) for the full list.
- **Related:** [Create](./create-key.md) · [Revoke](./revoke-key.md) ·
  [Rotate](./rotate-key.md) · [Per-key endpoints](./key-endpoints.md) ·
  [Usage](./usage.md).
