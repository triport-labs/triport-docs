> Live version: https://triport.io/docs/console/auth/wallet-challenge

# POST /v1/auth/wallet/challenge

> Request a single-use nonce and the exact human-readable message a wallet must sign — for sign-in, or for linking a wallet to your account.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/wallet/challenge` |
| **Type** | Triport Console API |
| **Network** | — (EVM and Solana wallets) |
| **Authentication** | None — public endpoint (no session, no CSRF token required) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

This is the **first step** of every wallet proof on Triport. You send the wallet
`address`, its `chain` and the `purpose` of the proof; Triport returns a freshly
minted `nonce` (a UUID) together with a `message` string. The wallet displays the
`message` **verbatim** so the user sees exactly what they sign; the signature is
then submitted to the endpoint that matches the purpose:

| `purpose` | Next call | What it does |
|---|---|---|
| `login` (default) | [`POST /v1/auth/wallet/verify`](./wallet-verify.md) | Sign in or sign up with the wallet. |
| `link` | [`POST /v1/auth/wallet/link`](./wallet-link.md) | Attach the wallet to the account you are signed in to. |

The `replace` purpose was removed on 2026-09-29 together with self-service
wallet replace: `purpose: "replace"` now returns `400 invalid_purpose`. Changing
a linked wallet is done by support.

The purpose is part of the signed text and is stored with the nonce. A nonce
issued for one purpose is refused by the other endpoints (`purpose_mismatch`),
so a signature collected for sign-in can never be replayed to link a wallet.

The `nonce` is single-use and **expires 5 minutes** after it is issued. This
endpoint does not authenticate the caller and does not set any cookies. Pass the
`message` to the wallet unchanged: any modification makes the signature fail
verification.

## Parameters

Request body (JSON):

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | The wallet address. `evm`: `0x` + 40 hex characters. `solana`: base58 of the 32-byte public key. |
| `chain` | string | yes | Wallet chain: `"evm"` or `"solana"`. `"tron"` → `400 chain_not_supported`. |
| `purpose` | string | no | `"login"` (default when omitted) or `"link"`. Any other value (including the removed `"replace"`) → `400 invalid_purpose`. |

EVM addresses are normalised to lower case (no EIP-55 checksum validation).
Solana addresses are used as-is.

## Request

```bash
curl https://triport.io/v1/auth/wallet/challenge \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x52908400098527886E0F7030069857D2E4169EE7",
    "chain": "evm"
  }'
```

## Response

`200 OK`

```json
{
  "nonce": "9f1c8a2e-3b7d-4c6a-9e21-0d4f5b6a7c8e",
  "message": "Sign in to triport.io — nonce 9f1c8a2e-3b7d-4c6a-9e21-0d4f5b6a7c8e\n\nAddress: 0x52908400098527886e0f7030069857d2e4169ee7\nChain: evm"
}
```

The message text depends on the purpose:

| `purpose` | `message` |
|---|---|
| `login` | `Sign in to triport.io — nonce <nonce>\n\nAddress: <address>\nChain: <chain>` |
| `link` | `Link this wallet to your triport.io account — nonce <nonce>\n\nAddress: <address>\nChain: <chain>\nPurpose: link` |

### Response fields

| Field | Type | Description |
|---|---|---|
| `nonce` | string | UUID identifying this challenge. Single-use, expires after 5 minutes. |
| `message` | string | The exact text the wallet must sign. The address in it is the canonical form (lower-case EVM). |

## Errors

| Code | HTTP | When it happens |
|---|---|---|
| `invalid_json` | 400 | The request body is not valid JSON, or exceeds the 4 KB limit. |
| `chain_not_supported` | 400 | `chain` is `tron`. Tron wallet sign-in and linking were removed on 2026-09-29. Checked before the address and the rate limit. |
| `invalid_address` | 400 | `chain` is not `evm`/`solana`, or `address` fails the format check for that chain. |
| `invalid_purpose` | 400 | `purpose` is present and not one of `login`, `link`. |
| `rate_limited` | 429 | Too many challenges from this IP (or, when signed in, this account). Body adds `retry_after` (seconds); `Retry-After` header is set. |
| `method_not_allowed` | 405 | A method other than `POST` was used. |
| `internal` | 500 | The challenge could not be persisted server-side. |

Errors share the standard error envelope — see [errors.md](../../errors.md).

## Examples

### JavaScript (fetch) — link a Solana wallet

```js
const res = await fetch('https://triport.io/v1/auth/wallet/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    chain: 'solana',
    purpose: 'link',
  }),
});
const { nonce, message } = await res.json();
// Phantom: const { signature } = await window.phantom.solana.signMessage(new TextEncoder().encode(message));
// encode the 64-byte signature as base58, base64 or hex, then
// POST /v1/auth/wallet/link with { nonce, address, chain: 'solana', signature }.
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from '@triport/sdk';

const client = new TriportClient();
const { nonce, message } = await client.auth.wallet.challenge({
  address: '0x52908400098527886E0F7030069857D2E4169EE7',
  chain: 'evm',
});
```

## Notes

- **Signing per chain:** EVM — `personal_sign` (EIP-191); Solana — ed25519
  `signMessage`. Tron is not accepted (`chain_not_supported`).
- **5-minute TTL:** request a new challenge if the user takes too long to sign.
- **Omitting `purpose`** keeps the pre-2026-09 behaviour (sign-in text,
  byte-identical to before).
- See the [console authentication overview](../../authentication.md) for how
  wallet sign-in fits alongside email OTP and Google OAuth.
