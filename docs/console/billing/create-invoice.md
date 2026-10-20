> Live version: https://triport.io/docs/console/billing/create-invoice

# Create an invoice

> Open a single-rail payment invoice for the signed-in console user — one invoice maps to exactly one channel, one rail, and one deposit address.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/billing/invoices` |
| **Type** | Triport Console API |
| **Payment networks** | rail-dependent: Solana, Ethereum, Polygon, BSC, or Tron _(crypto payment rails — not the RPC chain set)_ |
| **Authentication** | Session cookie (console login) |
| **Required scope** | — |
| **Tier / rate limit** | — (capped by per-user pending-invoice limit) |

## Description

Creates a new payment invoice in the Triport console billing flow. The billing
surface uses a **per-rail** model: each invoice is bound to exactly one
`channel`, one `rail`, and one freshly derived deposit `address`. To offer the
customer a choice of payment methods, create one invoice per method.

The invoice is created in `pending` status with an expiry timestamp. The
response includes the deposit `address`, a wallet-ready `qr_uri`, and the
running `payments_received_micro` total (0 at creation). Watch the invoice
through to settlement over the SSE stream at
`GET /v1/billing/invoices/{id}/events`, or pay it from the user's internal
balance with `POST /v1/billing/invoices/{id}/pay-from-balance`.

This endpoint requires an authenticated console session — anonymous invoices are
rejected, because a per-rail invoice drives subscription activation and must be
attributed to a user. The set of valid `rail` values and their
`channel` compatibility comes from `GET /v1/billing/rails` (unauthenticated);
build your rail selector from that list so you never submit an unsupported
combination.

## Parameters

Send a JSON request body. No path or query parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | Payment channel. One of `crypto-onchain` (customer sends funds to the deposit address) or `crypto-inapp` (in-app wallet transaction built/relayed via the `/inapp/*` endpoints). |
| `rail` | string | yes | The payment rail. One of `sol-native`, `sol-spl-usdc`, `sol-spl-usdt`, `tron-usdt`, `tron-usdc`, `eth-usdt`, `eth-usdc`, `bsc-usdt`, `bsc-usdc`, `polygon-usdc`, `polygon-usdt`. Must be compatible with `channel`. |
| `bill_action` | object | yes | What the payment buys (see below). |
| `amount_micro` | integer | no | Charge amount in micro-USD (1 USD = 1,000,000). Omit or send `0` to let the backend resolve the price from `bill_action` via the pricing resolver. |
| `description` | string | no | Free-text label stored on the invoice. |
| `ttl_seconds` | integer | no | Lifetime in seconds before the invoice expires. Backend default applies when omitted/`0`. |
| `client_request_id` | string | no | Idempotency key. Reuse the same value to safely retry a create without producing duplicate invoices. Generate a UUID v4. |
| `fx_rate_micro_per_atomic` | integer | no | FX rate (micro-USD per smallest token unit) for rails that price in a non-USD token. Required for rails where `fx_rate_required` is `true` in the rails list (e.g. `sol-native`); rejected for stablecoin rails that do not accept it. |

### `bill_action` object

| Name | Type | Required | Description |
|---|---|---|---|
| `type` | string | yes | One of `subscription_purchase`, `subscription_renew`, `topup`. |
| `plan` | string | yes | Plan id — e.g. `starter`, `growth`, `scale`. |
| `months` | integer | yes | Billing period in months — e.g. `1`, `3`, `6`, `12`. |

## Request

```bash
curl https://triport.io/v1/billing/invoices \
  -H "Content-Type: application/json" \
  -b "triport_session=$TRIPORT_SESSION" \
  -d '{
    "channel": "crypto-onchain",
    "rail": "sol-spl-usdc",
    "bill_action": { "type": "subscription_purchase", "plan": "starter", "months": 1 },
    "description": "Starter plan — 1 month",
    "ttl_seconds": 1800,
    "client_request_id": "6c214bce-3f2e-46ac-9236-b2d4ace19055"
  }'
```

> This endpoint is part of the authenticated console surface and uses the
> browser **session cookie** issued at login, not an API key. Send requests
> from the same origin (or with `credentials: "include"`); the
> `Authorization: Bearer` / `x-token` API-key forms do not apply here.

## Response

`201 Created`:

```json
{
  "id": "inv_8f2a1c9d4e6b40f1",
  "user_id": "usr_3b91e0c7",
  "amount_micro": 29000000,
  "amount_usd": "29.00",
  "status": "pending",
  "description": "Starter plan — 1 month",
  "channel": "crypto-onchain",
  "rail": "sol-spl-usdc",
  "bill_action": { "type": "subscription_purchase", "plan": "starter", "months": 1 },
  "client_request_id": "6c214bce-3f2e-46ac-9236-b2d4ace19055",
  "created_at": "2026-05-29T12:00:00Z",
  "expires_at": "2026-05-29T12:30:00Z",
  "address": {
    "invoice_id": "inv_8f2a1c9d4e6b40f1",
    "network": "sol",
    "address": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "deriv_index": 42
  },
  "qr_uri": "solana:9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin?amount=29&spl-token=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "payments_received_micro": 0
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Invoice id. Use it for the detail, cancel, pay-from-balance, in-app, and SSE endpoints. |
| `user_id` | string | Owner of the invoice (resolved from the session). |
| `amount_micro` | integer | Final charge amount in micro-USD. Resolved by the backend when the request omitted `amount_micro`. |
| `amount_usd` | string | `amount_micro` formatted as a decimal USD string, e.g. `"29.00"`. |
| `status` | string | Invoice status — `pending` at creation. Later: `paid`, `expired`, `cancelled`. |
| `description` | string | The label you supplied (may be empty). |
| `channel` | string | The channel the invoice was created on. |
| `rail` | string | The rail the invoice was created on. |
| `bill_action` | object | Echo of the submitted `bill_action`. |
| `client_request_id` | string | Echo of the idempotency key, if supplied. |
| `fx_rate_micro_per_atomic` | integer | Echo of the FX rate, when applicable to the rail. |
| `reference_pubkey` | string | Reference key used to match an on-chain payment to this invoice, when applicable. |
| `created_at` | string (ISO-8601) | Creation timestamp. |
| `expires_at` | string (ISO-8601) | When the invoice expires if unpaid. |
| `paid_at` | string (ISO-8601) | Settlement timestamp; present once `status` is `paid`. |
| `address` | object | The single deposit address for this invoice (see below). |
| `qr_uri` | string | Wallet payment URI (e.g. a `solana:` / EIP-681 link) encoding the address and amount; render it as a QR code. |
| `payments_received_micro` | integer | Total received against this invoice so far, in micro-USD. `0` at creation. |

The `address` object:

| Field | Type | Description |
|---|---|---|
| `invoice_id` | string | Back-reference to the owning invoice. |
| `network` | string | Chain of the deposit address — `sol`, `eth`, `bsc`, `tron`, `polygon`, or `ton`. |
| `address` | string | The deposit address the customer pays to. |
| `deriv_index` | integer | Derivation index of the address within the platform wallet. |

## Errors

Errors use the shared `{"error": "<code>"}` envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `auth required` | 401 | No valid session cookie on the request. |
| `bad json: …` | 400 | The request body is not valid JSON. |
| `channel and rail required` | 400 | `channel` or `rail` was empty/missing. |
| `bill_action required` | 400 | `bill_action` was missing. |
| `invalid channel` / `invalid rail` / `unknown rail` | 400 | The `channel` or `rail` value is not recognised. |
| `incompatible channel` | 400 | The `rail` does not support the requested `channel` (unsupported rail/channel combination). |
| `unknown plan` | 400 | `bill_action.plan` is not a known plan. |
| `amount too low` | 400 | The resolved amount is below the rail minimum. |
| `fx rate required` | 400 | The rail requires `fx_rate_micro_per_atomic` and it was missing. |
| `fx rate not applicable` | 400 | An FX rate was supplied for a rail that does not accept one. |
| `max pending exceeded` | 429 | The user already has too many open `pending` invoices. |
| `service disabled` / `session resolver not configured` | 503 | Billing or session resolution is not currently wired on this deployment. |

See [Errors](../../errors.md) for the shared error envelope and conventions.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/v1/billing/invoices", {
  method: "POST",
  credentials: "include", // send the console session cookie
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    channel: "crypto-onchain",
    rail: "sol-spl-usdc",
    bill_action: { type: "subscription_purchase", plan: "starter", months: 1 },
    description: "Starter plan — 1 month",
    ttl_seconds: 1800,
    client_request_id: crypto.randomUUID(),
  }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(error);
}
const invoice = await res.json();
console.log(invoice.address.address, invoice.qr_uri);
```

## Notes

- **One invoice = one rail.** To present multiple payment options, create one
  invoice per rail and let the customer pick. Discover valid rail/channel
  combinations from `GET /v1/billing/rails` (no auth required) and build your
  selector from `channels` / `supports_inapp` / `fx_rate_required`.
- **Let the backend price it.** Omit `amount_micro` (or send `0`) to have the
  pricing resolver compute the charge from `bill_action`. Pass an explicit
  `amount_micro` only when you must override.
- **Idempotency.** Always set `client_request_id` (a UUID v4) so a retried POST
  returns the same invoice instead of creating a duplicate.
- **FX rates.** Stablecoin rails (`*-usdc`, `*-usdt`) generally price 1:1 and do
  not take an FX rate; native-token rails such as `sol-native` require
  `fx_rate_micro_per_atomic`. The rails list's `fx_rate_required` flag tells you
  which is which — supplying the wrong thing yields a `400`.
- **In-app channel.** For `channel: "crypto-inapp"`, after creating the invoice
  build and relay the wallet transaction via
  `POST /v1/billing/invoices/{id}/inapp/build` and `.../inapp/submit`.
- **Track settlement.** Subscribe to `GET /v1/billing/invoices/{id}/events`
  (SSE) for `invoice_paid` / `invoice_progress` / `invoice_expired_sweep`
  updates, or settle immediately from the user's balance with
  `POST /v1/billing/invoices/{id}/pay-from-balance`.
