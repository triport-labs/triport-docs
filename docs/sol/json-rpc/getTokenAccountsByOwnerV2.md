> Live version: https://triport.io/docs/sol/json-rpc/getTokenAccountsByOwnerV2

# getTokenAccountsByOwnerV2

> Enhanced, paginated version of `getTokenAccountsByOwner` that returns the SPL token accounts owned by a given address.

> **Beta — live on every tier.** `getTokenAccountsByOwnerV2` is served on the
> public Solana endpoint today (checked against production on 2026-09-22):
> paging with `limit` / `paginationKey` works as documented below. What is not
> final yet is the *published* schema — the OpenRPC spec still declares no
> parameters and types the result as an open object until spec version
> **api.2.2**+. The field names on this page are the ones the endpoint returns
> now; re-check this page before relying on anything not listed here.

| | |
|---|---|
| **Status** | 🚧 **Beta** — live on all tiers; published schema not final (`api.2.2`+) |
| **Method / Endpoint** | `getTokenAccountsByOwnerV2` |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTokenAccountsByOwnerV2` returns the SPL token accounts owned by a given
wallet address, filtered by either a specific mint or a token program. It is the
enhanced successor to [`getTokenAccountsByOwner`](./getTokenAccountsByOwner.md):
the V2 variant adds cursor-based pagination (`limit` / `paginationKey`), so
owners holding large numbers of token accounts can be enumerated reliably
without hitting response-size limits.

Use it when you want to list a wallet's token balances — for example to render a
portfolio view or to find the associated token account for a particular mint.
For a single mint you should still pass a `filter` so the validator only returns
the relevant accounts rather than the owner's entire token set.

This method is served directly from the validator (not the DAS index), so it is
available on the **Free** trial and up under the `sol_read_rpc` category. It is
*not* one of the heavily throttled `sol_read_rpc_heavy` methods, so it carries
the standard 20 / 60 / 200 / 600 RPS limits.

## Parameters

JSON-RPC positional parameters `[owner, filter, config?]`:

| Name | Type | Required | Description |
|---|---|---|---|
| `owner` | string (base-58 pubkey) | yes | Owner account whose token accounts are returned. |
| `filter` | object | yes | Filter selecting which token accounts to return. Exactly one of `mint` or `programId` is expected. |
| `filter.mint` | string (base-58 pubkey) | no* | Return only accounts holding this specific mint. |
| `filter.programId` | string (base-58 pubkey) | no* | Return all accounts owned by this token program (e.g. the SPL Token program). |
| `config` | object | no | Optional encoding / commitment configuration. |
| `config.commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `config.encoding` | string | no | Account-data encoding: `base58`, `base64`, `base64+zstd`, or `jsonParsed`. |
| `config.dataSlice` | object | no | `{ offset, length }` to return a slice of account data. |
| `config.minContextSlot` | integer | no | Minimum slot at which the request can be evaluated. |
| `config.limit` | integer | no | Maximum number of accounts to return per page (V2 pagination). Without it, a page held 1,000 accounts in our 2026-09-22 check. |
| `config.paginationKey` | string | no | Opaque cursor returned by a prior call to fetch the next page (V2 pagination). |

\* Exactly one of `filter.mint` or `filter.programId` is required, matching the
behavior of `getTokenAccountsByOwner`. `limit` and `paginationKey` are the V2
additions.

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenAccountsByOwnerV2",
    "params": [
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
      { "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
      { "encoding": "jsonParsed", "limit": 1 }
    ]
  }'
```

## Response

Unlike `getTokenAccountsByOwner`, whose `value` is a bare array, V2 returns a
page object under `value`: the `accounts` array, the cursor for the next page
and the number of accounts in this page. Response to a `limit: 1` request
(owner `5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1`, USDC mint):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 449454232
    },
    "value": {
      "accounts": [
        {
          "pubkey": "1yYy5Vcy5Zop8Q2cPeJhyPtGpn5G46XWMZCR4s6F4y",
          "account": {
            "lamports": 2039280,
            "data": {
              "program": "spl-token",
              "parsed": {
                "info": {
                  "isNative": false,
                  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                  "owner": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
                  "state": "initialized",
                  "tokenAmount": {
                    "amount": "6131218",
                    "decimals": 6,
                    "uiAmount": 6.131218,
                    "uiAmountString": "6.131218"
                  }
                },
                "type": "account"
              },
              "space": 165
            },
            "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
            "executable": false,
            "rentEpoch": 18446744073709551615,
            "space": 165
          }
        }
      ],
      "paginationKey": "1yYy5Vcy5Zop8Q2cPeJhyPtGpn5G46XWMZCR4s6F4z",
      "count": 1
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.context.slot` | integer | Slot at which the data was read. |
| `result.value.accounts` | array | Matching token accounts in this page. |
| `result.value.accounts[].pubkey` | string | Base-58 address of the token account. |
| `result.value.accounts[].account` | object | The decoded account: `lamports`, `owner`, `data`, `executable`, `rentEpoch`, `space`. |
| `result.value.accounts[].account.data` | object/array | Account data, encoded per `config.encoding` (object when `jsonParsed`, `[<data>, <encoding>]` for binary encodings). |
| `result.value.paginationKey` | string \| null | Cursor for the next page — pass it back as `config.paginationKey`; `null` on the last page. |
| `result.value.count` | integer | Number of accounts in this page. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` API key. |
| `403` | Forbidden / tier too low | Your plan is below the tier this method requires. |
| `429` | Rate limited | You exceeded the requests-per-second limit for your tier (RPS + burst; there is no daily quota). |
| `403` | Unknown method | Method name misspelled — plain HTTP body `{"error":"method_unknown", …}`, no JSON-RPC envelope. |
| `-32602` | Invalid params | Parameters did not match — e.g. missing `owner` or a `filter` with neither `mint` nor `programId`. |

See the shared [errors reference](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenAccountsByOwnerV2",
    params: [
      "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
      { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
      { encoding: "jsonParsed", limit: 100 },
    ],
  }),
});

const { result } = await res.json();
const { accounts, paginationKey } = result.value;
console.log(accounts.length, "accounts; next page:", paginationKey); // null on the last page
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

// Beta method: the SDK types the result as `unknown` until the api.2.2+ schema ships.
const result = await client.solana.rpc("getTokenAccountsByOwnerV2", [
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
  { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  { encoding: "jsonParsed", limit: 100 },
]);

console.log(result);
```

## Notes

- **Beta: published schema not final.** The endpoint serves V2 today and the
  fields above are what it returns; the OpenRPC schema still declares no params
  and an open result object until spec **api.2.2**+. Re-check this page when
  that spec ships.
- **Tier:** available on the **Free** trial and up under `sol_read_rpc`
  (20 / 60 / 200 / 600 RPS for free / basic / pro / business). See
  [rate limits and tiers](../../rate-limits-and-tiers.md).
- **Filter required:** as with `getTokenAccountsByOwner`, supply exactly one of
  `filter.mint` or `filter.programId`. Use `mint` to find a single associated
  token account and `programId` (the SPL Token program) to list all of an owner's
  token accounts.
- **Pagination:** pass `limit`, then send each response's
  `value.paginationKey` back as `config.paginationKey`; keep requesting pages
  until it comes back `null`.
- **Related methods:** [`getTokenAccountsByOwner`](./getTokenAccountsByOwner.md)
  (the non-paginated original), [`getTokenAccountBalance`](./getTokenAccountBalance.md),
  and the DAS-indexed [`getTokenAccounts`](./getTokenAccounts.md).
