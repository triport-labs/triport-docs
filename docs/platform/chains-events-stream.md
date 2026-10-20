> Live version: https://triport.io/docs/platform/chains-events-stream

# Chain events stream (SSE)

> A live, one-way **Server-Sent Events** stream of chain health changes and metric ticks for the Triport network catalogue.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/chains/events` (Server-Sent Events, **not** WebSocket) |
| **Type** | Triport product (REST API) |
| **Network** | — (multi-chain — events carry a `chain_id`) |
| **Authentication** | Session cookie (browser session) — sent automatically with `withCredentials` |
| **Required scope** | — (the stream is scoped to the chains visible to your session) |
| **Tier / rate limit** | — |

## Description

`GET /v1/chains/events` is a **Server-Sent Events (SSE)** endpoint, consumed in the
browser with the native [`EventSource`](https://developer.mozilla.org/docs/Web/API/EventSource)
API. It is a long-lived, server-to-client, text/event-stream connection — it is
**not** a WebSocket, so there is no client-to-server channel and no upgrade
handshake. Open it once and the server pushes named events as chain health and
metrics change.

Two named event types are emitted:

- **`chain_status`** — a chain's health transitioned (e.g. `live` → `degraded`).
- **`chain_metric_tick`** — a periodic metrics sample for a chain (p50 latency,
  block height).

There is **no snapshot frame on connect.** The stream only delivers changes that
occur after you subscribe. To render correct initial state, seed each chain from
[`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md) on mount, then apply the
events as they arrive.

`EventSource` reconnects automatically on network drops. On reconnect the backend
resumes the connection with periodic keepalive comments and any future events; it
does **not** replay a backlog, so treat a reconnect like a fresh subscription and
re-seed from the metrics endpoint if you need a guaranteed-consistent baseline.

The broadcaster fans out events **non-blocking**: a subscriber that cannot keep up
has events dropped rather than back-pressuring the server. Do not assume you
receive every tick — design your UI to converge from whatever events arrive plus
the periodic metrics read.

## Parameters

This endpoint takes no path, query, or body parameters. Authentication is the
browser **session cookie**, which `EventSource` sends when opened with
`withCredentials: true`.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No request parameters. Stream contents are scoped to the chains your session can see. |

## Request

`EventSource` cannot set an `Authorization` header, so this stream authenticates
with the browser session cookie. The equivalent raw request:

```bash
curl -N https://triport.io/v1/chains/events \
  -H "Accept: text/event-stream" \
  --cookie "$TRIPORT_SESSION_COOKIE"
```

`-N` disables curl buffering so events print as they arrive.

## Response

`Content-Type: text/event-stream`. Each event is a `event:`/`data:` pair; lines
beginning with `:` are keepalive comments. The `data:` payload is a JSON object.

```text
event: chain_metric_tick
data: {"chain_id":"solana-mainnet","latency_p50_ms":42,"block_height":271934812,"at":"2026-05-29T12:00:01Z"}

event: chain_status
data: {"chain_id":"ethereum-mainnet","prev":"live","next":"degraded","at":"2026-05-29T12:00:05Z"}

: keepalive

event: chain_metric_tick
data: {"chain_id":"polygon-mainnet","latency_p50_ms":null,"block_height":58120044,"at":"2026-05-29T12:00:07Z"}
```

### Response fields

**`chain_status`** event `data`:

| Field | Type | Description |
|---|---|---|
| `chain_id` | string | Chain identifier (e.g. `ethereum-mainnet`). |
| `prev` | string | Previous status: `live` \| `degraded` \| `down` \| `scope_missing`. |
| `next` | string | New status: `live` \| `degraded` \| `down` \| `scope_missing`. |
| `at` | string | RFC 3339 timestamp of the transition. |

**`chain_metric_tick`** event `data`:

| Field | Type | Description |
|---|---|---|
| `chain_id` | string | Chain identifier. |
| `latency_p50_ms` | number \| null | Median request latency in ms; `null` when unmeasured (not `0`). |
| `block_height` | number \| null | Latest observed block/slot height; `null` when unmeasured. |
| `at` | string | RFC 3339 timestamp of the sample. |

> `scope_missing` is reported for a chain your authenticated session has no scope
> for — it describes authorization, not upstream health (which is `degraded` /
> `down`).

## Errors

SSE has no per-event error envelope; failures surface as the connection failing to
open or the `EventSource` `error` event firing (after which it auto-reconnects).

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthenticated | No valid session cookie — sign in first. |
| `404` | Not found | Chains vector not mounted on this deployment. |

For the standard JSON error envelope used by the REST endpoints, see
[errors](../errors.md).

## Examples

### JavaScript (fetch)

`EventSource`, not `fetch`, is the right primitive for SSE in the browser:

```js
const es = new EventSource("https://triport.io/v1/chains/events", {
  withCredentials: true,
});

es.addEventListener("chain_status", (e) => {
  const ev = JSON.parse(e.data); // { chain_id, prev, next, at }
  console.log(`${ev.chain_id}: ${ev.prev} → ${ev.next}`);
});

es.addEventListener("chain_metric_tick", (e) => {
  const ev = JSON.parse(e.data); // { chain_id, latency_p50_ms, block_height, at }
  if (ev.latency_p50_ms != null) {
    console.log(`${ev.chain_id} p50=${ev.latency_p50_ms}ms`);
  }
});

es.onerror = () => {
  // EventSource reconnects on its own; no snapshot is replayed on resume.
};

// later: es.close();
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient, ChainEvent } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

// Seed initial state, then subscribe for live updates.
const seed = await client.chains.metrics("solana-mainnet");
let p50 = seed.latency_p50_ms;

const stop = client.chains.subscribeEvents((ev: ChainEvent) => {
  if (ev.type === "chain_metric_tick" && ev.chain_id === "solana-mainnet") {
    if (ev.latency_p50_ms != null) p50 = ev.latency_p50_ms;
  }
});

// stop(); // closes the stream and removes listeners
```

## Notes

- **Server-Sent Events, one direction only.** There is no message channel from
  client to server; to issue requests use the REST endpoints.
- **No snapshot on connect, no backlog on reconnect.** Always seed from
  [`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md) and treat the stream as a
  delta feed. For historical trends use
  [`GET /v1/chains/{id}/metrics/series`](./get-chain-metrics-series.md).
- **Lossy by design.** Slow subscribers have events dropped (non-blocking
  fan-out), so reconcile periodically against the metrics endpoint rather than
  assuming a complete event log.
- **Nulls are meaningful.** `latency_p50_ms` and `block_height` arrive as JSON
  `null` when unmeasured — check `!= null` rather than truthiness, since a real
  `0` is a valid value.
- Discover the chain catalogue with [`GET /v1/chains`](./list-chains.md) and
  per-chain detail with [`GET /v1/chains/{id}`](./get-chain.md).
