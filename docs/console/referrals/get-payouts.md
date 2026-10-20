> Live version: https://triport.io/docs/console/referrals/get-payouts

# GET /v1/referrals/payouts — List payout requests

> Returns the authenticated user's referral payout requests, newest first, with pagination.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/referrals/payouts` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (console login) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Lists the payout requests that the signed-in user has submitted against their
referral balance. Each entry tracks a single withdrawal through its lifecycle —
from the moment it is requested until it is sent on-chain (or fails / is
cancelled).

This is a console (dashboard) endpoint, not a public RPC method. It is
authenticated with the browser **session cookie** established at login — there is
no API key or bearer token on this route. Use it to render a user's payout
history table; create new payouts with `POST /v1/referrals/payouts` (see
[create-payout](./post-payouts.md)).

Results are returned as a flat list under `items` and are paginated with
`limit` / `offset`. When the user has no payouts the endpoint returns
`{"items": []}` (never `null`).

## Parameters

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | no | Maximum number of payouts to return. Range `1–200`. Default `50`. |
| `offset` | integer | no | Number of payouts to skip, for pagination. Default `0`. |

## Request

```bash
curl 'https://triport.io/v1/referrals/payouts?limit=50&offset=0' \
  -H "Cookie: $TRIPORT_SESSION" \
  -H "Content-Type: application/json"
```

> This route uses the console session cookie set at login. From a browser the
> cookie is sent automatically (`credentials: "include"`); from a script, pass
> it explicitly as shown.

## Response

```json
{
  "items": [
    {
      "id": "8f1c0a2e-3b4d-4e5f-9a01-2c3d4e5f6a7b",
      "user_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "amount_micro": 25000000,
      "network": "solana",
      "address": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PB5gjB",
      "status": "sent",
      "tx_hash": "3Jb5x...Pn8q",
      "requested_at": "2026-05-20T14:02:11Z",
      "completed_at": "2026-05-21T09:18:44Z"
    },
    {
      "id": "b7d9e1f3-6a82-4c0d-9e1a-7f3b2c4d5e6f",
      "user_id": "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      "amount_micro": 5000000,
      "network": "solana",
      "address": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PB5gjB",
      "status": "requested",
      "requested_at": "2026-05-28T11:47:02Z"
    }
  ]
}
```

### Response fields

Each object in `items` is a `Payout`:

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique payout request identifier. |
| `user_id` | string (UUID) | Owner of the payout (the authenticated user). |
| `amount_micro` | integer | Payout amount in micro-units (1 unit = 1,000,000 micro). |
| `network` | string | Destination network for the withdrawal. |
| `address` | string | Destination address the funds are sent to. |
| `status` | string | Lifecycle state. One of `requested`, `processing`, `sent`, `failed`, `cancelled`. |
| `tx_hash` | string | On-chain transaction hash. Present once sent; omitted otherwise. |
| `note` | string | Optional operator note (e.g. failure reason). Omitted when empty. |
| `requested_at` | string (RFC 3339) | When the payout was requested. |
| `completed_at` | string (RFC 3339) | When the payout reached a terminal state (`sent`/`failed`/`cancelled`). Omitted while still pending. |

#### `status` values

| Value | Meaning |
|---|---|
| `requested` | Submitted, awaiting processing. |
| `processing` | Being prepared / broadcast. |
| `sent` | Completed on-chain; `tx_hash` populated. |
| `failed` | Could not be completed; see `note`. |
| `cancelled` | Voided before completion. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid console session cookie on the request. |
| `500` | `internal` | Unexpected server-side error while listing payouts. |

See [errors.md](../../errors.md) for the full error envelope shape.

## Examples

### JavaScript (fetch)
```js
const res = await fetch(
  "https://triport.io/v1/referrals/payouts?limit=50&offset=0",
  {
    credentials: "include", // send the console session cookie
    headers: { "Content-Type": "application/json" },
  }
);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { items } = await res.json();
console.log(items);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console_ = new TriportConsole(); // session-cookie auth
const { items } = await console_.referrals.listPayouts({
  limit: 50,
  offset: 0,
});
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

console = ConsoleClient()  # session-cookie auth
resp = console.referrals.list_payouts(limit=50, offset=0)
for payout in resp["items"]:
    print(payout["id"], payout["status"], payout["amount_micro"])
```

## Notes

- **Pagination:** page through results by incrementing `offset` by `limit`. A
  returned page shorter than `limit` means you have reached the end. Values
  outside `1–200` for `limit` are clamped to that range; the default page size is
  `50`.
- **Amounts:** `amount_micro` is an integer in micro-units. Divide by
  `1_000_000` for the display value (e.g. `25000000` → `25.00`).
- **Related:** create a payout with `POST /v1/referrals/payouts`
  ([create-payout](./post-payouts.md)); view the underlying balance and tier
  via `GET /v1/referrals/me` ([overview](../../overview.md)).
