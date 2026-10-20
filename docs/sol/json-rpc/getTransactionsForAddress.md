> Live version: https://triport.io/docs/sol/json-rpc/getTransactionsForAddress

# getTransactionsForAddress

> Full transaction history of an address in one call — oldest-first or newest-first, as signatures or complete transactions, with slot, time, status and token-account filters and cursor pagination.

| | |
|---|---|
| **Method / Endpoint** | `getTransactionsForAddress` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc_heavy` |
| **Tier / rate limit** | free+ — **2 rps (free) / 5 rps (basic) / 20 rps (pro) / 80 rps (business)**, with burst |

## Description

`getTransactionsForAddress` returns the transactions that reference an address,
in the order you choose. Set `sortOrder` to `asc` to start from the very first
transaction the address ever made, or to `desc` for the most recent ones. Each
page holds up to 1000 entries — either signature summaries or complete
transactions with `meta` — and carries a `paginationToken` for the next page.

It replaces the usual two-step history scan. With the standard methods you
page backwards through [`getSignaturesForAddress`](./getSignaturesForAddress.md)
from the newest signature and then call [`getTransaction`](./getTransaction.md)
for each one; reaching an old wallet's first transaction means walking its
entire history. Here one ascending call returns that first transaction
directly, and `transactionDetails: "full"` returns the transactions themselves.

Filters narrow the history server-side: a slot or block-time window, only
succeeded or only failed transactions, and optionally the activity of token
accounts owned by the address.

The method is a heavy read (`sol_read_rpc_heavy`) and shares that budget with
[`getProgramAccounts`](./getProgramAccounts.md) — **2 rps on the Free trial**,
rising to 80 rps on business.

## Parameters

Positional params array: `[address, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (base-58 `Pubkey`) | yes | Wallet, program or any account address. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object (`GetTransactionsForAddressConfig`)

| Name | Type | Default | Description |
|---|---|---|---|
| `transactionDetails` | string | `signatures` | `signatures` returns signature summaries; `full` returns complete transactions with `meta`. |
| `sortOrder` | string | `desc` | `asc` — oldest first; `desc` — newest first. |
| `limit` | integer | `1000` | Entries per page, `1`–`1000` for both detail levels. |
| `paginationToken` | string | — | Cursor from the previous page's `paginationToken`; omit it for the first page. |
| `filters` | object | — | Server-side filters (see below). |
| `commitment` | string | `finalized` | `confirmed` or `finalized`. `processed` is rejected. |
| `encoding` | string | `json` | For `full`: `json`, `jsonParsed`, `base58` or `base64`. |
| `maxSupportedTransactionVersion` | integer | — | Set to `0` to receive versioned (v0) transactions in `full` mode. |
| `minContextSlot` | integer | — | Minimum slot the request must be evaluated at. |

### `filters` object (`GetTransactionsForAddressFilters`)

| Name | Type | Description |
|---|---|---|
| `slot` | object | Slot window: any of `gt`, `gte`, `lt`, `lte` (integers). |
| `blockTime` | object | Unix-time window: any of `gt`, `gte`, `lt`, `lte` (seconds). |
| `signature` | object | Signature bounds: any of `gt`, `gte`, `lt`, `lte` (base-58 signatures). |
| `status` | string | `succeeded`, `failed` or `any`. |
| `tokenAccounts` | string | `none` — only transactions that reference the address itself; `balanceChanged` — also transactions that changed a balance of a token account the address owns; `all` — also every transaction of those token accounts. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransactionsForAddress",
    "params": [
      "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      {
        "transactionDetails": "signatures",
        "sortOrder": "asc",
        "limit": 2
      }
    ]
  }'
```

To fetch the next page, repeat the call with the same address and options and
add `"paginationToken": "<value from the previous response>"` to `config`.

## Response

The result is one page: a `data` array and the cursor for the next page.
Response to the request above — the address's first two transactions, from
January 2022:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "data": [
      {
        "signature": "6HtVDabXRSxYeQ6ennJ8rqTfs8oLFKViSv275SMaasoqNUke1VbAHLzmq41KQ1qYSvZxeL84tVQWDX8XcuBft1A",
        "slot": 116982180,
        "transactionIndex": 280,
        "err": null,
        "memo": null,
        "blockTime": 1642623466,
        "confirmationStatus": "finalized"
      },
      {
        "signature": "5WX9C5kCQNULGGrSHJBR1WDFyetVyekbUpe1KQ45p3zEBe6jVgSsJuMqLWijjTDcnaAK2518ZriktRMCNycnsNAG",
        "slot": 116984883,
        "transactionIndex": 2461,
        "err": null,
        "memo": null,
        "blockTime": 1642625194,
        "confirmationStatus": "finalized"
      }
    ],
    "paginationToken": "116984883:2461"
  }
}
```

With `transactionDetails: "full"` each `data` entry is a complete transaction
instead — the same shape [`getTransaction`](./getTransaction.md) returns, plus
the position of the transaction in its block:

