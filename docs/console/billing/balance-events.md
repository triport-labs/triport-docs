> Live version: https://triport.io/docs/console/billing/balance-events

# Balance SSE event stream

> A Server-Sent Events stream that pushes your account's authoritative balance on connect and on every credit or debit.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/balance/events` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie (`withCredentials`) |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/balance/events` is a long-lived [Server-Sent Events](https://developer.mozilla.org/docs/Web/API/Server-sent_events) stream (`Content-Type: text/event-stream`) that delivers your live account balance. It is scoped to the authenticated session: the server only emits events for your own user, so there is no per-user filter to pass.

The stream is **authoritative** — all amounts are in micro-USD (1 USD = 1,000,000 micro). Never do client-side balance arithmetic from deltas alone: every credit and debit frame also carries the post-event `new_balance`, and the `snapshot` frame carries the full current balance. Treat the server's values as the source of truth.

On every connect (and every reconnect), the server first sends a `snapshot` frame describing the current balance, then streams `balance_credit` / `balance_debit` frames as they occur. A keep-alive comment frame is sent every 15 seconds so that intermediary proxies do not close the idle connection.

Use this stream to keep a balance widget live without polling. For one-off reads or for re-establishing a baseline after a disconnect, use [`GET /v1/balance`](./get-balance.md); for historical ledger rows, use [`GET /v1/balance/entries`](./list-balance-entries.md).

## Parameters

This endpoint takes no path, query, or body parameters. Identity is resolved from the session cookie.

## Request

