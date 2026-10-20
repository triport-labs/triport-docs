> Live version: https://triport.io/docs/platform/get-chain-metrics

# Get chain metrics

> Fetch the latest live health snapshot — latency, uptime, block height, sync state and more — for a single chain in the Triport registry.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/chains/{id}/metrics` |
| **Type** | Triport product (REST API) |
| **Network** | — (any chain in the registry) |
| **Authentication** | None — public endpoint |
| **Required scope** | — |
| **Tier / rate limit** | — (public observability data) |

## Description

Returns the most recent `ChainMetrics` snapshot for the chain identified by
`{id}`. Metrics are observability data — they describe the live health of a
chain's upstream, not anything tied to your account — so this endpoint is
**public** and requires no authentication.

### The null-vs-zero invariant

Every numeric field in the response is typed `number | null`. **`null` means
"no observation available" — it is not the same as `0`.** A real measured value
of `0` is meaningful (e.g. a genuine `latency_p50_ms` of `0`, or `peers: 0`),
so clients must branch on presence, not truthiness:

```js
// correct
if (m.latency_p50_ms != null) render(m.latency_p50_ms);
// WRONG — hides a real 0 and treats it as "no data"
if (m.latency_p50_ms) render(m.latency_p50_ms);
```

Only `chain_id`, `status`, and `measured_at` are always present. Everything
else may be `null` until the collector has gathered a sample for that field.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Chain identifier from the registry (e.g. `solana-mainnet`). The value is URL-encoded by clients. |

This endpoint takes no query parameters or request body.

## Request

```bash
curl https://triport.io/v1/chains/solana-mainnet/metrics
```

No `Authorization` header is required. If you do send one (e.g. you reuse a
single client for all calls), it is simply ignored on this route.

## Response

`200 OK` — the latest snapshot:

```json
{
  "chain_id": "solana-mainnet",
  "status": "live",
  "latency_p50_ms": 42,
  "latency_p95_ms": 118,
  "uptime_24h_pct": 99.98,
  "uptime_7d_pct": 99.91,
  "block_height": 312847551,
  "block_finalized": 312847519,
  "peers": null,
  "sync_status": true,
  "gas_price_native": null,
  "epoch": 724,
  "tps": 2841.7,
  "last_seen_ago_sec": 3,
  "measured_at": "2026-05-29T10:14:02Z"
}
```

The example above is a non-EVM (Solana) chain, so `peers` and
`gas_price_native` are `null` while `epoch` and `tps` are populated. An EVM
chain would typically populate `peers` and `gas_price_native` and leave
`epoch`/`tps` `null`. Which fields carry data depends on what the upstream
exposes — always handle `null` for any numeric field.

### Response fields

| Field | Type | Description |
|---|---|---|
| `chain_id` | string | Echoes the requested chain id. Always present. |
| `status` | string | Health status: `live`, `degraded`, or `down`. Always present. |
| `latency_p50_ms` | number \| null | Median request latency in milliseconds. |
| `latency_p95_ms` | number \| null | 95th-percentile request latency in milliseconds. |
| `uptime_24h_pct` | number \| null | Uptime over the last 24 hours, as a percentage (e.g. `99.98`). |
| `uptime_7d_pct` | number \| null | Uptime over the last 7 days, as a percentage. |
| `block_height` | number \| null | Latest observed block / slot height. |
| `block_finalized` | number \| null | Latest finalized block / slot height. |
| `peers` | number \| null | Connected peer count (typically EVM chains). |
| `sync_status` | boolean \| null | Whether the upstream reports as fully synced. |
| `gas_price_native` | string \| null | Current gas price in the chain's native unit, as a decimal string (typically EVM chains). |
| `epoch` | number \| null | Current epoch (typically Solana). |
| `tps` | number \| null | Transactions per second (typically Solana). |
| `last_seen_ago_sec` | number \| null | Seconds since the last successful observation. |
| `measured_at` | string | RFC 3339 / ISO 8601 timestamp of when this snapshot was taken. Always present. |

> Note `gas_price_native` is a **string**, not a number — it carries a
> decimal value that can exceed the safe integer range, so it is serialized as
> a string to avoid precision loss.

## Errors

All errors return a JSON envelope of the form `{"error": "<code>"}`.

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `chain_not_found` | 404 | Unknown chain id | The `{id}` is not in the registry, or no metrics snapshot exists for it yet. |
| `metrics_disabled` | 503 | Metrics unavailable | The metrics aggregator is not wired on this deployment. |
| `method_not_allowed` | 405 | Wrong HTTP method | A method other than `GET` was used. |

See the shared [errors reference](../errors.md) for the full error envelope
and conventions.

## Examples

### JavaScript (fetch)

```js
const res = await fetch(
  `https://triport.io/v1/chains/${encodeURIComponent("solana-mainnet")}/metrics`,
);
if (!res.ok) {
  const { error } = await res.json();
  throw new Error(error);
}
const m = await res.json();

// Respect the null-vs-zero invariant.
const p50 = m.latency_p50_ms != null ? `${m.latency_p50_ms} ms` : "—";
console.log(`${m.chain_id}: ${m.status}, p50 ${p50}`);
```

## Notes

- **Public endpoint.** No `Authorization` header is required; sending one has
  no effect on the response.
- **Null vs zero.** Re-read the invariant above before rendering. Any numeric
  field can be `null` ("no observation"); only `0` means a measured zero.
- **Snapshot freshness.** Use `last_seen_ago_sec` and `measured_at` to detect
  stale data — a large `last_seen_ago_sec` with `status: "down"` indicates the
  upstream has gone silent.
- **Related endpoints:**
  [`GET /v1/chains`](./list-chains.md) (registry list),
  [`GET /v1/chains/{id}`](./get-chain.md) (descriptor + latest metrics in one
  call), [`GET /v1/chains/{id}/metrics/series`](./get-chain-metrics-series.md)
  (bucketed history), and the
  [`GET /v1/chains/events`](./chains-events-stream.md) SSE stream for live status and
  metric ticks.
