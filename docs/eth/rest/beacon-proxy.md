> Live version: https://triport.io/docs/eth/rest/beacon-proxy

# Beacon API reverse proxy (CL path router)

> Forwards Ethereum Consensus-Layer (Beacon) REST calls through to Triport's pooled CL nodes (Prysm / Lighthouse / Nimbus), with tier, family, and rate-limit enforcement applied per path.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/eth-beacon/<beacon-path>` |
| **Type** | Triport product (REST API) |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | per-path feature (e.g. `eth.beacon_standard`) — see [Parameters](./beacon-proxy.md#parameters) |
| **Tier / rate limit** | Starter+ for standard reads; 5 rps light / 0.5 rps state-dump / 0.2 rps analysis (per-customer) |

## Description

This endpoint is a path router that sits in front of Triport's Consensus-Layer
node pool. You issue a normal [Beacon Node REST API](https://ethereum.github.io/beacon-APIs/)
request, but prefixed with `/rpc/eth-beacon/`, and the platform picks a healthy
CL host, forwards your `GET`, and streams the upstream response back to you with
provider-identifying headers and fields removed.

The router exposes a **curated whitelist** of standard CL paths rather than the
entire Beacon API surface. Paths fall into two groups:

* **Any-family standard paths** (`/eth/v1/node/*`, `/eth/v1/debug/*`) — served by
  whatever CL client is healthy.
* **Client-specific namespaces** (`/lighthouse/*`, `/prysm/*` + `/eth/v1alpha1/*`,
  `/nimbus/*`) — routed only to a host of the matching family.

A request to a path that is not on the whitelist returns `404 route_not_found`;
the surface is intentionally closed. The router accepts **`GET` only** — every
other HTTP method returns `405 method_not_allowed`.

Two behaviours are worth calling out up front:

* The Server-Sent Events stream `/rpc/eth-beacon/eth/v1/events` is handled by a
  **separate, higher-specificity handler** — see the
  [Beacon events (SSE)](./beacon-events-sse.md) page. If that handler is not
  mounted, the path router returns `501 sse_handler_not_wired` for it rather than
  attempting a normal forward.
* Tier and per-path rate limits are enforced here. Heavy amplifier paths
  (state dumps, Lighthouse analysis) require higher tiers and have much lower
  per-customer RPS ceilings (see [Notes](./beacon-proxy.md#notes)).

## Parameters

The "parameter" is the Beacon API path you append after `/rpc/eth-beacon/`, plus
any query string, which is forwarded verbatim to the upstream node. Only the
paths below are routable.

### Path: any CL family

| Path (append after `/rpc/eth-beacon`) | Feature / tier | Rate-limit class | Notes |
|---|---|---|---|
| `/eth/v1/node/version` | `eth.beacon_standard` · Starter+ | light (5 rps) | |
| `/eth/v1/node/identity` | `eth.beacon_standard` · Starter+ | light (5 rps) | |
| `/eth/v1/node/peers` | `eth.beacon_standard` · Starter+ | light (5 rps) | |
| `/eth/v1/node/syncing` | `eth.beacon_standard` · Starter+ | light (5 rps) | |
| `/eth/v1/debug/beacon/heads` | `eth.beacon_standard` · Starter+ | light (5 rps) | |
| `/eth/v1/debug/fork_choice` | `eth.beacon_standard` · Starter+ | light (5 rps) | |
| `/eth/v1/debug/beacon/states/{slot}` | `eth.beacon_state_dump` · Scale | state_dump (0.5 rps + 5 rps/host) | up to ~226 MiB body |
| `/eth/v1/events` | `eth.beacon_events_sse_short` · Starter+ | SSE | served by the [SSE handler](./beacon-events-sse.md) |

### Path: Lighthouse family

| Path | Feature / tier | Rate-limit class |
|---|---|---|
| `/lighthouse/health` | `eth.beacon_lighthouse_analysis` · Growth+ | light (5 rps) |
| `/lighthouse/database/info` | `eth.beacon_lighthouse_analysis` · Growth+ | light (5 rps) |
| `/lighthouse/proto_array` | `eth.beacon_lighthouse_analysis` · Growth+ | light (5 rps) |
| `/lighthouse/peers` | `eth.beacon_lighthouse_analysis` · Growth+ | light (5 rps) |
| `/lighthouse/analysis/attestation_performance/global` | `eth.beacon_lighthouse_analysis` · Scale | lh_analysis (0.2 rps + 10 rps/host) |
| `/lighthouse/analysis/block_rewards` | `eth.beacon_lighthouse_analysis` · Scale | lh_analysis (0.2 rps + 10 rps/host) |

### Path: Prysm family

| Path | Feature / tier | Rate-limit class |
|---|---|---|
| `/prysm/node/trusted_peers` | `eth.beacon_prysm` · Growth+ | light (5 rps) |
| `/prysm/v1/beacon/weak_subjectivity` | `eth.beacon_prysm` · Growth+ | light (5 rps) |
| `/eth/v1alpha1/beacon/chainhead` | `eth.beacon_prysm` · Growth+ | light (5 rps) |
| `/eth/v1alpha1/validators/participation` | `eth.beacon_prysm` · Growth+ | light (5 rps) |
| `/eth/v1alpha1/beacon/committees` | `eth.beacon_prysm` · Growth+ | light (5 rps) |
| `/eth/v1alpha1/validators/queue` | `eth.beacon_prysm` · Growth+ | light (5 rps) |

### Path: Nimbus family

| Path | Feature / tier | Rate-limit class |
|---|---|---|
| `/nimbus/v1/chain/head` | `eth.beacon_nimbus` · Starter+ | light (5 rps) |

### Headers

| Header | Required | Description |
|---|---|---|
| `Authorization: Bearer <key>` | yes | Your Triport API key. |
| `Accept` | no | Forwarded upstream (e.g. `application/json` or `application/octet-stream` for SSZ). |
| `Accept-Encoding` | no | Forwarded upstream for content negotiation. |

> Admin / mutating CL endpoints (e.g. Teku and Lodestar admin namespaces, and
> Lighthouse admin mutations) are **not** routable and return
> `403 namespace_disabled` or `404 route_not_found`.

## Request

```bash
curl https://triport.io/rpc/eth-beacon/eth/v1/node/syncing \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

State-dump example (Scale tier; the `{slot}` segment is a slot number or state id):

```bash
curl "https://triport.io/rpc/eth-beacon/eth/v1/debug/beacon/states/head?type=full" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/json"
```

## Response

The upstream Beacon API response body is returned unchanged except that
operator-identifying fields are stripped. Headers are passed through, except that
`Server` is replaced with `Triport` and hop-by-hop / `Content-Length` headers
are recomputed.

```json
{
  "data": {
    "head_slot": "9183442",
    "sync_distance": "0",
    "is_syncing": false,
    "is_optimistic": false,
    "el_offline": false
  }
}
```

### Response fields

The shape of `data` is defined by the upstream Beacon API for each path. For
`/eth/v1/node/syncing`:

| Field | Type | Description |
|---|---|---|
| `data.head_slot` | string | Slot of the node's current head. |
| `data.sync_distance` | string | Slots behind the chain head (`0` when fully synced). |
| `data.is_syncing` | boolean | Whether the node is still syncing. |
| `data.is_optimistic` | boolean | Whether the head is optimistically imported. |
| `data.el_offline` | boolean | Whether the paired Execution-Layer client is unreachable. |

> For diagnostic and identity paths (`/eth/v1/node/identity`, `/eth/v1/node/peers`,
> `/lighthouse/peers`, etc.) fields such as `peer_id`, `enr`, `p2p_addresses`,
> `listening_addresses`, `agent_string`, and `graffiti` are removed from the
> response before it reaches you.

## Errors

Errors use a stable typed envelope:

```json
{ "error": "route_not_found", "code": 404 }
```

| Code | `error` value | When it happens |
|---|---|---|
| 403 | `namespace_disabled` | Path resolves to a classified/admin capability that is not exposed. |
| 404 | `route_not_found` | Path is not on the routable whitelist (or is exactly `/rpc/eth-beacon/`). |
| 405 | `method_not_allowed` | Any HTTP method other than `GET`. |
| 500 | `router_not_initialized` | CL pool is not configured on this deployment. |
| 501 | `sse_handler_not_wired` | `/eth/v1/events` reached the path router with no SSE handler mounted. |
| 503 | `cl_beacon_unavailable` | No healthy CL host of the required family after a retry. |
| 503 | `cl_archive_unavailable` | Same as above for archive state-dump paths when strict archive routing is on. |

`4xx` responses produced by the upstream Beacon node (e.g. `404` for an unknown
slot, `400` for a malformed query) are forwarded to you as-is — those are
legitimate Beacon API responses, not Triport errors. See the shared
[Errors](../../errors.md) page for the full envelope contract.

## Examples

### JavaScript (fetch)

```js
const res = await fetch(
  "https://triport.io/rpc/eth-beacon/eth/v1/node/syncing",
  { headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` } }
);
if (!res.ok) {
  const { error, code } = await res.json();
  throw new Error(`beacon proxy error ${code}: ${error}`);
}
const { data } = await res.json();
console.log("head slot:", data.head_slot, "syncing:", data.is_syncing);
```

## Notes

* **Closed whitelist.** Only the paths listed under [Parameters](./beacon-proxy.md#parameters) are
  routable; this is not an open passthrough of the entire Beacon API. Anything
  else returns `404 route_not_found`.
* **GET only.** The router never forwards mutating methods.
* **Family routing.** `/lighthouse/*`, `/prysm/*` + `/eth/v1alpha1/*`, and
  `/nimbus/*` are routed only to a CL host of the matching client family. If no
  such host is healthy, you get `503 cl_beacon_unavailable` rather than a
  cross-family response.
* **Failover.** The router tries up to two healthy hosts per request before
  returning `503`.
* **Rate limits** are per-path classes, not a daily quota:
  * `light` — 5 rps per customer (most node/diagnostic reads).
  * `state_dump` — 0.5 rps per customer + 5 rps aggregate per host
    (`/eth/v1/debug/beacon/states/{slot}`, bodies up to ~226 MiB).
  * `lh_analysis` — 0.2 rps per customer + 10 rps aggregate per host
    (`/lighthouse/analysis/*`, bodies up to ~230 MB).
  Response bodies are capped at 256 MiB.
* **Related pages:** [Beacon events (SSE)](./beacon-events-sse.md) for the
  `/eth/v1/events` live stream, and the [Ethereum JSON-RPC transport](./rpc-eth-transport.md)
  for Execution-Layer calls.
