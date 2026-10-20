> Live version: https://triport.io/docs/sol/json-rpc/getProgramAccountsV2

# getProgramAccountsV2

> Paginated variant of `getProgramAccounts`: lists the accounts owned by a program page by page, using `limit` and a `paginationKey` cursor.

> **Beta — live on every tier.** `getProgramAccountsV2` is served on the
> public Solana endpoint today (checked against production on 2026-09-22):
> paging with `limit` / `paginationKey` works as documented below. What is not
> final yet is the *published* schema — the OpenRPC spec still types the result
> as an open object until spec version `api.2.2`+. The field names on this page
> are the ones the endpoint returns now; re-check this page before relying on
> anything not listed here. [`getProgramAccounts`](./getProgramAccounts.md)
> remains the stable, unpaginated alternative.

| | |
|---|---|
| **Status** | 🚧 **Beta** — live on all tiers; published schema not final (`api.2.2`+) |
| **Method / Endpoint** | `getProgramAccountsV2` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc_heavy` |
| **Tier / rate limit** | free+ — **2 rps (free) / 5 rps (basic) / 20 rps (pro) / 80 rps (business)**, with burst |

## Description

`getProgramAccountsV2` is the paginated form of
[`getProgramAccounts`](./getProgramAccounts.md): it returns the accounts owned
by a given program Pubkey, with the same filtering and encoding controls, but
one page at a time. Pass `limit` to size the page; each response carries a
`paginationKey` that you send back to get the next page. That makes it the
method to use when a program owns more accounts than fit comfortably in one
response.

Like its predecessor, this is one of the two **heavy** Solana read methods
(`sol_read_rpc_heavy`). Scanning all accounts owned by a program is expensive
for the node, so it is throttled far more aggressively than ordinary reads —
just **2 rps on the Free trial**, rising to 80 rps on business. Budget your
calls accordingly, cache results where you can, and always narrow the scan with
`filters` (a `dataSize` and/or `memcmp` filter) rather than fetching every
account a program owns.

## Parameters

Positional params array: `[programId, config?]`. The `config` object takes
the `getProgramAccounts` options and adds two V2 fields, `limit` and
`paginationKey`.

| Name | Type | Required | Description |
|---|---|---|---|
| `programId` | string (base-58 `Pubkey`) | yes | Public key of the owning program to scan. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object (`GetProgramAccountsConfig`)

| Name | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | One of `base58`, `base64`, `base64+zstd`, `jsonParsed`. Controls how each account's `data` is returned. |
| `commitment` | string | no | Confirmation level: `processed`, `confirmed`, or `finalized`. |
| `dataSlice` | object | no | Limits each account's returned data to a byte window: `{ "offset": <integer>, "length": <integer> }`. Only valid with binary encodings. |
| `filters` | array | no | List of filters applied server-side to narrow the result set (see below). |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at; the request fails if the node has not reached it. |
| `withContext` | boolean | no | When `true`, wraps the page in an `RpcContext` envelope: `{ context, value: { accounts, paginationKey, count } }`. |
| `limit` | integer | no | Maximum number of accounts in this page (V2). |
| `paginationKey` | string | no | Cursor from the previous response's `paginationKey`; omit it for the first page (V2). |

### `filters` entries (`AccountFilter`)

| Name | Type | Description |
|---|---|---|
| `dataSize` | integer | Match only accounts whose data is exactly this many bytes. |
| `memcmp` | object | Match accounts whose data, at a byte `offset`, equals the provided `bytes` (`{ "offset": <integer>, "bytes": <string>, "encoding": <string> }`). |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getProgramAccountsV2",
    "params": [
      "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      {
        "encoding": "base64",
        "commitment": "finalized",
        "limit": 2,
        "filters": [
          { "dataSize": 165 },
          { "memcmp": { "offset": 0, "bytes": "So11111111111111111111111111111111111111112", "encoding": "base58" } }
        ]
      }
    ]
  }'
```

To fetch the next page, repeat the call with the same `programId` and
filters and add `"paginationKey": "<value from the previous response>"` to
`config`.

## Response

