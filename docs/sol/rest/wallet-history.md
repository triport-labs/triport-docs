> Live version: https://triport.io/docs/sol/rest/wallet-history

# Get wallet transaction history

> Return a paginated, newest-first page of confirmed transactions for a Solana address, with per-mint balance changes, back to ~3.5 years of archive depth.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/sol/wallet/history/{address}` |
| **Type** | Triport product (REST API) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query) |
| **Required scope** | any valid API key |
| **Tier / rate limit** | all tiers (free+) — RPS-per-tier with 2× burst (see [rate limits](../../rate-limits-and-tiers.md)) |

## Description

Returns a page of transaction summaries for a single Solana account — a wallet,
a token mint, a program, or any other pubkey — newest first. Each item carries
the signature, slot, block timestamp, fee, fee payer, error status and the
token balance changes observed in that transaction, so a single call covers
what would otherwise take `getSignaturesForAddress` plus a `getTransaction`
per signature.

The archive reaches back roughly **3.5 years**; a `before` cursor pointing at a
2022 signature pages through history exactly like a cursor from an hour ago.

Pages are capped at **100 items**. For deep scans, page with the `before`
cursor (see [Notes](./wallet-history.md#notes)); for bulk extraction of full transaction bodies
at hundreds of requests per second, use `getSignaturesForAddress` +
`getTransaction` on the JSON-RPC endpoint instead — the REST page is a
convenience view, not a firehose.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | Solana base58 pubkey. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. Any account works, including token mints and programs. |

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | no | Page size. `1`–`100`, default `100`. Values above `100` (or `0`) are **silently clamped to `100`**. |
| `before` | string | no | Signature cursor — return only transactions **older** than this signature. Pass `pagination.nextCursor` from the previous page. Must be a signature that belongs to this address's history. |

Any other query parameter (`offset`, `after`, `page`, …) is stripped before the
request is served and has no effect.

## Request

```bash
curl "https://triport.io/v1/sol/wallet/history/3gd3dqgtJ4jWfBfLYTX67DALFetjc5iS72sCgRhCkW2u?limit=2" \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

Next page — feed the cursor back as `before`:

