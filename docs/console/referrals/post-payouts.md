> Live version: https://triport.io/docs/console/referrals/post-payouts

# POST /v1/referrals/payouts — Request a referral payout

> Submits a request to pay out your available referral balance to an on-chain address; the request is created in `requested` status and settled asynchronously by operators.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/referrals/payouts` |
| **Type** | Triport Console API |
| **Network** | — (the destination chain is chosen via the `network` body field) |
| **Authentication** | Session cookie (set at login) — send it with the request |
| **Required scope** | — (any authenticated console session) |
| **Tier / rate limit** | Console session limits apply |

## Description

Use this endpoint to cash out your accrued referral earnings. You specify an
amount (in micro-units), a destination `network`, and a payout `address`. The
server checks the request against your **available** balance — the funds that
have unlocked and are not already reserved by a pending payout — and against the
minimum payout threshold. If the request passes, a `Payout` record is created in
`requested` status and returned with `202 Accepted`.

Payouts are **not** settled inline. An operator processes the request
out-of-band, moving it through `processing` → `sent` (or `failed`). Poll
[`GET /v1/referrals/payouts`](./get-payouts.md) to track the lifecycle, or read
your current balance from [`GET /v1/referrals/me`](./get-me.md).

The amount you can request is bounded server-side by your available balance —
the caller cannot exceed it. A request larger than what is available is rejected
with `balance_insufficient`; a request below the minimum is rejected with
`payout_below_min`.

## Parameters

This endpoint takes a JSON request body. There are no path or query parameters.

### Request body

| Name | Type | Required | Description |
|---|---|---|---|
| `amount_micro` | integer (int64) | yes | Amount to pay out, in micro-units (1,000,000 micro = 1.00). Must be ≥ the minimum payout and ≤ your available balance. |
| `network` | string | yes | Destination chain for the payout (e.g. `solana`, `ethereum`, `polygon`). |
| `address` | string | yes | Destination wallet address, valid for `network`. Validated server-side. |

> The request body is capped at 4 KiB; larger bodies are rejected.

## Request

```bash
curl -X POST https://triport.io/v1/referrals/payouts \
  -H "Content-Type: application/json" \
  --cookie "triport_session=$TRIPORT_SESSION" \
  -d '{
    "amount_micro": 25000000,
    "network": "solana",
    "address": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"
  }'
```

## Response

`202 Accepted` with the newly created `Payout`:

```json
{
  "id": "5f0d2a6e-1c3b-4a9d-8f2e-7b6c5d4e3a21",
  "user_id": "a1b2c3d4-e5f6-4789-9abc-def012345678",
  "amount_micro": 25000000,
  "network": "solana",
  "address": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  "status": "requested",
  "requested_at": "2026-05-29T14:02:11Z"
}
```

`tx_hash`, `note`, and `completed_at` are omitted until the payout is processed.

### Response fields

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique payout identifier. |
| `user_id` | string (UUID) | The requesting user. |
| `amount_micro` | integer (int64) | Requested amount, in micro-units. |
| `network` | string | Destination chain. |
| `address` | string | Destination wallet address. |
| `status` | string | Lifecycle status — one of `requested`, `processing`, `sent`, `failed`, `cancelled`. New requests start at `requested`. |
| `tx_hash` | string | On-chain transaction hash. Present once the payout has been sent. |
| `note` | string | Operator note (e.g. failure reason). Present when set. |
| `requested_at` | string (RFC 3339) | When the request was created. |
| `completed_at` | string (RFC 3339) \| null | When the payout reached a terminal state. Null/omitted while in flight. |

## Errors

Errors use the shared envelope `{ "error": "<tag>" }`. See [errors.md](../../errors.md)
for the full envelope.

| Code | Error tag | When it happens |
|---|---|---|
| 400 | `payout_below_min` | `amount_micro` is below the minimum payout threshold. |
| 400 | `payout_address_invalid` | `address` is not valid for the given `network`. |
| 400 | `balance_insufficient` | `amount_micro` exceeds your available balance. |
| 400 | `invalid_args` | A field is missing or malformed (e.g. non-positive amount, empty network). |
| 400 | `invalid_json` | The request body is not valid JSON or exceeds the 4 KiB limit. |
| 401 | `unauthenticated` | No valid console session on the request. |
| 500 | `internal` | Unexpected server error. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/referrals/payouts", {
  method: "POST",
  credentials: "include", // sends the console session cookie
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount_micro: 25_000_000,
    network: "solana",
    address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(`payout failed: ${error}`);
}

const payout = await res.json();
console.log(payout.id, payout.status); // "...", "requested"
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient(); // uses the browser session cookie

const payout = await client.referrals.createPayout({
  amountMicro: 25_000_000,
  network: "solana",
  address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
});

console.log(payout.status); // "requested"
```

## Notes

- **Asynchronous settlement.** A `202` means the request was accepted, not that
  funds have moved. Track progress with
  [`GET /v1/referrals/payouts`](./get-payouts.md).
- **Server-bounded amount.** The available balance is computed server-side from
  your unlocked rewards; you cannot request more than is available. Read it via
  [`GET /v1/referrals/me`](./get-me.md) (`balance.available_micro`).
- **Micro-units.** Amounts are integers in micro-units: `25000000` = 25.00.
- **Related:** [`GET /v1/referrals/payouts`](./get-payouts.md) (list payouts),
  [`POST /v1/referrals/spend-on-invoice`](./post-spend-on-invoice.md) (apply
  balance to an invoice instead of cashing out).
