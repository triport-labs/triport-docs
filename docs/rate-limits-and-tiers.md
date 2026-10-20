> Live version: https://triport.io/docs/rate-limits-and-tiers

# Rate Limits and Tiers

> How Triport meters traffic: five subscription tiers, per-category sustained RPS, a 2× burst allowance, and the headers and errors you'll see when you hit a limit.

| | |
|---|---|
| **Method / Endpoint** | `n/a — rate-limit reference` |
| **Network** | Solana, Ethereum, Polygon, Tron, BSC, Stellar, TON, Robinhood; Base preview |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](./authentication.md) |
| **Required scope** | — |
| **Tier / rate limit** | Applies to every method on every chain |

## Description

Triport meters requests by **sustained requests-per-second (RPS)**, scoped to
the combination of your **tier** and the **category** a method belongs to (for
example `sol_read_rpc`, `eth_send_tx`, `polygon_read_rpc`). Every chain splits its
methods into roughly eight category buckets, and each tier has its own sustained
RPS budget per bucket. Each finite budget includes a **2× burst buffer** at no extra cost,
which refills at the sustained rate. **There is no quota on the number of bursts**:
traffic spikes are included in the plan without an extra charge. See [Burst capacity](./rate-limits-and-tiers.md#burst-capacity).

There is **no daily cap**. Triport does not enforce a per-day request quota, and
there is **no `X-Daily-Quota-Remaining` header** — the only limit you need to plan
around is sustained RPS per category. A `429` is normal backpressure, not a fatal
error: back off one second and retry.

Higher tiers unlock more categories, more regions, more tokens, and higher RPS.
When a method requires a tier above yours, you get `403 tier_insufficient`
instead of a rate-limit error.

## Tiers

| Tier | Price | Duration | Regions | Max tokens | Multi-region | Notes |
|---|---|---|---|---|---|---|
| **Free** | $0 | 7-day trial | EU only | 1 | — | Trial; limited category access |
| **Basic** | $20/mo | monthly | EU | 1 | — | |
| **Pro** | $249/mo | monthly | EU + US | 1 | — | |
| **Business** | $499/mo | monthly | EU + US | 5 | active-active | |

* **Free** is a 7-day trial limited to the **EU** region with a single token.
  When the trial period ends you receive `401 trial_expired`.
* **Pro** adds the **US** region.
* **Business** enables **multi-region active-active** routing across EU + US and
  allows up to **5 tokens**.
* **Enterprise** has **unlimited RPS** (`rps_unlimited`), custom Points of
  Presence, a custom domain, and white-labeling. Pricing and limits are
  negotiated per contract.

## Sustained RPS per tier

The table below lists **sustained RPS / short burst capacity** for the core read/write categories on
each chain. The burst buffer is included at no extra cost and refills at sustained RPS. `enterprise` is
unlimited across all categories unless a contract overrides it.

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---|---|---|---|---|
| `sol_read_rpc` | 20 / 40 | 60 / 120 | 200 / 400 | 600 / 1200 | unlimited |
| `sol_read_rpc_heavy` | 2 / 4 | 5 / 10 | 20 / 40 | 80 / 160 | unlimited |
| `sol_send_tx` | 5 / 10 | 10 / 20 | 50 / 100 | 150 / 300 | unlimited |
| `eth_read_rpc` | 10 / 20 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `eth_send_tx` | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | unlimited |
| `polygon_read_rpc` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `polygon_send_tx` | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | unlimited |
| `tron_read_rpc` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `tron_read_rpc_heavy` *(unmeasured; Polygon default)* | 2 / 4 | 5 / 10 | 20 / 40 | 80 / 160 | unlimited |
| `bsc_read_rpc` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `bsc_read_rpc_heavy` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `stellar_read_rpc` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `stellar_read_rpc_heavy` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `ton_read_rpc` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `ton_read_rpc_heavy` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `robinhood_read_rpc` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `robinhood_read_rpc_heavy` *(unmeasured; Polygon default)* | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `robinhood_send_tx` *(unmeasured; Polygon default)* | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | unlimited |
| `base_read_rpc` *(preview; provisional, unmeasured)* | 10 / 20 | 20 / 40 | 100 / 200 | 250 / 500 | contract |
| `base_send_tx` *(preview; provisional, unmeasured)* | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | contract |
| `base_read_rpc_heavy` *(preview; provisional, unmeasured)* | — | — | 2 / 4 | 5 / 10 | contract + measured provider ceiling |
| `base_simulate` *(preview; provisional, unmeasured)* | — | — | 2 / 4 | 5 / 10 | contract + schema/provider gate |
| `wallet_identity` *(cross-chain profile REST; internal per-network calls are charged to `<net>_read_rpc` as well; the burst of ×2 is sized so the largest batch — 100×6 on Business, 500×6 on Enterprise — fits in one request)* | — | — | — | 30 / 60 | 150 / 300 |

For BSC, Stellar, TON, Tron, and Robinhood, the rows marked **unmeasured** are operational
defaults inherited from the corresponding Polygon tier budgets. They remain
unmeasured until the relevant network remeasurement; Robinhood is tracked by
`N5-D-rh-C`. These
product throttles are not upstream capacity or SLA claims.

Base rows are staged R05/14c policy, not production publication, provider
capacity, or an SLA. `base_aa`, `base_send_bundle`, and `base_send_private` have
no frozen numeric client RPS; bundle access remains `key_required`. Enterprise
Base limits are finite contract values rather than the general unlimited
default. See [Base limits](./base/limits.md).

Additional specialized categories (e.g. tracing, bundles, mempool streams,
DAS, websocket pub/sub) are gated by tier and have their own budgets; consult the
relevant method's reference page for the category it charges against.

## Burst capacity

Each finite RPS budget includes a **2× burst buffer at no extra cost**. This absorbs brief traffic spikes without changing your subscription price.

The limiter uses a token bucket. A full bucket holds `2 × sustained_rps` request tokens and refills continuously at `sustained_rps` tokens per second. Each metered request spends one token; each JSON-RPC batch element counts separately. There is no daily, monthly, or lifetime counter limiting the number of bursts.

| Plan | Solana RPC sustained RPS | Short burst capacity | Ethereum RPC sustained RPS | Short burst capacity |
|---|---:|---:|---:|---:|
| Free (7-day trial) | 20 | 40 | 10 | 20 |
| Basic | 60 | 120 | 20 | 40 |
| Pro | 200 | 400 | 100 | 200 |
| Business | 600 | 1,200 | 250 | 500 |
| Enterprise | unlimited | no numeric ceiling | unlimited | no numeric ceiling |

For example, Free Solana RPC runs at **20 RPS sustained**, with up to **40 requests in a full burst**. The buffer restores 20 tokens per second, up to 40. It is shared by the key and category, so creating batches or connections does not multiply it.

**There is no quota on the number of traffic spikes, and they carry no extra charge.** The burst value describes short peak capacity; size continuous workloads and monthly-volume estimates to sustained RPS. Burst allowance does not raise connection, subscription, stream, filter or provider limits.

**There is no outbound data-volume quota.** Plans do not limit delivered data by gigabytes per day or month, and there is no per-GB traffic charge.

Unlimited categories have no numeric burst ceiling. Explicit finite Enterprise overrides, including Base and Wallet Identity, keep the same 2× rule; contract and provider limits still apply.

## Rate-limit response headers

On metered responses Triport returns the following headers describing your
current window. They let you implement client-side pacing without trial and error.

| Header | Type | Description |
|---|---|---|
| `X-RateLimit-Limit` | integer | Sustained RPS (the refill rate) for the matching tier + category. |
| `X-RateLimit-Remaining` | integer | Request tokens currently available in the burst buffer. This can exceed the sustained RPS value. |
| `X-RateLimit-Reset` | integer | On HTTP 429, the UNIX timestamp for the retry hint; the bucket refills continuously. |
| `X-RateLimit-Category` | string | The tier-matrix category bucket charged for this request. |
| `Retry-After` | integer | On `429`, seconds to wait before retrying (always `1`). |

Base (`/rpc/base`) is the exception: its native handler meters every batch
element itself, and successful Base responses do not carry the `X-RateLimit-*`
headers (checked 2026-09-22). Pace Base clients by the plan's `base_*` budgets.

> There is **no** `X-Daily-Quota-Remaining` header. Triport does not track a
> daily quota.

## Errors

When traffic exceeds the category's rate limit, or you call a method above your tier, you get one
of these. The full error envelope is documented in [Errors](./errors.md).

| HTTP | `error` | When it happens |
|---|---|---|
| 429 | `rate_limited` | Traffic exceeds the rate limit for your tier on that category. Back off `Retry-After` seconds and retry. |
| 403 | `tier_insufficient` | The method requires a higher tier than your key has. |
| 403 | `method_unknown` | The method is not part of the product for that chain. |

These are plain HTTP responses, not JSON-RPC `error` objects — the gate rejects
the request before it reaches the RPC layer, so the fields below sit at the top
level of the body.

### `429 rate_limited`

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

Response headers on this error:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 1
X-RateLimit-Reset: 1746950412
```

| Field | Type | Description |
|---|---|---|
| `current_tier` | string | Tier of the key that triggered the limit (`free`–`enterprise`). |
| `category` | string | Tier-matrix category the offending request belongs to. |
| `limit_rps` | integer | Sustained RPS budget for that tier + category. |
| `burst_capacity` | integer | Full token-bucket capacity = `2 × limit_rps`; refills at sustained RPS. |
| `retry_after_sec` | integer | Seconds to wait before retrying (≥ 1). |
| `upgrade_url` | string | Pricing page where a plan with a higher limit can be chosen. |
| `docs_url` | string | Reference page for this error. |

### `403 tier_insufficient`

Returned when a method needs a higher tier. The `X-Required-Tier` header carries
the minimum tier, and the body includes `current_tier`, `required_tier`, the
gating `category`, and an `upgrade_url`.

## Examples

### JavaScript (fetch) — honor `Retry-After`

```js
async function callWithBackoff(body) {
  for (;;) {
    const res = await fetch("https://triport.io/sol", {
      method: "POST",
      headers: {
        "x-token": process.env.TRIPORT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const wait = Number(res.headers.get("Retry-After") ?? 1);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue; // back off and retry — 429 is normal backpressure
    }
    return res.json();
  }
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { Triport, RateLimitedError } from "@triport/sdk";

// The SDK sends your key via the x-token header and retries 429s automatically.
const client = new Triport({ token: process.env.TRIPORT_API_KEY! });

try {
  const balance = await client.sol.getBalance(
    "So11111111111111111111111111111111111111112",
  );
} catch (err) {
  if (err instanceof RateLimitedError) {
    console.warn(
      `rate limited on ${err.category}: ${err.limitRps} RPS (tier ${err.currentTier})`,
    );
  }
}
```

## Notes

* **Pace to sustained, not burst.** The burst multiplier (2×) absorbs spikes, but
  sustaining above your tier's sustained RPS will produce a steady stream of
  `429`s. Use `X-RateLimit-Remaining` to throttle proactively.
* **`429` is recoverable.** Always retry after `Retry-After` seconds (currently
  `1`). It is backpressure, not a hard failure.
* **No daily quota.** Plan only around per-category RPS — there is no daily cap and
  no daily-quota header.
* **Need more headroom or regions?** Compare tiers above and upgrade; Business adds
  multi-region active-active and up to 5 tokens, Enterprise removes RPS limits
  entirely.
* **Pricing.** Every plan is a flat monthly price with the per-category limits
  above — no credits, compute units or overage. All plans and limits side by
  side: [Pricing](https://triport.io/pricing). How credit and compute-unit
  billing compares with RPS limits in general:
  [RPC credits, compute units and flat pricing](https://triport.io/learn/rpc-credits-vs-flat-pricing).
* See also: [Authentication](./authentication.md) for how to pass your token,
  [Errors](./errors.md) for the full error envelope, and
  [Getting Started](./getting-started.md).
