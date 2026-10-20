> Live version: https://triport.io/docs/console/billing/invoice-events

# Invoice SSE event stream

> Subscribe to live state changes for a single invoice over Server-Sent Events (SSE) — from the moment it is created until it is paid, cancelled, or expires.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/billing/invoices/{id}/events` |
| **Type** | Triport Console API |
| **Network** | — (account/billing surface, not chain-specific) |
| **Authentication** | Session cookie (same-origin console session, sent automatically by the browser) |
| **Required scope** | — |
| **Tier / rate limit** | — (one long-lived SSE connection per invoice) |

## Description

This endpoint opens a long-lived `text/event-stream` (SSE) connection scoped to
one invoice. Use it to drive a live payment screen: render a QR code, then react
the instant the payment lands instead of polling [`GET /v1/billing/invoices/{id}`](./get-invoice.md).

The **first frame is always a `snapshot`** carrying the invoice's current status,
so a freshly opened connection immediately tells you where the invoice stands.
After the snapshot, named events are pushed as the invoice's state changes.

The stream is **reconnect-safe**: it carries no resumable cursor or `Last-Event-ID`
semantics, so if the connection drops, simply re-subscribe — you will receive a
fresh `snapshot` reflecting the latest state and can continue from there.

Two important lifecycle behaviours:

- If the invoice is already in a terminal state (`paid`, `expired`, or
  `cancelled`) when you connect, the server emits a single `snapshot` and then
  **closes the stream** — there is nothing further to wait for.
- For a `pending` invoice, the server holds the stream open and emits a
  `: keep-alive` comment every 15 seconds to keep proxies from idling the
  connection. Once an `invoice_paid` event for this invoice is delivered, the
  server **closes the stream**.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The invoice ID returned by [`POST /v1/billing/invoices`](./create-invoice.md). If no invoice with this ID exists, the endpoint returns `404`. |

There are no query parameters or request body.

## Request

SSE is consumed in the browser with `EventSource`, but you can observe the raw
stream with `curl -N` (no buffering). The session cookie is sent automatically;
pass it explicitly when calling outside the browser:

```bash
curl -N https://triport.io/v1/billing/invoices/inv_8f2c1a/events \
  --cookie "session=$TRIPORT_SESSION"
```

## Response

`Content-Type: text/event-stream`. Each frame is a named SSE event whose `data:`
line is a JSON object. A pending invoice that is then paid produces a stream like:

```text
event: snapshot
data: {"status":"pending"}

: keep-alive

event: invoice_paid
data: {"type":"invoice_paid","invoice_id":"inv_8f2c1a","payer_user_id":"usr_4d9","payment_id":80214,"amount_micro":1500000}

