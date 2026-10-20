> Live version: https://triport.io/docs/console/referrals/get-rewards

# GET /v1/referrals/rewards — List referral rewards

> Lists the calling user's referral rewards — one row per qualifying payment event — with optional status filtering and pagination.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/referrals/rewards` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (Console login) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Returns the referral rewards that belong to the authenticated user. Each reward
is a snapshot of a single qualifying payment made by one of your invitees: the
`rate_bps` and `tier` are frozen at the moment the reward is created and are
**not** recalculated if your tier later changes.

Use this endpoint to render the rewards ledger in the Console — the detailed
breakdown behind the aggregate balance shown by
[`GET /v1/referrals/me`](./get-me.md). Filter by `status` to drive views
such as "pending unlock", "available to spend", or "paid out".

This route is authenticated by the Console **session cookie**, not by an API
key — it is a first-party Console endpoint and requests must be sent with
credentials included. There is no bearer token or scope on this route.

## Parameters

All parameters are query-string parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | no | Comma-separated list of reward statuses to include. Allowed values: `pending`, `available`, `spent`, `paid_out`, `reversed`. Unknown values are passed through and simply match nothing. Omit to return all statuses. |
| `limit` | integer | no | Maximum number of rows to return. Valid range `1`–`200`. Defaults to `50`; values outside the range (or non-numeric) are ignored and the default is used. |
| `offset` | integer | no | Number of rows to skip, for pagination. Must be `>= 0`. Defaults to `0`; invalid values are ignored and the default is used. |

## Request

```bash
curl "https://triport.io/v1/referrals/rewards?status=pending,available&limit=50&offset=0" \
  -H "Content-Type: application/json" \
  --cookie "$TRIPORT_SESSION"
```

> This is a session-cookie route. `$TRIPORT_SESSION` is the Console session
> cookie set at login; browsers send it automatically when the request is made
> with credentials included.

## Response

`200 OK`

```json
{
  "items": [
    {
      "id": "a1f3c9d2-7b04-4e91-8c5a-1d2e3f4a5b6c",
      "beneficiary_id": "0c8e1b22-3a44-4f5d-9e6f-7a8b9c0d1e2f",
      "source_user_id": "5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f",
      "source_event_id": "billing:inv_4821",
      "rate_bps": 1500,
      "tier": 2,
      "amount_micro": 4500000,
      "status": "pending",
      "unlock_at": "2026-06-12T00:00:00Z",
      "payout_id": null,
      "created_at": "2026-05-13T09:41:22Z",
      "updated_at": "2026-05-13T09:41:22Z"
    }
  ]
}
```

When the user has no matching rewards, `items` is an empty array (`[]`), never
`null`.

### Response fields

The top-level object has a single field:

| Field | Type | Description |
|---|---|---|
| `items` | array | List of reward objects (see below). Empty array if none match. |

Each element of `items` is a `Reward`:

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique identifier of the reward. |
| `beneficiary_id` | string (UUID) | The user who earns the reward — the authenticated caller. |
| `source_user_id` | string (UUID) | The invitee whose payment generated this reward. |
| `source_event_id` | string | Globally unique source payment-event identifier, formatted `<source>:<id>`. |
| `rate_bps` | integer | Referral rate applied, in basis points, frozen at reward-creation time. |
| `tier` | integer | Referral tier in effect when the reward was created. |
| `amount_micro` | integer | Reward amount in micro-units (1,000,000 micro = 1 unit). |
| `status` | string | One of `pending`, `available`, `spent`, `paid_out`, `reversed`. |
| `unlock_at` | string (RFC 3339) | Timestamp at which a `pending` reward becomes `available`. |
| `payout_id` | string (UUID) \| null | Identifier of the payout this reward was included in, or `null` if not yet paid out. |
| `created_at` | string (RFC 3339) | When the reward was created. |
| `updated_at` | string (RFC 3339) | When the reward was last modified. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid Console session cookie was supplied. |
| `500` | `internal` | An unexpected server-side error occurred while listing rewards. |

Errors use the shared error envelope: `{ "error": "<code>" }`. See
[errors.md](../../errors.md) for the full envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
const params = new URLSearchParams({
  status: "pending,available",
  limit: "50",
  offset: "0",
});

const res = await fetch(
  `https://triport.io/v1/referrals/rewards?${params}`,
  { credentials: "include" } // send the Console session cookie
);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { items } = await res.json();
console.log(`${items.length} rewards`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ baseUrl: "https://triport.io" });

const { items } = await client.referrals.listRewards({
  status: ["pending", "available"],
  limit: 50,
  offset: 0,
});

for (const reward of items) {
  console.log(reward.id, reward.status, reward.amount_micro);
}
```

## Notes

* **Pagination.** Page through results with `limit` and `offset`. The response
  contains only `items` (no total count) — when a page returns fewer than
  `limit` rows, you have reached the end.
* **Amounts are micro-units.** Divide `amount_micro` by 1,000,000 to get the
  display value.
* **Frozen snapshot.** `rate_bps` and `tier` reflect the values in effect when
  the reward was created and do not change retroactively.
* **Related endpoints:** [`GET /v1/referrals/me`](./get-me.md) for the
  aggregate balance, [`GET /v1/referrals/invitees`](./get-invitees.md) for the
  invitee list, and [`GET /v1/referrals/payouts`](./get-payouts.md) for payout
  history.
