> Live version: https://triport.io/docs/sol/json-rpc/getTokenAccountsByOwner

# getTokenAccountsByOwner

> Returns all SPL Token accounts owned by a given wallet, filtered by a single mint or token program.

| | |
|---|---|
| **Method / Endpoint** | `getTokenAccountsByOwner` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 rps (free) / 60 rps (basic) / 200 rps (pro) / 600 rps (business), with burst |

## Description

`getTokenAccountsByOwner` returns every SPL Token account held by a wallet
(`owner`), narrowed by a required `filter`. You filter by **exactly one** of
`mint` (return only the owner's account(s) for that specific token) or
`programId` (return all of the owner's accounts owned by that token program,
e.g. the SPL Token program). You must supply one and only one of the two — not
both, and not neither.

Use it to discover a wallet's token holdings: which mints it holds, the address
of each token account, and — with `jsonParsed` encoding — the decoded balance
for each. Each entry in the result pairs the token account's `pubkey` with its
full on-chain `account` state, all read at a single slot so the snapshot is
internally consistent.

This is the standard Solana JSON-RPC method and works on any wallet. It is
distinct from the Digital Asset Standard
[`getTokenAccounts`](./getTokenAccounts.md), which is a `sol_das` method
(basic+ tier) with cursor pagination and a different result shape;
`getTokenAccountsByOwner` here is `sol_read_rpc` and available from the free
tier.

## Parameters

Positional params array: `[owner, filter, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `owner` | string (base-58 `Pubkey`) | yes | Wallet public key to query. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `filter` | object | yes | Exactly one of `mint` **or** `programId` (see below). |
| `config` | object | no | Optional configuration object (see below). |

### `filter` object (`TokenAccountsFilter`)

Provide **exactly one** of these keys:

| Name | Type | Description |
|---|---|---|
| `mint` | string (base-58 `Pubkey`) | Restrict results to token accounts for this single mint. |
| `programId` | string (base-58 `Pubkey`) | Restrict results to token accounts owned by this token program (e.g. `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` for SPL Token). |

### `config` object (`GetTokenAccountsConfig`)

| Name | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | One of `base58`, `base64`, `base64+zstd`, `jsonParsed`. `jsonParsed` decodes token balances into a readable object; `base58` is limited to account data under 129 bytes. |
| `commitment` | string | no | Confirmation level: `processed`, `confirmed`, or `finalized`. |
| `dataSlice` | object | no | Limits each returned account's data to a byte slice: `{ "offset": <integer>, "length": <integer> }`. Only valid with the binary encodings. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. The request fails if the node has not yet reached this slot. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTokenAccountsByOwner",
    "params": [
      "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
      { "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
      { "encoding": "jsonParsed", "commitment": "finalized" }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 348392041,
      "apiVersion": "2.0.18"
    },
    "value": [
      {
        "pubkey": "H7iLu4Dk5Q3eqe1bnZyRBcEKZbvWp8M4y6kqyq3RrtuV",
        "account": {
          "lamports": 2039280,
          "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "executable": false,
          "rentEpoch": 18446744073709551615,
          "space": 165,
          "data": {
            "program": "spl-token",
            "parsed": {
              "type": "account",
              "info": {
                "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "owner": "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
                "tokenAmount": {
                  "amount": "4200000",
                  "decimals": 6,
                  "uiAmount": 4.2,
                  "uiAmountString": "4.2"
                }
              }
            }
          }
        }
      }
    ]
  }
}
```

With a binary encoding (e.g. `base64`), each `account.data` is instead a
`[<data>, <encoding>]` tuple rather than the decoded `parsed` object shown
above.

### Response fields

The `result` is a `TokenAccountsResponse`: an `RpcContext` plus a `value` array
of `{ pubkey, account }` entries.

| Field | Type | Description |
|---|---|---|
| `context.slot` | integer | Slot at which all accounts were evaluated. |
| `context.apiVersion` | string | Version of the RPC node that served the request. |
| `value` | array | One entry per matching token account; empty if the owner holds none. |
| `value[i].pubkey` | string (base-58) | Address of the token account. |
| `value[i].account` | object | Full `AccountInfo` for the token account. |
| `value[i].account.lamports` | integer | Balance of the account in lamports. |
| `value[i].account.owner` | string (base-58) | Owning program (the token program), not the wallet. |
| `value[i].account.executable` | boolean | Whether the account holds a loaded program (always `false` for token accounts). |
| `value[i].account.rentEpoch` | integer | Epoch at which this account will next owe rent (`u64`). |
| `value[i].account.space` | integer | Size of the account data in bytes. |
| `value[i].account.data` | object \| array | Account data. For `jsonParsed`: a decoded object with `program`/`parsed`. For binary encodings: a `[<data>, <encoding>]` tuple. |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 400 | Invalid params | `owner` is not valid base-58, `filter` is missing or specifies both/neither of `mint`/`programId`, or `config` contains an invalid value (e.g. `base58` encoding on data larger than 129 bytes). |
| — | 403 | Tier insufficient | API key's tier/scope does not include `sol_read_rpc`. Rejected before the RPC layer: plain HTTP body `{"error":"tier_insufficient", …}` with an `X-Required-Tier` header — there is no JSON-RPC `error` object. |
| — | 429 | Rate limit exceeded | More than your tier's sustained RPS (with burst) was sent. Plain HTTP body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` and `X-RateLimit-Reset`. |
| `-32601` | 404 | Method not found | Method name misspelled or not available on this chain. |

Example rate-limit response — HTTP `429` with a plain body, not a JSON-RPC envelope:

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 20 requests/s for sol_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "sol_read_rpc",
  "limit_rps": 20,
  "burst_capacity": 40,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

See the shared [errors reference](../../errors.md) for the full envelope and
retry guidance.

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
    method: "getTokenAccountsByOwner",
    params: [
      "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
      { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
      { encoding: "jsonParsed", commitment: "finalized" },
    ],
  }),
});

