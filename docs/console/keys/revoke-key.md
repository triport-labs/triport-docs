> Live version: https://triport.io/docs/console/keys/revoke-key

# Revoke an API key

> Permanently disables one of your API keys so it can no longer authenticate requests.

| | |
|---|---|
| **Method / Endpoint** | `DELETE /v1/keys/{id}` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Console session cookie (`nl_session`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Revokes the API key identified by `{id}`. Once revoked, the key is moved out of
the `active` status and any further request that presents it will be rejected.
This is a **console** endpoint: it manages the keys on your account and is
authenticated by your logged-in dashboard session, not by an API key itself.

The operation is **idempotent**. Revoking a key that has already been revoked
returns the same `{"ok": true}` body and a `200` status — there is no error for
a repeat call, so client retries are always safe.

Two keys you cannot revoke:

- The **default key** for your account. Attempting it returns `409
  cannot_revoke_default`. Promote another key to default (or rotate the default
  in place — see [Rotate an API key](./rotate-key.md)) before retiring it.
- A key that does **not belong to your account**. The lookup is scoped to the
  session user, so any other user's key id resolves to `404 not_found` rather
  than leaking its existence.

Revoking is irreversible — you cannot un-revoke a key. If you need a fresh
credential while keeping the same name, scopes, and rate limit, use
[Rotate an API key](./rotate-key.md) instead, which atomically revokes the old
key and issues a new one.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | yes | The key's id, as returned by [List API keys](./list-keys.md) or [Create an API key](./create-key.md). Must be a valid UUID; a malformed or missing id returns `400 invalid_id`. |

This endpoint takes no query parameters and no request body.

## Request

```bash
curl -X DELETE https://triport.io/v1/keys/3f8a1c2e-9b4d-4e7a-bb31-2d6f0a9c1e44 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TRIPORT_CSRF" \
  --cookie "nl_session=$TRIPORT_SESSION; nl_csrf=$TRIPORT_CSRF"
```

The `nl_session` cookie is set automatically by your browser after you sign in
to the console. Because `DELETE` is a state-changing method, it is also CSRF
protected with a double-submit token: the `nl_csrf` cookie value must be echoed
back in the `X-CSRF-Token` header. The console does this for you; only scripted
callers outside the browser need to forward both explicitly.

## Response

```json
{
  "ok": true
}
```

A `200` with this body is returned both when the key is revoked for the first
time and when it was already revoked.

### Response fields

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | Always `true` on success. |

## Errors

All errors use the shared envelope `{"error": {"code": "<code>"}}` — see
[Errors](../../errors.md) for the full structure.

| Code | HTTP status | Meaning | When it happens |
|---|---|---|---|
| `unauthenticated` | 401 | No valid session | The `nl_session` cookie is missing, expired, or invalid. |
| `csrf_missing` | 403 | No CSRF token | The `nl_csrf` cookie was not sent on this mutating request. |
| `csrf_invalid` | 403 | CSRF mismatch | The `X-CSRF-Token` header is absent or does not match the `nl_csrf` cookie. |
| `invalid_id` | 400 | Malformed key id | `{id}` is empty, contains a `/`, or is not a valid UUID. |
| `not_found` | 404 | No such key | The key does not exist or does not belong to the session user. |
| `cannot_revoke_default` | 409 | Default key is protected | The target key is the account's active default and cannot be revoked. |
| `method_not_allowed` | 405 | Wrong HTTP method | The path was called with a method other than `DELETE`. |
| `internal` | 500 | Server error | An unexpected error occurred while looking up or revoking the key. |

## Examples

### JavaScript (fetch)
```js
const id = "3f8a1c2e-9b4d-4e7a-bb31-2d6f0a9c1e44";

const res = await fetch(`https://triport.io/v1/keys/${id}`, {
  method: "DELETE",
  credentials: "include", // send the nl_session + nl_csrf cookies
  headers: { "X-CSRF-Token": csrfToken }, // echo the nl_csrf cookie value
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(`revoke failed: ${error.code}`);
}

const { ok } = await res.json(); // { ok: true }
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole(); // uses the browser session cookie

await console.keys.revoke("3f8a1c2e-9b4d-4e7a-bb31-2d6f0a9c1e44");
// resolves to { ok: true }; resolves the same way on a repeat call
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

console = ConsoleClient(session=os.environ["TRIPORT_SESSION"])

result = console.keys.revoke("3f8a1c2e-9b4d-4e7a-bb31-2d6f0a9c1e44")
print(result["ok"])  # True
```

## Notes

- **CSRF:** as a mutating route, this endpoint enforces the CSRF double-submit
  token — send the `nl_csrf` cookie value in the `X-CSRF-Token` header.
  In-browser console calls satisfy this automatically.
- **Idempotency:** safe to retry; a second revoke of the same id returns
  `{"ok": true}`, never `404`.
- **No undo:** there is no endpoint to restore a revoked key. To keep a key's
  name, scopes, and rate limit while replacing the secret, use
  [Rotate an API key](./rotate-key.md).
- **Default key:** clear `400`/`409` distinctions let scripts tell apart "bad
  id" from "this key is protected." See [List API keys](./list-keys.md) to find
  which key has `"is_default": true`.
- **Related:** [Create an API key](./create-key.md) ·
  [List API keys](./list-keys.md) · [Rotate an API key](./rotate-key.md) ·
  [Errors](../../errors.md)
