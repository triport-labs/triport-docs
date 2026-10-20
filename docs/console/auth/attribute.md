> Live version: https://triport.io/docs/console/auth/attribute

# POST /v1/auth/attribute

> Attributes the freshly-signed-in console user to the referrer recorded in their `ref_code` cookie — best-effort, always returns 200.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/attribute` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (`nl_session`) + CSRF double-submit (`X-CSRF-Token`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Call this once, immediately after a user completes sign-in, to link their new
account to whoever referred them. The endpoint reads the referral code from the
`ref_code` cookie — set earlier by the landing-page pickup flow when a visitor
arrives with a `?ref=<code>` link — and records the current (logged-in) user as
that referrer's invitee.

The request body is ignored; send `{}`. The user **must** be authenticated: the
endpoint resolves the inviter's invitee from the `nl_session` cookie, so an
unauthenticated request is rejected with `401`.

Attribution is **best-effort**. As long as a valid session is present the
endpoint returns HTTP `200` regardless of whether attribution succeeded — it
never blocks or fails the login. The JSON body tells you the outcome via
`attributed` and an optional `reason`. The `ref_code` cookie is **always
cleared** on every call, whatever the result, so a second call with no fresh
cookie returns `{ "attributed": false, "reason": "no_cookie" }`.

## Parameters

This endpoint takes no path or query parameters. The request body is read but
ignored — send an empty object.

| Name | Type | Required | Description |
|---|---|---|---|
| (body) | object | no | Ignored. Send `{}`. |

State is read from cookies, not parameters:

| Cookie | Required | Description |
|---|---|---|
| `nl_session` | yes | HttpOnly session cookie identifying the logged-in user (the invitee). |
| `nl_csrf` | yes | Double-submit CSRF token; its value must be echoed in the `X-CSRF-Token` header. |
| `ref_code` | no | Referral code captured by the landing-page flow. If absent, attribution short-circuits to `no_cookie`. |

## Request

```bash
curl https://triport.io/v1/auth/attribute \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $NL_CSRF" \
  --cookie "nl_session=$NL_SESSION; nl_csrf=$NL_CSRF; ref_code=$REF_CODE" \
  -d '{}'
```

In a browser the cookies are sent automatically; you only need to attach the
`X-CSRF-Token` header (read from the non-HttpOnly `nl_csrf` cookie).

## Response

Always `HTTP 200` when a valid session is present.

Successful attribution:

```json
{
  "attributed": true
}
```

No attribution (here, because the `ref_code` cookie was missing):

```json
{
  "attributed": false,
  "reason": "no_cookie"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `attributed` | boolean | `true` if the user was linked to a referrer on this call; `false` otherwise. |
| `reason` | string | Present only when `attributed` is `false`. Explains why attribution did not happen — see the table below. |

#### `reason` values

| Value | Meaning |
|---|---|
| `no_cookie` | No `ref_code` cookie was present (or it was empty). |
| `already_attributed` | This user is already attributed to a referrer. |
| `self_referral` | The referral code resolves to the user themselves. |
| `identity_overlap` | The user's identity signals overlap with the referrer's — rejected as fraud-protection. |
| `ip_cap` | The referrer has hit the per-IP attribution cap. |
| `inviter_disabled` | The referring account's referral program is disabled. |
| `code_not_found` | The `ref_code` does not match any referral code. |
| `internal` | An internal error occurred; attribution was skipped but the request still succeeds. |

## Errors

Business outcomes never produce an error status — they are reported as
`attributed: false` with a `reason` (see above). Only request-level failures
return a non-`200` status:

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid `nl_session` cookie. |
| `403` | `csrf_missing` / `csrf_invalid` | The `X-CSRF-Token` header is absent or does not match the `nl_csrf` cookie. |
| `405` | `method_not_allowed` | Any method other than `POST`. |

See the shared [errors reference](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)

```js
function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

const res = await fetch("https://triport.io/v1/auth/attribute", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookie("nl_csrf"),
  },
  body: "{}",
});

const { attributed, reason } = await res.json();
if (!attributed) console.debug("not attributed:", reason);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole(); // uses the browser session + CSRF cookies

const { attributed, reason } = await console.auth.attribute();
if (attributed) {
  console.log("referral attributed");
}
```

### Python (`triport-sdk`)

```python
from triport import ConsoleSession

# Attach the cookies captured during sign-in.
session = ConsoleSession(
    nl_session=NL_SESSION,
    nl_csrf=NL_CSRF,
    ref_code=REF_CODE,
)

result = session.auth.attribute()
print(result.attributed, result.reason)
```

## Notes

- **Call it once, right after sign-in.** Because the `ref_code` cookie is
  cleared on every call, a repeated call returns `no_cookie`.
- **Fire-and-forget.** The endpoint is intentionally non-fatal: treat a
  non-`true` `attributed` value as informational, not as a login failure.
- This route is part of the cookie-session console surface — no API key or
  Bearer token applies. See the [console auth overview](../../streaming/index.md) for the
  shared session and CSRF model, and the related
  [referral endpoints](./me.md).