```

(After the `invoice_paid` frame for this invoice, the server closes the
connection.)

### Event types

The stream defines the following named events. Every `invoice_*` event shares a
common JSON envelope; fields that are zero/empty are omitted.

| Event | When it fires | Data payload |
|---|---|---|
| `snapshot` | Always, as the first frame after connecting (and the only frame if the invoice is already terminal). | `{ "status": <status> }` |
| `invoice_created` | The invoice has been created. | `{ "type": "invoice_created", "invoice_id": <string> }` |
| `invoice_progress` | A partial / in-progress payment update for the invoice. | invoice envelope (see below) |
| `invoice_late_payment` | A payment arrived for an invoice that had already expired. | invoice envelope (see below) |
| `invoice_paid` | The invoice is fully paid. The server closes the stream right after this frame. | invoice envelope (see below) |
| `invoice_cancelled` | The invoice was cancelled (e.g. via [`POST /v1/billing/invoices/{id}/cancel`](./cancel-invoice.md)). | invoice envelope (see below) |
| `invoice_expired_sweep` | The periodic sweeper expired one or more pending invoices. This is a broadcast event and is **not** scoped to your invoice. | `{ "type": "invoice_expired_sweep" }` |

### `snapshot` data fields

| Field | Type | Description |
|---|---|---|
| `status` | string | Current invoice status: `pending`, `paid`, `expired`, or `cancelled`. |

### Invoice event envelope

`invoice_paid` (and the other `invoice_*` events that carry it) use this shape:

| Field | Type | Description |
|---|---|---|
| `type` | string | The event name, e.g. `"invoice_paid"`. |
| `invoice_id` | string | The invoice this event refers to. |
| `payer_user_id` | string | *(optional)* The user who paid. Present on payment events. |
| `payment_id` | number | *(optional)* The settled payment's ID. |
| `amount_micro` | number | *(optional)* Amount in micro-USD (`1500000` = `1.50`). |
| `activation_failed` | boolean | *(optional)* `true` if payment settled but the linked subscription/top-up activation did not complete. |

## Errors

This endpoint does not return a JSON error envelope on the stream itself — it
fails before the stream opens:

| Code | Meaning | When it happens |
|---|---|---|
| `404 Not Found` | Unknown invoice | No invoice exists for the given `{id}`. |
| `500 Internal Server Error` | Streaming unsupported | The server could not establish a streaming connection. |

See [errors.md](../../errors.md) for the standard error envelope used by the
non-streaming billing endpoints.

## Examples

### JavaScript (fetch)

`EventSource` is the idiomatic SSE client in the browser (it sends the
same-origin session cookie automatically):

```js
const id = "inv_8f2c1a";
const es = new EventSource(`https://triport.io/v1/billing/invoices/${id}/events`);

const onAny = (name) => (e) => {
  const data = e.data ? JSON.parse(e.data) : null;
  console.log(name, data);
};

for (const name of [
  "snapshot",
  "invoice_created",
  "invoice_progress",
  "invoice_late_payment",
  "invoice_paid",
  "invoice_cancelled",
  "invoice_expired_sweep",
]) {
  es.addEventListener(name, onAny(name));
}

es.addEventListener("invoice_paid", () => es.close()); // stream ends after paid
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient(); // uses the session cookie in the browser

// Returns an unsubscribe function; re-call to re-subscribe after a disconnect.
const unsubscribe = client.billing.subscribeInvoice(
  "inv_8f2c1a",
  (eventType, data) => {
    if (eventType === "snapshot") console.log("current status:", data.status);
    if (eventType === "invoice_paid") {
      console.log("paid:", data.amount_micro);
      unsubscribe();
    }
  },
);
```

### Python (`triport-sdk`)

`EventSource` is browser-only; from Python, read the raw stream:

```python
import json
import httpx

url = "https://triport.io/v1/billing/invoices/inv_8f2c1a/events"
cookies = {"session": TRIPORT_SESSION}

with httpx.stream("GET", url, cookies=cookies, timeout=None) as r:
    r.raise_for_status()
    event = None
    for line in r.iter_lines():
        if line.startswith("event: "):
            event = line[len("event: "):]
        elif line.startswith("data: "):
            data = json.loads(line[len("data: "):])
            print(event, data)
            if event == "invoice_paid":
                break  # server closes the stream after this
```

## Notes

- **First frame guarantee.** Always handle `snapshot` first — it is the source of
  truth for the invoice's state at connect time and may be the only frame for an
  already-terminal invoice.
- **Reconnecting.** On disconnect, just reconnect; a new `snapshot` resyncs you.
  There is no daily quota and no resumable event cursor.
- **`invoice_expired_sweep` is not invoice-scoped.** Treat it as a hint to
  re-check invoices, not as a definitive signal about *this* invoice.
- **Keep-alives.** Lines beginning with `:` are SSE comments (heartbeats) and
  should be ignored by clients; `EventSource` does this for you.
- **Related:** [`POST /v1/billing/invoices`](./create-invoice.md),
  [`GET /v1/billing/invoices/{id}`](./get-invoice.md),
  [`POST /v1/billing/invoices/{id}/cancel`](./cancel-invoice.md),
  [`POST /v1/billing/invoices/{id}/pay-from-balance`](./pay-from-balance.md),
  and the [balance event stream](./balance-events.md).
