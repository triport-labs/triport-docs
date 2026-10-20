> Live version: https://triport.io/docs/console/billing/pay-from-balance

# Pay invoice from balance

> Settle a pending invoice instantly by debiting the signed-in user's prepaid balance.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/billing/invoices/{id}/pay-from-balance` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Closes a `pending` invoice by drawing down the authenticated user's prepaid
**balance** instead of an on-chain or in-app crypto payment. The debit and the
invoice activation happen atomically inside a single database transaction, so
the call either fully settles the invoice or changes nothing.

On success the endpoint returns the new balance synchronously — there is no
need to poll the [balance snapshot](./get-balance.md) afterwards. The same
number is also pushed as a `balance_debit` event on
[`/v1/balance/events`](./balance-events.md), so any other open UI tab updates
live.

The call is **idempotent**: POSTing again for an invoice that is already `paid`
returns `200` with the same response shape (the current state), not an error.
This lets the UI treat a double-click or a retried request exactly like the
first request.

Use this when the user has enough prepaid balance and wants to pay without
broadcasting a blockchain transaction. If the balance is insufficient, locked,
or the invoice is not yours / not pending, the call fails with a named error
code (see [Errors](./pay-from-balance.md#errors)).

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The invoice ID to settle. Must be a `pending` invoice owned by the authenticated user. |

There is no request body and no query parameters.

## Request

```bash
curl -X POST \
  "https://triport.io/v1/billing/invoices/inv_8f2c1a/pay-from-balance" \
  -H "Content-Type: application/json" \
  -b "triport_session=$TRIPORT_SESSION"
```

The request is authenticated by the session cookie established at sign-in; no
body is sent.

## Response

```json
{
  "invoice_id": "inv_8f2c1a",
  "status": "paid",
  "new_balance_micro": 500000
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `invoice_id` | string | The invoice that was settled. |
| `status` | string | Always `"paid"` on a successful (or idempotent) call. |
| `new_balance_micro` | integer | The user's balance **after** the debit, in micro-units (1 unit = 1,000,000 micro). |

## Errors

All errors use the shared error envelope `{ "error": "<code>" }` — see
[errors.md](../../errors.md) for the full contract. The `error` value is one of
the named codes below; surface it to the user verbatim.

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `auth required` | 401 | Not authenticated | No valid session cookie on the request. |
| `invoice not found` | 404 | Unknown invoice | No invoice exists for the given `id`. |
| `not_owner` | 409 | Invoice belongs to another user | The invoice's owner is not the authenticated user. |
| `invoice_not_pending` | 409 | Invoice not payable | Invoice is expired, cancelled, or lost a race to another settlement. |
| `invoice_is_topup` | 409 | Wrong invoice kind | Top-up invoices credit the balance rather than debit it; they cannot be paid from balance. |
| `insufficient_balance` | 409 | Balance too low | The balance is less than the invoice amount. |
| `balance_locked` | 409 | Balance locked | The user's balance is temporarily locked and cannot be debited. |
| `already_debited` | 409 | Concurrent debit | A parallel settlement already consumed this invoice's debit slot. |

> A request for an invoice that is **already `paid`** is not an error — it
> returns `200` with the standard response body (idempotent replay).

## Examples

### JavaScript (fetch)
```js
const res = await fetch(
  `https://triport.io/v1/billing/invoices/${invoiceId}/pay-from-balance`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send the session cookie
  },
);

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(error); // e.g. "insufficient_balance"
}

const { invoice_id, status, new_balance_micro } = await res.json();
console.log(`${invoice_id} → ${status}, balance now ${new_balance_micro} micro`);
```

## Notes

- **Live updates.** On success a `balance_debit` event is broadcast on
  [`/v1/balance/events`](./balance-events.md) with the shape
  `{ "kind": "balance_debit", "user_id", "delta_micro", "new_balance",
  "ref_invoice_id", "at" }`, where `delta_micro` is negative and
  `ref_invoice_id` is the settled invoice. An `invoice_paid` event is also
  emitted on that invoice's own [event stream](./invoice-events.md).
- **Idempotency.** Retrying after a `paid` response is safe — you receive the
  same `200` body. Build retries assuming at-most-once settlement even under
  concurrent requests; the duplicate is collapsed server-side.
- **Related endpoints.** To pay on-chain or in-app instead, see the in-app
  transaction endpoints; to cancel an unpaid invoice, see
  [cancel invoice](./cancel-invoice.md); to inspect available funds, see the
  [balance snapshot](./get-balance.md) and
  [ledger entries](./list-balance-entries.md).
