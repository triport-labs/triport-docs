> Live version: https://triport.io/docs/errors

# Errors

> Every Triport error — REST or JSON-RPC — uses one predictable JSON envelope with a machine-readable `error` code, a human `message`, and a `request_id` you can quote in support tickets.

| | |
|---|---|
| **Method / Endpoint** | `n/a — error reference` |
| **Network** | Solana \| Ethereum \| Polygon \| Tron \| BSC \| Stellar \| TON |
| **Authentication** | `x-token` header (preferred) · `Authorization: Bearer` · `?api-key` query · path-form |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

Triport returns a consistent error shape across all surfaces. The HTTP status
line tells you the broad class of problem, the `error` field gives you a stable
machine-readable code to branch on, and the `message` is a human-readable
explanation safe to log. Some errors carry extra fields (for example, which
tier you'd need to upgrade to, or how many seconds to wait before retrying).

Branch your client logic on the `error` code, **not** on the `message` string —
messages may be reworded over time, while codes are part of the contract. When
you contact support, always include the `request_id`: it lets us correlate your
call with our server-side logs.

Authentication, tier, and rate-limit rejections are decided **before** the
request reaches the RPC layer, so they are plain HTTP errors using the envelope
above — not JSON-RPC `error` objects, on any surface including `/rpc/bsc`. The
JSON-RPC `error` objects you do receive come either from the upstream node or
from the two batch-level checks Triport performs itself; both are listed in
[JSON-RPC wire codes](./errors.md#json-rpc-wire-codes) below.

## The error envelope

Every REST error response has this shape:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'getAssetsByOwner' requires basic tier or higher",
  "request_id": "req_9f3c1a8e2b6d4f10"
}
```

### Envelope fields

| Field | Type | Description |
|---|---|---|
| `error` | string | Machine-readable error code. One of the values in the [error code table](./errors.md#error-code-table). Branch on this. |
| `message` | string | Human-readable explanation. Safe to log; do not parse. |
| `request_id` | string | Server-side correlation id. Quote it in support tickets. May be absent on errors generated before a request is fully routed. |

Specific error codes add extra top-level fields on top of this base envelope —
see the per-code rows below.

## Error code table

| `error` code | HTTP status | Extra fields | When it happens |
|---|---|---|---|
| `unauthorized` | 401 | — | No credentials supplied, or the key/token is invalid or revoked. |
| `trial_expired` | 401 | `expired_at`, `upgrade_url` | The free 7-day trial period has ended. Upgrade to a paid tier to continue. |
| `subscription_expired` | 401 | `expired_at`, `renew_url` | A previously active paid subscription has lapsed. Renew to restore access. |
| `tier_insufficient` | 403 | `current_tier`, `required_tier`, `method`, `category`, `upgrade_url` | Your tier is below the minimum required for this method. Also sets the `X-Required-Tier` response header. |
| `method_unknown` | 403 | `chain`, `method` | The method is not part of the product on this chain. |
| `rate_limited` | 429 | `retry_after_sec`, `limit_rps`, `burst_capacity`, `category`, `current_tier` | Sustained RPS for your tier and the request's category was exceeded. Sets `Retry-After` and `X-RateLimit-*` headers. |
| `invalid_params` | 400 | — | The request was malformed: bad/missing parameters or an unparseable body. |
| `internal_error` | 500 | — | An unexpected server-side fault. Safe to retry with backoff; quote `request_id` if it persists. |

> **Note:** there is **no daily quota** and no daily-quota error. Rate limiting
> is sustained-RPS-per-tier with a burst allowance — see
> [Rate limits](./rate-limits-and-tiers.md).

### Extra-field reference

**`tier_insufficient` (403)** — adds:

| Field | Type | Description |
|---|---|---|
| `current_tier` | string | Your key's tier — one of `free`, `basic`, `pro`, `business`, `enterprise`. |
| `required_tier` | string | Minimum tier needed for this method. |
| `method` | string | The method that was gated. |
| `category` | string | The tier-matrix category bucket that gates this method. |
| `upgrade_url` | string (uri) | Link to upgrade your subscription. |

Also returned as the `X-Required-Tier` response header.

**`rate_limited` (429)** — adds:

| Field | Type | Description |
|---|---|---|
| `current_tier` | string | Tier of the API key that triggered the limit. |
| `retry_after_sec` | integer (≥1) | Seconds to wait before retrying. Mirrors the `Retry-After` header. |
| `limit_rps` | integer (≥1) | Sustained RPS allowed for your tier and category. |
| `burst_capacity` | integer | Short burst ceiling. Equals `2 × limit_rps` (global burst multiplier). |
| `category` | string | The tier-matrix category the offending request belongs to. |

Also accompanied by the response headers below.

**`trial_expired` (401)** — adds `expired_at` (date-time) and `upgrade_url` (uri).

**`subscription_expired` (401)** — adds `expired_at` (date-time) and `renew_url` (uri).

**`method_unknown` (403)** — adds:

| Field | Type | Description |
|---|---|---|
| `chain` | string | Chain the method was attempted on — `sol`, `eth`, `polygon`, `tron`, or `bsc`. |
| `method` | string | The method name that was not recognised. |

## Response headers

On `429 rate_limited`, Triport sets:

| Header | Description |
|---|---|
| `Retry-After` | Seconds to wait before retrying. |
| `X-RateLimit-Limit` | Total allowed RPS for the matching tier + category. |
| `X-RateLimit-Remaining` | Remaining capacity in the current 1-second window. |
| `X-RateLimit-Reset` | UNIX timestamp when the window resets. |
| `X-RateLimit-Category` | Tier-matrix category bucket charged for this request. |

On `403 tier_insufficient`, Triport sets:

| Header | Description |
|---|---|
| `X-Required-Tier` | Minimum tier required for the method. |

## Examples

### tier_insufficient — 403 envelope

```json
{
  "error": "tier_insufficient",
  "message": "Method 'getAssetsByOwner' requires basic tier or higher",
  "request_id": "req_9f3c1a8e2b6d4f10",
  "current_tier": "free",
  "required_tier": "basic",
  "method": "getAssetsByOwner",
  "category": "sol_das",
  "upgrade_url": "https://triport.io/upgrade/basic"
}
```

### rate_limited — 429 envelope

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 20 requests/s for sol_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "sol_read_rpc",
  "limit_rps": 20,
  "burst_capacity": 40,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

## JSON-RPC wire codes

Triport's product errors — `unauthorized`, `trial_expired`,
`subscription_expired`, `tier_insufficient`, `method_unknown`, `rate_limited` —
are **not** returned as JSON-RPC `error` objects. The gate decides them before
the request reaches the RPC layer, so they arrive as the plain HTTP envelope
documented above, with the status from the
[error code table](./errors.md#error-code-table). Branch on the HTTP status and the
`error` field; there is no numeric wire code for them to branch on.

Triport emits exactly two JSON-RPC error codes of its own, both for a batch
body it cannot process:

| JSON-RPC `code` | Meaning | HTTP status | When it happens |
|---|---|---|---|
| `-32700` | Parse error | 400 | The body opened as a batch array (`[`) but is not valid JSON. |
| `-32600` | Invalid Request | 200 | An empty batch `[]`. Per JSON-RPC 2.0 §6 this is answered with a single error object, and the request itself arrived intact — hence HTTP 200. |

For a batch that parses, responses can arrive in any order and each item succeeds
or fails on its own — see [JSON-RPC batches: order, ids and partial errors](https://triport.io/learn/json-rpc-batch-responses).

Every other JSON-RPC `code` you see is the upstream node's own and is passed
through unchanged — most commonly `-32602` (invalid params) and `-32601`
(method not found). The chain-specific boundaries below cover the upstream
codes worth special handling.

### BSC upstream `-32000`

BSC nodes also use upstream code `-32000` for more than one condition. A
message containing `header not found` means that the requested block is not
available, while pruned/unsupported-state wording means historical state is
unavailable on the selected node. Branch on the pair **code + message** for
this upstream error. It is distinct from Triport's stable product codes above.

Trace/debug on BSC is best-effort: its only public source has a shared quota and
no SLA. A quota response must not be rewritten as `method_unknown`.

### Stellar retention and Horizon page limit

Stellar uses an explicit boundary outcome for history outside the selected
node's current window. Horizon returns HTTP `410 Gone` with
`beyond_retention` and `oldest=N`; Soroban returns JSON-RPC `-32602` with
`beyond_retention` and `oldest N`. These responses describe the retained
window and are not internal failures.

Horizon rejects a page size above the measured maximum with
`limit must not exceed 200`. Retry only after reducing `limit` to 200 or less.

### TON retention and unavailable writes

TON returns JSON-RPC `-32602` with `beyond_retention` and `oldest N` when a
historical `seqno` is below the selected liteserver's numeric floor. Upstream
texts such as `not in db`, `block not in db`, and `state not in db` are treated
as this boundary for old requests, not as empty data. `sendBoc` is outside the
read-only TON catalog, so the gate rejects it as an unclassified method with
HTTP `403` `method_unknown` — it never reaches an upstream node.

### method_unknown — 403 envelope

```json
{
  "error": "method_unknown",
  "message": "Method \"bogus_nonexistent_method_42\" on chain \"polygon\" is not recognised",
  "chain": "polygon",
  "method": "bogus_nonexistent_method_42"
}
```

The `tier_insufficient` and `rate_limited` bodies are shown under
[Examples](./errors.md#examples) above. All three are plain HTTP responses: there is no
JSON-RPC envelope and no `error.data` — the extra fields sit at the top level of
the body, and the HTTP status carries the class.

## Handling errors

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getBalance",
    params: ["So11111111111111111111111111111111111111112"],
  }),
});

const body = await res.json();

if (!res.ok) {
  // Product errors are plain HTTP responses, not JSON-RPC error objects:
  // branch on the `error` field, with the extra fields at the top level.
  switch (body.error) {
    case "rate_limited": {
      const wait = Number(res.headers.get("Retry-After") ?? body.retry_after_sec);
      await new Promise((r) => setTimeout(r, wait * 1000));
      // ...then retry
      break;
    }
    case "tier_insufficient":
      console.error("Upgrade required:", body.upgrade_url);
      break;
    case "method_unknown":
      console.error("Unknown method:", body.method);
      break;
    default:
      throw new Error(body.message ?? `HTTP ${res.status}`);
  }
} else if (body.error) {
  // A JSON-RPC error object from the upstream node, e.g. -32602 invalid params.
  throw new Error(`${body.error.code}: ${body.error.message}`);
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { Triport, TierInsufficientError, RateLimitedError } from "@triport/sdk";

const client = new Triport({ token: process.env.TRIPORT_API_KEY! });

try {
  await client.sol.getAssetsByOwner("So11111111111111111111111111111111111111112");
} catch (err) {
  if (err instanceof RateLimitedError) {
    await new Promise((r) => setTimeout(r, err.retryAfterSec * 1000));
    // ...retry
  } else if (err instanceof TierInsufficientError) {
    console.error(`Need ${err.requiredTier}; upgrade at ${err.upgradeUrl}`);
  } else {
    throw err;
  }
}
```

## Notes

* **Branch on codes, not messages.** The `error` code (REST) and JSON-RPC
  numeric `code` are stable; `message` text may change.
* **Respect `Retry-After`.** On `429`, wait at least `retry_after_sec` seconds
  (or read the `Retry-After` header) before retrying. `burst_capacity` is
  `2 × limit_rps`. See [Rate limits](./rate-limits-and-tiers.md) for the full model.
* **`401` vs `403`.** A `401` (`unauthorized`, `trial_expired`,
  `subscription_expired`) is about *who you are*; a `403`
  (`tier_insufficient`, `method_unknown`) is about *what your tier may call*.
  See [Authentication](./authentication.md) for credential setup.
* **`internal_error` (500)** is the only error safe to blindly retry with
  exponential backoff. If it persists, open a support ticket with the
  `request_id`.
* See also: [Getting started](./getting-started.md) ·
  [Authentication](./authentication.md) · [Rate limits](./rate-limits-and-tiers.md).

| ID | Network | Required scope | Errors |
|---|---|---|---|
| `sol` | Solana | `solana:rpc` | [Errors](./sol/errors.md) |
| `eth` | Ethereum | `eth:rpc` | [Errors](./eth/errors.md) |
| `polygon` | Polygon | `polygon:rpc` | [Errors](./polygon/errors.md) |
| `bsc` | BNB Smart Chain | `bsc:rpc` | [Errors](./bsc/errors.md) |
| `base` | Base | `base:rpc` | [Errors](./base/errors.md) |
| `tron` | Tron | `tron:rpc` | [Errors](./tron/errors.md) |
| `robinhood` | Robinhood Chain | `robinhood:rpc` | [Errors](./robinhood/errors.md) |
| `stellar` | Stellar | `stellar:rpc` | [Errors](./stellar/errors.md) |
| `ton` | TON | `ton:rpc` | [Errors](./ton/errors.md) |
