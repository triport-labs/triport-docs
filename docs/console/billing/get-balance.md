> Live version: https://triport.io/docs/console/billing/get-balance

# Get balance

> Returns the authenticated user's current account balance, in micro-USD, along with its lock state.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/balance` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/balance` returns a snapshot of the caller's account balance. The
balance is the running total of all ledger activity (payment credits, invoice
debits, refunds, and administrative adjustments) and is what
[pay-from-balance](./pay-from-balance.md) draws against.

All monetary amounts are expressed in **micro-USD**: `1 USD = 1_000_000 micro`.
The server is authoritative — do no client-side arithmetic to reconstruct the
balance; read `amount_micro` directly. For a live-updating value (pushed on
every credit and debit), subscribe to the
[balance event stream](./balance-events.md) instead of polling this endpoint.

New users with no ledger history are **not** an error: the endpoint returns
`200 OK` with `amount_micro: 0` and `locked: false` rather than `404`, so the
response shape is always consistent.

When `locked` is `true`, the balance has been administratively frozen and
`locked_at` carries the freeze time. While frozen, pay-from-balance attempts
fail with `balance_locked` (see [Notes](./get-balance.md#notes)).

## Parameters

This endpoint takes no path, query, or body parameters. Authentication is
carried entirely by the session cookie established at sign-in.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/v1/balance \
  -H "Content-Type: application/json" \
  --cookie "$TRIPORT_SESSION_COOKIE"
```

> This endpoint authenticates with the session cookie set during sign-in, not a
> bearer token. Send the cookie with the request (browsers do this automatically
> for same-origin calls; `fetch` callers should use `credentials: "include"`).

## Response

```json
{
  "amount_micro": 12500000,
  "locked": false,
  "updated_at": 1748534400
}
```

When the balance is frozen, `locked` is `true` and `locked_at` is present:

```json
{
  "amount_micro": 12500000,
  "locked": true,
  "locked_at": 1748534400,
  "updated_at": 1748534400
}
```

A brand-new user with no ledger history:

```json
{
  "amount_micro": 0,
  "locked": false,
  "updated_at": 1748534400
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `amount_micro` | integer | Current balance in micro-USD (`1 USD = 1_000_000 micro`). |
| `locked` | boolean | `true` when the balance is administratively frozen. |
| `updated_at` | integer | Unix seconds of the last balance change. Multiply by 1000 for `new Date(...)`. |
| `locked_at` | integer | Unix seconds when the freeze was applied. Present only when `locked` is `true`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `auth required` | No valid session cookie on the request. |
| `500` | `internal: ...` | Unexpected server-side failure reading the ledger. |
| `503` | `session resolver not configured` | Authentication subsystem not yet available; retry shortly. |

Errors use the shared envelope `{ "error": "<message>" }`. See
[errors.md](../../errors.md) for the full envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/balance", {
  headers: { "Content-Type": "application/json" },
  credentials: "include", // send the session cookie
});
if (!res.ok) {
  const { error } = await res.json().catch(() => ({}));
  throw new Error(error ?? `HTTP ${res.status}`);
}
const balance = await res.json();
const usd = balance.amount_micro / 1_000_000;
console.log(`Balance: $${usd.toFixed(2)}`, balance.locked ? "(frozen)" : "");
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient(); // uses the session cookie

const balance = await client.balance.get();
//    ^? { amount_micro: number; locked: boolean; updated_at: number; locked_at?: number }

const usd = balance.amount_micro / 1_000_000;
console.log(`Balance: $${usd.toFixed(2)}`);
```

## Notes

* **Micro-USD everywhere.** `amount_micro` is an integer in millionths of a
  dollar. Divide by `1_000_000` for display; never store a rounded float as the
  source of truth.
* **Lock semantics.** `locked: true` with `locked_at` set means the balance is
  frozen. While frozen, [pay-from-balance](./pay-from-balance.md) fails with the
  `balance_locked` error — surface the freeze state in the UI before letting a
  user attempt to pay from balance.
* **No 404 for new users.** Accounts without ledger history return zeros, so you
  can render a balance widget without special-casing "not found".
* **Live updates.** This endpoint is a point-in-time snapshot. For a value that
  stays current, use the [balance event stream](./balance-events.md), which
  emits a `snapshot` baseline on every (re)connect followed by
  `balance_credit` / `balance_debit` frames.
* **Ledger detail.** To list the individual credits and debits behind the
  balance, use [list ledger entries](./list-balance-entries.md).
