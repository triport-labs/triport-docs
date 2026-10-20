> Live version: https://triport.io/docs/console/billing/get-invoice

# Get invoice

> Fetch a single invoice you own, including its payment address, QR payment URI, and how much has been received so far.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/billing/invoices/{id}` |
| **Type** | Triport Console API |
| **Network** | — (per-invoice; the rail/network is returned in the body) |
| **Authentication** | Session cookie (`nl_session`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Returns the full state of one invoice belonging to the authenticated user. Use it
to render an invoice/checkout screen: the response carries the canonical
`status`, the deposit `address` for the chosen rail, a ready-to-render `qr_uri`,
and `payments_received_micro` so you can show progress toward the amount due.

This is the snapshot endpoint. For a live feed of status changes (payment
detected, paid, expired, cancelled) open the SSE stream at
[`GET /v1/billing/invoices/{id}/events`](./invoice-events.md) instead of polling
this route.

Invoices are scoped to their owner. Requesting an `id` that does not exist — or
one that belongs to another user — returns `404` (the API does not distinguish
the two cases, so it never leaks the existence of someone else's invoice).

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The invoice ID (as returned by `POST /v1/billing/invoices` or `GET /v1/billing/invoices`). |

This endpoint takes no query parameters and no request body.

## Request

```bash
curl https://triport.io/v1/billing/invoices/inv_8f2c1a7e9b3d4e6f \
  -H "Content-Type: application/json" \
  -b "nl_session=$TRIPORT_SESSION"
```

The session cookie is set for you by the browser after login; in a browser the
request is same-origin and the cookie is sent automatically. For server-side or
`curl` calls, pass it explicitly with `-b "nl_session=..."`.

## Response

`200 OK`

```json
{
  "id": "inv_8f2c1a7e9b3d4e6f",
  "user_id": "usr_a13f29c4",
  "amount_micro": 49000000,
  "status": "pending",
  "description": "Growth plan — 3 months",
  "channel": "crypto-onchain",
  "rail": "polygon-usdc",
  "bill_action": {
    "type": "subscription_purchase",
    "plan": "growth",
    "months": 3
  },
  "client_request_id": "b6f0d2c1-7a44-4e2b-9f10-2c8e5d3a1b9e",
  "created_at": "2026-05-29T11:42:08Z",
  "expires_at": "2026-05-29T12:12:08Z",
  "amount_usd": "49.00",
  "address": {
    "invoice_id": "inv_8f2c1a7e9b3d4e6f",
    "network": "polygon",
    "address": "0x3a1F9C7b2E54d8A6f0B19c4D2e7A8b6C5d4E3f21",
    "deriv_index": 137
  },
  "qr_uri": "ethereum:0x3a1F9C7b2E54d8A6f0B19c4D2e7A8b6C5d4E3f21@137/transfer?address=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174&uint256=49000000",
  "payments_received_micro": 0,
  "payer_address": null,
  "payer_linked": null
}
```

### Response fields

The body is the full invoice (`Invoice`) plus six extra fields.

| Field | Type | Description |
|---|---|---|
| `id` | string | Invoice ID. |
| `user_id` | string | Owner of the invoice. |
| `amount_micro` | number | Amount due, in micro-units (`1_000_000` = 1.00 USD). |
| `status` | string | One of `pending`, `paid`, `expired`, `cancelled`. |
| `description` | string | Human-readable line item. |
| `channel` | string | Payment channel: `crypto-onchain` or `crypto-inapp`. |
| `rail` | string | Payment rail, e.g. `polygon-usdc`, `sol-spl-usdc`, `eth-usdt`. See [`GET /v1/billing/rails`](./get-rails.md). |
| `bill_action` | object | What the payment buys: `{ type, plan, months }` where `type` is `subscription_purchase`, `subscription_renew`, or `topup`. |
| `client_request_id` | string | Idempotency key supplied at creation (if any). |
| `fx_rate_micro_per_atomic` | number | FX rate locked at creation, for rails that require one (if any). |
| `reference_pubkey` | string | On-chain reference key used to match payments (if any). |
| `created_at` | string | ISO-8601 creation time. |
| `expires_at` | string | ISO-8601 expiry; after this a `pending` invoice is swept to `expired`. |
| `paid_at` | string | ISO-8601 time the invoice was marked paid (present once paid). |
| `processed_at` | string | ISO-8601 time the bill action was applied (present once processed). |
| `amount_usd` | string | `amount_micro` formatted as a decimal USD string, e.g. `"49.00"`. |
| `address` | object | The single deposit address for this invoice (see below). May be absent if no address has been derived. |
| `qr_uri` | string | Payment URI for the rail, suitable for rendering a QR code. Absent when the rail is unknown or no address exists. |
| `payments_received_micro` | number | Total received so far for this invoice, in micro-units. |
| `payer_address` | string | null | Sender of the most recent payment detected for this invoice, or `null` if none is known yet. Always present. |
| `payer_linked` | boolean | null | Whether payments came from the wallet linked to the account for that chain family: `false` if **any** payment came from another address; `true` only when every payment has been checked and all came from the linked wallet; `null` when there are no payments or the check has not finished. Always present. Payments from another address are still credited. |

#### `address` object

| Field | Type | Description |
|---|---|---|
| `invoice_id` | string | The invoice this address belongs to. |
| `network` | string | `sol`, `eth`, `bsc`, `tron`, `polygon`, or `ton`. |
| `address` | string | The deposit address to send funds to. |
| `deriv_index` | number | HD derivation index of the address. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `auth required` | No valid `nl_session` cookie on the request. |
| `404` | `not found` | The invoice does not exist, or it is not owned by the requesting user. |

All errors share the standard envelope `{ "error": "<message>" }`. See
[errors.md](../../errors.md) for the full error model.

## Examples

### JavaScript (fetch)
```js
async function getInvoice(id) {
  const r = await fetch(`https://triport.io/v1/billing/invoices/${id}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send the nl_session cookie
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${r.status}`);
  }
  return r.json();
}

const invoice = await getInvoice('inv_8f2c1a7e9b3d4e6f');
console.log(invoice.status, invoice.amount_usd, invoice.address?.address);
```

## Notes

- **Snapshot, not a stream.** To react to payment in real time, subscribe to
  [`GET /v1/billing/invoices/{id}/events`](./invoice-events.md) rather than
  polling this endpoint.
- **`amount_usd` vs `amount_micro`.** `amount_micro` is the precise integer
  amount in micro-units; `amount_usd` is the same value pre-formatted for
  display. Compute progress from the `*_micro` fields, not the string.
- **Address availability.** `address` and `qr_uri` are present for a normal
  per-rail invoice. If they are missing, the rail/address has not been resolved
  yet — re-fetch shortly or check the invoice was created against a valid rail.
- **Related endpoints:**
  [list invoices](./list-invoices.md),
  [create invoice](./create-invoice.md),
  [cancel invoice](./cancel-invoice.md),
  [pay from balance](./pay-from-balance.md).
