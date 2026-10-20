> Live version: https://triport.io/docs/platform/get-chain-metrics-series

# Get chain metrics series

> Returns a time-bucketed series of latency and block-height samples for a single chain, suitable for charting recent health.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/chains/{id}/metrics/series` |
| **Type** | Triport product (REST API) |
| **Network** | Any network in the registry |
| **Authentication** | None — public endpoint |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

This endpoint returns a downsampled time series of observability metrics for a
single chain, intended for drawing sparklines and trend charts of recent health.
Unlike [`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md), which gives a
single point-in-time snapshot, the series endpoint returns one bucket per fixed
interval across the requested time window.

Each point carries the request-latency percentiles (`p50`, `p95`) and the
observed `block` height for that bucket. Metrics are pure observability data and
are **not** sensitive, so this endpoint requires no authentication and is served
to anonymous callers.

The width of each bucket is fixed per window and returned in `bucket_sec`. With
the default `window=1h`, buckets are 5 minutes (`bucket_sec: 300`), so a response
contains roughly 12–13 points. Any bucket with no underlying sample reports its
metric fields as JSON `null` (not `0`) — always check `!= null` before
rendering, because a genuine `0` latency or block is meaningful.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | Chain identifier from the registry (e.g. `solana-mainnet`, `ethereum-mainnet`, `polygon-mainnet`). See [`GET /v1/chains`](./list-chains.md). |

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `window` | string | no | Time span of the series. One of `1h`, `6h`, `24h`, `7d`. Defaults to `1h`. The bucket width scales with the window and is reported in the response as `bucket_sec`. |

## Request

```bash
curl "https://triport.io/v1/chains/ethereum-mainnet/metrics/series?window=1h"
```

No `Authorization` header is required. For authenticated callers, the standard
header is still accepted and ignored for this route:

```bash
curl "https://triport.io/v1/chains/ethereum-mainnet/metrics/series?window=1h" \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

## Response

```json
{
  "window": "1h",
  "bucket_sec": 300,
  "points": [
    { "ts": "2026-05-29T11:00:00Z", "p50": 38, "p95": 96, "block": 22310418 },
    { "ts": "2026-05-29T11:05:00Z", "p50": 41, "p95": 102, "block": 22310443 },
    { "ts": "2026-05-29T11:10:00Z", "p50": 37, "p95": 91, "block": 22310468 },
    { "ts": "2026-05-29T11:15:00Z", "p50": 40, "p95": 99, "block": 22310493 },
    { "ts": "2026-05-29T11:20:00Z", "p50": null, "p95": null, "block": null },
    { "ts": "2026-05-29T11:25:00Z", "p50": 39, "p95": 95, "block": 22310543 },
    { "ts": "2026-05-29T11:30:00Z", "p50": 42, "p95": 110, "block": 22310568 },
    { "ts": "2026-05-29T11:35:00Z", "p50": 36, "p95": 88, "block": 22310593 },
    { "ts": "2026-05-29T11:40:00Z", "p50": 38, "p95": 93, "block": 22310618 },
    { "ts": "2026-05-29T11:45:00Z", "p50": 44, "p95": 121, "block": 22310643 },
    { "ts": "2026-05-29T11:50:00Z", "p50": 37, "p95": 90, "block": 22310668 },
    { "ts": "2026-05-29T11:55:00Z", "p50": 39, "p95": 97, "block": 22310693 },
    { "ts": "2026-05-29T12:00:00Z", "p50": 40, "p95": 100, "block": 22310718 }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `window` | string | Echoes the effective window (`1h`, `6h`, `24h`, or `7d`). |
| `bucket_sec` | number | Width of each bucket in seconds (e.g. `300` for the `1h` window). |
| `points` | array | Ordered list of `ChainSeriesPoint` objects, oldest first. |
| `points[].ts` | string | Bucket start time as an ISO-8601 / RFC 3339 UTC timestamp. |
| `points[].p50` | number \| null | Median request latency for the bucket, in milliseconds. `null` if no sample. |
| `points[].p95` | number \| null | 95th-percentile request latency for the bucket, in milliseconds. `null` if no sample. |
| `points[].block` | number \| null | Observed block height at the bucket. `null` if no sample. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `404` | `chain_not_found` | The `id` does not match any chain in the registry. |
| `400` | `invalid_window` | `window` is present but not one of `1h`, `6h`, `24h`, `7d`. |

See [Errors](../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)
```js
const res = await fetch(
  "https://triport.io/v1/chains/ethereum-mainnet/metrics/series?window=1h"
);
if (!res.ok) throw new Error(`http_${res.status}`);
const series = await res.json();

for (const p of series.points) {
  // skip empty buckets — null is distinct from a real 0
  if (p.p50 != null) console.log(p.ts, `${p.p50}ms`, `block ${p.block}`);
}
```

## Notes

- **Empty buckets:** gaps in upstream observability surface as points with
  `p50`, `p95`, and `block` all set to `null`. Render these as gaps in a chart
  rather than zeros.
- **Bucket count:** the default `1h` window yields about 12–13 five-minute
  buckets. Wider windows return a coarser `bucket_sec` so the point count stays
  bounded.
- **Related:** for the current snapshot use
  [`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md); for a live push of
  status and metric ticks subscribe to the
  [`GET /v1/chains/events`](./chains-events-stream.md) SSE stream.

9 networks are supported today: Solana, Ethereum, Polygon, BNB Smart Chain, Base, Tron, Robinhood Chain, Stellar, and TON.
