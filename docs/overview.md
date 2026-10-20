> Live version: https://triport.io/docs/overview

# API Overview

> Triport is a single multi-chain RPC platform for every network in the registry — JSON-RPC, a REST product layer, and streaming where mounted, all behind one base URL and one API key.

| | |
|---|---|
| **Method / Endpoint** | `n/a — orientation page` |
| **Network** | Any network in the registry |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](./authentication.md) for all forms |
| **Required scope** | — |
| **Tier / rate limit** | Any tier (free 7-day trial works); see [Rate Limits](./rate-limits-and-tiers.md) |

## What Triport is

Triport is a multi-chain RPC platform. You send standard requests to a single
base URL; Triport authenticates your key, routes the request to the right
network backend, enforces your tier's rate limits, and returns the upstream
result unchanged. You integrate against **one** API surface instead of wiring up
a separate provider per chain.

The generated registry summary below is authoritative.

Across the registered networks Triport exposes three kinds of surface:

| Surface | What it is | Transport |
|---|---|---|
| **JSON-RPC** | The native node RPC for each chain (`getBalance`, `eth_getBalance`, `bor_*`, …), proxied verbatim. | HTTP `POST` |
| **REST product** | Higher-level, opinionated endpoints layered on top of the raw RPC: Solana wallet history, cross-chain wallet identity, research and watch, the Ethereum beacon and MEV routes, the Polygon Heimdall proxy. | HTTP `GET`/`POST` |
| **Streaming** | Subscription channels — JSON-RPC Pub/Sub, Solana gRPC (Yellowstone), the Solana shred stream and a high-throughput WebSocket bridge. | gRPC / WSS |

## Base URLs

All requests go to a single base URL:

| Environment | Base URL |
|---|---|
| **Production** | `https://triport.io` |

Each network's canonical JSON-RPC endpoint is listed in the generated table below.

A minimal first request (Solana `getBalance` against production):

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

If you have never called Triport before, start with
[Getting Started](./getting-started.md) — it takes you from zero to a verified
response in under five minutes.

## Method types

Every reference page carries a **Type** field so you always know what you are
calling — a chain method, a Triport add-on, or a Triport product surface:

| Type | Meaning |
|---|---|
| **Native upstream RPC** | A standard chain JSON-RPC method for any network in the registry. Triport authenticates, rate-limits, and routes it to an upstream node, then returns the upstream result **unchanged**. |
| **Triport extension** | A provider-specific method that is **not** part of the base chain RPC — e.g. Solana DAS (`getAsset*`, `searchAssets`, `getTokenAccounts`), `getPriorityFeeEstimate`, and bundle submission (`sendBundle`, Flashbots `eth_sendBundle`). |
| **Triport product (REST API)** | A Triport-built REST surface under `/v1/…` (Solana wallet history, cross-chain wallet identity, research and watch) — indexed product endpoints, not raw chain RPC. |

Console / dashboard-management endpoints are tagged **Triport Console API**.

For how a request actually flows end-to-end — edge, auth, routing, upstream node,
response — and an honest account of what Triport operates versus routes to, see
[Architecture & trust model](./architecture.md).

## Authentication, briefly

Send your API key (it looks like `tri_live_…`). Triport accepts it in several
forms, tried in this priority order:

1. `x-token: <key>` header — **preferred**, used by the SDKs.
2. `Authorization: Bearer <key>` header — standard Bearer scheme.
3. `?api-key=<key>` query parameter — legacy.
4. Path form `/<chain>/<key>` — works only for `tri_live_*` API keys.

Full details and when to use each are on the [Authentication](./authentication.md)
page.

## Rate limits, briefly

Triport rate-limits by **sustained requests-per-second**, scoped to your tier
and the request's category, with a global burst multiplier of **2×**. **There is
no daily quota** — only the per-second budget. Tiers range from the free 7-day
trial through `basic`, `pro`, `business`, and custom `enterprise`; higher tiers
unlock more RPS and multi-region routing.

