> Live version: https://triport.io/docs/console/billing/get-rails

# List payment rails

> Returns the catalog of payment rails (network + token combinations) the platform can accept, so the frontend can build its payment channel/rail selector.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/billing/rails` |
| **Type** | Triport Console API |
| **Network** | — (multi-network catalog) |
| **Authentication** | None — this endpoint is public |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/billing/rails` lists every payment rail the platform currently
supports. A **rail** is a concrete `network` + `token` pair (for example USDC on
Polygon, or native SOL) together with the metadata needed to render and validate
a payment: how many decimals the token has, how many confirmations settle a
payment, which channels accept it, and whether an FX rate must be supplied when
creating an invoice.

This endpoint is **unauthenticated** by design: the frontend calls it before the
user logs in — for example, to build the rail selector on a public pricing page
— so it carries no session cookie and requires no scope. It returns only static,
non-sensitive catalog data.

Call this endpoint first, then use the returned `id` as the `rail` value (and a
member of `channels` as the `channel` value) when creating an invoice. If the
rail registry is unavailable, the endpoint still responds `200 OK` with an empty
`rails` array rather than an error.

## Parameters

This endpoint takes no path params, query params, or request body.

## Request

```bash
curl https://triport.io/v1/billing/rails
```

No `Authorization` header is needed. (Sending one is harmless — it is ignored.)

## Response

Live response excerpt (3 of the 11 rails, `https://triport.io`, 2026-09-27):

```json
{
  "rails": [
    {
      "id": "sol-spl-usdc",
      "display_name": "USDC on Solana",
      "network": "sol",
      "token": "USDC",
      "decimals": 6,
      "confirmations": 1,
      "channels": ["crypto-onchain", "crypto-inapp"],
      "supports_inapp": true,
      "fx_rate_required": false,
      "family": "sol",
      "chain_name": "Solana",
      "native_symbol": "SOL",
      "explorer_url": "https://solscan.io",
      "native": false,
      "token_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "inapp_build": true
    },
    {
      "id": "eth-usdt",
      "display_name": "USDT on Ethereum",
      "network": "eth",
      "token": "USDT",
      "decimals": 6,
      "confirmations": 12,
      "channels": ["crypto-onchain", "crypto-inapp"],
      "supports_inapp": true,
      "fx_rate_required": false,
      "family": "evm",
      "chain_name": "Ethereum",
      "chain_id": 1,
      "native_symbol": "ETH",
      "explorer_url": "https://etherscan.io",
      "native": false,
      "token_contract": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "inapp_build": true
    },
    {
      "id": "tron-usdt",
      "display_name": "USDT on Tron",
      "network": "tron",
      "token": "USDT",
      "decimals": 6,
      "confirmations": 19,
      "channels": ["crypto-onchain", "crypto-inapp"],
      "supports_inapp": true,
      "fx_rate_required": false,
      "family": "tron",
      "chain_name": "Tron",
      "native_symbol": "TRX",
      "explorer_url": "https://tronscan.org",
      "native": false,
      "token_contract": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "token_contract_hex": "0xa614f803b6fd780986a42c78ec9c7f77e6ded13c",
      "inapp_build": false
    }
  ]
}
```

### Response fields

The top-level object has a single key, `rails`, an array of `RailInfo` objects:

