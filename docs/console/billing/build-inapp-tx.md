> Live version: https://triport.io/docs/console/billing/build-inapp-tx

# Build in-app transaction

> Build the unsigned transaction that pays an in-app invoice from the customer's linked wallet — Solana or EVM (Ethereum / BSC / Polygon) — ready for the wallet to sign.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/billing/invoices/{id}/inapp/build` |
| **Type** | Triport Console API |
| **Network** | Solana / Ethereum / BNB Smart Chain / Polygon (by the invoice's rail) |
| **Authentication** | Session cookie (console login) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Builds the transaction that pays a `crypto-inapp` invoice from the customer's
own wallet. You pass the wallet address as `payer`; the backend routes by the
rail's `family` (see [`GET /v1/billing/rails`](./get-rails.md)) and returns a
transaction for the remaining amount due, addressed to the invoice's deposit
address:

| Rail family | Rails | What you get | What the wallet does |
|---|---|---|---|
| `sol` | `sol-native`, `sol-spl-usdc`, `sol-spl-usdt` | `transaction_b64`: unsigned legacy tx (`SystemProgram::Transfer` or SPL `TransferChecked` + invoice reference key; creates the recipient token account if needed) | sign and send (`signAndSendTransaction`), or sign only and submit `signed_b64` |
| `evm` | `eth-*`, `bsc-*`, `polygon-*` (USDT/USDC) | `{chain_id, to, data, value}` — an ERC-20 `transfer(deposit, amount)` call | switch to `chain_id`, then `eth_sendTransaction({from: payer, to, data, value})` |

**Tron is not paid in-app.** `tron-usdt` is offered only as an on-chain
transfer (`crypto-onchain`: send USDT to the invoice's deposit address); its
`inapp_build` is `false`, so `build` / `submit` answer
`400 inapp_rail_unsupported` for it.

**Linked payer only.** `payer` must be the account's currently linked wallet of
that family (see [`GET /v1/auth/wallets`](../auth/wallets.md)); any other address
gets `403 payer_not_linked` before anything is built. Link the wallet first
([`wallet/link`](../auth/wallet-link.md)); a linked wallet can be changed only by
support (self-service replace was removed on 2026-09-29).

Building does not sign, send or settle anything. After the wallet signs (and
possibly sends), call [`POST …/inapp/submit`](./submit-inapp-tx.md). The invoice
turns `paid` only when the deposit watcher sees the transfer on chain with the
rail's confirmations — follow it on the
[invoice event stream](./invoice-events.md).

Gate the feature on the rail's `inapp_build` flag; rails where it is `false`
answer `400 inapp_rail_unsupported` (or `503 inapp not configured` when in-app is
off entirely).

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Invoice id. Must belong to the signed-in user, be `pending`, not expired, and use the `crypto-inapp` channel. |

### Request body

| Name | Type | Required | Description |
|---|---|---|---|
| `payer` | string | yes | The paying wallet: Solana base58 pubkey; EVM `0x…` (EIP-55 checked if mixed case). Must be the linked wallet of the rail's family and differ from the deposit address. |

## Request

```bash
curl https://triport.io/v1/billing/invoices/inv_8f2a1c9d4e6b40f1/inapp/build \
  -H "Content-Type: application/json" \
  -b "nl_session=$NL_SESSION" \
  -d '{ "payer": "0x52908400098527886E0F7030069857D2E4169EE7" }'
```

> Console session cookie, not an API key. Send from the same origin or with
> `credentials: "include"`.

## Response

### Solana (`family: sol`)

```json
{
  "transaction_b64": "AQABBJ5xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin...AAAA",
  "blockhash": "9XYZb7uA3kZxRq4Yb8pY2v9bN1cR7sQ2sJ3oU9d2W6kq",
  "blockhash_valid_until": "2026-09-27T12:05:30Z"
}
```

| Field | Type | Description |
|---|---|---|
| `transaction_b64` | string | Base64 unsigned legacy transaction. |
| `blockhash` | string | Recent blockhash used. |
| `blockhash_valid_until` | string (RFC 3339) | Conservative expiry (~90 s). After it, build again instead of submitting. |

### EVM (`family: evm`)

```json
{
  "family": "evm",
  "rail": "bsc-usdt",
  "network": "bsc",
  "chain_id": 56,
  "chain_id_hex": "0x38",
  "token": "USDT",
  "to": "0x55d398326f99059fF775485246999027B3197955",
  "data": "0xa9059cbb000000000000000000000000…0000000000000000000000000000000000000de0b6b3a7640000",
  "value": "0x0",
  "amount_units": "1000000000000000000",
  "invoice_amount_units": "1000000000000000000",
  "decimals": 18,
  "deposit_address": "0x3a1F9C7b2E54d8A6f0B19c4D2e7A8b6C5d4E3f21",
  "payer": "0x52908400098527886E0F7030069857D2E4169EE7",
  "expires_at": "2026-09-27T13:05:30Z",
  "simulation": "ok"
}
```

| Field | Type | Description |
|---|---|---|
| `chain_id`, `chain_id_hex` | number, string | Network to send on: `1`, `56`, `137`. Switch the wallet (`wallet_switchEthereumChain`) and verify `eth_chainId` before sending. |
| `to`, `data`, `value` | string | The call: token contract, ERC-20 `transfer` calldata, `0x0`. Gas is estimated by the wallet. |
| `amount_units` | string | Amount encoded in `data` = **remaining** amount due, in token base units (decimal string). |
| `invoice_amount_units` | string | Full invoice amount in base units. |
| `credited_units` | string | Already credited (omitted if unknown). |
| `decimals` | number | Token decimals (18 on BSC). |
| `deposit_address`, `payer` | string | EIP-55 addresses. |
| `expires_at` | string (RFC 3339) | Invoice expiry. |
| `simulation` | string | Best-effort dry run: `ok`, `transfer_reverted` (e.g. blacklisted or paused token — informational), `unavailable`. |

## Errors

EVM returns stable codes in `{"error": "<code>", …}`. Solana returns
free-form strings that start with the code (e.g. `"invoice_not_pending: paid"`) —
compare by prefix.

| Code | HTTP | When it happens |
|---|---|---|
| `auth required` | 401 | No valid session. |
| `invoice not found` | 404 | No such invoice, or it belongs to another user. |
| `inapp_rail_unsupported` | 400 | In-app is disabled for this rail's family (body carries `rail`). |
| `invoice_not_inapp`, `rail_not_solana_inapp` / `rail_not_evm_inapp` | 400 | Wrong channel or rail. |
| `bad json…`, `payer required`, bad payer address, `payer_equals_recipient` | 400 | Invalid `payer`. |
| `payer_not_linked` | 403 | `payer` is not the linked wallet of the family. Body: `{ "error", "family", "hint": "link_or_replace", "message" }`; `message` asks the user to pay from the linked wallet and to contact support to change it (the `hint` value is kept for compatibility). |
| `invoice_not_pending` | 409 | The invoice is no longer `pending`. |
| `invoice_already_funded` | 409 | EVM: the full amount is already credited while the invoice is still settling. Body adds `invoice_amount_units`, `credited_units`. |
| `invoice_expired` | 410 | The invoice expired. |
| `insufficient_token_balance` | 422 | EVM: the payer holds less than `amount_units`. Body adds `token`, `decimals`, `balance_units`, `amount_units`. |
| `build_failed: …`, `rpc_unavailable: …` | 502 / 503 | Solana: upstream RPC failed. |
| `payer_check_unavailable` | 503 | The linked-wallet check could not run; retry (`Retry-After: 2`). |
| `billing_unavailable` | 503 | Billing is temporarily unavailable on this node (failover or maintenance); retry after `Retry-After`. |
| `inapp not configured` | 503 | In-app payments are disabled on this deployment. |

See [Errors](../../errors.md) for the shared envelope.

## Examples

### JavaScript (fetch) — EVM

```js
const res = await fetch(`https://triport.io/v1/billing/invoices/${invoiceId}/inapp/build`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payer }),
});
const b = await res.json();
if (!res.ok) throw new Error(b.error);

await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: b.chain_id_hex }] });
if ((await provider.request({ method: 'eth_chainId' })) !== b.chain_id_hex) throw new Error('wrong_chain');
const txHash = await provider.request({
  method: 'eth_sendTransaction',
  params: [{ from: payer, to: b.to, data: b.data, value: b.value }],
});
// then POST …/inapp/submit { tx_hash: txHash }
```

## Notes

- **Remaining amount.** After a partial payment, build asks only for what is
  still due (`amount_units`); the watcher credits partial payments as they land.
- **Payments from other wallets** (e.g. a manual transfer to the deposit address)
  are still credited, but flagged: the invoice then shows `payer_linked: false`
  (see [Get invoice](./get-invoice.md)).
- **Settlement is asynchronous** and needs the rail's `confirmations`
  (eth 12, bsc 15, polygon 30, sol 1).
