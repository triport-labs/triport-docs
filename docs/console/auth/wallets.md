> Live version: https://triport.io/docs/console/auth/wallets

# GET /v1/auth/wallets

> List the wallets linked to the signed-in account — at most one per chain family (EVM, Solana).

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/auth/wallets` |
| **Type** | Triport Console API |
| **Network** | — (EVM and Solana wallets) |
| **Authentication** | Console session cookie (`nl_session`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Every Triport account has **at most one linked wallet per chain family**:
`evm` (Ethereum, Polygon, BSC share one address) and `solana`. The linked
wallet is the only wallet allowed to pay in-app invoices on that family's rails —
see [Build in-app transaction](../billing/build-inapp-tx.md). New Tron wallets can
no longer be linked or used to sign in (`400 chain_not_supported`); a `tron` row
linked before 2026-09-29 is still listed.

A wallet becomes linked in one of two ways:

- **`source: "login"`** — the account was created or signed in with that wallet
  ([`wallet/verify`](./wallet-verify.md)); the sign-in wallet is the binding.
- **`source: "link"`** — the wallet was attached to an existing account with
  [`POST /v1/auth/wallet/link`](./wallet-link.md).

There is no self-service replace or unlink: to change or remove a linked
wallet, the user contacts support and an operator changes it (audited). The
former `POST /v1/auth/wallet/replace` now answers `410 endpoint_removed`.
Previous bindings are kept in an audited history that is not returned here.

## Parameters

None.

## Request

```bash
curl https://triport.io/v1/auth/wallets \
  -b cookies.txt
```

## Response

`200 OK`

```json
{
  "wallets": [
    {
      "family": "evm",
      "address": "0x52908400098527886e0f7030069857d2e4169ee7",
      "linked_at": "2026-09-27T17:58:41Z",
      "source": "login"
    },
    {
      "family": "solana",
      "address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "linked_at": "2026-09-27T18:40:02Z",
      "source": "link"
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `wallets[]` | array | Current bindings, at most one per family. Empty when nothing is linked. |
| `wallets[].family` | string | `evm` or `solana` (`tron` only for a binding made before 2026-09-29). |
| `wallets[].address` | string | Canonical address: EVM lower-case `0x…`, Solana base58, Tron base58 `T…`. |
| `wallets[].linked_at` | string (RFC 3339) | When this address became the binding. |
| `wallets[].source` | string | `login` (sign-in wallet) or `link` (attached later). |

The response carries only `wallets`. The former `email_code_required`,
`replace_cooldown_seconds`, `replace_available_at` and wallet-group fields were
removed on 2026-09-29 together with self-service replace.

## Errors

| Code | HTTP | When it happens |
|---|---|---|
| `unauthenticated` | 401 | No valid session cookie. |
| `method_not_allowed` | 405 | A method other than `GET`/`HEAD`. |
| `internal` | 500 | Server-side failure. |

## Notes

- **Accounts created before 2026-09-27** may still have more than one wallet in a
  family; every one of them is listed and counts as linked until an operator
  replace collapses the family to one.
- Family names here (`solana`) differ from the rail `family` values in
  [`GET /v1/billing/rails`](../billing/get-rails.md) (`sol`); `evm` and `tron` match.
