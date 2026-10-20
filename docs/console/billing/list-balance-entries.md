> Live version: https://triport.io/docs/console/billing/list-balance-entries

# List balance ledger entries

> Returns a cursor-paginated, newest-first slice of your account's balance ledger (every credit and debit).

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/balance/entries` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (Console session) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/balance/entries` reads your account's **balance journal** — the
append-only ledger of every change to your balance. Each row records a single
credit or debit, its source, and when it was applied. Use it to render an
account-activity / billing-history view, to reconcile invoices against
payments, or to audit adjustments and refunds.

Entries are returned **newest-first** and are **cursor-paginated** on the id of
the last (oldest) entry in the current page. A balance entry is immutable once
written, so a cursor walk is stable: re-fetching the same `after_id` always
yields the same following rows.

All amounts are expressed in **micro-USD** (`1 USD = 1_000_000 micro`). A
positive `delta_micro` is a credit to your balance; a negative value is a debit.
The server is authoritative for these values — do not derive a running balance
on the client by summing deltas; read the snapshot from
[`GET /v1/balance`](./get-balance.md) or the balance event stream instead.

This endpoint requires an authenticated Console session (sent as a cookie). A
brand-new account with no activity returns an empty `entries` array with HTTP
`200`, not a `404`.

## Parameters

All parameters are optional query-string values.

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | no | Maximum number of entries to return in this page. If omitted or non-numeric, the server applies its own default page size. |
| `after_id` | integer | no | Cursor: the id of the last entry you have already seen. Returns entries older than this id. Omit on the first request; on subsequent requests pass the previous response's `next_cursor`. |

## Request

```bash
curl "https://triport.io/v1/balance/entries?limit=50" \
  -H "Content-Type: application/json" \
  -b "triport_session=$TRIPORT_SESSION"
```

To page backward through history, repeat the request with `after_id` set to the
`next_cursor` from the previous response:

```bash
curl "https://triport.io/v1/balance/entries?limit=50&after_id=10428" \
  -H "Content-Type: application/json" \
  -b "triport_session=$TRIPORT_SESSION"
```

## Response

```json
{
  "entries": [
    {
      "id": 10493,
      "delta_micro": -2500000,
      "kind": "invoice_debit",
      "ref_invoice_id": "inv_8c1f2a",
      "reason": "invoice settled from balance",
      "created_at": 1748467200
    },
    {
      "id": 10428,
      "delta_micro": 10000000,
      "kind": "payment_credit",
      "ref_payment_id": 5571,
      "reason": "on-chain payment confirmed",
      "created_at": 1748380800
    }
  ],
  "next_cursor": 10428
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `entries` | array | The page of ledger entries, newest-first. Empty array when the account has no (further) activity. |
| `entries[].id` | integer | Monotonic ledger entry id. Use the id of the last entry as the next page's `after_id`. |
| `entries[].delta_micro` | integer | Signed balance change in micro-USD. Positive = credit, negative = debit. |
| `entries[].kind` | string | What produced the row: `payment_credit`, `invoice_debit`, `refund`, or `adjust`. |
| `entries[].ref_invoice_id` | string \| null | The invoice this entry relates to, if any (e.g. for `invoice_debit`). Absent/null otherwise. |
| `entries[].ref_payment_id` | integer \| null | The payment this entry relates to, if any (e.g. for `payment_credit`). Absent/null otherwise. |
| `entries[].reason` | string | Human-readable note describing the entry. May be empty. |
| `entries[].created_at` | integer | When the entry was written, in Unix seconds. Multiply by `1000` for a JavaScript `Date`. |
| `next_cursor` | integer \| null | The id of the last (oldest) entry in this page, to be passed as the next request's `after_id`. Absent/null only when `entries` is empty. |

## Errors

Errors use the shared envelope `{ "error": "<message>" }` — see
[errors.md](../../errors.md) for the full contract.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `auth required` | No valid Console session cookie was presented. |
| `500` | `internal: <detail>` | Unexpected server-side failure while reading the ledger. |
| `503` | `session resolver not configured` | Authentication is temporarily unavailable on this node; retry shortly. |

## Examples

### JavaScript (fetch)
```js
async function listBalanceEntries({ limit, afterId } = {}) {
  const q = new URLSearchParams();
  if (limit != null) q.set('limit', String(limit));
  if (afterId != null) q.set('after_id', String(afterId));
  const qs = q.toString();

  const res = await fetch(
    `https://triport.io/v1/balance/entries${qs ? `?${qs}` : ''}`,
    { credentials: 'include', headers: { 'Content-Type': 'application/json' } },
  );
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
  return res.json(); // { entries, next_cursor }
}

// Walk the whole journal, newest-first.
async function* allEntries() {
  let afterId;
  for (;;) {
    const { entries, next_cursor } = await listBalanceEntries({ limit: 100, afterId });
    if (entries.length === 0) return;
    yield* entries;
    if (next_cursor == null) return;
    afterId = next_cursor;
  }
}
```

## Notes

- **Pagination terminates on an empty page.** `next_cursor` is the id of the
  last entry returned and is present on *every* non-empty page — including the
  final one. Don't treat "`next_cursor` is set" as "more data exists." Instead,
  keep passing `after_id=next_cursor` until a request returns
  `entries: []` (at which point `next_cursor` is absent/null).
- **No `kind` filter.** This endpoint does not filter by entry kind; filtering
  by `payment_credit` / `invoice_debit` / `refund` / `adjust` is done client-side.
- **Timestamps are Unix seconds**, not milliseconds — multiply by `1000` before
  constructing a JS `Date`.
- **Related:** [`GET /v1/balance`](./get-balance.md) for the current balance
  snapshot, and the balance event stream for live credit/debit pushes.
