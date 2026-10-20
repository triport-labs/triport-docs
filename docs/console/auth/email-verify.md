> Live version: https://triport.io/docs/console/auth/email-verify

# POST /v1/auth/email/verify

> Completes the email one-time-passcode (OTP) login flow: verifies the code, opens an authenticated console session, and returns the signed-in user.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/email/verify` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | None required. On success the response sets the `nl_session` (HttpOnly) and `nl_csrf` (double-submit) session cookies. |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

This is the second step of the email login flow. The caller first requests a
code with [`POST /v1/auth/email/start`](./email-start.md), which returns a
`request_id` and emails a one-time passcode to the address. The user then
submits that `request_id` together with the `code` they received to this
endpoint.

On success the endpoint:

- verifies the code against the pending request and **consumes the OTP**
  (it is single-use — a second verify with the same `request_id` returns
  `invalid_request`);
- creates or updates the user record and the email identity;
- issues a new session and sets the `nl_session` and `nl_csrf` cookies on the
  response;
- returns the authenticated `user` object.

After a successful verify the platform also runs several best-effort
background steps that never block or fail the login: free-subscription
provisioning, generation of the user's primary referral code, and enqueueing of
the welcome email. If a referral-attribution cookie is present on the request
it is consumed and attributed to the new user.

Because this is a browser session flow, no API key or Bearer token is involved.
Send the request with credentials enabled so the `Set-Cookie` headers are
stored; subsequent authenticated calls (such as
[`GET /v1/auth/me`](./me.md)) read the `nl_session` cookie, and mutating
requests must echo the `nl_csrf` cookie value in the `X-CSRF-Token` header.

## Parameters

Request body (JSON):

| Name | Type | Required | Description |
|---|---|---|---|
| `request_id` | string (UUID) | yes | The identifier returned by `POST /v1/auth/email/start`. Must be a valid UUID for an unexpired, not-yet-consumed request. |
| `code` | string | yes | The one-time passcode the user received by email. |

## Request

```bash
curl https://triport.io/v1/auth/email/verify \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "request_id": "8f1d6c2a-0b3e-4a7e-9c11-2d4f6a8b1c3d",
    "code": "123456"
  }'
```

`-c cookies.txt` persists the `nl_session` and `nl_csrf` cookies that the
response sets, so they can be reused on subsequent requests.

## Response

`200 OK`

```json
{
  "user": {
    "id": "3a9b7c10-5e22-4d8f-bb01-7c6e4f2a9d83",
    "email": "dev@example.com",
    "display_name": "dev",
    "created_at": "2026-05-29T12:00:00Z",
    "updated_at": "2026-05-29T12:00:00Z"
  }
}
```

The response also carries two `Set-Cookie` headers:

- `nl_session` — HttpOnly session cookie (sent automatically by the browser on
  later requests).
- `nl_csrf` — readable double-submit token; the frontend reads it and sends it
  back as `X-CSRF-Token` on mutating requests.

### Response fields

| Field | Type | Description |
|---|---|---|
| `user.id` | string (UUID) | Unique user identifier. |
| `user.email` | string | The verified email address. |
| `user.display_name` | string | Display name (derived from the email when not otherwise set). Omitted if empty. |
| `user.avatar_url` | string | Avatar URL. Omitted if empty. |
| `user.billing_customer_id` | string | Billing customer identifier. Omitted if empty. |
| `user.created_at` | string (RFC 3339) | When the user record was created. |
| `user.updated_at` | string (RFC 3339) | When the user record was last updated. |

## Errors

| Code | HTTP status | Meaning | When it happens |
|---|---|---|---|
| `invalid_code` | 400 | The passcode is wrong or malformed. | The submitted `code` does not match the pending request, or fails basic format validation. |
| `invalid_request` | 400 | The request could not be matched. | `request_id` is not a valid UUID, is unknown, expired, or was already consumed. |
| `invalid_json` | 400 | Body could not be parsed. | The request body is not valid JSON. |
| `session_issue_failed` | 500 | The code verified but the session could not be created. | An internal failure while issuing the session after a valid code. |

All error responses use the shared error envelope `{ "error": "<code>" }`.
See [errors.md](../../errors.md) for the full envelope and handling guidance.

## Examples

### JavaScript (fetch)

```js
const res = await fetch('https://triport.io/v1/auth/email/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // store nl_session / nl_csrf cookies
  body: JSON.stringify({
    request_id: requestId, // from /v1/auth/email/start
    code: '123456',
  }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(error); // 'invalid_code' | 'invalid_request' | ...
}

const { user } = await res.json();
console.log('signed in as', user.email);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from '@triport/sdk';

const client = new TriportClient(); // cookie-session based; no API key

const { requestId } = await client.auth.email.start({ email: 'dev@example.com' });

// ...collect the code from the user...

const { user } = await client.auth.email.verify({
  requestId,
  code: '123456',
});
// session cookies are now set on the client
```

## Notes

- **Single-use codes.** Verifying consumes the OTP. A repeated verify with the
  same `request_id` returns `invalid_request`; start a new flow with
  [`POST /v1/auth/email/start`](./email-start.md) to get a fresh code.
- **Cookies, not tokens.** No raw session token is exposed to JavaScript — the
  `nl_session` cookie is HttpOnly. Always send requests with credentials
  included so the browser stores and replays it.
- **CSRF on later calls.** This endpoint itself takes no `X-CSRF-Token`, but the
  `nl_csrf` cookie it sets must be echoed as the `X-CSRF-Token` header on
  subsequent mutating requests.
- **Related:** [`POST /v1/auth/email/start`](./email-start.md),
  [`GET /v1/auth/me`](./me.md), [`POST /v1/auth/logout`](./logout.md).
