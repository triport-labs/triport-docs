> Live version: https://triport.io/docs/console/referrals/post-auth-attribute

# POST /v1/auth/attribute — Attribute signup to a referral code

> Best-effort post-login hook that links a freshly signed-in account to the referral code captured in the visitor's `ref_code` cookie.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/attribute` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (set at login) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Call this once, immediately after a successful login or sign-up, to attribute
the new account to whoever referred them. Attribution is **best-effort**: the
endpoint never blocks or fails a login. As long as the session cookie is valid
it returns `200` with a small JSON body telling you whether attribution
happened and, if not, why.

The referral code is **not** sent in the request body — it is read from the
`ref_code` cookie. That cookie is planted by the cookie-pickup middleware
whenever a visitor lands on any page with a `?ref=<code>` query parameter, well
before they authenticate. By the time the user signs in, the code is already
waiting in the cookie, and this call consumes it.

The request body is ignored entirely; send `{}`. Regardless of the outcome
(attributed or not), the `ref_code` cookie is **cleared on the response**, so a
second call for the same user has nothing to consume and reports
`already_attributed` or `no_cookie`. There is no need to retry — call it exactly
once after login.

## Parameters

This endpoint takes no path parameters, query parameters, or meaningful body.

| Name | Type | Required | Description |
|---|---|---|---|
| (request body) | object | no | Ignored. Send an empty object `{}`. |
| `ref_code` cookie | cookie | no | Read server-side. Set automatically by the cookie-pickup middleware from a `?ref=<code>` query param on any page. Not something you set in this request. |

## Request

```bash
curl https://triport.io/v1/auth/attribute \
  -X POST \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  --cookie "session=<your-session-cookie>" \
  -d '{}'
```

> In the browser the session cookie and the `ref_code` cookie are sent
> automatically — use `credentials: 'include'` (see the JavaScript example).

## Response

Attribution succeeded:

```json
{
  "attributed": true
}
```

Attribution did not happen (still `200`):

```json
{
  "attributed": false,
  "reason": "no_cookie"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `attributed` | boolean | `true` if the account was just linked to a referral code; `false` otherwise. |
| `reason` | string | Present only when `attributed` is `false`. Explains why attribution was skipped (see table below). |

#### Non-attribution reasons

| `reason` | Meaning |
|---|---|
| `no_cookie` | No `ref_code` cookie was present, so there was nothing to attribute. |
| `already_attributed` | This account was already linked to a referral code. |
| `self_referral` | The code belongs to the same user — you cannot refer yourself. |
| `identity_overlap` | The new account overlaps in identity with the inviter and was rejected. |
| `ip_cap` | The inviter has reached the per-IP attribution cap. |
| `inviter_disabled` | The inviter's account or code is disabled. |
| `code_not_found` | The cookie held a code that does not exist. |
| `internal` | An internal error occurred; attribution was skipped without failing the login. |

## Errors

The only non-`200` outcome is an invalid session.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid session cookie on the request. |

Every other situation — including missing cookie, rejected attribution, and
internal errors — returns `200` with `attributed: false` and a `reason`. The
`401` body uses the shared error envelope; see [errors.md](../../errors.md) for
the full shape.

## Examples

### JavaScript (fetch)

```js
// Call once right after login. Result is informational only.
const res = await fetch('https://triport.io/v1/auth/attribute', {
  method: 'POST',
  credentials: 'include', // send session + ref_code cookies
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
});

if (res.ok) {
  const { attributed, reason } = await res.json();
  console.log(attributed ? 'referral attributed' : `not attributed: ${reason}`);
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from '@triport/sdk';

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

// Fire-and-forget after login; never throws on non-attribution.
const result = await client.auth.attribute();
if (!result.attributed) {
  console.debug('signup not attributed:', result.reason);
}
```

## Notes

- **Call exactly once after login.** The `ref_code` cookie is cleared on every
  response, so repeated calls cannot re-attribute.
- The body is ignored — there is no need to construct a payload beyond `{}`.
- Treat the result as informational. The frontend logs the outcome and takes no
  user-facing action on `attributed: false`.
- To inspect the referral relationship after attribution, see the referral
  overview at [GET /v1/referrals/me](./get-me.md).
