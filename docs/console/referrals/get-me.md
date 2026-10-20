> Live version: https://triport.io/docs/console/referrals/get-me

# GET /v1/referrals/me — Referral overview

> Returns the authenticated user's referral overview: their primary code, tier, commission rate, paid-invitee count, and earnings balance.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/referrals/me` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (`nl_session`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/referrals/me` is the snapshot endpoint for the referral console. It
returns everything needed to render a user's referral dashboard in a single
call: their shareable primary code, an optional custom slug, the tier they have
reached and its human-readable label, the commission rate in basis points, how
many of their invitees have become paying customers, and their current earnings
balance broken into pending / available / lifetime buckets. If the user was
themselves referred by someone, the referrer's display name is included.

Call it once on page load. The endpoint requires a valid session cookie — it is
part of the console surface, not the public RPC surface — and takes no query
parameters. For the detailed reward, invitee, and payout lists, use the
read-side endpoints (`/v1/referrals/rewards`, `/v1/referrals/invitees`,
`/v1/referrals/payouts`).

All monetary fields are integers in **micro-units** (millionths of the account
currency). Divide by 1,000,000 to get the display value.

## Parameters

This endpoint takes no path, query, or body parameters. Authentication is
carried entirely by the session cookie.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | — | — | Session is resolved from the `nl_session` cookie. |

## Request

```bash
curl https://triport.io/v1/referrals/me \
  -H "Content-Type: application/json" \
  --cookie "nl_session=$TRIPORT_SESSION"
```

The session cookie is set by the console login flow (`httpOnly`, `Secure`,
`SameSite=Lax`). Browser clients send it automatically with
`credentials: 'include'`; no `Authorization` header is used on this surface.

## Response

```json
{
  "primary_code": "a1b2c3d4",
  "custom_slug": "ada",
  "tier": 2,
  "tier_label": "Silver",
  "rate_bps": 1500,
  "paid_invitees": 7,
  "balance": {
    "pending_micro": 250000,
    "available_micro": 1750000,
    "lifetime_micro": 4200000
  },
  "inviter_display": "Grace H."
}
```

When the user has no custom slug, `custom_slug` is `null`. When the user was not
referred by anyone, `inviter_display` is `null`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `primary_code` | string | The user's always-available referral code (derived from their account). |
| `custom_slug` | string \| null | User-chosen vanity slug, or `null` if none is set. |
| `tier` | integer | Numeric referral tier the user has reached. |
| `tier_label` | string | Human-readable label for `tier` (e.g. `"Silver"`). |
| `rate_bps` | integer | Commission rate in basis points (1500 = 15%). |
| `paid_invitees` | integer | Count of invitees who have become paying customers. |
| `balance` | object | Earnings balance, in micro-units (see below). |
| `balance.pending_micro` | integer | Earned but not yet unlocked, in micro-units. |
| `balance.available_micro` | integer | Unlocked and available to spend or withdraw, in micro-units. |
| `balance.lifetime_micro` | integer | Total earned across the account's lifetime, in micro-units. |
| `inviter_display` | string \| null | Display name of the user who referred this user, or `null`. |

## Errors

All errors share the standard envelope: `{ "error": "<tag>" }`.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid session cookie was presented (missing, expired, or invalid). |
| `405` | `method_not_allowed` | A non-`GET` method was used on this path. |
| `500` | `internal` | An unexpected server-side error occurred while building the overview. |

See [errors.md](../../errors.md) for the full error envelope and shared
conventions.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/v1/referrals/me", {
  credentials: "include", // sends the nl_session cookie
  headers: { "Content-Type": "application/json" },
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const overview = await res.json();
console.log(overview.primary_code, overview.balance.available_micro);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ baseUrl: "https://triport.io" });

// Console SDK uses the browser session cookie automatically.
const overview = await client.referrals.getOverview();
console.log(overview.tier_label, overview.paidInvitees);
```

## Notes

- **Micro-units:** every `*_micro` field is an integer in millionths. Format for
  display as `value / 1_000_000`.
- **Read-only snapshot:** this endpoint never mutates state. To set or remove a
  custom slug use `POST` / `DELETE` `/v1/referrals/code`.
- **Related endpoints:** detailed lists live at
  [`/v1/referrals/rewards`](./get-rewards.md),
  [`/v1/referrals/invitees`](./get-invitees.md), and
  [`/v1/referrals/payouts`](./get-payouts.md).
- **Auth scope:** this is a console (session-cookie) endpoint, not an API-key
  RPC endpoint. It cannot be called with a `Bearer` API key.
