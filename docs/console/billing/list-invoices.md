> Live version: https://triport.io/docs/console/billing/list-invoices

# List invoices

> Return the authenticated user's billing invoices, optionally filtered by status and capped to a limit.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/billing/invoices` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Lists the invoices that belong to the calling account, most-recent first. An
invoice is the per-rail payment object in the Triport billing model: each one
maps to exactly one channel, one rail, and (once created) one payment address.
Use this endpoint to render a billing history table, to find a pending invoice
to resume payment on, or to reconcile completed top-ups and subscription
purchases.

When the request carries a valid session cookie the result is **scoped to that
user** — you only ever see your own invoices. The response is always the shape
`{ "invoices": [...] }`; the array is empty (never `null`) when there is
nothing to return.

This is a list view and returns the base `Invoice` object. It does **not**
include the per-invoice payment `address`, `qr_uri`, or
`payments_received_micro` — fetch a single invoice with
[`GET /v1/billing/invoices/{id}`](./get-invoice.md) for those fields.

## Parameters

All parameters are query-string parameters; there is no request body.

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | string | no | Filter by invoice status. One of `pending`, `paid`, `expired`, `cancelled`. An unrecognized value returns `400`. Omit to return all statuses. |
| `limit` | integer | no | Maximum number of invoices to return. Omit (or `0`) for the server default. |
| `offset` | integer | no | Number of invoices to skip before collecting `limit` results. Combine with `limit` for simple paging. |

## Request

```bash
curl https://triport.io/v1/billing/invoices?status=pending&limit=20 \
  -H "Content-Type: application/json" \
  -b "triport_session=$TRIPORT_SESSION"
```

The console API authenticates with the session cookie set at login; send it
with the request (the browser does this automatically for same-origin calls).

## Response

```json
{
  "invoices": [
    {
      "id": "inv_8Q2m4xZ1aVbN",
      "user_id": "usr_3kPq7Rd9",
      "amount_micro": 49000000,
      "status": "pending",
      "description": "Growth plan — 3 months",
      "channel": "crypto-onchain",
      "rail": "sol-spl-usdc",
      "bill_action": {
        "type": "subscription_purchase",
        "plan": "growth",
        "months": 3
      },
      "client_request_id": "f1c2d3e4-5678-49ab-90cd-ef1234567890",
      "fx_rate_micro_per_atomic": 1000000,
      "created_at": "2026-05-29T14:02:11Z",
      "expires_at": "2026-05-29T14:32:11Z",
      "payer_address": null,
      "payer_linked": null
    },
    {
      "id": "inv_5Lt0wYpKcRsE",
      "user_id": "usr_3kPq7Rd9",
      "amount_micro": 19000000,
      "status": "paid",
      "description": "Starter plan — 1 month",
      "channel": "crypto-inapp",
      "rail": "eth-usdc",
      "bill_action": {
        "type": "subscription_renew",
        "plan": "starter",
        "months": 1
      },
      "client_request_id": "a0b1c2d3-4455-6677-8899-aabbccddeeff",
      "fx_rate_micro_per_atomic": 1000000,
      "created_at": "2026-05-12T09:17:44Z",
      "expires_at": "2026-05-12T09:47:44Z",
      "paid_at": "2026-05-12T09:21:03Z",
      "processed_at": "2026-05-12T09:21:05Z",
      "payer_address": "0x52908400098527886e0f7030069857d2e4169ee7",
      "payer_linked": true
    }
  ]
}
```

### Response fields

Each element of `invoices` is an `Invoice` object.

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique invoice identifier. |
| `user_id` | string | Owner of the invoice. |
| `amount_micro` | integer | Amount due, in micro-units of USD (`1000000` = `1.00`). |
| `status` | string | One of `pending`, `paid`, `expired`, `cancelled`. |
| `description` | string | Human-readable line item for the invoice. |
| `channel` | string | Payment channel: `crypto-onchain` or `crypto-inapp`. |
| `rail` | string | Payment rail, e.g. `sol-spl-usdc`, `eth-usdc`, `polygon-usdt`. One invoice = one rail. |
| `bill_action` | object | What paying this invoice does — see below. |
| `client_request_id` | string | Caller-supplied idempotency key from invoice creation. |
| `fx_rate_micro_per_atomic` | integer | FX rate locked at creation, in micro-USD per atomic token unit (present for rails that require an FX rate). |
| `created_at` | string | ISO-8601 UTC timestamp of creation. |
| `expires_at` | string | ISO-8601 UTC timestamp after which a `pending` invoice can no longer be paid. |
| `paid_at` | string | ISO-8601 UTC timestamp the invoice was paid. Present once `status` is `paid`. |
| `processed_at` | string | ISO-8601 UTC timestamp the payment was applied (e.g. subscription activated). Present after post-payment processing. |
| `payer_address` | string | null | Sender of the most recent payment, or `null`. Always present. |
| `payer_linked` | boolean | null | `false` if any payment came from a wallet other than the account's linked wallet of that family, `true` if all checked payments came from it, `null` otherwise. Always present. See [get invoice](./get-invoice.md). |

The `bill_action` object describes the account effect of payment:

| Field | Type | Description |
|---|---|---|
| `type` | string | `subscription_purchase`, `subscription_renew`, or `topup`. |
| `plan` | string | Plan key for subscription actions, e.g. `starter`, `growth`, `scale`. |
| `months` | integer | Billing duration: `1`, `3`, `6`, or `12`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `bad status filter` | `status` is set to a value other than `pending`, `paid`, `expired`, or `cancelled`. |
| `500` | server error | An internal error occurred while loading invoices. |

Errors are returned as `{ "error": "<message>" }`. See the shared
[error reference](../../errors.md) for the full envelope.

## Examples

### JavaScript (fetch)
```js
const params = new URLSearchParams({ status: "pending", limit: "20" });
const res = await fetch(
  `https://triport.io/v1/billing/invoices?${params}`,
  { credentials: "include" },
);
if (!res.ok) {
  const { error } = await res.json().catch(() => ({}));
  throw new Error(error ?? `HTTP ${res.status}`);
}
const { invoices } = await res.json();
console.log(`${invoices.length} invoice(s)`);
```

## Notes

- **Scope.** Results are limited to the authenticated user's invoices. The list
  is intentionally lean — call
  [`GET /v1/billing/invoices/{id}`](./get-invoice.md) for the payment address,
  QR URI, and received-amount details of a single invoice.
- **Amounts are micro-USD.** Divide `amount_micro` and
  `fx_rate_micro_per_atomic` by `1_000_000` to get a USD value.
- **Paging.** Combine `limit` and `offset` for basic pagination; there is no
  cursor on this endpoint. For balance ledger entries, the cursor-paginated
  [`GET /v1/balance/ledger`](./list-balance-entries.md) endpoint is the
  counterpart.
- **Live updates.** To react to invoice state changes in real time rather than
  polling this list, subscribe to the per-invoice SSE stream
  [`GET /v1/billing/invoices/{id}/events`](./invoice-events.md).
- **Related:** [Create invoice](./create-invoice.md),
  [Cancel invoice](./cancel-invoice.md),
  [Pay from balance](./pay-from-balance.md).
