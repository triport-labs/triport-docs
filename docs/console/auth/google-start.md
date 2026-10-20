> Live version: https://triport.io/docs/console/auth/google-start

# GET /v1/auth/google/start

> Begins the Google OAuth sign-in flow by redirecting the browser to Google's consent screen.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/auth/google/start` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | None (this endpoint *starts* a session; it does not require one) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

This endpoint is the entry point of the console's Google OAuth login flow. It is
not a JSON API — it is a **full-page navigation** target. The browser is meant to
land here directly (via `window.location.assign`), and the server responds with a
`302 Found` redirect to Google's OAuth consent screen.

Before redirecting, the server generates a random CSRF `state` value and a PKCE
code verifier, stores both in short-lived `HttpOnly` cookies, and builds the
Google authorization URL with a PKCE `S256` challenge and the `openid email
profile` scopes. Google then sends the user back to
[`GET /v1/auth/google/callback`](./google-callback.md), which validates the
`state`, exchanges the authorization code, and issues the `nl_session` /
`nl_csrf` cookies.

Because this is a browser redirect and not an XHR/fetch call, **do not** call it
with `fetch` expecting a JSON body — point the top-level window at it instead.
If Google OAuth is not configured on the server, the endpoint redirects to
`/login?error=google_disabled` rather than returning an error body, so the user
never sees raw JSON.

## Parameters

This endpoint takes **no path params, query params, or request body.**

## Request

```bash
# This is a browser navigation, not an API call. Shown here with -i so you can
# inspect the 302 and the Set-Cookie headers; -L would follow it to Google.
curl -i https://triport.io/v1/auth/google/start
```

In the frontend the flow is triggered by navigating the window:

```js
window.location.assign('https://triport.io/v1/auth/google/start');
```

## Response

On success the server returns a `302 Found` to the Google consent screen and
sets two short-lived cookies:

```http
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&scope=openid+email+profile&state=...&code_challenge=...&code_challenge_method=S256&access_type=online&prompt=select_account
Set-Cookie: nl_google_state=<random>; Path=/v1/auth/google/; Max-Age=600; HttpOnly; Secure; SameSite=Lax
Set-Cookie: nl_google_verifier=<random>; Path=/v1/auth/google/; Max-Age=600; HttpOnly; Secure; SameSite=Lax
```

When Google OAuth is not configured server-side, the response redirects to the
login page instead — no cookies are set:

```http
HTTP/1.1 302 Found
Location: /login?error=google_disabled
```

### Response fields

There is no response body. The meaningful output is the `Location` header and
the two `Set-Cookie` headers.

| Item | Description |
|---|---|
| `Location` | The Google consent URL (or `/login?error=google_disabled` when OAuth is unconfigured). |
| `nl_google_state` cookie | Random CSRF `state` echoed back by Google and re-checked at the callback. `HttpOnly`, `Secure` over HTTPS, `SameSite=Lax`, scoped to `Path=/v1/auth/google/`, TTL 10 minutes. |
| `nl_google_verifier` cookie | PKCE code verifier; its `S256` challenge is sent to Google and the verifier is replayed during the token exchange. Same attributes and TTL as above. |

The Google authorization URL carries these fixed query parameters: `response_type=code`,
`scope=openid email profile`, `code_challenge_method=S256`, `access_type=online`,
and `prompt=select_account`.

## Errors

This endpoint never returns a JSON error envelope — every outcome is a redirect.

| Outcome | Status | Where it redirects | When it happens |
|---|---|---|---|
| OAuth started | `302` | `https://accounts.google.com/o/oauth2/v2/auth?...` | Normal case: Google OAuth is configured. |
| OAuth disabled | `302` | `/login?error=google_disabled` | The server has no Google client ID / secret / redirect URL configured. |
| Random generation failed | `500` | — (JSON `{"error":"internal"}`) | Rare: the server could not generate the `state` / verifier. See [errors.md](../../errors.md) for the envelope. |

The frontend reads the `?error=google_*` query parameter on `/login` and shows a
toast via the `auth.google.disabled` i18n key; downstream callback failures arrive
as `?error=google_<tag>` (e.g. `google_invalid_state`, `google_exchange_failed`).

## Examples

### JavaScript (fetch)
```js
// Do NOT fetch() this endpoint — it is a redirect, not a JSON API.
// Trigger the OAuth flow by navigating the top-level window:
function signInWithGoogle() {
  window.location.assign('https://triport.io/v1/auth/google/start');
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { authUrl } from '@triport/sdk';

// The SDK exposes the start URL; the actual redirect must happen in the browser.
window.location.assign(authUrl('/v1/auth/google/start'));
```

### Python (`triport-sdk`)
```python
# Google OAuth login is an interactive browser flow and cannot be completed
# from a headless server-side client. Open the start URL in a browser instead:
import webbrowser

webbrowser.open("https://triport.io/v1/auth/google/start")
```

## Notes

- The `nl_google_state` and `nl_google_verifier` cookies are scoped to
  `Path=/v1/auth/google/`, so they are only sent on the `/start` and `/callback`
  requests — they are cleared as soon as the callback consumes them, regardless
  of outcome, and expire on their own after 10 minutes.
- These are distinct from the long-lived session cookies (`nl_session` +
  `nl_csrf`) that are issued only after a successful callback. See the
  [authentication overview](../../overview.md) for how the session cookies work.
- Related: [`GET /v1/auth/google/callback`](./google-callback.md) completes the
  flow; [`POST /v1/auth/email/start`](./email-start.md) and the wallet
  challenge/verify endpoints are the other ways to begin a console session.