Rate-limit state is reported on responses via `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `X-RateLimit-Category`. When
you exceed your budget you get HTTP `429` with a `Retry-After` header. See
[Rate Limits](./rate-limits-and-tiers.md) for the per-tier numbers and burst behavior.

## Errors, briefly

Every error comes back as a JSON envelope with a machine-readable `error` code,
a human `message`, and a `request_id` for support. The codes you will see most:

| HTTP | `error` | When it happens |
|---|---|---|
| 401 | `unauthorized` | Missing or invalid key |
| 401 | `trial_expired` / `subscription_expired` | Trial or subscription period ended |
| 403 | `tier_insufficient` | Method requires a higher tier |
| 403 | `method_unknown` | Method not part of that chain's product |
| 429 | `rate_limited` | Sustained RPS exceeded |
| 400 | `invalid_params` | Malformed request |
| 500 | `internal_error` | Server-side failure |

All of these are plain HTTP errors: the gate decides them before the request
reaches the RPC layer, so there is no JSON-RPC `error` object to branch on — use
the HTTP status and the `error` field. JSON-RPC `error` objects come from the
upstream node (such as `-32602` for invalid params). See the
[Errors](./errors.md) page for the full envelope and typed error schemas.

## Surface reference — where to go next

### Guides

| Page | What it covers |
|---|---|
| [Getting Started](./getting-started.md) | Get a key and make your first call. |
| [Authentication](./authentication.md) | Every supported auth form and when to use each. |
| [Rate Limits](./rate-limits-and-tiers.md) | Per-tier RPS budgets, burst, and rate-limit headers. |
| [Errors](./errors.md) | The full error envelope and typed error schemas. |

### Solana

| Surface | Reference |
|---|---|
| JSON-RPC | [Solana JSON-RPC](./sol/json-rpc/index.md) |
| REST product (wallet history, transfers, identity) | [Solana REST](./sol/rest/index.md) |
| Pub/Sub WebSocket `wss://triport.io/ws/sol` (`accountSubscribe`, `logsSubscribe`, `programSubscribe`, …) | [Solana Pub/Sub WS](./streaming/sol-pubsub.md) |
| Firehose (WebSocket) `wss://triport.io/ws/sol-stream` — every non-vote transaction, no filters, Pro | [Solana Firehose](./streaming/sol-stream.md) |
| gRPC (Yellowstone) `https://grpc.triport.io` — native gRPC with server-side filters, Pro | [Solana gRPC (Yellowstone)](./streaming/sol-grpc.md) |
| Shred stream `wss://triport.io/ws/sol-preexec` — pre-execution transactions, Pro | [Solana Shred Stream](./streaming/sol-preexec.md) |

### Ethereum

| Surface | Reference |
|---|---|
| JSON-RPC (`eth_*`) | [Ethereum JSON-RPC](./eth/json-rpc/index.md) |
| REST product (beacon proxy and events, MEV builder and private-transaction routes) | [Ethereum REST](./eth/rest/index.md) |
| Pub/Sub WebSocket (`newHeads`, `logs`, `newPendingTransactions`, `syncing`) | [Ethereum WS](./streaming/eth-ws.md) |

### Polygon

| Surface | Reference |
|---|---|
| JSON-RPC (`eth_*` + `bor_*`) | [Polygon JSON-RPC](./polygon/json-rpc/index.md) |
| REST product (Heimdall consensus-layer proxy) | [Polygon REST](./polygon/rest/index.md) |
| Pub/Sub WebSocket (`newHeads`, `logs`, `newPendingTransactions`, `syncing`) | [Polygon WS](./streaming/poly-ws.md) |

### Wallet Identity (cross-chain)

| Surface | Reference |
|---|---|
| REST product — one profile per EVM address across every mounted network + Tron (names, balances, deployer, labels) | [Wallet Identity](./platform/wallet-identity.md) |
| Batch profiles with filters (up to 100/500 addresses per call) | [Batch](./platform/wallet-identity-batch.md) · [Filters](./platform/wallet-identity-filters.md) |
| Event subscriptions — deployments, bridges, fresh wallets; webhook / WebSocket / REST cursor | [Wallet watch](./platform/wallet-watch.md) |

Available from the Business tier (`wallet_identity` category, 30 rps; Enterprise 150 rps).

## SDKs

You can call any surface directly over HTTP/WSS, or use an official SDK that
wraps auth, retries, and rate-limit handling for you:

- **TypeScript** — `@triport/sdk`
- **Python** — `triport-sdk`

Both default to the `x-token` header and the production base URL. See
[Getting Started](./getting-started.md) for installable examples in each.

## Notes

- Every registered network shares one key, one error envelope, and one rate-limit model.
- Raw JSON-RPC results are passed through unchanged from the upstream node, so
  existing chain tooling and method docs continue to apply.

9 networks are supported today: Solana, Ethereum, Polygon, BNB Smart Chain, Base, Tron, Robinhood Chain, Stellar, and TON.

| ID | Network | chainId | JSON-RPC endpoint | REST | Streams | Guide |
|---|---|---:|---|---|---|---|
| `sol` | Solana | 101 | `https://triport.io/sol` | yes | yes | [Guide](./sol/index.md) |
| `eth` | Ethereum | 1 | `https://triport.io/eth` | yes | yes | [Guide](./eth/index.md) |
| `polygon` | Polygon | 137 | `https://triport.io/polygon` | yes | yes | [Guide](./polygon/index.md) |
| `bsc` | BNB Smart Chain | 56 | `https://triport.io/rpc/bsc` | — | — | [Guide](./bsc/index.md) |
| `base` | Base | 8453 | `https://triport.io/r/{key}/rpc/base` | — | yes | [Guide](./base/index.md) |
| `tron` | Tron | 728126428 | `https://triport.io/rpc/tron` | yes | — | [Guide](./tron/index.md) |
| `robinhood` | Robinhood Chain | 4663 | `https://triport.io/rpc/robinhood` | — | yes | [Guide](./robinhood/index.md) |
| `stellar` | Stellar | 102 | `https://triport.io/rpc/stellar` | yes | yes | [Guide](./stellar/index.md) |
| `ton` | TON | 103 | `https://triport.io/rpc/ton` | — | — | [Guide](./ton/index.md) |