const { result } = await res.json();
result.value.forEach(({ pubkey, account }) => {
  const { tokenAmount } = account.data.parsed.info;
  console.log(pubkey, tokenAmount.uiAmountString);
});
```

## Notes

- **Exactly one filter:** the `filter` object must contain `mint` **or**
  `programId`, never both and never neither. Use `mint` to look up a wallet's
  account for one specific token; use `programId` (e.g.
  `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`) to enumerate all of the
  wallet's token accounts under that program.
- **Token-2022:** to find Token-2022 accounts, filter by that program's
  `programId` rather than the legacy SPL Token program — the two live under
  different owning programs.
- **Encoding:** `jsonParsed` is the most convenient choice — it decodes mint,
  owner, and `tokenAmount` for each account. Use `base64`/`base64+zstd` when you
  need the raw account bytes; `base58` only works for data under 129 bytes, and
  `dataSlice` (binary encodings only) is ignored by `jsonParsed`.
- **Commitment:** use `confirmed` or `processed` to see changes sooner when you can
  tolerate possible rollbacks; `finalized` is the safest choice for settled
  state.
- **Empty result:** a wallet with no matching token accounts returns an empty
  `value` array (with a populated `context`), not an error.
- **Related methods:**
  [`getTokenAccountsByDelegate`](./getTokenAccountsByDelegate.md) (same shape,
  keyed by approved delegate instead of owner),
  [`getTokenAccounts`](./getTokenAccounts.md) (DAS variant, `sol_das` /
  basic+ tier, cursor-paginated),
  [`getMultipleAccounts`](./getMultipleAccounts.md), and
  [`getProgramAccounts`](./getProgramAccounts.md) (note its much stricter
  `sol_read_rpc_heavy` rate limits of 2 / 5 / 20 / 80 rps).
- **Tokens missing?** Token balances live in token accounts, per mint and per
  token program — see [why a Solana wallet's token balance is missing](https://triport.io/learn/solana-token-balance-missing).
