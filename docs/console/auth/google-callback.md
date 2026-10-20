> Live version: https://triport.io/docs/console/auth/google-callback

# GET /v1/auth/google/callback

> Browser-facing OAuth callback that completes the Google sign-in dance, issues a console session, and redirects into the app.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/auth/google/callback` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | None on entry; **issues** the `nl_session` + `nl_csrf` cookies on success |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

This endpoint is the **redirect target** of the Google OAuth flow that begins at
[`GET /v1/auth/google/start`](./google-start.md). Google sends the user's
browser here with a `code` and `state` after they approve the consent screen.
You never call it directly or with `fetch` — it is a full-page navigation that
ends in a `302` redirect.

On arrival it:

1. Validates the `state` query parameter against the `nl_google_state` cookie
   (constant-time compare) and confirms the `nl_google_verifier` (PKCE) cookie
   is present. Both short-lived cookies are then cleared regardless of outcome.
2. Exchanges the authorization `code` (plus the PKCE verifier) for an access
   token, then fetches the user's profile. The account's email **must be
   verified** or the flow is rejected.
3. Links or creates the console user, issues a session, and sets the
   `nl_session` (HttpOnly) and `nl_csrf` (double-submit) cookies.
4. Redirects the browser to the configured post-login URL — `/app/chains` by
   default.

Best-effort, non-blocking hooks run during link/create: a free subscription is
ensured for new users, a pending referral attribution (from a referral cookie)
is applied, and a welcome email is dispatched. Failures in these hooks do not
fail the sign-in.

On **any** error the endpoint redirects to `/login?error=google_<tag>` rather
than rendering raw JSON, so the login page can show a localized toast. (The one
exception is when Google sign-in is not configured server-side, which returns a
`503` body — see [Errors](./google-callback.md#errors).)

## Parameters

These are supplied by Google on the redirect; you do not construct them.

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | Authorization code to exchange for a token. |
| `state` | string | yes | Opaque value that must match the `nl_google_state` cookie set at `/start`. |
| `error` | string | no | Present when the user denies consent or Google reports a problem; triggers the failure redirect. |

### Cookies (set earlier by `/v1/auth/google/start`)

| Name | Type | Required | Description |
|---|---|---|---|
| `nl_google_state` | string | yes | CSRF/state guard for the OAuth round-trip. HttpOnly, ~10 min TTL. |
| `nl_google_verifier` | string | yes | PKCE code verifier. HttpOnly, ~10 min TTL. |

## Request

You do not issue this request yourself — the browser is redirected here by
Google. The effective URL looks like:

```bash
# Browser navigation (not a direct API call):
GET https://triport.io/v1/auth/google/callback?code=<auth_code>&state=<state>
# Cookies nl_google_state and nl_google_verifier are sent automatically.
```

## Response

There is no JSON body on the success path. The endpoint replies with a `302
Found` and sets the session cookies:

```http
HTTP/1.1 302 Found
Location: /app/chains
Set-Cookie: nl_session=<opaque>; Path=/; HttpOnly; Secure; SameSite=Lax
Set-Cookie: nl_csrf=<token>; Path=/; Secure; SameSite=Lax
Set-Cookie: nl_google_state=; Path=/v1/auth/google/; Max-Age=-1
Set-Cookie: nl_google_verifier=; Path=/v1/auth/google/; Max-Age=-1
```

On failure it instead replies:

```http
HTTP/1.1 302 Found
Location: /login?error=google_invalid_state
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `Location` (success) | header | Post-login URL, default `/app/chains`. |
| `Location` (failure) | header | `/login?error=google_<tag>`, where `<tag>` identifies the failure. |
| `nl_session` | cookie | HttpOnly session cookie used to authenticate subsequent console calls. |
| `nl_csrf` | cookie | Double-submit CSRF token; echo it as `X-CSRF-Token` on mutating requests. |

## Errors

Most failures are surfaced as a redirect to `/login?error=google_<tag>`, not as
an HTTP error status. The `<tag>` values:

| Redirect tag | Meaning | When it happens |
|---|---|---|
| `google_invalid_request` | Missing `code` or `state` | Query parameters incomplete. |
| `google_invalid_state` | State/PKCE mismatch | `state` doesn't match the cookie, or a state/verifier cookie is missing. |
| `google_exchange_failed` | Token exchange failed | Code-for-token call to the provider errored. |
| `google_userinfo_failed` | Profile fetch failed | Userinfo lookup errored. |
| `google_userinfo_incomplete` | Profile missing fields | No subject id or email returned. |
| `google_email_unverified` | Email not verified | The Google account's email is unverified. |
| `google_session_issue_failed` | Session could not be issued | Backend failed to mint a session. |
| `google_internal` | Internal error | Link/create user failed. |
| `google_<provider error>` | Provider-reported error | Google returned `?error=...` (e.g. user denied consent). |

| HTTP code | Meaning | When it happens |
|---|---|---|
| `503` | `google_disabled` | Google sign-in is not configured on the server. |

See the shared [errors reference](../../errors.md) for the standard error envelope
used elsewhere in the API.

## Examples

This endpoint is reached by browser navigation, so there is no client-side call
to make. The only thing your app initiates is the **start** of the flow, which
redirects the browser to Google and ultimately back to this callback.

### JavaScript (fetch)
```js
// Kick off Google sign-in — a full-page navigation, not fetch().
// The callback below handles the rest and lands the user on /app/chains.
window.location.assign("https://triport.io/v1/auth/google/start");
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { authUrls } from "@triport/sdk";

// Begin the OAuth flow; the callback completes it and sets the session cookie.
window.location.assign(authUrls.googleStart());
```

### Python (`triport-sdk`)
```python
# OAuth is an interactive, browser-only flow. There is no server-side
# equivalent; direct the user's browser to the start URL:
start_url = "https://triport.io/v1/auth/google/start"
print(f"Open this URL to sign in with Google: {start_url}")
```

## Notes

- **Do not call directly.** This is a redirect target for the browser. The
  session is established only when the cookies set here are stored by the
  browser.
- After landing on `/app/chains` (or your configured post-login URL), the
  browser holds a valid `nl_session` cookie. Use it for authenticated console
  calls such as [`GET /v1/auth/me`](./me.md); include the `nl_csrf` value as the
  `X-CSRF-Token` header on mutating requests.
- The `state` and PKCE verifier cookies are scoped to `/v1/auth/google/` and are
  always cleared by the time this endpoint returns.
- Related: [`GET /v1/auth/google/start`](./google-start.md),
  [`GET /v1/auth/me`](./me.md), [`POST /v1/auth/logout`](./logout.md).
