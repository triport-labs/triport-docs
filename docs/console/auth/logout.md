> Live version: https://triport.io/docs/console/auth/logout

# POST /v1/auth/logout

> Revokes the current console session and clears the `nl_session` cookie.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/logout` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (`nl_session`, HttpOnly) + `X-CSRF-Token` header (double-submit of `nl_csrf`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Ends the caller's console session. The server looks up the session row by the
token carried in the `nl_session` cookie, marks it revoked in the database, and
then instructs the browser to clear the `nl_session` cookie. On success the
response body is simply `{ "ok": true }`.

This is a console (dashboard) endpoint, not an RPC endpoint — it uses the same
cookie-session scheme as the rest of `/v1/auth/*`. There is no API-key or
Bearer-token form. Because logout is a mutating request, it requires the
`X-CSRF-Token` header whose value must match the `nl_csrf` cookie that was set
at login.

The call is **idempotent**: if the session token is already revoked, expired, or
simply absent, the server still returns `{ "ok": true }` and clears the cookie.

> **Retry on failure.** If the database revoke fails, the endpoint returns
> `500 logout_failed` and **does not** clear the `nl_session` cookie. This is
> deliberate — clearing the cookie while the session row is still valid
> (`revoked_at IS NULL`) would leave a dangling, still-authenticating session
> behind. The client must retry until it receives a success response.

## Parameters

This endpoint takes no path params, query params, or request body. The caller is
identified entirely by the request cookies and CSRF header.

| Name | In | Required | Description |
|---|---|---|---|
| `nl_session` | cookie | yes | HttpOnly session cookie set at login. Identifies the session to revoke. |
| `nl_csrf` | cookie | yes | Double-submit CSRF cookie (non-HttpOnly) set at login. |
| `X-CSRF-Token` | header | yes | Must equal the `nl_csrf` cookie value. |

## Request

```bash
curl -X POST https://triport.io/v1/auth/logout \
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
  "ok": true
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | Always `true` on success. The `nl_session` cookie is cleared via `Set-Cookie` on the same response. |

## Errors

| Code | HTTP status | Meaning | When it happens |
|---|---|---|---|
| `logout_failed` | 500 | The session revoke did not complete. | A transient database error while revoking the session row. The cookie is **not** cleared — retry the request. |
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

await fetch("https://triport.io/v1/auth/logout", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookie("nl_csrf") ?? "",
  },
});
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole({ baseUrl: "https://triport.io" });

// Revokes the active session and clears the session cookie.
await console.auth.logout();
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

console = ConsoleClient(base_url="https://triport.io")

# Session cookie + CSRF are managed by the client.
console.auth.logout()
```

## Notes

- **Best-effort on the client, exact on the server.** Frontends often clear local
  auth state regardless of the network outcome, but the *session row* is only
  invalidated once this endpoint returns success — so keep retrying after a
  `logout_failed` to avoid leaving a usable session behind.
- **Idempotent.** Calling logout twice, or after the session has already expired,
  is safe and returns `{ "ok": true }`.
- Related: [me.md](./me.md) (inspect the current session) and the
  [authentication overview](../../streaming/index.md).
