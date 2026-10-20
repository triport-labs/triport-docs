> Live version: https://triport.io/docs/console/auth/wallet-verify

# POST /v1/auth/wallet/verify

> Verify a wallet signature against a previously issued challenge nonce, then open an authenticated console session.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/wallet/verify` |
| **Type** | Triport Console API |
| **Network** | EVM / Solana |
| **Authentication** | None to call. On success, sets the `nl_session` (HttpOnly) and `nl_csrf` (double-submit) session cookies. |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

This is the second and final step of the **wallet sign-in** flow. First call
[`POST /v1/auth/wallet/challenge`](./wallet-challenge.md) to obtain a single-use
`nonce` and the exact human-readable `message` the wallet must sign. Have the
user sign that message with their wallet, then post the `nonce`, `address`,
`chain`, and resulting `signature` here.

The server reloads the challenge by `nonce`, confirms it was issued for the same
`address` and `chain`, cryptographically verifies the signature, and — on
success — links or creates the user account for that wallet identity and issues
a console session. The session is delivered as cookies, not as a token: the
response body contains only the `user` object.

Signature handling differs by chain:

- **EVM (`chain: "evm"`)** — a 65-byte `secp256k1` signature in `R‖S‖V` order,
  supplied as hex (with or without a `0x` prefix). `V` may be `27`/`28` or
  `0`/`1`. The message is hashed with the EIP-191 `personal_sign` envelope
  (`keccak256("\x19Ethereum Signed Message:\n" + len(msg) + msg)`), the public
  key is recovered, and the derived address must match the submitted address
  (case-insensitive — EVM addresses are not EIP-55 checksum-validated).
- **Solana (`chain: "solana"`)** — a 64-byte `ed25519` signature. It is accepted
  as hex, base58 (Phantom default), or base64 (standard or URL-safe, padded or
  unpadded). The address is the base58-encoded 32-byte public key, and the
  signature is verified directly against the challenge message.
- **Tron (`chain: "tron"`)** — no longer accepted: since 2026-09-29 Tron wallet
  sign-in returns `400 chain_not_supported` before the nonce is looked up (the
  nonce is not consumed). This includes accounts that were created with a Tron
  wallet earlier.

Only challenges issued with `purpose: "login"` (the default) are accepted here;
a `link` nonce (or a leftover `replace` nonce from before 2026-09-29) returns
`purpose_mismatch` and is **not** consumed.

Gotchas:

- The `nonce` is **single-use**. It is burned on the first successful verify, so
  a retry with the same `nonce` returns `invalid_nonce`. Request a fresh
  challenge to try again.
- The challenge expires 5 minutes after it is issued; an expired or unknown
  nonce returns `invalid_nonce`.
- The `address`/`chain` you send here must match the values used in the
  challenge request, or you get `address_mismatch`.

## Parameters

Request body (JSON). All fields are required.

| Name | Type | Required | Description |
|---|---|---|---|
| `nonce` | string (UUID) | yes | The single-use nonce returned by `POST /v1/auth/wallet/challenge`. |
| `address` | string | yes | Wallet address. EVM: `0x` + 40 hex chars. Solana: base58 of the 32-byte public key. |
| `chain` | string | yes | `"evm"` or `"solana"`. Must match the chain used for the challenge. `"tron"` → `400 chain_not_supported`. |
| `signature` | string | yes | Signature over the challenge `message`. EVM: 65-byte hex. Solana: 64-byte hex/base58/base64. |

## Request

```bash
curl https://triport.io/v1/auth/wallet/verify \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "nonce": "8b1d0d2e-3c4a-4f5b-9a6c-7d8e9f0a1b2c",
    "address": "0x52908400098527886E0F7030069857D2E4169EE7",
    "chain": "evm",
    "signature": "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8b9e6e7b5c1f4e2a0d3c5b6a7980f1e2d3c4b5a69788776655443322110aff1b"
  }'
