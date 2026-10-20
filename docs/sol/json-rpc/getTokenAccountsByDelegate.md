> Live version: https://triport.io/docs/sol/json-rpc/getTokenAccountsByDelegate

# getTokenAccountsByDelegate

> Returns all SPL Token accounts that have approved a given delegate, filtered by mint or by token program.

| | |
|---|---|
| **Method / Endpoint** | `getTokenAccountsByDelegate` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 rps (free) / 60 rps (basic) / 200 rps (pro) / 600 rps (business), with burst |

## Description

`getTokenAccountsByDelegate` returns every SPL Token account whose delegate
authority has been set to the public key you provide. When a token-account owner
calls `approve`, they grant a delegate the right to transfer up to a fixed
amount on their behalf; this method enumerates all accounts that have named a
particular delegate.

You must narrow the query with exactly one filter — either a specific `mint`
(only accounts of that token) or a `programId` (all accounts owned by that token
program, typically the SPL Token or Token-2022 program). The result is a
positional `value` array of `{ pubkey, account }` pairs read at a single slot,
so the set is internally consistent.

Use `jsonParsed` encoding to get a decoded token-account object (mint, owner,
delegate, token amount) instead of raw bytes — this is usually what you want for
displaying delegated balances. This is the delegate-keyed counterpart of
[`getTokenAccountsByOwner`](./getTokenAccountsByOwner.md), which keys by the
account owner instead.

## Parameters

Positional params array: `[delegate, filter, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `delegate` | string (base-58 `Pubkey`) | yes | Public key of the delegate to query for. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `filter` | object (`TokenAccountsFilter`) | yes | Exactly one of `mint` or `programId` (see below). |
| `config` | object (`GetTokenAccountsConfig`) | no | Optional configuration object (see below). |

### `filter` object (`TokenAccountsFilter`)

Provide **exactly one** of these keys:

| Name | Type | Description |
|---|---|---|
| `mint` | string (base-58 `Pubkey`) | Restrict results to token accounts of this specific mint. |
| `programId` | string (base-58 `Pubkey`) | Restrict results to accounts owned by this token program (e.g. `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`). |

### `config` object (`GetTokenAccountsConfig`)

| Name | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | One of `base58`, `base64`, `base64+zstd`, `jsonParsed`. Use `jsonParsed` for a decoded token-account object. `base58` is limited to account data under 129 bytes. |
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
    "method": "getTokenAccountsByDelegate",
    "params": [
      "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
      { "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
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
        "pubkey": "28YTZEwqtMHWrhWcvv34se7pjS7wctgqzCPB3gReCFKt",
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
                "owner": "FZ7B2... token-account owner ...",
                "delegate": "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
                "delegatedAmount": {
                  "amount": "5000000",
                  "decimals": 6,
                  "uiAmount": 5.0,
                  "uiAmountString": "5"
                },
                "state": "initialized",
                "tokenAmount": {
                  "amount": "12000000",
                  "decimals": 6,
                  "uiAmount": 12.0,
                  "uiAmountString": "12"
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

### Response fields

The `result` is a `TokenAccountsResponse`: an `RpcContext` plus a `value` array
of `{ pubkey, account }` pairs.

| Field | Type | Description |
|---|---|---|
| `context.slot` | integer | Slot at which all accounts were evaluated. |
| `context.apiVersion` | string | Version of the RPC node that served the request. |
| `value` | array | One entry per matching token account. Empty if the delegate has no approved accounts under the filter. |
| `value[i].pubkey` | string (base-58) | Address of the token account. |
| `value[i].account` | object (`AccountInfo`) | The account state (see below). |
| `value[i].account.lamports` | integer | Balance of the account in lamports. |
| `value[i].account.owner` | string (base-58) | Public key of the program that owns the account (the token program). |
| `value[i].account.executable` | boolean | Whether the account holds a loaded program (always `false` for token accounts). |
| `value[i].account.rentEpoch` | integer | Epoch at which this account will next owe rent (`u64`). |
| `value[i].account.space` | integer | Size of the account data in bytes. |
| `value[i].account.data` | object \| array | Account data. For `jsonParsed`: a decoded token-account object. For binary encodings: `[<data>, <encoding>]`. |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 400 | Invalid params | `delegate` is not valid base-58, the `filter` is missing or specifies neither/both of `mint`/`programId`, or `config` contains an invalid value (e.g. `base58` encoding on data larger than 129 bytes). |
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
    method: "getTokenAccountsByDelegate",
    params: [
      "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed", commitment: "finalized" },
    ],
  }),
});

const { result } = await res.json();
result.value.forEach(({ pubkey, account }) => {
  const info = account.data.parsed.info;
  console.log(pubkey, info.mint, info.delegatedAmount.uiAmountString);
});
```

## Notes

- **Exactly one filter:** the `filter` object must carry either `mint` or
  `programId`, not both and not neither. Use `mint` to scope to a single token;
  use `programId` (the SPL Token or Token-2022 program) to enumerate every
  delegated account across all mints.
- **Delegate vs. owner:** this method matches the token account's *delegate*
  authority, not its owner. To list accounts by their owner instead, use
  [`getTokenAccountsByOwner`](./getTokenAccountsByOwner.md).
- **Use `jsonParsed`:** for token accounts, `jsonParsed` decodes the layout into
  `mint`, `owner`, `delegate`, `delegatedAmount`, and `tokenAmount`, which is far
  easier to work with than raw bytes. Binary encodings (`base64`,
  `base64+zstd`) return the account as a `[data, encoding]` tuple; `base58` only
  works for data under 129 bytes.
- **Consistent snapshot:** all accounts are read at the single `context.slot`,
  so the returned set is internally consistent.
- **Commitment:** use `confirmed` or `processed` to see changes sooner when you can
  tolerate possible rollbacks; `finalized` is the safest choice for settled
  state.
- **Related methods:** [`getTokenAccountsByOwner`](./getTokenAccountsByOwner.md)
  (by owner), [`getTokenLargestAccounts`](./getTokenLargestAccounts.md), and
  [`getAccountInfo`](./getAccountInfo.md) (a single account by its address).