| Field | Type | Description |
|---|---|---|
| `id` | string | Rail identifier. Use this as the `rail` value when creating an invoice. One of: `sol-native`, `sol-spl-usdc`, `sol-spl-usdt`, `tron-usdt`, `tron-usdc`, `eth-usdt`, `eth-usdc`, `bsc-usdt`, `bsc-usdc`, `polygon-usdc`, `polygon-usdt`. |
| `display_name` | string | Human-readable label for the rail, suitable for showing in a selector. |
| `network` | string | Underlying network. One of: `sol`, `eth`, `bsc`, `tron`, `polygon`, `ton`. |
| `token` | string | Token symbol accepted on this rail (e.g. `SOL`, `USDC`, `USDT`). |
| `decimals` | number | Number of decimal places in the token's atomic unit. |
| `confirmations` | number | On-chain confirmations required before a payment is considered settled. |
| `channels` | string[] | Payment channels this rail can be used with. Each value is one of `crypto-onchain` or `crypto-inapp`. Use a member of this array as the `channel` value when creating an invoice. |
| `supports_inapp` | boolean | `true` if the rail is configured with the `crypto-inapp` channel (also reflected by `crypto-inapp` appearing in `channels`). This does **not** guarantee that an in-app transaction can be built right now — use `inapp_build`. |
| `fx_rate_required` | boolean | `true` if an FX rate (`fx_rate_micro_per_atomic`) must be supplied when creating an invoice on this rail — typically the case for volatile native tokens, and `false` for stablecoins. |
| `inapp_build` | boolean | `true` when [`POST /v1/billing/invoices/{id}/inapp/build`](./build-inapp-tx.md) works for this rail **now**: the rail has the `crypto-inapp` channel and the in-app builder for its family is enabled on the server. Gate "pay from wallet" on this field. Today it is `true` for the Solana and EVM rails and `false` for `tron-usdt` (Tron is paid by on-chain transfer only). |
| `family` | string | Wallet family (namespace) that pays this rail: `sol`, `evm` or `tron`. |
| `chain_name` | string | `Solana`, `Ethereum`, `BNB Smart Chain`, `Polygon` or `Tron`. |
| `chain_id` | number | EVM only: `1` (Ethereum), `56` (BSC), `137` (Polygon). Omitted on other families. |
| `native_symbol` | string | The chain's gas coin: `SOL`, `ETH`, `BNB`, `POL`, `TRX`. |
| `explorer_url` | string | Block explorer base URL (`https://solscan.io`, `https://etherscan.io`, `https://bscscan.com`, `https://polygonscan.com`, `https://tronscan.org`). |
| `native` | boolean | `true` only for `sol-native` (a native-coin transfer, not a token). |
| `token_contract` | string | Token contract: EIP-55 hex on EVM, base58 `T…` on Tron. Omitted on Solana. |
| `token_contract_hex` | string | Tron only: the contract as `0x` hex. |
| `token_mint` | string | Solana SPL rails only: the token mint (base58). |

All metadata comes from the server's compiled rail adapters, the same values the
deposit watchers use, so clients should take contracts, mints, chain ids and
decimals from here instead of hard-coding them. Note that **BSC USDT/USDC use 18
decimals**.

## Errors

This endpoint does not return application-level error codes for normal use. It
always responds `200 OK`; when the rail registry is not initialized it returns
`{ "rails": [] }` rather than an error.

| Code | Meaning | When it happens |
|---|---|---|
| `200` | OK | Always, including when the catalog is empty. |
| `500` | Internal error | Unexpected server-side failure while encoding the response. |

See the shared [errors](../../errors.md) page for the standard error envelope
used by the rest of the billing API.

## Examples

### JavaScript (fetch)
```js
const res = await fetch('https://triport.io/v1/billing/rails');
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const { rails } = await res.json();

// Show only rails that can be paid from a connected wallet right now
const walletRails = rails.filter((r) => r.inapp_build);
console.log(walletRails.map((r) => `${r.display_name} [${r.family}]`));
```

## Notes

- **No authentication, no rate-limit tier.** This is the only billing endpoint
  that is public; all invoice and balance endpoints require a session cookie.
- **Use the output to drive invoice creation.** Feed the rail's `id` into the
  `rail` field and one of its `channels` into the `channel` field of
  `POST /v1/billing/invoices`. See the
  [create invoice](./create-invoice.md) reference.
- **`fx_rate_required`.** When `true`, the invoice request must include
  `fx_rate_micro_per_atomic`; otherwise the backend resolves pricing on its own.
- **Empty array is valid.** Treat `{ "rails": [] }` as "no rails currently
  offered," not as an error.
