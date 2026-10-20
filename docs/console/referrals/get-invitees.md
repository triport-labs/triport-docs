> Live version: https://triport.io/docs/console/referrals/get-invitees

# GET /v1/referrals/invitees — List referred users

> Returns the users who signed up under your referral code, with how much each has paid.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/referrals/invitees` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Console session cookie (sent automatically by the browser) |
| **Required scope** | — |
| **Tier / rate limit** | Console tier (standard per-session RPS with burst) |

## Description

Lists the accounts that registered through your referral code. This is a
read-side, console-only endpoint backing the **Invitees** table in the
referral dashboard — use it to see who you've referred and how much revenue
each of them has driven.

Each row identifies one invitee by their account `user_id`, their public
`display_name`, the time they signed up under your code (`signed_at`), and the
lifetime amount they have paid in micro-units (`total_paid_micro`). For privacy,
**no email or other PII is returned** — only the public display name.

Results are returned newest-relevant first and are paginated with `limit` and
`offset`. There is no total-count field; request successive pages until you
receive fewer than `limit` rows.

## Parameters

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | no | Max rows to return. Valid range `1`–`200`. Defaults to `50`. Values outside the range are ignored and the default is used. |
| `offset` | integer | no | Number of rows to skip, for pagination. Must be `>= 0`. Defaults to `0`. |

## Request

```bash
curl "https://triport.io/v1/referrals/invitees?limit=50&offset=0" \
  -H "Content-Type: application/json" \
  --cookie "$TRIPORT_SESSION_COOKIE"
```

> This endpoint is authenticated by the console session cookie established at
> login. In the browser the cookie is sent automatically; from the command line,
> pass it explicitly as shown.

## Response

```json
{
  "items": [
    {
      "user_id": "8f1c2e44-9b7a-4d2e-bc3f-0a1b2c3d4e5f",
      "display_name": "alice.sol",
      "signed_at": "2026-05-12T09:31:07Z",
      "total_paid_micro": 4250000
    },
    {
      "user_id": "12ab34cd-56ef-78ab-90cd-1234567890ab",
      "display_name": "bob",
      "signed_at": "2026-05-03T18:02:44Z",
      "total_paid_micro": 0
    }
  ]
}
```

When you have no invitees, `items` is an empty array (`{"items": []}`), never
`null`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `items` | array | List of invitee rows. Empty array when there are none. |
| `items[].user_id` | string (UUID) | The invitee's account identifier. |
| `items[].display_name` | string | The invitee's public display name. |
| `items[].signed_at` | string (RFC 3339 timestamp) | When the invitee signed up under your referral code. |
| `items[].total_paid_micro` | integer | Lifetime amount the invitee has paid, in micro-units (1,000,000 = 1 unit). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid console session cookie was presented. |
| `500` | `internal` | An unexpected server-side error occurred while loading invitees. |

Errors use the shared error envelope `{ "error": "<tag>" }`. See
[errors.md](../../errors.md) for the full envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch(
  "https://triport.io/v1/referrals/invitees?limit=50&offset=0",
  {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  }
);
if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
const { items } = await res.json();
console.log(`${items.length} invitees`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient(); // uses the active console session
const { items } = await client.referrals.listInvitees({ limit: 50, offset: 0 });

for (const row of items) {
  console.log(row.display_name, row.total_paid_micro);
}
```

## Notes

- **Pagination:** there is no total count. Keep increasing `offset` by `limit`
  until a page returns fewer than `limit` rows.
- **Micro-units:** divide `total_paid_micro` by 1,000,000 to display a
  human-readable amount.
- **No PII:** email and other personal data are intentionally excluded; only
  `display_name` is exposed.
- **Related endpoints:** [`GET /v1/referrals/me`](./get-me.md) for your referral
  overview and balance, and [`GET /v1/referrals/rewards`](./get-rewards.md) for
  the per-payment reward ledger.
