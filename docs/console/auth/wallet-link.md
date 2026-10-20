> Live version: https://triport.io/docs/console/auth/wallet-link

# POST /v1/auth/wallet/link

> Attach a wallet to the account you are signed in to, proving ownership with a signed `link` challenge. One wallet per chain family.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/wallet/link` |
| **Type** | Triport Console API |
| **Network** | — (EVM and Solana wallets) |
| **Authentication** | Console session cookie + CSRF header (`X-CSRF-Token` = `nl_csrf` cookie) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Links a wallet to the **current** account without signing anyone in. It is how
an account created with email or Google gets a wallet it can pay from, and how a
wallet-login account adds a wallet of another family.

Flow:

1. [`POST /v1/auth/wallet/challenge`](./wallet-challenge.md) with
   `purpose: "link"` for the wallet's `address` and `chain`.
2. The wallet signs the returned `message` (EVM: `personal_sign`; Solana: `signMessage`).
3. Call this endpoint with the `nonce`, `address`, `chain` and `signature`.

Policy:

- **One wallet per family.** If the account already has a different wallet of
  this family, the call returns `409 family_already_linked` with the existing
  address. There is no self-service replace (removed on 2026-09-29): a linked
  wallet is changed only by support.
- **One account per wallet.** A wallet already linked to (or used to sign in to)
  another account returns `409 address_taken`; accounts are never merged.
- Linking the same address again is idempotent (`already: true`).
- **One family per call.** Each call links exactly one wallet of one family with
  one signature; a refusal leaves every other binding untouched.
- **No Tron.** `chain: "tron"` returns `400 chain_not_supported` before the nonce
  is looked up (the nonce is not consumed).

The nonce is consumed only after the signature and purpose check pass.

## Parameters

Request body (JSON), all required:

| Name | Type | Description |
|---|---|---|
| `nonce` | string (UUID) | Nonce from a `purpose: "link"` challenge. |
| `address` | string | Wallet address (same forms as the challenge). |
| `chain` | string | `evm` or `solana`. |
| `signature` | string | Signature over the challenge `message` (encodings as in [`wallet/verify`](./wallet-verify.md)). |

## Request

```bash
curl https://triport.io/v1/auth/wallet/link \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $NL_CSRF" \
  -d '{
    "nonce": "4d1f0a7e-2b6c-4f3e-9a18-7c5d2e9b0f41",
    "address": "0x52908400098527886E0F7030069857D2E4169EE7",
    "chain": "evm",
    "signature": "0x5f1c…1b"
  }'
```

## Response

`200 OK`

```json
{
  "user": { "id": "0f9b2c47-1a2b-4c3d-8e5f-6a7b8c9d0e1f", "email": "user@example.com", "display_name": "user", "created_at": "2026-09-01T10:00:00Z", "updated_at": "2026-09-27T18:40:02Z" },
  "provider": "wallet_evm",
  "family": "evm",
  "address": "0x52908400098527886e0f7030069857d2e4169ee7"
}
```

| Field | Type | Description |
|---|---|---|
| `user` | object | The signed-in user (same shape as in [`wallet/verify`](./wallet-verify.md)). |
| `provider` | string | `wallet_evm` or `wallet_solana`. |
| `family` | string | `evm` or `solana`. |
| `address` | string | Canonical address that is now linked. |
| `already` | boolean | Present and `true` when this address was already linked to this account. |

## Errors

| Code | HTTP | When it happens |
|---|---|---|
| `unauthenticated` | 401 | No valid session. |
| `csrf_missing` / `csrf_invalid` | 403 | `X-CSRF-Token` header absent or not equal to the `nl_csrf` cookie. |
| `invalid_json` | 400 | Body is not valid JSON. |
| `chain_not_supported` | 400 | `chain` is `tron` (Tron linking removed on 2026-09-29). The nonce is not consumed. |
| `invalid_nonce` | 400 | Unknown, used or expired nonce. |
| `invalid_address` | 400 | Address malformed for `chain`, or unknown `chain`. |
| `address_mismatch` | 400 | `address`/`chain` differ from the challenge. |
| `purpose_mismatch` | 400 | The nonce was not issued with `purpose: "link"` (not consumed). |
| `nonce_user_mismatch` | 400 | The `link` challenge was requested in another signed-in account's session; a link nonce is bound to the session that requested it. Checked before the signature; the nonce is not consumed. |
| `invalid_signature` | 400 | Signature does not verify. |
| `address_taken` | 409 | The wallet belongs to another account. |
| `family_already_linked` | 409 | Body `{ "error", "family", "address", "hint": "support" }` — the account already has another wallet of this family; only support can change it. (`hint` was `"replace"` before 2026-09-29.) |
| `internal` | 500 | Server-side failure. |

## Notes

- Linking does not create a session and never switches accounts.
- The linked wallet is what in-app payments check: a build with any other payer
  address of that family returns `403 payer_not_linked`
  ([Build in-app transaction](../billing/build-inapp-tx.md)).
