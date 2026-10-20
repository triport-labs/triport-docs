> Live version: https://triport.io/docs/sol/json-rpc/getMultipleAccounts

# getMultipleAccounts

> Returns the account information for a list of Solana public keys in a single round-trip.

| | |
|---|---|
| **Method / Endpoint** | `getMultipleAccounts` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 rps (free) / 60 rps (basic) / 200 rps (pro) / 600 rps (business), with burst |

## Description

`getMultipleAccounts` fetches the current on-chain state of several accounts at
once, identified by their base-58 public keys. It is the batched counterpart of
[`getAccountInfo`](./getAccountInfo.md): instead of one request per account, you
pass up to **100** public keys and receive one `AccountInfo` entry per key, in
the same order you requested them.

Use it whenever you would otherwise loop over `getAccountInfo` — for example to
read a set of token accounts, several PDAs, or a basket of mints — to cut
latency and stay well within your rate limit. All accounts are read at the same
slot, so the returned values are mutually consistent.

The `value` array is positional and the same length as the `pubkeys` you sent.
Any account that does not exist comes back as a `null` entry at that position
(the surrounding array and `context` are still populated). The shape of each
account's `data` field depends on the `encoding` you request, exactly as for
`getAccountInfo`.

## Parameters

Positional params array: `[pubkeys, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `pubkeys` | array of string (base-58 `Pubkey`) | yes | Public keys of the accounts to query, up to **100**. Each must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object (`GetAccountInfoConfig`)

| Name | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | One of `base58`, `base64`, `base64+zstd`, `jsonParsed`. Defaults to `base64`. `base58` is limited to account data under 129 bytes. |
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
    "method": "getMultipleAccounts",
    "params": [
      [
        "So11111111111111111111111111111111111111112",
        "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA"
      ],
      { "encoding": "base64", "commitment": "finalized" }
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
        "lamports": 2039280,
        "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "executable": false,
        "rentEpoch": 18446744073709551615,
        "space": 165,
        "data": [
          "z9eXmHQADh7AIE0Q...base64-encoded-account-bytes...",
          "base64"
        ]
      },
      null
    ]
  }
}
```

The second entry is `null` because no account exists at that public key. The
`value` array is always the same length and order as the `pubkeys` you sent.

### Response fields

The `result` is a `MultipleAccountsResponse`: an `RpcContext` plus a `value`
array of nullable `AccountInfo` objects.

| Field | Type | Description |
|---|---|---|
| `context.slot` | integer | Slot at which all accounts were evaluated. |
| `context.apiVersion` | string | Version of the RPC node that served the request. |
| `value` | array | One entry per requested public key, in the same order. |
| `value[i]` | object \| null | Account state, or `null` if that account does not exist. |
| `value[i].lamports` | integer | Balance of the account in lamports. |
| `value[i].owner` | string (base-58) | Public key of the program that owns the account. |
| `value[i].executable` | boolean | Whether the account holds a loaded program. |
| `value[i].rentEpoch` | integer | Epoch at which this account will next owe rent (`u64`). |
| `value[i].space` | integer | Size of the account data in bytes. |
| `value[i].data` | array \| object | Account data. For binary encodings: `[<data>, <encoding>]`. For `jsonParsed`: a decoded object, or the binary tuple if no parser matched. |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 400 | Invalid params | A `pubkey` is not valid base-58, more than 100 keys were sent, or `config` contains an invalid value (e.g. `base58` encoding on data larger than 129 bytes). |
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
    method: "getMultipleAccounts",
    params: [
      [
        "So11111111111111111111111111111111111111112",
        "4fYNw3dojWmQ4dXtSGE9epjRGy9pFSx62YypT7avPYvA",
      ],
      { encoding: "jsonParsed", commitment: "finalized" },
    ],
  }),
});

const { result } = await res.json();
result.value.forEach((account, i) => {
  if (account === null) console.log(`account ${i} does not exist`);
  else console.log(account.lamports, account.owner);
});
```

## Notes

- **100-key limit:** at most 100 public keys per call. Split larger sets across
  multiple requests and stay within your tier's RPS.
- **Positional results:** `value` is parallel to `pubkeys` — index `i` of the
  response always corresponds to index `i` of the request, with `null` for any
  missing account. Don't assume non-null entries; check each.
- **Consistent snapshot:** every account is read at the single `context.slot`,
  so the batch is internally consistent — an advantage over issuing separate
  `getAccountInfo` calls.
- **Encoding & size:** `base58` only works for account data smaller than 129
  bytes; use `base64` or `base64+zstd` for larger accounts. `dataSlice` (binary
  encodings only) fetches just a window of each account's bytes and is ignored
  by `jsonParsed`.
- **Commitment:** use `confirmed` or `processed` to see changes sooner when you can
  tolerate possible rollbacks; `finalized` is the safest choice for settled
  state.
- **Related methods:** [`getAccountInfo`](./getAccountInfo.md) (single account),
  [`getBalance`](./getBalance.md) (lamports only), and
  [`getProgramAccounts`](./getProgramAccounts.md) (all accounts owned by a
  program — note its much stricter `sol_read_rpc_heavy` rate limits of
  2 / 5 / 20 / 80 rps).
