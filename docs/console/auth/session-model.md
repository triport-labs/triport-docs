> Live version: https://triport.io/docs/console/auth/session-model

# Session and CSRF model

> How the Triport console authenticates browser requests: an opaque
> HttpOnly session cookie paired with a readable CSRF cookie that the frontend
> echoes back as a header on every state-changing call.

| | |
|---|---|
| **Method / Endpoint** | `n/a — applies to all console auth routes under /v1/auth/*` |
| **Type** | Triport Console API |
| **Network** | — (platform console, not a chain RPC) |
| **Authentication** | Cookie session (`nl_session` HttpOnly) + double-submit CSRF (`nl_csrf`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

The Triport **console** (the dashboard at the browser origin) does not use
API keys or `Bearer` tokens. Those belong to the chain RPC endpoints. Instead,
every console request is authenticated by a pair of cookies that the server
sets at login and the browser sends automatically on subsequent requests.

The two cookies have deliberately different visibility:

- **`nl_session`** — `HttpOnly`. Carries an opaque session token. JavaScript
  can never read it, so an XSS payload on the origin cannot exfiltrate it. The
  server stores only a SHA-256 hash of the token in the database; the raw value
  lives only in this cookie.
- **`nl_csrf`** — readable by JavaScript (not `HttpOnly`). Carries a separate
  random CSRF token. The frontend reads it and copies it into the
  `X-CSRF-Token` request header on every non-`GET` request. The server then
  checks that the header matches the cookie.

This is the classic **double-submit** pattern, and it is layered on top of
`SameSite=Lax`. Use this page to understand why both layers exist, how the
30-day session slides forward on activity, and how the frontend wires the CSRF
header for you so you rarely have to think about it.

## The two cookies

Both cookies are set on a successful login (email OTP, Google OAuth, or wallet
verify) and are scoped to `Path=/`.

| Attribute | `nl_session` | `nl_csrf` |
|---|---|---|
| Purpose | Opaque session token | CSRF double-submit token |
| `HttpOnly` | **yes** — JS cannot read it | **no** — JS reads it to set the header |
| `SameSite` | `Lax` | `Lax` |
| `Secure` | yes on HTTPS, off on plain-HTTP dev | yes on HTTPS, off on plain-HTTP dev |
| `Expires` | login time + 30 days (sliding) | same as the session |
| Value | random session token (256-bit) | random 128-bit token, base64url |

The `Secure` flag is decided per request: it is set when the connection is TLS,
or when an upstream proxy forwards `X-Forwarded-Proto: https`. On a plain
`http://localhost` dev origin it is omitted so the cookies still work.

On **logout** (and on any `401`) the server clears `nl_session` with an expired
cookie, and the frontend store drops the cached user. The session row is also
revoked server-side, so a captured token stops authenticating immediately.

## Why double-submit on top of SameSite=Lax

`SameSite=Lax` already blocks most cross-site `POST` requests from carrying the
session cookie, which defeats the bulk of CSRF. The double-submit check is a
belt-and-suspenders second signal that covers the gaps `Lax` leaves open:

- Top-level navigations to a same-site subdomain, and
- Compromised browser extensions that can issue same-site requests.

The reasoning behind the header check: an attacker on a different origin
**cannot read** the `nl_csrf` cookie (the same-origin policy forbids it), so
they cannot forge a matching `X-CSRF-Token` header. A request that carries the
session cookie but no matching header is rejected.

The check only runs on **state-changing** methods. `GET`, `HEAD`, and
`OPTIONS` are treated as safe and skip the CSRF check entirely — they must not
change server state, so there is nothing to protect.

```
non-safe request ──► RequireSession ──► RequireCSRF
                                          │
                          cookie nl_csrf == header X-CSRF-Token ?
                              │ yes                     │ no
                              ▼                          ▼
                          handler                 403 csrf_invalid
```

The CSRF middleware always runs *after* session resolution — without a session
there is no `nl_csrf` cookie to compare against.

## Sliding-window refresh

The session has a **30-day** lifetime, but it slides forward on use so an
active user is never logged out mid-session.

On each authenticated request the server checks the session's remaining
lifetime. If **less than half the TTL remains** (i.e. under ~15 days to
expiry), it:

1. Touches the `sessions` row in the database, pushing `expires_at` to
   *now + 30 days*, and
2. Re-issues **both** the `nl_session` and `nl_csrf` cookies with the new
   `Expires` so the browser copies stay in lock-step with the database.

Both steps are required. If only the database row were extended, the browser
would still drop the cookie at its original absolute expiry and the server-side
extension would be wasted. Refreshing the cookie too is what makes the window
actually slide.

The half-TTL threshold exists so the server does not issue an `UPDATE` on every
single request (e.g. every poll of `/v1/auth/me`) — it only writes when the
session is genuinely aging. A failed touch does not fail the request: the
session is still valid, and the refresh will be retried on the next call.

## How the frontend wires the CSRF header

You normally never set `X-CSRF-Token` by hand. The console's `pgFetch` helper
does it for you:

- It always sends `credentials: 'include'` so the cookies travel with the
  request (including cross-subdomain to the API host).
- For any method other than `GET`/`HEAD`/`OPTIONS`, it reads the `nl_csrf`
  cookie via `document.cookie` and sets the `X-CSRF-Token` header from it.
- If the response is not OK, it parses the JSON `error` tag and throws it, so
  `csrf_missing` / `csrf_invalid` surface as catchable errors.

```ts
// frontend/src/auth/api.ts (shape)
export async function pgFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrf = readCookie('nl_csrf'); // non-HttpOnly, readable here
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }
  return fetch(apiUrl(path), { credentials: 'include', ...init, headers })
    .then(/* parse JSON, throw error tag on !ok */);
}
```

The session token itself is never held in JavaScript. The auth store keeps only
the non-secret `user` object in `localStorage`; the source of truth for "am I
still logged in?" is a `/v1/auth/me` call on startup, which fails with `401`
once the cookie is gone or revoked.

## Errors

Returned by the CSRF middleware on state-changing requests. See
[errors.md](../../errors.md) for the full response envelope.

| Code | `error` tag | When it happens |
|---|---|---|
| `403` | `csrf_missing` | The `nl_csrf` cookie is absent or empty on a non-safe request. |
| `403` | `csrf_invalid` | The `X-CSRF-Token` header is missing, or does not match the `nl_csrf` cookie. |
| `401` | — | The `nl_session` cookie is absent, invalid, expired, or the session was revoked. The frontend clears local state and routes to login. |

## Examples

### Reading the CSRF cookie and calling a mutating route (fetch)

```js
function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// State-changing call: must send X-CSRF-Token; cookies travel via credentials.
await fetch('https://triport.io/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': readCookie('nl_csrf') ?? '',
  },
});
```

### cURL (manual cookie + header)

```bash
# A GET is "safe" — no CSRF header needed, just the session cookie.
curl https://triport.io/v1/auth/me \
  -H "Cookie: nl_session=$SESSION; nl_csrf=$CSRF"

# A mutating request must echo the CSRF cookie value as the header.
curl -X POST https://triport.io/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Cookie: nl_session=$SESSION; nl_csrf=$CSRF" \
  -H "X-CSRF-Token: $CSRF"
```

## Notes

- These cookies are set by the login flows, not by a separate "issue token"
  call. See the per-route reference pages under this section (email OTP, Google
  OAuth, wallet challenge/verify) for how each one establishes the session, and
  `GET /v1/auth/me` for reading the current user.
- The session cookie is `SameSite=Lax`, so it is sent on top-level navigations
  to the API origin but not on cross-site sub-resource requests — keep the
  console and API on the same registrable domain.
- There is no daily quota or daily-cap header on these routes; rate limiting
  applies to the chain RPC endpoints, not the console auth surface.
- `GET`/`HEAD`/`OPTIONS` are exempt from the CSRF check by design — never rely
  on those methods to change state.
