> Live version: https://triport.io/docs/sol/json-rpc/getAccountInfo

# getAccountInfo

> Returns all information associated with the account of the given Solana public key.

| | |
|---|---|
| **Method / Endpoint** | `getAccountInfo` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 rps (free) / 60 rps (basic) / 200 rps (pro) / 600 rps (business), with burst |

## Description

`getAccountInfo` fetches the current on-chain state of a single account,
identified by its base-58 public key. It is the canonical way to read an
account's lamport balance, owning program, and raw or decoded data in one call.

Use it when you need the full picture of one account — for example to read a
token mint, a program-derived address (PDA), or a config account. If you only
need the SOL balance, prefer the lighter [`getBalance`](./getBalance.md); to read
many accounts in a single round-trip, use [`getMultipleAccounts`](./getMultipleAccounts.md).

The shape of the returned `data` depends on the `encoding` you request. Binary
encodings (`base58`, `base64`, `base64+zstd`) return the raw account bytes as a
`[data, encoding]` tuple. With `jsonParsed`, well-known program accounts (System,
SPL Token, etc.) are decoded into structured JSON; if no parser is available the
response falls back to the binary tuple. When the account does not exist, `value`
is `null` while `context` is still populated.

## Parameters

Positional params array: `[pubkey, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `pubkey` | string (base-58 `Pubkey`) | yes | Public key of the account to query. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object (`GetAccountInfoConfig`)

| Name | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | One of `base58`, `base64`, `base64+zstd`, `jsonParsed`. Defaults to `base64`. `base58` is limited to account data under 129 bytes. |
| `commitment` | string | no | Confirmation level: `processed`, `confirmed`, or `finalized`. |
| `dataSlice` | object | no | Limits the returned data to a byte slice: `{ "offset": <integer>, "length": <integer> }`. Only valid with the binary encodings. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. The request fails if the node has not yet reached this slot. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAccountInfo",
    "params": [
      "So11111111111111111111111111111111111111112",
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
    "value": {
      "lamports": 2039280,
      "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      "executable": false,
      "rentEpoch": 18446744073709551615,
      "space": 165,
      "data": [
        "z9eXmHQADh7AIE0Q...base64-encoded-account-bytes...",
        "base64"
      ]
    }
  }
}
```

When the account does not exist, `value` is `null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": { "slot": 348392041, "apiVersion": "2.0.18" },
    "value": null
  }
}
```

### Response fields

The `result` is an `AccountInfoResponse`: an `RpcContext` plus a nullable
`AccountInfo` value.

| Field | Type | Description |
|---|---|---|
| `context.slot` | integer | Slot at which the data was evaluated. |
| `context.apiVersion` | string | Version of the RPC node that served the request. |
| `value` | object \| null | Account state, or `null` if the account does not exist. |
| `value.lamports` | integer | Balance of the account in lamports. |
| `value.owner` | string (base-58) | Public key of the program that owns the account. |
| `value.executable` | boolean | Whether the account holds a loaded program. |
| `value.rentEpoch` | integer | Epoch at which this account will next owe rent (`u64`). |
| `value.space` | integer | Size of the account data in bytes. |
| `value.data` | array \| object | Account data. For binary encodings: `[<data>, <encoding>]`. For `jsonParsed`: a decoded object, or the binary tuple if no parser matched. |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 400 | Invalid params | `pubkey` is not valid base-58, or `config` contains an invalid value (e.g. `base58` encoding on data larger than 129 bytes). |
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
    method: "getAccountInfo",
    params: [
      "So11111111111111111111111111111111111111112",
      { encoding: "jsonParsed", commitment: "finalized" },
    ],
  }),
});

const { result } = await res.json();
console.log(result.value); // null if the account does not exist
```

## Notes

- **Encoding & size:** `base58` only works for account data smaller than 129
  bytes; use `base64` or `base64+zstd` for larger accounts. `base64+zstd`
  compresses the bytes before base-64 encoding, which is worth it for large
  accounts.
- **`dataSlice`:** combine with a binary encoding to fetch only a window of the
  account's bytes — handy for reading a single field out of a large account
  without transferring the whole thing. It is ignored by `jsonParsed`.
- **Commitment:** use `confirmed` or `processed` when you need changes sooner and
  can tolerate possible rollbacks; `finalized` is the safest choice for
  settled state.
- **Related methods:** [`getBalance`](./getBalance.md) (lamports only),
  [`getMultipleAccounts`](./getMultipleAccounts.md) (batch reads), and
  [`getProgramAccounts`](./getProgramAccounts.md) (all accounts owned by a
  program — note its much stricter `sol_read_rpc_heavy` rate limits of
  2 / 5 / 20 / 80 rps).
