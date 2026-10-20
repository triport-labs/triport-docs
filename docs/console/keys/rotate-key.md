> Live version: https://triport.io/docs/console/keys/rotate-key

# Rotate an API key

> Atomically revokes an existing key and issues a replacement that inherits its name, scopes, rate limit, and default flag — returning the new raw secret exactly once.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/keys/{id}/rotate` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (`nl_session`, HttpOnly) + `X-CSRF-Token` header (double-submit of `nl_csrf`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Rotation replaces a key without changing what it can do. In a single database
transaction the server revokes the old key (identified by `{id}`) and creates a
brand-new key that inherits the old one's `name`, `scopes`, `rate_limit`, and
`is_default` flag. The old key stops authenticating immediately; the new key
takes its place. Use this when a secret may have leaked, on a periodic rotation
schedule, or whenever you want a fresh value without re-creating and
re-configuring a key by hand.

This is a console (dashboard) endpoint, not an RPC endpoint — it uses the same
cookie-session scheme as the rest of `/v1/auth/*` and `/v1/keys`. There is no
API-key or Bearer-token form for calling it. Because rotation mutates state, the
request must carry the `X-CSRF-Token` header whose value matches the `nl_csrf`
cookie set at login.

> **The raw key is shown once.** The `raw` field in the response is the only
> time the full new secret is ever returned — exactly like
> [creating a key](./create-key.md). Every other endpoint (list, this response's
> `new` object on later reads) returns only the 8-character `key_prefix`. Capture
> `raw` and store it securely before the response is discarded; it cannot be
> recovered afterward.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | yes | ID of the key to rotate. Must be a key the authenticated user owns and whose status is `active`. |

### Request body

This endpoint takes no request body. The new key's attributes are inherited from
the old key, not supplied by the caller.

### Cookies & headers

| Name | In | Required | Description |
|---|---|---|---|
| `nl_session` | cookie | yes | HttpOnly session cookie set at login. Identifies the calling user. |
| `nl_csrf` | cookie | yes | Double-submit CSRF cookie (non-HttpOnly) set at login. |
| `X-CSRF-Token` | header | yes | Must equal the `nl_csrf` cookie value. |

## Request

```bash
curl -X POST https://triport.io/v1/keys/3f2c1b9a-5e4d-4c8b-a1f0-9d7e6c5b4a3f/rotate \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $NL_CSRF" \
  --cookie "nl_session=$NL_SESSION; nl_csrf=$NL_CSRF"
```

In the browser the cookies are sent automatically with `credentials: 'include'`;
you only need to attach the `X-CSRF-Token` header (the SDK / `pgFetch` helper
does this for you).

## Response

```json
{
  "old_id": "3f2c1b9a-5e4d-4c8b-a1f0-9d7e6c5b4a3f",
  "new": {
    "id": "8b1d0e7c-2a4f-4d6e-9c3b-1f5a8e2d7c6b",
    "name": "production",
    "key_prefix": "tp_live_",
    "scopes": ["*"],
    "rate_limit": 50,
    "status": "active",
    "created_at": "2026-05-29T10:14:02Z",
    "is_default": true
  },
  "raw": "tp_live_XXXXXXXXXXXXXXXXXXXXXXXX"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `old_id` | string (UUID) | ID of the key that was revoked by this rotation. |
| `new` | object | The newly created key (see fields below). It inherits `name`, `scopes`, `rate_limit`, and `is_default` from the old key. |
| `new.id` | string (UUID) | ID of the new key — different from `old_id`. |
| `new.name` | string | Inherited from the old key. |
| `new.key_prefix` | string | First 8 characters of the new key — the only part visible on subsequent reads. |
| `new.scopes` | array of string | Public scope aliases granted to the key (e.g. `"*"`, `"solana:rpc"`, `"stream.grpc.solana"`). Inherited from the old key. |
| `new.rate_limit` | integer | Per-key rate-limit override; `0` means the tier default applies. Inherited from the old key. |
| `new.status` | string | Status of the new key — `active`. |
| `new.created_at` | string (RFC 3339) | Creation timestamp of the new key. |
| `new.last_used_at` | string (RFC 3339) | Last time the key authenticated a request. Omitted until the key has been used. |
| `new.is_default` | boolean | Whether this is the account's default key. Inherited from the old key. |
| `raw` | string | The full new secret, returned **only** in this response. Store it now — it cannot be retrieved later. |

## Errors

| Code | HTTP status | Meaning | When it happens |
|---|---|---|---|
| `invalid_id` | 400 | The `{id}` segment is missing or not a valid UUID. | The path was malformed (e.g. no key id, or a non-UUID value). |
| `unauthenticated` | 401 | No valid session. | The `nl_session` cookie was missing, expired, or revoked. |
| `csrf_missing` | 403 | CSRF cookie absent. | The `nl_csrf` cookie was not sent. |
| `csrf_invalid` | 403 | CSRF check failed. | The `X-CSRF-Token` header was missing or did not match the `nl_csrf` cookie. |
| `not_found` | 404 | No such key. | The id does not match a key owned by the authenticated user. |
| `key_not_active` | 409 | The old key is not active. | The key has already been revoked (or otherwise is not in `active` status), so there is nothing to rotate. |
| `rotate_conflict` | 409 | Concurrent rotation race. | Two rotations of the same key collided. Rare — re-list the key and retry. |
| `method_not_allowed` | 405 | Wrong HTTP method. | The request used a verb other than `POST`. |

Errors use the shared error envelope `{ "error": "<code>" }`. See
[errors.md](../../errors.md) for the full envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

const keyId = "3f2c1b9a-5e4d-4c8b-a1f0-9d7e6c5b4a3f";

const res = await fetch(`https://triport.io/v1/keys/${keyId}/rotate`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookie("nl_csrf") ?? "",
  },
});

const { old_id, new: newKey, raw } = await res.json();
// `raw` is shown once — persist it now.
console.log(`Rotated ${old_id} -> ${newKey.id}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole({ baseUrl: "https://triport.io" });

// Returns { oldId, key, raw }. `raw` is only available on this call.
const { oldId, key, raw } = await console.keys.rotate(
  "3f2c1b9a-5e4d-4c8b-a1f0-9d7e6c5b4a3f",
);

saveSecret(raw); // store before it is lost
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

console = ConsoleClient(base_url="https://triport.io")

# Session cookie + CSRF are managed by the client.
result = console.keys.rotate("3f2c1b9a-5e4d-4c8b-a1f0-9d7e6c5b4a3f")

print("old:", result.old_id, "new:", result.new.id)
save_secret(result.raw)  # raw is returned only once
```

## Notes

- **Inheritance, not configuration.** Rotation copies `name`, `scopes`,
  `rate_limit`, and `is_default` from the old key. To change any of those,
  rotate first and then edit the new key (or create a fresh key with
  [create-key](./create-key.md)).
- **The old key dies immediately.** Revocation and creation happen in one
  transaction, so there is no overlap window where both keys authenticate.
  Deploy the new `raw` value to your clients as part of the rotation, not before.
- **Default key is preserved.** Rotating the account's default key produces a new
  key that is still the default — no separate step is needed to keep it default.
- **Idempotency / retries.** Rotation is not idempotent: each successful call
  mints a new secret and revokes the previous one. A `rotate_conflict` (409)
  means a concurrent rotation won the race — re-list the key with
  [list-keys](./list-keys.md) and retry against the current active key rather
  than blindly re-sending.
- Related: [create-key](./create-key.md), [list-keys](./list-keys.md),
  [revoke-key](./revoke-key.md), and the
  [session model](../auth/session-model.md).
