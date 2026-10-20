> Live version: https://triport.io/docs/getting-started

# Getting Started

> Get a Triport API key and make your first multi-chain JSON-RPC call in under five minutes.

| | |
|---|---|
| **Method / Endpoint** | `n/a — quickstart walkthrough` |
| **Network** | Any network in the registry |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](./authentication.md) for other forms |
| **Required scope** | — |
| **Tier / rate limit** | Any tier (free 7-day trial works); see [Rate Limits](./rate-limits-and-tiers.md) |

## Overview

Triport is a multi-chain RPC platform. You send standard JSON-RPC requests to a
single base URL and Triport routes them to the right network backend, applies
your tier's rate limits, and returns the upstream result unchanged.

All requests go to a single base URL:

| Environment | Base URL |
|---|---|
| **Production** | `https://triport.io` |

This page walks you from zero to a verified Solana `getBalance` response.

## 1. Get an API key

1. Sign in to the **Triport billing portal**.
2. Create a project — this issues a static API key (it looks like
   `tri_live_…`).
3. Every new account starts on the **Free plan, a 7-day trial** (EU region
   only). It is a trial, not a permanent plan: no credit card is required to
   start, and when it ends you choose a paid plan to keep the key working, with
   more requests-per-second and multi-region routing on the higher tiers. See
   [Rate Limits](./rate-limits-and-tiers.md) for the full tier matrix.

Keep your key secret. Throughout this guide it is referenced as the environment
variable `$TRIPORT_API_KEY`:

```bash
export TRIPORT_API_KEY="tri_live_your_key_here"
```

## 2. Make your first request

Triport's SDK-preferred way to send your key is the `x-token` header. Send a
standard JSON-RPC 2.0 body to the base URL with your network's path.

Here is a Solana [`getBalance`](https://solana.com/docs/rpc/http/getbalance)
request against production:

```bash
curl https://triport.io/sol \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBalance",
    "params": ["vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"]
  }'
```

## 3. Read the response

A successful call returns the upstream JSON-RPC result verbatim. For
`getBalance`, the balance (in lamports) is under `result.value`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": { "slot": 268420690 },
    "value": 11110795
  }
}
```

That's it — you're live. Every other method works the same way: swap the
`method`/`params`, and (for other chains) the path.

### What the path means

Use the registry-derived endpoint in the generated first-call examples below.

## Base

Base mainnet (`8453`) uses `POST https://triport.io/rpc/base` with your key in
`x-token`, scope `base:rpc`. See the [Base reference](./base/index.md).

## Authentication, briefly

`x-token` is the recommended header, but Triport accepts your key in several
forms, tried in this priority order:

1. `x-token: <key>` header — **preferred** (used by the SDKs).
2. `Authorization: Bearer <key>` header — standard Bearer scheme.
3. `?api-key=<key>` query parameter — legacy.
4. Path form `/<chain>/<key>` — works only for `tri_live_*` API keys.

Full details, including when to use each, are on the
[Authentication](./authentication.md) page.

## Rate limits, briefly

Triport rate-limits by **sustained requests-per-second**, scoped to your tier
and the request's category, with a global burst multiplier of **2×**. **There is
no daily quota** — only the per-second budget.

Rate-limit state is reported on responses via these headers:

| Header | Meaning |
|---|---|
| `X-RateLimit-Limit` | Allowed RPS for your tier + category |
| `X-RateLimit-Remaining` | Remaining capacity in the current 1s window |
| `X-RateLimit-Reset` | UNIX timestamp when the window resets |
| `X-RateLimit-Category` | Category bucket charged for this request |

When you exceed your budget you get an HTTP `429` with a `Retry-After` header.
See [Rate Limits](./rate-limits-and-tiers.md) for per-tier numbers.

## Handling errors

Errors come back as a JSON envelope with a machine-readable `error` code and a
human `message`. The common ones during onboarding:

| HTTP | `error` | When it happens |
|---|---|---|
| 401 | `unauthorized` | Missing or invalid key |
| 401 | `trial_expired` | Your free 7-day trial ended |
| 403 | `tier_insufficient` | Method requires a higher tier |
| 403 | `method_unknown` | Method not part of that chain's product |
| 429 | `rate_limited` | Sustained RPS exceeded |

See the [Errors](./errors.md) page for the full envelope and the typed error
schemas.

## Examples

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
    params: ["vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg"],
  }),
});

const { result } = await res.json();
console.log("lamports:", result.value);
```

## Next steps

- [Authentication](./authentication.md) — every supported auth form and when to use it.
- [Rate Limits](./rate-limits-and-tiers.md) — per-tier RPS budgets, burst behavior, and the rate-limit headers.
- [Errors](./errors.md) — the full error envelope and typed error schemas.
- [Base](./base/index.md) — Base mainnet JSON-RPC, WebSocket and Flashblocks.
- Browse the per-network hubs and method references to find the call you need.

### Solana

```bash
curl -sS 'https://triport.io/sol' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[]}'
```

### Ethereum

```bash
curl -sS 'https://triport.io/eth' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### Polygon

```bash
curl -sS 'https://triport.io/polygon' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### BNB Smart Chain

```bash
curl -sS 'https://triport.io/rpc/bsc' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### Base

```bash
curl -sS 'https://triport.io/r/{key}/rpc/base' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### Tron

```bash
curl -sS 'https://triport.io/rpc/tron' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### Robinhood Chain

```bash
curl -sS 'https://triport.io/rpc/robinhood' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### Stellar

```bash
curl -sS 'https://triport.io/rpc/stellar' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"getHealth","params":{}}'
```

### TON

```bash
curl -sS 'https://triport.io/rpc/ton' -H 'Content-Type: application/json' -H "x-token: $TRIPORT_API_KEY" --data '{"jsonrpc":"2.0","id":1,"method":"getMasterchainInfo","params":{}}'
```
