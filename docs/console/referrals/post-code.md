> Live version: https://triport.io/docs/console/referrals/post-code

# POST /v1/referrals/code — Set custom referral slug

> Create or update the authenticated user's custom referral code (slug).

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/referrals/code` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Console session cookie |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Every account automatically gets a `uid` referral code derived from its user
ID. This endpoint lets a signed-in user pick a friendlier, human-readable
**custom** code (`kind = custom`) to share instead.

The call is an **upsert**: the first request creates the custom code, and any
later request replaces the slug. The submitted value is normalized server-side
(lowercased and trimmed) before validation and storage, so `MyCode` and
`mycode ` both resolve to `mycode`. A user has at most one active custom code;
the existing `uid` code keeps working alongside it.

To remove a custom code, send `DELETE /v1/referrals/code` — the `uid` code
remains active.

This route is part of the user-facing referral console and is protected by the
session cookie set at login. There is no API-key form for it.

## Parameters

### Request body

| Name | Type | Required | Description |
|---|---|---|---|
| `slug` | string | yes | Desired custom code. Normalized to lowercase and trimmed before validation. Must be 3–32 characters, contain only `a-z`, `0-9`, and `-`, and may not start or end with `-`. Reserved words (e.g. `admin`) are rejected. |

## Request

```bash
curl https://triport.io/v1/referrals/code \
  -X POST \
  -H "Content-Type: application/json" \
  --cookie "triport_session=$TRIPORT_SESSION" \
  -d '{"slug": "trip-with-me"}'
```

> The session cookie is set automatically by the console after login. Pass it
> with the request (browsers do this for you); the example shows it explicitly
> for completeness.

## Response

`200 OK`

```json
{
  "code": {
    "ID": "b7c0f2a1-3e4d-4a9b-8c21-9f0e1d2c3b4a",
    "UserID": "8f3d4a2b-1c0e-4f6a-9b2d-5e7c8a1b3d4f",
    "Code": "trip-with-me",
    "Kind": "custom",
    "CreatedAt": "2026-05-29T10:15:00Z",
    "DisabledAt": null
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `code` | object | The created or updated referral code. |
| `code.ID` | string (UUID) | Identifier of the code row. |
| `code.UserID` | string (UUID) | Owner of the code. |
| `code.Code` | string | The normalized slug as stored and shared. |
| `code.Kind` | string | Always `custom` for this endpoint (the other kind is `uid`). |
| `code.CreatedAt` | string (RFC 3339) | When the code was created. |
| `code.DisabledAt` | string (RFC 3339) \| null | `null` while active; set when the code is disabled via `DELETE`. |

## Errors

| Code | `error` value | When it happens |
|---|---|---|
| 400 | `invalid_json` | Request body is missing or not valid JSON. |
| 400 | `slug_invalid` | Slug fails the format rules: wrong length (outside 3–32), disallowed characters, or a leading/trailing `-`. |
| 401 | `unauthenticated` | No valid session cookie. |
| 409 | `slug_reserved` | Slug is on the reserved/blocked list (e.g. `admin`). |
| 409 | `slug_taken` | Slug is already in use by another user. |

All errors use the shared error envelope — see [errors.md](../../errors.md) for
the full shape and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/referrals/code", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // send the session cookie
  body: JSON.stringify({ slug: "trip-with-me" }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(error); // e.g. "slug_taken"
}

const { code } = await res.json();
console.log(code.Code); // "trip-with-me"
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ baseUrl: "https://triport.io" });

const { code } = await client.referrals.setSlug({ slug: "trip-with-me" });
console.log(code.Code, code.Kind); // "trip-with-me" "custom"
```

## Notes

- **Slug rules:** length 3–32, charset `[a-z0-9-]`, no leading or trailing `-`.
  Input is lowercased and trimmed before these checks run, so casing and
  surrounding whitespace never cause a rejection on their own.
- **Idempotent upsert:** repeating the request with the same slug is safe;
  sending a new slug replaces the previous custom code.
- **Removing the slug:** `DELETE /v1/referrals/code` disables the custom code
  (soft delete) and returns `{"ok": true}`; the `uid` code continues to work.
- **Related:** [`GET /v1/referrals/me`](../auth/me.md) returns the current
  `primary_code` and `custom_slug` alongside referral stats.