```json
{
  "slot": 116982180,
  "blockTime": 1642623466,
  "transactionIndex": 280,
  "version": "legacy",
  "transaction": {
    "signatures": ["6HtVDabXRSxYeQ6ennJ8rqTfs8oLFKViSv275SMaasoqNUke1VbAHLzmq41KQ1qYSvZxeL84tVQWDX8XcuBft1A"],
    "message": { "accountKeys": ["..."], "header": { "...": "..." }, "instructions": ["..."], "recentBlockhash": "..." }
  },
  "meta": { "err": null, "fee": 5000, "preBalances": ["..."], "postBalances": ["..."], "logMessages": ["..."], "...": "..." }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `data` | array | Entries of this page, in the requested `sortOrder`. |
| `paginationToken` | string \| null | Cursor for the next page — pass it back as `config.paginationToken`. `null` once the history is exhausted. |
| `data[].signature` | string (base-58) | Transaction signature (`signatures` mode). |
| `data[].slot` | integer | Slot the transaction was processed in. |
| `data[].transactionIndex` | integer | Position of the transaction within its block. |
| `data[].blockTime` | integer \| null | Estimated production time, Unix seconds. |
| `data[].err` | object \| null | Error if the transaction failed, `null` if it succeeded. |
| `data[].memo` | string \| null | Memo attached to the transaction (`signatures` mode). |
| `data[].confirmationStatus` | string | `confirmed` or `finalized` (`signatures` mode). |
| `data[].transaction`, `data[].meta`, `data[].version` | object, object, string \| number | The transaction, its status metadata and its version (`full` mode). |

## Errors

Errors use the standard JSON-RPC envelope (`error.code`, `error.message`,
`error.data`).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `-32602` | 200 | Invalid params | `address` is not a valid base-58 key, an option has an invalid value (for example an unknown `sortOrder`), or `commitment` is `processed`. |
| `-32603` | 200 | Invalid limit | `limit` is above 1000: `"Invalid limit: You can only request up to 1000 transactions at a time."` |
| — | 403 | Tier insufficient | API key's tier/scope does not include `sol_read_rpc_heavy`. Rejected before the RPC layer: plain HTTP body `{"error":"tier_insufficient", …}` with an `X-Required-Tier` header — there is no JSON-RPC `error` object. |
| — | 429 | Rate limit exceeded | More than your tier's sustained heavy-read RPS (with burst) was sent. Plain HTTP body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` and `X-RateLimit-Reset`. |

See the shared [errors reference](../../errors.md) for the full envelope and
retry guidance.

## Examples

### JavaScript (fetch)
```js
// Replay a wallet's history from its first transaction, page by page.
// Stay under your heavy-read RPS between pages.
async function page(paginationToken) {
  const res = await fetch("https://triport.io/sol", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransactionsForAddress",
      params: [
        "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
        {
          transactionDetails: "signatures",
          sortOrder: "asc",
          limit: 1000,
          filters: { status: "succeeded" },
          ...(paginationToken ? { paginationToken } : {}),
        },
      ],
    }),
  });
  const { result, error } = await res.json();
  if (error) throw new Error(`${error.code}: ${error.message}`);
  return result;
}

let token;
do {
  const { data, paginationToken } = await page(token);
  for (const tx of data) console.log(tx.slot, tx.signature);
  token = paginationToken; // null once the history is exhausted
} while (token);
```

### Python (requests)
```python
import os
import time

import requests

# Transactions of the last 24 hours, newest first, with full details.
since = int(time.time()) - 86400
payload = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransactionsForAddress",
    "params": [
        "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
        {
            "transactionDetails": "full",
            "sortOrder": "desc",
            "limit": 100,
            "maxSupportedTransactionVersion": 0,
            "filters": {"blockTime": {"gte": since}},
        },
    ],
}
r = requests.post(
    "https://triport.io/sol",
    json=payload,
    headers={"Authorization": f"Bearer {os.environ['TRIPORT_API_KEY']}"},
    timeout=60,
)
for tx in r.json()["result"]["data"]:
    print(tx["slot"], tx["transaction"]["signatures"][0], tx["meta"]["err"])
```

## Notes

- **Order.** `asc` walks forward from the address's first transaction — the
  way to backfill a wallet or find when it was created. `desc` matches the
  order of [`getSignaturesForAddress`](./getSignaturesForAddress.md).
- **Paging.** Send the returned `paginationToken` back unchanged with the same
  address and options, and stop when it comes back `null`. A page shorter than
  `limit` does not mean the end — the final call may return an empty `data`
  array with `paginationToken: null`. Each page is a separate heavy read and
  counts against your RPS budget.
- **Page size.** Up to 1000 entries in both modes. A page of 1000 full
  transactions can be several megabytes; lower `limit` if you parse
  responses in a memory-constrained process.
- **Commitment.** Only `confirmed` and `finalized` are accepted.
- **Heavy rate limits.** `getTransactionsForAddress` shares the
  `sol_read_rpc_heavy` budget — **2 / 5 / 20 / 80 rps** by tier; see
  [rate limits and tiers](../../rate-limits-and-tiers.md).
- **Related methods:** [`getSignaturesForAddress`](./getSignaturesForAddress.md)
  (standard newest-first signature scan), [`getTransaction`](./getTransaction.md)
  (single transaction by signature), and
  [`signatureSubscribe`](./signatureSubscribe.md) (stream the confirmation of a
  new signature).
