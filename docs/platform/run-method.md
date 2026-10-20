> Live version: https://triport.io/docs/platform/run-method

# Run method (method explorer)

> Executes a single JSON-RPC method against your default key from the browser-based method explorer, returning a structured envelope for both success and failure.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/diagnostics/run-method` |
| **Type** | Triport product (REST API) |
| **Network** | Any network in the registry |
| **Authentication** | Session cookie + CSRF token (`nl_csrf` cookie → `X-CSRF-Token` header) |
| **Required scope** | — (gated by your account session, not an API-key scope) |
| **Tier / rate limit** | 5 RPS sustained · up to 10 burst per session (burst 5); [Burst capacity](../rate-limits-and-tiers.md#burst-capacity) |

## Description

`POST /v1/diagnostics/run-method` powers the in-browser **method explorer**. It
takes a chain, a method name, and a params payload, screens the call against
your account's tier, then forwards it to the live RPC backend using your
**default API key** — so you can try a method and see its real latency and
result without wiring up a client first.

This endpoint is **session-gated**, not API-key-gated. It is meant to be called
from a logged-in browser tab: the request must carry your session cookie and a
matching CSRF token. It is not part of the programmatic RPC surface — for that,
call the chain's RPC endpoint directly. The handler never receives or returns a
raw API key; it resolves your default key server-side and forwards on your
behalf.

The defining trait of this endpoint is its envelope: **every** response — 2xx
success and 4xx/5xx alike — parses as the same JSON object with an `ok` boolean.
A non-2xx status is part of the contract, not a transport failure. Callers must
branch on the `ok` and `error` fields, **never on the HTTP status code alone**.

## Parameters

Request body (JSON):

| Name | Type | Required | Description |
|---|---|---|---|
| `chain` | string | yes | Target network. One of `sol`, `eth`, `polygon` (the long forms `solana`, `ethereum`, `poly` are also accepted). |
| `method` | string | yes | The JSON-RPC method to run, e.g. `getBalance`, `eth_getBlockByNumber`. Must be non-empty and known to the classifier for that chain. |
| `params` | any | yes | The JSON-RPC params payload, passed through verbatim to the upstream call. Usually an array; may be any JSON value. Max body size 64 KiB. |
| `transport` | string | no | Transport to use. Only `'http'` is supported; an empty value defaults to HTTP. Any other value is rejected. |

## Request

```bash
curl https://triport.io/v1/diagnostics/run-method \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TRIPORT_CSRF" \
  -b "nl_session=$TRIPORT_SESSION; nl_csrf=$TRIPORT_CSRF" \
  -d '{
    "chain": "sol",
    "method": "getBalance",
    "params": ["So11111111111111111111111111111111111111112"],
    "transport": "http"
  }'
