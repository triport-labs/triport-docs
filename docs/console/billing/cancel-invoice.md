> Live version: https://triport.io/docs/console/billing/cancel-invoice

# Cancel an invoice

> Cancels one of your own pending invoices, transitioning it from `pending` to `cancelled`.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/billing/invoices/{id}/cancel` |
| **Type** | Triport Console API |
| **Network** | — (billing console; rail-agnostic) |
| **Authentication** | Console session cookie (`nl_session`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`POST /v1/billing/invoices/{id}/cancel` cancels a payment invoice you no longer
intend to pay. The invoice is moved from the `pending` status to `cancelled`,
which retires its payment address and stops it from ever settling. On success
the endpoint returns **`204 No Content`** with an empty body.

Only **pending** invoices can be cancelled. If the invoice has already reached a
terminal state — `paid`, `expired`, or `cancelled` — the transition is rejected.
Cancellation is also scoped to the **owning user**: the invoice must belong to
the account behind the session cookie. Requests for an invoice that does not
exist, is not pending, or belongs to another user all collapse to the same
`404` response, so the endpoint never reveals whether someone else's invoice id
exists.

This is a **console** endpoint, authenticated by your logged-in dashboard
session rather than by an API key. It is the counterpart to
[Create an invoice](./create-invoice.md): create opens a `pending` invoice,
cancel closes one that is still open.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The invoice id to cancel, as returned by [Create an invoice](./create-invoice.md) or [List invoices](./list-invoices.md). |

This endpoint takes no query parameters and no request body.

## Request

```bash
curl -X POST https://triport.io/v1/billing/invoices/inv_7c1f9a3e2b6d/cancel \
  --cookie "nl_session=$TRIPORT_SESSION"
```

The `nl_session` cookie is set automatically by your browser after you sign in
to the console, so dashboard-originated calls need no extra headers. The
`--cookie` flag above is only required when scripting the call outside the
browser.

## Response

On success the server responds `204 No Content` with no body:

```http
HTTP/1.1 204 No Content
```

There are no response fields — the absence of a body is the success signal. To
observe the resulting state, re-fetch the invoice with
[Get an invoice](./get-invoice.md) (its `status` will be `cancelled`) or listen
for the `invoice_cancelled` event on the
[invoice event stream](./invoice-events.md).

## Errors

Billing errors use a flat envelope, `{"error": "<message>"}`:

```json
{
  "error": "not found or not pending"
}
```

| Code | Meaning | When it happens |
|---|---|---|
| `204` | Cancelled | Success — the invoice was `pending` and is now `cancelled`. No body. |
| `401` | Not authenticated | The `nl_session` cookie is missing, expired, or invalid. |
| `404` | Not found or not pending | The invoice does not exist, is not in the `pending` state (already `paid`, `expired`, or `cancelled`), or does not belong to the session user. |

The single `404` deliberately conflates "no such invoice," "wrong owner," and
"not pending" so that one account cannot probe for another's invoice ids. Branch
your UI on the HTTP status, not on the message text.

See the shared [Errors](../../errors.md) page for the standard error envelope
used across the API.

## Examples

### JavaScript (fetch)
```js
const id = "inv_7c1f9a3e2b6d";

const res = await fetch(
  `https://triport.io/v1/billing/invoices/${id}/cancel`,
  {
    method: "POST",
    credentials: "include", // send the nl_session cookie
  },
);

if (res.status === 204) {
  // success — invoice is now cancelled
} else {
  let msg = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    if (body?.error) msg = body.error;
  } catch {
    /* no JSON body */
  }
  throw new Error(msg); // e.g. "not found or not pending"
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole(); // uses the browser session cookie

await console.billing.cancelInvoice("inv_7c1f9a3e2b6d");
// resolves on 204; throws if the invoice is not pending or not yours
```

### Python (`triport-sdk`)
```python
import os
from triport import ConsoleClient

console = ConsoleClient(session=os.environ["TRIPORT_SESSION"])

console.billing.cancel_invoice("inv_7c1f9a3e2b6d")
# returns None on success (204); raises on 401 / 404
```

## Notes

- **Pending-only, one-way.** Cancellation works only from `pending`; there is no
  endpoint to un-cancel. Terminal states (`paid`, `expired`, `cancelled`) are
  rejected with `404`.
- **Don't cancel to pay differently.** If you want to settle a pending invoice
  from your account balance instead of on-chain, use
  [Pay from balance](./pay-from-balance.md) — you don't need to cancel first.
- **Watch the state change live.** A cancelled invoice emits an
  `invoice_cancelled` event on the
  [invoice event stream](./invoice-events.md); subscribers can react without
  polling.
- **Related:** [Create an invoice](./create-invoice.md) ·
  [Get an invoice](./get-invoice.md) · [List invoices](./list-invoices.md) ·
  [Errors](../../errors.md)
