> Live version: https://triport.io/docs/console/referrals/post-spend-on-invoice

# POST /v1/referrals/spend-on-invoice — Apply referral credit to an invoice

> Spends part of your available referral balance to cover an eligible invoice in full.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/referrals/spend-on-invoice` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (Console login) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Deducts the requested amount from your **available** referral balance and applies
it as credit against a specific invoice. This is a Console (logged-in user)
action: the caller is identified by the session cookie, not by an API key, so
there is no `Authorization` header or scope on this route.

The amount you spend must cover the invoice **exactly** — partial coverage is
rejected. The invoice must also be in a state that is eligible for referral
credit (open and not already paid or covered); otherwise the request fails with
`invoice_not_eligible`. If your available balance is lower than the requested
amount, the call returns `balance_insufficient` and nothing is deducted.

Amounts are expressed in **micro-units** (`amount_micro`), the same integer
unit used throughout the referral surface — `1_000_000` micro = 1.00 of the
billing currency. The value must be strictly greater than zero.

## Parameters

Request body (JSON):

| Name | Type | Required | Description |
|---|---|---|---|
| `invoice_id` | string | yes | Identifier of the invoice to apply credit to. Must be non-empty. |
| `amount_micro` | number (int64) | yes | Amount of referral balance to spend, in micro-units. Must be `> 0` and match the invoice total exactly. |

## Request

```bash
curl https://triport.io/v1/referrals/spend-on-invoice \
  -H "Content-Type: application/json" \
  --cookie "$TRIPORT_SESSION" \
  -d '{
    "invoice_id": "inv_8f3a21",
    "amount_micro": 1500000
  }'
```

## Response

`200 OK`:

```json
{
  "ok": true
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | `true` when the credit was applied and the balance debited. |

## Errors

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `balance_insufficient` | 400 | Available balance too low | Requested `amount_micro` exceeds your available referral balance. |
| `amount_mismatch` | 400 | Amount does not match invoice | `amount_micro` does not equal the invoice total exactly. |
| `invalid_args` | 400 | Bad request body | `invoice_id` is empty or `amount_micro` is `<= 0`. |
| `invalid_json` | 400 | Malformed body | Request body is not valid JSON (or exceeds the 4 KiB limit). |
| `invoice_not_eligible` | 404 | Invoice not eligible | The invoice does not exist for this user or is not in a coverable state. |
| `unauthenticated` | 401 | No valid session | Session cookie is missing, expired, or invalid. |
| `internal` | 500 | Server error | Unexpected failure while applying the credit. |

See [errors.md](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/referrals/spend-on-invoice", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ invoice_id: "inv_8f3a21", amount_micro: 1500000 }),
});
if (!res.ok) {
  const err = await res.json();
  throw new Error(err.error); // e.g. "amount_mismatch"
}
const { ok } = await res.json();
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const triport = new TriportClient({ session: process.env.TRIPORT_SESSION });

await triport.referrals.spendOnInvoice({
  invoiceId: "inv_8f3a21",
  amountMicro: 1_500_000,
});
```

## Notes

- The amount must match the invoice **exactly**; this endpoint does not support
  partial coverage or spending leftover balance across multiple invoices.
- Only the **available** portion of your balance can be spent. Pending (not yet
  unlocked) rewards do not count — check [`GET /v1/referrals/me`](./get-me.md)
  for your current `balance.available_micro`.
- To withdraw balance instead of applying it to an invoice, use
  [`POST /v1/referrals/payouts`](./post-payouts.md).
- The request body is capped at 4 KiB.