```

The `X-CSRF-Token` header must equal the value of the `nl_csrf` cookie
(double-submit cookie pattern). In the browser the explorer reads `nl_csrf` from
`document.cookie` and copies it into the header automatically.

## Response

A successful call returns HTTP `200` with `ok: true`:

```json
{
  "ok": true,
  "latency_ms": 38,
  "result": {
    "context": { "slot": 333912004 },
    "value": 1280000000
  },
  "rate_limit_remaining": 117,
  "tier_required": "free",
  "category": "sol_read_rpc"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `ok` | boolean | `true` on success, `false` on every error path. Branch on this first. |
| `latency_ms` | number | Wall-clock time of the upstream forward, in milliseconds. Also present on `rate_limited` and `upstream_failed` errors. |
| `result` | any | The upstream JSON-RPC `result` value, passed through verbatim. Shape depends on the method called. |
| `rate_limit_remaining` | number | Remaining requests in the upstream tier budget for this category. `-1` when the upstream did not report a budget. |
| `tier_required` | string | Minimum tier that grants the method's category (e.g. `free`, `basic`, `pro`, `business`, `enterprise`). |
| `category` | string | The tier category the method classified into, e.g. `sol_read_rpc`, `eth_send_tx`. |

## Errors

Every error shares the envelope (`ok: false` plus an `error` code). The HTTP
status signals which branch to render but is not the source of truth — read
`error`.

| Code | HTTP | Meaning | When it happens | Extra fields |
|---|---|---|---|---|
| `unauthenticated` | 401 | No valid session | Missing/expired session cookie, or no user on the request. | — |
| `invalid_json` | 400 | Body did not parse | Malformed JSON, or body over the 64 KiB cap. | — |
| `invalid_chain` | 400 | Unknown `chain` | `chain` is not one of `sol`/`eth`/`polygon` (or their aliases). | — |
| `invalid_method` | 400 | Empty `method` | `method` was omitted or blank. | — |
| `transport_not_supported` | 400 | Bad `transport` | `transport` was set to something other than `http`. | — |
| `no_default_key` | 500 | No usable key | Your account has no active default API key to forward with. | — |
| `method_unknown` | 403 | Method not classified | The method is not in the tier classifier for that chain. | `chain`, `method` |
| `tier_insufficient` | 403 | Tier gate | Your tier does not grant the method's category. | `current_tier`, `required_tier`, `category`, `method`, `upgrade_url` |
| `rate_limited` | 429 | Throttled | Either the per-session 5 RPS sustained · up to 10 burst cap, or the upstream tier RPS budget. | `current_tier`, `category`, `limit_rps`, `retry_after_sec` (session-cap also sets `category: "diagnostics_session"`) |
| `upstream_failed` | 502 | Forward failed | The upstream RPC returned an error or was unreachable. The message is in `detail`. | `detail`, `latency_ms` |
| `internal` | 500 | Server error | Tier resolution or another internal step failed. | — |
| `invalid_params` | — | Params rejected | The supplied `params` were rejected for the method. Part of the documented envelope union. | — |

Example `tier_insufficient` body (HTTP `403`):

```json
{
  "ok": false,
  "error": "tier_insufficient",
  "current_tier": "free",
  "required_tier": "pro",
  "category": "eth_trace_filter",
  "method": "trace_filter",
  "upgrade_url": "/pricing"
}
```

Example `rate_limited` body (HTTP `429`):

```json
{
  "ok": false,
  "error": "rate_limited",
  "current_tier": "",
  "category": "diagnostics_session",
  "limit_rps": 5,
  "retry_after_sec": 1
}
```

See [errors.md](../errors.md) for the shared error envelope and conventions.

## Examples

### JavaScript (fetch)

Reads the `nl_csrf` cookie and submits it as the CSRF header; `credentials:
'include'` sends the session cookie. The caller branches on `ok`, never on the
HTTP status.

```js
function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function runMethod(req) {
  const headers = { 'Content-Type': 'application/json' };
  const csrf = readCookie('nl_csrf');
  if (csrf) headers['X-CSRF-Token'] = csrf;

  const r = await fetch('https://triport.io/v1/diagnostics/run-method', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(req),
  });
  // Parse the body for every status — handler always emits the envelope.
  return r.json();
}

const res = await runMethod({
  chain: 'sol',
  method: 'getBalance',
  params: ['So11111111111111111111111111111111111111112'],
  transport: 'http',
});

if (res.ok) {
  console.log(`ok in ${res.latency_ms}ms`, res.result);
} else if (res.error === 'tier_insufficient') {
  console.warn(`needs ${res.required_tier}`, res.upgrade_url);
} else if (res.error === 'rate_limited') {
  console.warn(`retry in ${res.retry_after_sec}s (limit ${res.limit_rps} rps)`);
} else {
  console.error(res.error, res.detail);
}
```

## Notes

* **Always branch on `ok` / `error`, not on HTTP status.** A `403`, `429`, or
  `502` carries a fully-formed envelope; treat the status only as a hint for
  which branch to render.
* **Two distinct `rate_limited` sources.** The per-session 5 RPS cap (this
  endpoint, `category: "diagnostics_session"`) and the upstream per-category
  tier budget both surface as `error: "rate_limited"`. Use `category` to tell
  them apart; both carry `limit_rps` and `retry_after_sec`.
* **Default key only.** The method runs against your account's active default
  API key. If none is set you get `no_default_key`.
* **Body cap.** Request bodies are limited to 64 KiB — enough for large Solana
  `simulateTransaction` payloads. Larger bodies fail as `invalid_json`.
* **Browser-first.** This is the method explorer's backend; for programmatic
  access call the chain's RPC endpoint directly with your API key instead.

9 networks are supported today: Solana, Ethereum, Polygon, BNB Smart Chain, Base, Tron, Robinhood Chain, Stellar, and TON.
