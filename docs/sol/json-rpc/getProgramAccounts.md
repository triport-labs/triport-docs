> Live version: https://triport.io/docs/sol/json-rpc/getProgramAccounts

# getProgramAccounts

> Returns all accounts owned by a given Solana program, optionally narrowed by data-size and memcmp filters.

| | |
|---|---|
| **Method / Endpoint** | `getProgramAccounts` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc_heavy` |
| **Tier / rate limit** | free+ — **2 rps (free) / 5 rps (basic) / 20 rps (pro) / 80 rps (business)**, with burst |

## Description

`getProgramAccounts` returns every account whose `owner` is the supplied
`programId`. It is the canonical way to enumerate program state — for example,
all token accounts of a mint, all open orders on a market, or all PDAs created
by your own program.

This is a **heavy** method (`sol_read_rpc_heavy` category) and is rate-limited
far more strictly than standard read RPC: just **2 rps on the Free trial**, up to
80 rps on business. A single unfiltered call can scan a very large account set,
so always narrow the result with `filters` (a `memcmp` byte match and/or a
`dataSize` match) and request only the bytes you need with `dataSlice`. Treat
this method as expensive and cache its results where you can.

By default the result is a plain array of `ProgramAccount` objects. Set
`withContext: true` to wrap the array in an `RpcContext` envelope (`{ context,
value }`), which is useful when you need the slot the result was evaluated at.

## Parameters

JSON-RPC `params` is a positional array: `[programId, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `programId` | string (base-58 `Pubkey`) | yes | Public key of the owning program. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object (`GetProgramAccountsConfig`)

| Field | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | Account-data encoding for each result: `base58`, `base64`, `base64+zstd`, or `jsonParsed`. |
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `dataSlice` | object | no | Limits returned account data to a byte window: `{ "offset": <integer>, "length": <integer> }`. Only valid with binary encodings. |
| `filters` | array | no | Up to-N filter objects (logical AND). Each is either a `dataSize` filter or a `memcmp` filter (see below). |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. The request fails if the node has not yet reached this slot. |
| `withContext` | boolean | no | When `true`, wraps the result array in an `RpcContext` envelope (`{ context, value }`). Defaults to `false`. |

### `filters` entries (`AccountFilter`)

Each entry in `filters` is an object with **one** of:

| Field | Type | Description |
|---|---|---|
| `dataSize` | integer | Matches accounts whose data length is exactly this many bytes. |
| `memcmp` | object | Matches accounts whose data, at a byte offset, equals the given bytes. |

The `memcmp` object:

| Field | Type | Description |
|---|---|---|
| `offset` | integer | Byte offset into the account data at which the comparison starts. |
| `bytes` | string | The bytes to match, encoded per `encoding`. |
| `encoding` | string | Encoding of `bytes` (e.g. `base58`, `base64`). |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getProgramAccounts",
    "params": [
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      {
        "encoding": "base64",
        "commitment": "finalized",
        "filters": [
          { "dataSize": 165 },
          { "memcmp": { "offset": 0, "bytes": "So11111111111111111111111111111111111111112", "encoding": "base58" } }
        ]
      }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "pubkey": "CxELquR1gPP8wHe33gZ4QxqGB3sZ9RSwsJ2KshVewkFY",
      "account": {
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
  ]
}
```

With `withContext: true`, the array is wrapped in an envelope:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": { "slot": 348392041, "apiVersion": "2.0.18" },
    "value": [
      { "pubkey": "Cx...", "account": { "lamports": 2039280, "owner": "Tok...", "executable": false, "rentEpoch": 18446744073709551615, "space": 165, "data": ["...", "base64"] } }
    ]
  }
}
```

### Response fields

`result` is an array of `ProgramAccount` (or `{ context, value: [...] }` when
`withContext` is set). Each `ProgramAccount`:

| Field | Type | Description |
|---|---|---|
| `pubkey` | string (base-58) | Public key of the matched account. |
| `account` | object | The account state (`AccountInfo`). |
| `account.lamports` | integer | Balance of the account in lamports. |
| `account.owner` | string (base-58) | Owning program — equals the queried `programId`. |
| `account.executable` | boolean | Whether the account holds a loaded program. |
| `account.rentEpoch` | integer | Epoch at which the account next owes rent (`u64`). |
| `account.space` | integer | Size of the account data in bytes. |
| `account.data` | array \| object | Account data. For binary encodings: `[<data>, <encoding>]`. For `jsonParsed`: a decoded object, or the binary tuple if no parser matched. |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 400 | Invalid params | `programId` is not valid base-58, or `config`/`filters` contain an invalid value (e.g. `base58` encoding on oversized data, malformed `memcmp`). |
| — | 403 | Tier insufficient | API key's tier/scope does not include `sol_read_rpc_heavy`. Rejected before the RPC layer: plain HTTP body `{"error":"tier_insufficient", …}` with an `X-Required-Tier` header — there is no JSON-RPC `error` object. |
| — | 429 | Rate limit exceeded | More than your tier's sustained RPS for `sol_read_rpc_heavy` (2 / 5 / 20 / 80, with burst) was sent. Plain HTTP body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` and `X-RateLimit-Reset`. |
| `-32601` | 404 | Method not found | Method name misspelled or not available on this chain. |

Example rate-limit response — HTTP `429` with a plain body, not a JSON-RPC envelope:

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 2 requests/s for sol_read_rpc_heavy. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "sol_read_rpc_heavy",
  "limit_rps": 2,
  "burst_capacity": 4,
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
    method: "getProgramAccounts",
    params: [
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      {
        encoding: "base64",
        commitment: "finalized",
        filters: [{ dataSize: 165 }],
      },
    ],
  }),
});

const { result } = await res.json();
console.log(`${result.length} accounts owned by the program`);
```

## Notes

- **Always filter.** An unfiltered query can scan a huge account set and is the
  fastest way to exhaust your tier's RPS. Combine a `dataSize` filter (match the
  exact account layout size) with one or more `memcmp` filters (match a
  discriminator or owner field) to return only what you need.
- **Trim the payload with `dataSlice`.** If you only read a few fields, request
  a byte window instead of full account data. `dataSlice` is ignored by
  `jsonParsed`.
- **Heavy rate limits.** This method sits in `sol_read_rpc_heavy` (2 / 5 / 20 /
  80 rps), an order of magnitude below standard read RPC. Cache results and
  back off on HTTP `429` `rate_limited` using the `Retry-After` header.
- **Pagination.** This method returns the full matching set in one response and
  has no cursor. For large, paginated enumeration use `getProgramAccountsV2`
  (see the method catalog) once its full schema is published.
- **Related methods:** [`getAccountInfo`](./getAccountInfo.md) (a single account
  by key) and [`getBalance`](./getBalance.md) (lamports only).
- **Empty result?** See
  [why getProgramAccounts returns an empty array](https://triport.io/learn/getprogramaccounts-empty-result)
  for `dataSize`, `memcmp` encoding and Token vs Token-2022 mismatches.
