> Live version: https://triport.io/docs/console/keys/usage

# Get usage metrics

> Returns aggregated request usage for the signed-in account over a time range, broken down by RPC method or by chain.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/usage` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | Session cookie |
| **Required scope** | — |
| **Tier / rate limit** | — |

## Description

`GET /v1/usage` powers the usage dashboard in the Triport console. It returns
top-level totals (calls, errors, bytes) for the selected time range together
with a breakdown ("buckets") of the busiest dimensions — either by RPC method
or by chain.

This is a **console endpoint**, not a data-plane RPC method. It is authenticated
with the browser session cookie established at sign-in, not with an API key, and
it reports on usage accrued by all of your API keys in aggregate. There is no
required API scope.

Responses are cached server-side for **60 seconds** per `(account, range, group)`
combination. A served cache entry carries the header `X-Cache: HIT`; a freshly
computed response carries `X-Cache: MISS`. Because of this, two identical
requests made within the same minute return byte-identical bodies.

## Parameters

All parameters are query-string parameters; there is no request body.

| Name | Type | Required | Description |
|---|---|---|---|
| `range` | string | no | Time window to aggregate over. One of `1h`, `24h`, `7d`, `30d`. Defaults to `24h`. Any other value returns `invalid_range`. |
| `group` | string | no | Breakdown dimension for the `buckets` array. One of `method` or `chain`. Defaults to `method`. Any other value returns `invalid_group`. |

The breakdown is always limited to the **top 20 rows** by call volume for the
chosen dimension.

## Request

```bash
curl "https://triport.io/v1/usage?range=24h&group=method" \
  -H "Cookie: triport_session=$TRIPORT_SESSION" \
  -H "Content-Type: application/json"
```

Because authentication is the browser session cookie, this endpoint is normally
called from the console front-end with `fetch(..., { credentials: 'include' })`
rather than from a server-side integration.

## Response

```json
{
  "range": "24h",
  "group": "method",
  "totals": {
    "calls": 184302,
    "errors": 412,
    "bytes": 95817264
  },
  "buckets": [
    { "bucket": "getAccountInfo", "calls": 92110, "errors": 87, "avg_ms": 24.6 },
    { "bucket": "getTransaction", "calls": 41880, "errors": 153, "avg_ms": 61.2 },
    { "bucket": "getBlock", "calls": 18044, "errors": 12, "avg_ms": 88.7 }
  ],
  "over_quota": false
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `range` | string | Echo of the effective `range` (the default `24h` when omitted). |
| `group` | string | Echo of the effective `group` (the default `method` when omitted). |
| `totals` | object | Account-wide aggregate over the range. |
| `totals.calls` | integer | Total number of calls. |
| `totals.errors` | integer | Number of calls that returned an error. |
| `totals.bytes` | integer | Total response bytes served. |
| `buckets` | array | Top 20 rows by call volume for the chosen `group`. Empty array when there is no usage in the range. |
| `buckets[].bucket` | string | The dimension value — an RPC method name when `group=method`, or a chain name when `group=chain`. |
| `buckets[].calls` | integer | Calls attributed to this bucket. |
| `buckets[].errors` | integer | Errored calls attributed to this bucket. |
| `buckets[].avg_ms` | number | Average response latency for this bucket, in milliseconds. |
| `over_quota` | boolean | **Deprecated — always `false`.** Triport plans have no monthly request allowance, no overage and no credits; plans differ by requests-per-second limits per capability and by features. The field is kept only for backward compatibility. |

### Response headers

| Header | Description |
|---|---|
| `X-Cache` | `HIT` when served from the 60-second server-side cache, `MISS` when freshly computed. |

## Errors

| Code | HTTP | When it happens |
|---|---|---|
| `invalid_range` | 400 | `range` is set to a value other than `1h`, `24h`, `7d`, or `30d`. |
| `invalid_group` | 400 | `group` is set to a value other than `method` or `chain`. |
| `unauthenticated` | 401 | No valid session cookie is present. |
| `method_not_allowed` | 405 | Any HTTP method other than `GET`. |

See [errors.md](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)

```js
const res = await fetch(
  "https://triport.io/v1/usage?range=7d&group=chain",
  { credentials: "include" } // sends the session cookie
);
const usage = await res.json();
console.log(`Calls (7d): ${usage.totals.calls}`);
for (const row of usage.buckets) {
  console.log(`${row.bucket}: ${row.calls} calls, ${row.avg_ms} ms avg`);
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportConsole } from "@triport/sdk";

const consoleApi = new TriportConsole(); // uses the active browser session
const usage = await consoleApi.usage.get({ range: "30d", group: "method" });

console.log(`Calls (30d): ${usage.totals.calls}`);
```

### Python (`triport-sdk`)

```python
from triport import ConsoleClient

console = ConsoleClient(session=TRIPORT_SESSION)
usage = console.usage(range="24h", group="chain")

print(f"Total calls: {usage.totals.calls}")
for row in usage.buckets:
    print(f"{row.bucket}: {row.calls} calls, {row.avg_ms:.1f} ms avg")
```

## Notes

* The `buckets` array is capped at the top 20 rows by call volume; lower-volume
  methods or chains are not returned individually and are not summed into a
  remainder row. Use `totals` for the complete figure.
* `totals` always reflects the full range regardless of how many buckets are
  returned, so `sum(buckets[].calls)` can be less than `totals.calls`.
* Caching is keyed on `(account, range, group)`. Switching either `range` or
  `group` produces a distinct cache entry, so the first request after a change
  is always an `X-Cache: MISS`.
* Usage figures are informational. There is no monthly request allowance and
  no overage: calls are never billed per request. Throughput is limited by
  requests per second per capability — see
  [Rate limits and tiers](../../rate-limits-and-tiers.md).
* This endpoint is account-scoped and aggregates across every API key. To see
  the set of endpoints provisioned for a single key, use the per-key endpoint
  catalogue under `/v1/keys/{id}/endpoints`.
