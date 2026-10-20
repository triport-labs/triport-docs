> Live version: https://triport.io/docs/platform/get-chain

# Get a single chain

> Fetch one chain's static descriptor — identity, protocols, required scope, UI hints — plus its latest live health metrics, by chain id.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/chains/{id}` |
| **Type** | Triport product (REST API) |
| **Network** | — (catalogue endpoint; serves every chain Triport supports) |
| **Authentication** | None required. An optional session cookie narrows scope-gated views (see [Description](./get-chain.md#description)). |
| **Required scope** | — (the descriptor is public; each chain advertises its own `required_scope` in the body) |
| **Tier / rate limit** | Standard platform RPS-per-tier with burst. No daily quota. |

## Description

Returns the [`ChainDescriptor`](./list-chains.md) for a single chain identified
by its stable id (`eth`, `polygon`, `sol`, …), wrapped together with the
chain's most recent metrics snapshot. Use it to render a single chain's detail
page or to confirm a chain id is part of the catalogue before composing
endpoint URLs.

The descriptor itself is **public**: if you know a chain's id you get its
descriptor, regardless of authentication or scope. The catalogue is treated as
marketing/discovery data — scope gating happens on the
[list endpoint](./list-chains.md) and on the per-key
[endpoints surface](./get-key-endpoints.md), not here. The only reason this
endpoint returns 404 is an **unknown id**.

The `metrics` block is best-effort. It carries the latest health snapshot when
the metrics aggregator is wired in; if metrics are unavailable the field is
`null` and the descriptor still returns `200`. A chain's runtime health is
expressed by `metrics.status`, a closed union — see
[Response fields](./get-chain.md#response-fields).

> **`scope_missing` is a status, not an error.** `scope_missing` is one of the
> values in the `metrics.status` union. It marks a chain as *visible but
> permission-gated* — your key does not hold the chain's `required_scope` —
> rather than hiding it. It describes permission, never upstream health
> (contrast `degraded` / `down`). For a key-specific view of which chains you
> can actually call, use [`GET /v1/keys/{id}/endpoints`](./get-key-endpoints.md).

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Stable chain id. One of: `eth`, `polygon`, `sol`, `base`, `bsc`, `arbitrum`, `op`, `bitcoin`, `sol-devnet`. |

There are no query parameters or request body.

## Request

```bash
curl https://triport.io/v1/chains/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

The `Authorization` header is optional for this endpoint — anonymous requests
receive the same descriptor. Include it (or a session cookie) when you want
scope-aware behaviour to be consistent across the rest of the catalogue API.

## Response

`200 OK` — the descriptor paired with the latest metrics snapshot:

When no metrics aggregator is configured, `metrics` is `null`:

```json
{ "chain": { "id": "eth", "...": "..." }, "metrics": null }
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `chain` | object | The static [`ChainDescriptor`](./list-chains.md). Immutable for the lifetime of a release. |
| `chain.id` | string | Stable snake-case id used in URLs and as the metrics key. |
| `chain.name` | string | Human-readable display name. |
| `chain.chain_id` | number | EIP-155 chain id where applicable (`eth`=1, `polygon`=137). Synthetic for non-EVM (`sol`=101, `sol-devnet`=103); `-1` for `bitcoin` (no EIP-155 id). |
| `chain.net` | string | Network: `mainnet` \| `testnet` \| `devnet`. |
| `chain.kind` | string | VM family: `evm` \| `l2` \| `non-evm`. |
| `chain.symbol` | string | Native asset ticker (`ETH`, `POL`, `SOL`, …). |
| `chain.protocols` | array | Access surfaces. Each entry: `kind` (`https` \| `wss` \| `grpc`), `path`, optional `note`. The `path` is internal — compose public URLs from your key's [endpoints](./get-key-endpoints.md), not from this field. |
| `chain.required_scope` | string | Scope a key must hold to call this chain (e.g. `eth:rpc`). |
| `chain.ui` | object | Presentation hints: `color`, `glow`, `logo_bg`, `initials`. |
| `metrics` | object \| null | Latest health snapshot, or `null` when metrics are unavailable. |
| `metrics.status` | string | Closed union — see below. |
| `metrics.latency_p50_ms` / `latency_p95_ms` | number \| null | Probe latency percentiles in ms. `null` until samples exist. |
| `metrics.uptime_24h_pct` / `uptime_7d_pct` | number \| null | Success ratio (0–100) over the window. `null` for empty windows. |
| `metrics.block_height` / `block_finalized` | number \| null | Latest / finalized block height. |
| `metrics.peers` | number \| null | Connected peers. EVM/L2 only; `null` on non-EVM. |
| `metrics.sync_status` | boolean \| null | Whether the upstream reports fully synced. |
| `metrics.gas_price_native` | string \| null | Formatted gas price (e.g. `"12.4 Gwei"`). EVM/L2 only. |
| `metrics.epoch` | number \| null | Current epoch. Non-EVM only (e.g. Solana). |
| `metrics.tps` | number \| null | Transactions per second, when computable. |
| `metrics.last_seen_ago_sec` | number \| null | Seconds since the last successful probe. |
| `metrics.measured_at` | string | RFC 3339 timestamp of when the snapshot was assembled. |

**Nullability matters.** Numeric metric fields are `null` (not `0`) when there
is no data — a real `0` (e.g. `latency_p50_ms: 0`) is meaningful. Always test
`!= null` rather than truthiness before rendering.

#### `metrics.status` — closed union

| Value | Meaning |
|---|---|
| `live` | Upstream healthy and serving. |
| `degraded` | Reachable but impaired (elevated latency, partial sync). |
| `down` | Upstream failing health probes. |
| `scope_missing` | Permission state, not health: the authenticated session's key lacks this chain's `required_scope`. The chain is shown rather than hidden. |
| `unknown` | Default before any probe data exists (e.g. a freshly started process). Not surfaced by the typed frontend union but can appear on the wire. |

## Errors

The error envelope is `{ "error": "<code>" }`.

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `chain_not_found` | 404 | Unknown chain id | The `{id}` segment is not a registered chain. |
| `method_not_allowed` | 405 | Wrong HTTP method | Any verb other than `GET`. |

See [errors.md](../errors.md) for the shared error envelope and conventions.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/v1/chains/eth", {
  headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` },
});
if (!res.ok) {
  const { error } = await res.json();      // e.g. "chain_not_found"
  throw new Error(error);
}
const { chain, metrics } = await res.json();
console.log(chain.name, metrics?.status ?? "no-metrics");
```

## Notes

* **Descriptor is public; metrics are best-effort.** A known id always yields
  `200` with the descriptor; `metrics` may be `null` if the aggregator is not
  wired. Only an unknown id produces `404`.
* **Don't build URLs from `protocols[].path`.** Those paths are internal
  backend routes. Get callable, key-scoped URLs from
  [`GET /v1/keys/{id}/endpoints`](./get-key-endpoints.md).
* **Related endpoints:**
  [`GET /v1/chains`](./list-chains.md) (list / scope-filtered catalogue),
  [`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md) (metrics only),
  [`GET /v1/chains/{id}/metrics/series`](./get-chain-metrics-series.md) (bucketed history),
  and [`GET /v1/chains/events`](./chains-events-stream.md) (live SSE status + metric ticks).