Because this is consumed in the browser via `EventSource`, the canonical client is JavaScript (see [Examples](./balance-events.md#examples)). To inspect the raw stream from the command line:

```bash
curl -N https://triport.io/v1/balance/events \
  -H "Accept: text/event-stream" \
  --cookie "triport_session=$TRIPORT_SESSION"
```

`-N` disables curl's output buffering so frames appear as they arrive. The session cookie is the same one set when you sign in to the console.

## Response

The response is an open `text/event-stream`. Each frame is a named SSE event (`event: <name>`) followed by a JSON `data:` line. The very first frame is always `snapshot`; subsequent frames are `balance_credit` or `balance_debit`. Comment lines beginning with `:` are keep-alives and carry no data.

```text
event: snapshot
data: {"amount_micro":12500000,"locked":false,"updated_at":1748505600}

: keep-alive

event: balance_credit
data: {"kind":"balance_credit","user_id":"usr_7Qd3","delta_micro":5000000,"new_balance":17500000,"ref_payment_id":4821,"at":1748505631}

event: balance_debit
data: {"kind":"balance_debit","user_id":"usr_7Qd3","delta_micro":-2000000,"new_balance":15500000,"ref_invoice_id":"inv_9aF2c1","at":1748505702}
```

### Event types

| Event name | When it fires | Payload shape |
|---|---|---|
| `snapshot` | On every connect and reconnect, as the first frame. The authoritative baseline — overwrite your cached balance with it, do **not** merge. | Snapshot payload |
| `balance_credit` | When your balance increases (e.g. a payment is credited). | Delta payload |
| `balance_debit` | When your balance decreases (e.g. an invoice is paid from balance). `delta_micro` is negative. | Delta payload |

#### `snapshot` payload fields

| Field | Type | Description |
|---|---|---|
| `amount_micro` | integer | Current balance in micro-USD. `0` for a brand-new account. |
| `locked` | boolean | Whether the balance is currently locked. |
| `updated_at` | integer | Unix seconds the balance was last updated. Multiply by 1000 for `new Date(...)`. |
| `locked_at` | integer | Unix seconds the balance was locked. Present only when `locked` is `true`. |

#### `balance_credit` / `balance_debit` payload fields

| Field | Type | Description |
|---|---|---|
| `kind` | string | The event kind — equals the event name (`balance_credit` or `balance_debit`). Redundant discriminator alongside the SSE event name. |
| `user_id` | string | Your user id. |
| `delta_micro` | integer | Signed change in micro-USD. Positive for credits, negative for debits. |
| `new_balance` | integer | Authoritative balance in micro-USD **after** applying this event. Use this rather than summing deltas. |
| `ref_invoice_id` | string | Invoice this movement references. Present only when applicable. |
| `ref_payment_id` | integer | Payment this movement references. Present only when applicable. |
| `at` | integer | Unix seconds the event occurred. Note the field is `at`, not `created_at`. |

## Errors

SSE errors surface as the HTTP status of the initial response (before the stream opens) or as a connection drop afterwards.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | No valid session cookie was sent. Sign in and retry. |
| `500` | Streaming unsupported | The serving environment cannot flush a stream. Not retryable by the client. |

See the shared [error envelope reference](../../errors.md) for the full JSON error format returned by non-streaming endpoints such as `GET /v1/balance`.

## Examples

### JavaScript (fetch)

`EventSource` is the right primitive for SSE in the browser — it auto-reconnects on network errors and lets you bind per-event listeners. Pass `withCredentials: true` so the session cookie is sent.

```js
const es = new EventSource("https://triport.io/v1/balance/events", {
  withCredentials: true,
});

// snapshot = authoritative baseline; overwrite, don't merge.
es.addEventListener("snapshot", (e) => {
  const snap = JSON.parse(e.data);
  console.log("baseline balance:", snap.amount_micro, "locked:", snap.locked);
});

const onDelta = (e) => {
  const ev = JSON.parse(e.data);
  console.log(ev.kind, ev.delta_micro, "->", ev.new_balance);
};
es.addEventListener("balance_credit", onDelta);
es.addEventListener("balance_debit", onDelta);

es.onerror = () => {
  // EventSource reconnects automatically; the server re-sends a fresh
  // snapshot on reconnect, so any frames missed while offline are recovered.
};

// later: es.close();
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { subscribeBalance, getBalance } from "@triport/sdk";

const stop = subscribeBalance((ev) => {
  if (ev.type === "snapshot") {
    // authoritative baseline — replace local state
    setBalance(ev.amount_micro);
  } else {
    // balance_credit | balance_debit — trust new_balance
    setBalance(ev.new_balance);
  }
});

// On a hard disconnect, re-fetch the snapshot before resubscribing:
// const fresh = await getBalance();

// teardown:
stop();
```

### Python (`triport-sdk`)

```python
from triport import Client

client = Client(session="$TRIPORT_SESSION")

for event in client.balance.events():
    if event.type == "snapshot":
        print("baseline:", event.amount_micro, "locked:", event.locked)
    else:  # balance_credit | balance_debit
        print(event.kind, event.delta_micro, "->", event.new_balance)
```

## Notes

* **Snapshot semantics.** The `snapshot` frame is a full replacement of your cached balance, including `locked` / `locked_at` transitions — never merge it with prior state.
* **Reconnect strategy.** If the connection drops, re-fetch [`GET /v1/balance`](./get-balance.md) to re-establish a baseline, then reconnect to `/v1/balance/events`. Events dropped while you were offline (e.g. a slow subscriber) are recovered as part of the new `snapshot`. Browser `EventSource` handles reconnection automatically.
* **Keep-alives.** A `: keep-alive` comment frame is sent every 15 seconds. It carries no data — ignore it. It exists only to keep proxies from closing an idle connection.
* **No default `message` channel.** The server only emits the three named events (`snapshot`, `balance_credit`, `balance_debit`); the unnamed `message` channel is never used, so an `onmessage` handler will never fire.
* **Units.** All amounts are integer micro-USD (1 USD = 1,000,000 micro). Timestamps (`updated_at`, `locked_at`, `at`) are Unix seconds — multiply by 1000 for a JavaScript `Date`.
* **Related:** [`GET /v1/balance`](./get-balance.md) (snapshot), [`GET /v1/balance/entries`](./list-balance-entries.md) (paginated ledger history).
