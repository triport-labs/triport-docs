> Live version: https://triport.io/docs/console/referrals/delete-code

# DELETE /v1/referrals/code — Remove custom referral slug

> Disables your active custom referral slug; your permanent UID-based code keeps working.

| | |
|---|---|
| **Method / Endpoint** | `DELETE /v1/referrals/code` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (console login) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Every account has two kinds of referral code: a permanent **UID** code that is
created automatically and can never be removed, and an optional **custom** slug
that you choose yourself (see [`POST /v1/referrals/code`](./post-code.md)).

This endpoint disables your currently active custom slug. The slug is not hard
deleted — the server stamps it with a `disabled_at` timestamp so existing
links stop attributing new signups, while the historical record is preserved.
Your UID code is untouched and remains active, so referral links built from it
keep working.

Calling this endpoint when you have no active custom slug is a no-op and still
returns success. There is no request body.

## Parameters

This endpoint takes no path params, query params, or request body.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. The active custom slug is resolved from your session. |

## Request

```bash
curl -X DELETE https://triport.io/v1/referrals/code \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

In the console, authentication is carried by the session cookie set at login,
so browser/`fetch` calls send credentials automatically (see the examples
below).

## Response

`200 OK`

```json
{
  "ok": true
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | Always `true` on success. The custom slug is now disabled; the UID code is unaffected. |

## Errors

All errors share the standard envelope `{ "error": "<tag>" }` — see
[errors.md](../../errors.md) for the full contract.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid session — not logged in, or the session cookie is missing/expired. |
| `500` | `internal` | The slug could not be disabled due to a server-side error. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/referrals/code", {
  method: "DELETE",
  credentials: "include", // send the session cookie
});
if (!res.ok) {
  const { error } = await res.json().catch(() => ({}));
  throw new Error(error ?? `HTTP ${res.status}`);
}
const { ok } = await res.json(); // { ok: true }
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { ok } = await client.referrals.deleteCode();
// ok === true — custom slug disabled, UID code still active
```

## Notes

- **Idempotent.** Repeated calls return `{ "ok": true }` even when no custom
  slug is active.
- **The UID code cannot be removed.** This endpoint only affects the custom
  slug; the UID code returned by [`GET /v1/referrals/me`](../../overview.md) stays
  active.
- **Re-enabling.** To set a new custom slug (or re-take one you previously
  disabled, subject to availability), use
  [`POST /v1/referrals/code`](./post-code.md).