```bash
curl "https://triport.io/v1/sol/wallet/history/3gd3dqgtJ4jWfBfLYTX67DALFetjc5iS72sCgRhCkW2u?limit=2&before=3QerRFev2pet9nnHJdWreHkMwPP8B2YnXj9khTALLHey2AByVdVWSeESEmAgLBr485k5LYX1npJD1etXmKDKmpVF" \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

## Response

```json
{
  "data": [
    {
      "signature": "4J3fgrspP97oGRsG9PicGGzxxXvbVfNGPWv22KVL1HmKtusj8uHXfP4k396ZDMmW5D1bGW41ZkhM7q5pyCw4d3R1",
      "timestamp": 1787306430,
      "slot": 440662058,
      "fee": 5000,
      "feePayer": "mveQ2LeVFwW3kN9Hc7PAwB5rwdUymZm8GdzRRQDQg1u",
      "error": null,
      "balanceChanges": [
        { "mint": "DxruoDmi89GBWhSaGyHphxeHTmtVXt2WWSfDtraaafYP", "amount": 2015169, "decimals": 0 }
      ]
    },
    {
      "signature": "3QerRFev2pet9nnHJdWreHkMwPP8B2YnXj9khTALLHey2AByVdVWSeESEmAgLBr485k5LYX1npJD1etXmKDKmpVF",
      "timestamp": 1787306223,
      "slot": 440661494,
      "fee": 5000,
      "feePayer": "mveQ2LeVFwW3kN9Hc7PAwB5rwdUymZm8GdzRRQDQg1u",
      "error": null,
      "balanceChanges": [
        { "mint": "DxruoDmi89GBWhSaGyHphxeHTmtVXt2WWSfDtraaafYP", "amount": 649404, "decimals": 0 }
      ]
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "3QerRFev2pet9nnHJdWreHkMwPP8B2YnXj9khTALLHey2AByVdVWSeESEmAgLBr485k5LYX1npJD1etXmKDKmpVF"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `data` | array | Transaction summaries, newest first. Empty array when the address has no (further) history. |
| `data[].signature` | string | Base58 transaction signature. |
| `data[].timestamp` | integer (int64) | Block time in **UNIX seconds**. |
| `data[].slot` | integer (int64) | Slot in which the transaction was confirmed. |
| `data[].fee` | integer (int64) | Fee paid, in lamports. |
| `data[].feePayer` | string | Account that paid the fee (first signer). |
| `data[].error` | object \| null | `null` on success; otherwise the Solana transaction error object. |
| `data[].balanceChanges` | array | Token balance deltas observed in the transaction, one entry per mint. Empty for transactions that moved no tokens (e.g. pure program calls). |
| `data[].balanceChanges[].mint` | string | Mint address. Native SOL is reported as `So11111111111111111111111111111111111111112`. |
| `data[].balanceChanges[].amount` | number | Signed, decimal-adjusted delta as reported by the index. |
| `data[].balanceChanges[].decimals` | integer | Decimals applied to `amount`. |
| `pagination.hasMore` | boolean | `true` if older transactions exist beyond this page. |
| `pagination.nextCursor` | string | Signature of the last item on this page — pass it as `before` to fetch the next (older) page. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `unauthorized` / `trial_expired` / `subscription_expired` | Missing/invalid key, or the trial/subscription has ended. |
| `404` | `unsupported wallet endpoint` | The path segment after `/wallet/` is not `history`, `transfers` or `identity`, or `{address}` is not a 32–44 char base58 string. |
| `405` | `method not allowed` | Any method other than `GET`. |
| `429` | `rate_limited` | Sustained RPS for the tier exceeded. Honor the `Retry-After` header. |
| `502` | upstream error | `before` is not a valid signature, or the history index is temporarily unavailable. Retry with backoff; fix the cursor if it repeats. |

`401`/`429` share the standard envelope (`error`, `message`, `request_id`) — see the
shared [errors reference](../../errors.md). `404`/`405` from this endpoint are a
minimal `{"error": "...", "code": <status>}` body.

## Examples

### JavaScript (fetch) — walk the full history

```js
const address = "3gd3dqgtJ4jWfBfLYTX67DALFetjc5iS72sCgRhCkW2u";
const headers = { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` };

let before;
const all = [];
for (;;) {
  const url = new URL(`https://triport.io/v1/sol/wallet/history/${address}`);
  url.searchParams.set("limit", "100");
  if (before) url.searchParams.set("before", before);

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`history failed: ${res.status}`);

  const { data, pagination } = await res.json();
  all.push(...data);
  if (!pagination.hasMore || data.length === 0) break;
  before = pagination.nextCursor;
}
console.log(`${all.length} transactions, oldest at ${new Date(all.at(-1).timestamp * 1000)}`);
```

### Python (requests)

```python
import os, requests

address = "3gd3dqgtJ4jWfBfLYTX67DALFetjc5iS72sCgRhCkW2u"
headers = {"Authorization": f"Bearer {os.environ['TRIPORT_API_KEY']}"}
url = f"https://triport.io/v1/sol/wallet/history/{address}"

before, items = None, []
while True:
    params = {"limit": 100}
    if before:
        params["before"] = before
    page = requests.get(url, headers=headers, params=params, timeout=30)
    page.raise_for_status()
    body = page.json()
    items.extend(body["data"])
    if not body["pagination"]["hasMore"] or not body["data"]:
        break
    before = body["pagination"]["nextCursor"]

for tx in items[:5]:
    status = "failed" if tx["error"] else "ok"
    print(tx["signature"], tx["slot"], status, tx["fee"])
```

## Notes

* **Cursor pagination only.** Walk history by passing `pagination.nextCursor`
  as `before`. There is no `offset`; stop when `hasMore` is `false` or `data`
  comes back empty.
* **Page cap is 100.** `limit` above `100` does not error — it is clamped. Size
  your loop for 100-item pages.
* **Token mints work as `{address}`.** Querying a mint returns the transactions
  that touched that mint account — the same set `getSignaturesForAddress` on the
  mint would return, with balance deltas attached.
* **Time unit.** `timestamp` is UNIX **seconds** — multiply by 1000 before
  constructing a JavaScript `Date`.
* **Failed transactions.** A non-`null` `error` still appears in history and still
  charged a `fee`; filter on `error === null` if you only want successful activity.
* **Bulk extraction.** For tens of thousands of wallets or full transaction
  bodies (inner instructions, logs, pre/post balances), use JSON-RPC
  `getSignaturesForAddress` (1000 signatures per call) + `getTransaction` on
  `POST /sol` — same archive depth, and it runs at the full per-tier RPS.
* **Sibling endpoints at the same prefix:**
  `GET /v1/sol/wallet/transfers/{address}` — token transfer legs
  (`direction`, `counterparty`, `mint`, `amount`, `amountRaw`, `decimals`) with the
  same `limit`/`before` pagination;
  `GET /v1/sol/wallet/identity/{address}` — known-entity attribution
  (`type`, `name`, `category`, `tags`, `website`) for exchange, bridge and
  protocol addresses.