The result is one page: an `accounts` array, the cursor for the next page and
the number of accounts in this page. With `withContext: true` the same object
is returned under `result.value`, next to `result.context`. Response to the
request above (account data shortened):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "accounts": [
      {
        "pubkey": "11KVuTC8RvduNvS9mzp5NGdsZtqWjKXpTFBqwtjdUV",
        "account": {
          "lamports": 31739559,
          "data": [
            "BpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAHyzNU1...",
            "base64"
          ],
          "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "executable": false,
          "rentEpoch": 18446744073709551615,
          "space": 165
        }
      },
      {
        "pubkey": "11RiDGRArdrt8Y83d3hd88ELWRNJbtsbKDFppwF8ev",
        "account": {
          "lamports": 492402875,
          "data": [
            "BpuIV/6rgYT7aH9jRhjANdrEOdwa6ztVmKDwAAAAAAFBV7BY...",
            "base64"
          ],
          "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "executable": false,
          "rentEpoch": 18446744073709551615,
          "space": 165
        }
      }
    ],
    "paginationKey": "11RiDGRArdrt8Y83d3hd88ELWRNJbtsbKDFppwF8ew",
    "count": 2
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `accounts` | array | Accounts in this page, each a `ProgramAccount` (address plus `AccountInfo`). |
| `paginationKey` | string \| null | Cursor for the next page — pass it back as `config.paginationKey`. `null` on the last page. |
| `count` | integer | Number of accounts in this page. |
| `accounts[].pubkey` | string (base-58) | Address of the matched account. |
| `accounts[].account.lamports` | integer | Balance of the account in lamports. |
| `accounts[].account.owner` | string (base-58) | Owning program — equals the queried `programId`. |
| `accounts[].account.executable` | boolean | Whether the account holds a loaded program. |
| `accounts[].account.rentEpoch` | integer | Epoch at which the account will next owe rent (`u64`). |
| `accounts[].account.space` | integer | Size of the account data in bytes. |
| `accounts[].account.data` | array \| object | Account data. Binary encodings return `[<data>, <encoding>]`; `jsonParsed` returns a decoded object (or the binary tuple if no parser matched). |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 400 | Invalid params | `programId` is not valid base-58, or `config` contains an invalid value. |
| — | 403 | Tier insufficient | API key's tier/scope does not include `sol_read_rpc_heavy`. Rejected before the RPC layer: plain HTTP body `{"error":"tier_insufficient", …}` with an `X-Required-Tier` header — there is no JSON-RPC `error` object. |
| — | 429 | Rate limit exceeded | More than your tier's sustained heavy-read RPS (with burst) was sent. Plain HTTP body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` and `X-RateLimit-Reset`. |
| — | 403 | Unknown method | Method name misspelled. Rejected before the RPC layer with a plain HTTP body `{"error":"method_unknown", …}`. |

Example rate-limit response — HTTP `429` with a plain body, not a JSON-RPC envelope (note the much lower heavy-tier limit):

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
// Walk every page of a filtered scan. Stay under your heavy-read RPS.
async function page(paginationKey) {
  const res = await fetch("https://triport.io/sol", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getProgramAccountsV2",
      params: [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        {
          encoding: "base64",
          limit: 1000,
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: "So11111111111111111111111111111111111111112" } },
          ],
          ...(paginationKey ? { paginationKey } : {}),
        },
      ],
    }),
  });
  const { result } = await res.json();
  return result;
}

let key;
do {
  const { accounts, paginationKey, count } = await page(key);
  console.log(`${count} accounts`, accounts[0]?.pubkey);
  key = paginationKey; // null on the last page
} while (key);
```

## Notes

- **Beta: published schema not final.** The endpoint serves V2 today and the
  fields above are what it returns; the OpenRPC schema still types the result
  as an open object until spec `api.2.2`+. Re-check this page when that spec
  ships. [`getProgramAccounts`](./getProgramAccounts.md) is the stable,
  unpaginated contract.
- **Paging.** Keep sending the returned `paginationKey` until it comes back
  `null` — that page is the last one. Each page is a separate heavy read and
  counts against your RPS budget.
- **Heavy rate limits.** `getProgramAccountsV2` shares the
  `sol_read_rpc_heavy` budget with `getProgramAccounts` — only **2 / 5 / 20 / 80
  rps** by tier. These are an order of magnitude lower than standard reads
  (20 / 60 / 200 / 600 rps); see [rate limits and tiers](../../rate-limits-and-tiers.md).
- **Always filter.** Use `dataSize` and `memcmp` filters to restrict the scan
  server-side. Unfiltered scans over large programs are slow and burn through
  your limited heavy-read budget quickly.
- **Related methods:** [`getProgramAccounts`](./getProgramAccounts.md) (the
  stable v1), [`getAccountInfo`](./getAccountInfo.md) (single account), and
  [`getMultipleAccounts`](./getMultipleAccounts.md) (batch of known addresses).
