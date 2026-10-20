> Live version: https://triport.io/docs/console/billing/submit-inapp-tx

# Submit in-app transaction

> Tell the billing backend about a signed in-app payment: relay a signed Solana transaction, or report the signature / hash of one the wallet already broadcast (Solana or EVM).

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/billing/invoices/{id}/inapp/submit` |
| **Type** | Triport Console API |
| **Network** | Solana / Ethereum / BNB Smart Chain / Polygon (by the invoice's rail) |
| **Authentication** | Console session cookie |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

The second half of the in-app flow, after
[build in-app transaction](./build-inapp-tx.md) and the wallet's signature.

`submit` **never marks the invoice paid.** The deposit watcher detects the
transfer on chain and settles the invoice independently, after the rail's
confirmations. `submit` is a fast status check plus, for Solana, an
optional relay path. If the invoice is already settled you get `200` with
`already_processed: true`.

Tron is not paid in-app: `tron-usdt` is an on-chain transfer rail only
(`inapp_build: false` in [`GET /v1/billing/rails`](./get-rails.md)), and
`submit` answers `400 inapp_rail_unsupported` for it.

Accepted bodies (send exactly one field):

|---|---|---|
| `sol` | `{ "signature": "<base58>" }` | The wallet already sent the tx; syntax check only. |
| `sol` | `{ "signed_b64": "<base64 signed tx>" }` | Verifies the tx pays **this** invoice (recipient / token account, mint, amount ≥ remaining, reference key, valid signatures, only allowed programs), checks the fee payer is the linked Solana wallet, then broadcasts it. |
| `evm` | `{ "tx_hash": "0x…64 hex" }` | Read-only receipt check: sums `Transfer` logs of the rail's token to the deposit address. |

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The invoice ID (`crypto-inapp`, owned by the session user). |

## Request

```bash
# EVM — wallet already sent the transaction
curl https://triport.io/v1/billing/invoices/inv_8f2c1a9d/inapp/submit \
  -H "Content-Type: application/json" \
  -b "nl_session=$NL_SESSION" \
  -d '{"tx_hash": "0x5c1f…a07e"}'
```

## Response

### Solana

```json
{ "signature": "5VErh5kq9wXp2eF8…", "submitted": true, "payer": "5sQ2sJ3oU9d2W6kq3qQy3rQ4Yb8pY2v9bN1cR7uA3kZx" }
```

`submitted` is `true` when the backend broadcast `signed_b64`, `false` for a
reported `signature`. Already settled: `{ "signature", "submitted": false, "already_processed": true, "status": "paid" }`.

### EVM (`tx_hash`)

```json
{
  "tx_hash": "0x5c1f…a07e",
  "status": "seen",
  "invoice_status": "pending",
  "received_units": "1000000",
  "amount_units": "1000000",
  "invoice_amount_units": "1000000",
  "from": "0x52908400098527886E0F7030069857D2E4169EE7",
  "block_number": 21834512,
  "confirmations": 3,
  "confirmations_required": 12
}
```

| Field | Description |
|---|---|
| `status` | `seen` — a matching transfer of at least the remaining amount is in the receipt; `pending` — not mined yet (`reason: not_mined`) or node unavailable (`reason: rpc_unavailable`); `mismatch` — `reason: tx_reverted`, `no_matching_transfer` or `underpaid` (an underpayment is still credited as partial). |
| `confirmations` / `confirmations_required` | Progress towards settlement. |
| `already_processed` | `true` when the invoice is already paid (no chain call made). |

## Errors

| Code | HTTP | When it happens |
|---|---|---|
| `auth required` | 401 | No valid session. |
| `invoice not found` | 404 | Unknown or foreign invoice. |
| `inapp_rail_unsupported`, `invoice_not_inapp` | 400 | Wrong rail/channel. |
| `signature or signed_b64 required`, `bad signed_b64…`, `bad signature…` | 400 | Solana: missing or undecodable body. |
| `bad tx_hash…` | 400 | EVM: not a transaction hash. |
| `tx_mismatch` | 422 | Solana `signed_b64` does not pay this invoice. Body: `{ "error", "reason", "detail" }` (e.g. `no_payment_to_invoice`, `underpaid`, `unexpected_program`, `payer_mismatch`, `invalid_signature`, `address_lookup_tables_unsupported`). Nothing is relayed. |
| `payer_not_linked` | 403 | Solana `signed_b64` signed by a wallet that is not the linked one. |
| `payer_check_unavailable` | 503 | Linked-wallet check could not run; retry. |
| `invoice_not_pending`, `invoice_already_funded` | 409 | Nothing left to pay. |
| `invoice_expired` | 410 | Invoice expired. |
| `submit_failed: …` | 502 | Solana network rejected the broadcast. |
| `billing_unavailable` | 503 | Billing temporarily unavailable on this node; retry after `Retry-After`. |
| `inapp not configured`, `rpc not configured` | 503 | In-app (or the relay path) disabled on this deployment. |

## Notes

- **Settlement is asynchronous.** Watch the invoice's
  [SSE event stream](./invoice-events.md) for `invoice_paid`, or poll
  [get invoice](./get-invoice.md).
- **Idempotent.** Re-submitting is safe; a paid invoice returns
  `already_processed: true` and nothing is broadcast.
- **EVM sender is not re-checked on submit** (the build step already enforced
  the linked payer); every payment is reconciled after crediting and flagged if
  it came from another wallet (`payer_linked` on the invoice).
