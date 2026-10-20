> Live version: https://triport.io/docs/console/auth/me

# GET /v1/auth/me

> Returns the currently authenticated console user, their primary sign-in provider, and their default API key — bootstrapping that key on first login.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/auth/me` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (`nl_session`, HttpOnly) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/auth/me` is the console session-introspection endpoint. Call it after a
login flow completes (email OTP, Google OAuth, or wallet challenge/verify) and on
every app boot to learn who the current user is and to hydrate the dashboard. It
reads the `nl_session` cookie that was set during login — no API key or Bearer
token applies to this route.

On the **first** successful `/me` for a user (or after their default API key has
been rotated/revoked), the endpoint **bootstraps a default API key**: it creates
a `default` key for the account and returns it in the `default_key` object with
the raw secret in `default_key.raw`. **The raw value is shown exactly once** — on
this bootstrap response only. Subsequent `/me` calls return the same key metadata
but omit `raw`, so the client must capture and store it immediately (the frontend
caches it via `setCachedRawKey`).

`/me` also performs **sliding-session refresh**. When the session has less than
half of its TTL remaining, the server extends the session row in the database
**and** re-issues both the `nl_session` and `nl_csrf` cookies with an extended
`Expires`, keeping an active user logged in indefinitely. This happens
transparently as a side effect of the request; the response body is unchanged.

## Parameters

This endpoint takes no path, query, or body parameters. Authentication is carried
by the session cookie.

| Name | In | Required | Description |
|---|---|---|---|
| `nl_session` | cookie | yes | HttpOnly session cookie issued at login. Identifies the user. |

## Request

```bash
curl https://triport.io/v1/auth/me \
  -H "Cookie: nl_session=$NL_SESSION"
```

In a browser the cookie is sent automatically; include credentials on the fetch
(`credentials: 'include'`). Because `/me` is a `GET`, no CSRF token is required.

## Response

`200 OK` — bootstrap response (first login, includes the one-time raw key):

```json
{
  "user": {
    "id": "8f1c3b2a-4d5e-4f6a-9b8c-1d2e3f4a5b6c",
    "email": "dev@example.com",
    "display_name": "Ada Dev",
    "avatar_url": "https://cdn.example.com/avatars/ada.png",
    "created_at": "2026-05-29T10:14:02Z",
    "updated_at": "2026-05-29T10:14:02Z"
  },
  "provider": "google",
  "default_key": {
    "id": "2b9d7e10-5a3c-4e21-8f44-7c6b5a4d3e2f",
    "key_prefix": "trp_live_a1b2",
    "scopes": ["rpc:read", "rpc:write"],
    "is_default": true,
    "raw": "tp_live_XXXXXXXXXXXXXXXXXXXXXXXX",
    "created": true
  }
}
```

`200 OK` — subsequent calls (note `raw` and `created` are absent):

```json
{
  "user": {
    "id": "8f1c3b2a-4d5e-4f6a-9b8c-1d2e3f4a5b6c",
    "email": "dev@example.com",
    "display_name": "Ada Dev",
    "avatar_url": "https://cdn.example.com/avatars/ada.png",
    "created_at": "2026-05-29T10:14:02Z",
    "updated_at": "2026-05-29T10:14:02Z"
  },
  "provider": "google",
  "default_key": {
    "id": "2b9d7e10-5a3c-4e21-8f44-7c6b5a4d3e2f",
    "key_prefix": "trp_live_a1b2",
    "scopes": ["rpc:read", "rpc:write"],
    "is_default": true
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `user.id` | string (UUID) | Stable account identifier. |
| `user.email` | string | Account email. |
| `user.display_name` | string | Display name; omitted if unset. |
| `user.avatar_url` | string | Avatar URL; omitted if unset. |
| `user.created_at` | string (RFC 3339) | Account creation timestamp. |
| `user.updated_at` | string (RFC 3339) | Last account update timestamp. |
| `provider` | string | Primary sign-in provider for the account (e.g. `google`, `email`, `wallet_evm`, `wallet_solana`; `wallet_tron` only for an account created with a Tron wallet before 2026-09-29 — Tron sign-in is no longer accepted). Omitted if none recorded. |
| `default_key` | object | The account's active default API key. Omitted if generation failed transiently (a later `/me` will return it). |
| `default_key.id` | string (UUID) | Key identifier. |
| `default_key.key_prefix` | string | Non-secret display prefix of the key. |
| `default_key.scopes` | string[] | Scopes granted to the default key. |
| `default_key.is_default` | boolean | Always `true` for this object. |
| `default_key.raw` | string | **Bootstrap only.** The full secret key value, shown once. Capture it immediately. Absent on subsequent calls. |
| `default_key.created` | boolean | `true` only when this `/me` call just created the key. Absent otherwise. |

## Errors

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `unauthenticated` | 401 | No valid session | Missing, invalid, or expired `nl_session` cookie. |
| `internal` | 500 | Server error | Session store or user lookup failed. |

The error body follows the shared envelope `{ "error": "<code>" }`. See
[errors.md](../../errors.md) for the full contract.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/auth/me", {
  method: "GET",
  credentials: "include", // send nl_session cookie
});

if (res.status === 401) {
  // not logged in — redirect to login
} else if (res.ok) {
  const me = await res.json();
  if (me.default_key?.raw) {
    // shown once — persist it now
    saveApiKey(me.default_key.raw);
  }
  console.log("Signed in as", me.user.email, "via", me.provider);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole({ baseUrl: "https://triport.io" });

const me = await console.auth.me(); // uses the browser session cookie
if (me.default_key?.raw) {
  storeDefaultKey(me.default_key.raw); // one-time raw value
}
console.log(me.user.email, me.provider);
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

client = ConsoleClient(base_url="https://triport.io")
# Attach the session cookie obtained from a prior login flow.
me = client.auth.me(session_cookie=NL_SESSION)

if me.default_key and me.default_key.raw:
    save_default_key(me.default_key.raw)  # shown once

print(me.user.email, me.provider)
```

## Notes

- **One-time raw key:** `default_key.raw` is only ever present on the bootstrap
  response. If you miss it, rotate the key (`POST /v1/keys/{id}/rotate`) to obtain
  a fresh raw value rather than calling `/me` again.
- **Re-bootstrap:** if the default key is later revoked, the next `/me` creates a
  new default key and again returns its `raw` value once.
- **Sliding session:** cookie refresh only fires when under half the TTL remains,
  so most `/me` calls leave the cookies untouched. The body never reflects refresh.
- **CSRF:** not required for this `GET`. Mutating console routes (e.g.
  `/v1/auth/logout`, `/v1/keys`) require the `nl_csrf` double-submit token.
- **Related:** [POST /v1/auth/logout](./logout.md) to end the session.