```

> No API key is required for this route. The `-c cookies.txt` flag captures the
> `nl_session` and `nl_csrf` cookies that the response sets, so subsequent
> cookie-authenticated calls (e.g. `GET /v1/auth/me`) can reuse them.

## Response

`200 OK` — the wallet was verified and a session was opened. The session and
CSRF cookies are returned via `Set-Cookie`; the body carries the user record.

```json
{
  "user": {
    "id": "0f9b2c47-1a2b-4c3d-8e5f-6a7b8c9d0e1f",
    "email": "0x52908400098527886e0f7030069857d2e4169ee7@evm.wallet",
    "display_name": "0x5290…9EE7",
    "created_at": "2026-05-29T11:42:03Z",
    "updated_at": "2026-05-29T11:42:03Z"
  }
}
```

Response headers include:

```
Set-Cookie: nl_session=<opaque>; Path=/; HttpOnly; Secure; SameSite=Lax
Set-Cookie: nl_csrf=<opaque>; Path=/; Secure; SameSite=Lax
```

For wallet sign-ups, `email` is a synthetic placeholder of the form
`<address>@<chain>.wallet` and `display_name` is the shortened address. Both can
be updated later from the console.

### Response fields

| Field | Type | Description |
|---|---|---|
| `user.id` | string (UUID) | Stable user identifier. |
| `user.email` | string | Account email. For wallet-only accounts this is a `<address>@<chain>.wallet` placeholder. |
| `user.display_name` | string | Display name; defaults to the shortened wallet address. |
| `user.avatar_url` | string | Avatar URL, if set. Omitted when empty. |
| `user.billing_customer_id` | string | Billing customer reference, if any. Omitted when empty. |
| `user.created_at` | string (RFC 3339) | Account creation timestamp. |
| `user.updated_at` | string (RFC 3339) | Last update timestamp. |

## Errors

Errors use the shared envelope `{ "error": "<code>" }`. See [errors.md](../../errors.md)
for the full envelope and conventions.

| Code | HTTP | When it happens |
|---|---|---|
| `invalid_nonce` | 400 | `nonce` is not a valid UUID, or no matching challenge exists (unknown, already consumed, or expired). |
| `chain_not_supported` | 400 | `chain` is `tron` (Tron wallet sign-in removed on 2026-09-29). The nonce is not consumed. |
| `invalid_address` | 400 | `address` is malformed for the given `chain`, or `chain` is not `evm`/`solana`. |
| `address_mismatch` | 400 | The `address`/`chain` submitted do not match the challenge the `nonce` was issued for. |
| `purpose_mismatch` | 400 | The nonce was issued for `link` (or is a leftover `replace` nonce), not `login`. The nonce is not consumed. |
| `invalid_signature` | 400 | Signature is the wrong length/encoding, or it does not verify to the submitted address. |
| `invalid_json` | 400 | Request body is not valid JSON (or exceeds the 8 KiB limit). |
| `session_issue_failed` | 500 | Signature verified, but the server could not mint the session. |
| `method_not_allowed` | 405 | A method other than `POST` was used. |
| `internal` | 500 | Unexpected server-side failure (challenge lookup, nonce consume, or user upsert). |

## Examples

### JavaScript (fetch)
```js
async function walletVerify({ nonce, address, chain, signature }) {
  const res = await fetch("https://triport.io/v1/auth/wallet/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // required so nl_session / nl_csrf cookies are stored
    body: JSON.stringify({ nonce, address, chain, signature }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error);
  }
  const { user } = await res.json();
  return user;
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole({ baseUrl: "https://triport.io" });

// 1. Request a challenge.
const { nonce, message } = await console.auth.wallet.challenge({
  address,
  chain: "solana",
});

// 2. Sign `message` with the connected wallet (e.g. Phantom).
const signature = await wallet.signMessage(message); // base58 / base64 / hex

// 3. Verify — session cookies are persisted by the SDK client.
const { user } = await console.auth.wallet.verify({
  nonce,
  address,
  chain: "solana",
  signature,
});
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

client = ConsoleClient(base_url="https://triport.io")

# 1. Request a challenge.
challenge = client.auth.wallet.challenge(address=address, chain="evm")

# 2. Sign challenge.message with the user's wallet (65-byte secp256k1, hex).
signature = sign_personal_message(challenge.message, private_key)

# 3. Verify; the client session keeps the nl_session / nl_csrf cookies.
result = client.auth.wallet.verify(
    nonce=challenge.nonce,
    address=address,
    chain="evm",
    signature=signature,
)
print(result.user.id)
```

## Notes

- **Two-step flow.** Always pair this call with
  [`POST /v1/auth/wallet/challenge`](./wallet-challenge.md); the `nonce` and the
  `message` you sign both come from there.
- **Sign the exact message.** The wallet must sign the challenge `message`
  byte-for-byte. Re-deriving or altering it (extra whitespace, different
  line endings) will fail signature verification.
- **Cookie session, not a bearer token.** This endpoint returns no token. Reuse
  the `nl_session` cookie on subsequent requests, and echo the `nl_csrf` value
  in the `X-CSRF-Token` header on mutating calls. See the
  [authentication overview](../../authentication.md).
- **Check who you are** with [`GET /v1/auth/me`](./me.md), and end the session
  with [`POST /v1/auth/logout`](./logout.md).
- **The sign-in wallet is the linked wallet** of its family (`source: "login"` in
  [`GET /v1/auth/wallets`](./wallets.md)); it is the wallet allowed to pay
  in-app invoices on that family's rails. To add a wallet of another family use
  [`POST /v1/auth/wallet/link`](./wallet-link.md). There is no self-service
  replace: to change a linked wallet, contact support.
