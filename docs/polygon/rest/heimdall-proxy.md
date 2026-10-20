> Live version: https://triport.io/docs/polygon/rest/heimdall-proxy

# Heimdall consensus RPC proxy

> A transparent reverse-proxy that forwards Polygon **Heimdall** consensus-layer requests (Tendermint RPC, Cosmos LCD, and the consensus Prometheus port) through a single authenticated path on the Triport edge.

| | |
|---|---|
| **Method / Endpoint** | `ANY /rpc/polygon-heimdall/*` |
| **Type** | Triport product (REST API) |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — (standard project key) |
| **Tier / rate limit** | per-tier RPS with burst (free → basic → pro → business) |

> **Not an OpenAPI-defined endpoint.** This route is wired directly on the
> Polygon edge mux rather than declared in `polygon.yaml`, so it does not appear
> in the machine-readable OpenAPI surface. The contract below is documented from
> the live router behavior.

## Description

Everything after the `/rpc/polygon-heimdall` prefix is treated as a Heimdall
path. The proxy strips that prefix, matches the remaining path against a
fixed **whitelist** of safe read routes, and forwards the request to a healthy
upstream consensus node. Three logical upstream ports are addressed
transparently based on the route:

- **Tendermint RPC** (`26657`) — `/status`, `/validators`, `/tx_search`, etc.
- **Cosmos LCD / REST** (`1317`) — paths under `/lcd/...`
- **Consensus Prometheus** (`26660`) — internal metrics port (route-gated)

The proxy is **multi-region aware**: requests are served from a regional pool
of consensus nodes, with automatic cross-region failover when the home region
has no healthy host. Pool members are continuously health-checked against the
expected consensus chain ID `heimdallv2-137`; a node reporting a different
network, or one that is catching up, is taken out of rotation.

Use this endpoint when you need direct, low-level consensus data — checkpoint
status, validator set membership, or historic `tx_search` queries — that the
execution-layer JSON-RPC cannot answer.

**Gotchas**

- **Read-only.** Transaction broadcast paths (`/broadcast_tx_sync`,
  `/broadcast_tx_async`, `/broadcast_tx_commit`) are rejected by policy.
- **Whitelist only.** Any path not in the table below returns `404`.
- **Archive routes are strict.** `/tx_search` and `/block_search` are served
  only by archive-capable nodes; if none are available you get a typed `503`
  rather than a partial result.
- **Path hygiene.** Paths containing `..`, `//`, encoded traversal sequences,
  or null bytes are rejected with `400`.

## Parameters

There are no fixed query/body parameters at the proxy layer — the request is
forwarded as-is to the consensus node, including method, body, and query
string. What matters is the **path** (after the prefix), which must resolve to
a whitelisted route.

### Path

| Segment | Type | Required | Description |
|---|---|---|---|
| `/rpc/polygon-heimdall` | prefix | yes | Fixed mount prefix; stripped before route matching. |
| `<heimdall-path>` | string | yes | A whitelisted Tendermint RPC path (e.g. `/status`) or a `/lcd/...` Cosmos REST path. |

### Whitelisted routes

| Path (after prefix) | Upstream port | Notes |
|---|---|---|
| `/status` | RPC `26657` | Node + sync status. Not cached. |
| `/validators` | RPC `26657` | Current validator set. |
| `/net_info` | RPC `26657` | Peer info (sanitized). |
| `/dump_consensus_state` | RPC `26657` | Full consensus state. |
| `/unconfirmed_txs`, `/num_unconfirmed_txs` | RPC `26657` | Mempool view. |
| `/tx_search`, `/block_search` | RPC `26657` | **Archive-only.** Historic search. |
| `/blockchain` | RPC `26657` | Block metadata range. |
| `/abci_info` | RPC `26657` | Application info. |
| `/lcd/node_info` | LCD `1317` | Cosmos node info. |
| `/lcd/blocks/latest`, `/lcd/blocks/{height}` | LCD `1317` | Blocks by height. |
| `/lcd/validatorsets/latest`, `/lcd/validatorsets/{height}` | LCD `1317` | Validator sets. |
| `/lcd/accounts/{address}` | LCD `1317` | Account state. |
| `/lcd/staking/...` | LCD `1317` | Staking module. |
| `/lcd/bor/...` | LCD `1317` | Bor span/producer module. |
| `/lcd/checkpoints/...` | LCD `1317` | Checkpoint module. |

### Rejected by policy

`/broadcast_tx_sync`, `/broadcast_tx_async`, `/broadcast_tx_commit`,
`/lcd/health`, `/lcd/swagger` — these return `404` with code
`heimdall_route_rejected`.

## Request

```bash
curl https://triport.io/rpc/polygon-heimdall/status \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

A Cosmos LCD example (validator set at a given height):

```bash
curl "https://triport.io/rpc/polygon-heimdall/lcd/validatorsets/latest" \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

## Response

The body is the consensus node's native response, passed through verbatim
(with internal version/identity headers stripped). A `/status` response looks
like:

```json
{
  "jsonrpc": "2.0",
  "id": -1,
  "result": {
    "node_info": {
      "network": "heimdallv2-137",
      "moniker": "triport-polygon"
    },
    "sync_info": {
      "latest_block_height": "21456789",
      "latest_block_time": "2026-05-29T10:21:04.512Z",
      "catching_up": false
    },
    "validator_info": {
      "voting_power": "0"
    }
  }
}
```

### Response headers

| Header | Description |
|---|---|
| `X-Mesh-Source` | Always `polygon-heimdall` — identifies the serving layer. |
| `Content-Type` | Passed through from the consensus node (typically `application/json`). |

### Response fields

Response fields are defined by the underlying Tendermint RPC / Cosmos LCD
protocol and vary per route. For `/status`, the most useful fields are:

| Field | Type | Description |
|---|---|---|
| `result.node_info.network` | string | Consensus chain ID. Always `heimdallv2-137` for healthy nodes. |
| `result.sync_info.latest_block_height` | string | Latest committed Heimdall block height. |
| `result.sync_info.catching_up` | boolean | `true` if the node is still syncing. |

## Errors

All errors use a typed JSON envelope: `{"error":{"code":"...","message":"..."}}`.

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `heimdall_path_invalid` | 400 | Path contains forbidden segments | `..`, `//`, encoded traversal, or null byte in the path. |
| `heimdall_route_rejected` | 404 | Route rejected by policy | A broadcast/operator-internal path (e.g. `/broadcast_tx_sync`). |
| `heimdall_route_not_found` | 404 | Route not in whitelist | Path is not one of the whitelisted routes. |
| `heimdall_archive_unavailable` | 503 | No archive host available | `/tx_search` or `/block_search` requested while all archive nodes are quarantined/degraded. |
| `heimdall_upstream_exhausted` | 503 | All hosts exhausted | Every candidate node failed (transport error or 5xx) within the retry budget. |

Authentication and rate-limit errors share the platform envelope — see the
shared [errors reference](../../errors.md). Rate limiting is RPS-per-tier with
burst; there is no daily quota.

## Examples

### JavaScript (fetch)

```js
const res = await fetch(
  "https://triport.io/rpc/polygon-heimdall/status",
  {
    headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` },
  }
);
const { result } = await res.json();
console.log("Heimdall height:", result.sync_info.latest_block_height);
```

## Notes

- **Failover & retries.** A failed request is retried once on a different host
  before returning `heimdall_upstream_exhausted`. With multi-region routing
  enabled, the retry may land in another region.
- **Caching.** Some routes are served with a short server-side cache (e.g.
  `/validators` ~5s, `/tx_search` ~30s); volatile routes like `/status` are
  never cached.
- **Related endpoints.** The Bor execution layer is reached through the
  standard Polygon JSON-RPC surface; live Bor blocks, logs and pending
  transactions stream over [Polygon WebSocket](../../streaming/poly-ws.md).
- See the shared [authentication](../../authentication.md) and
  [rate limits](../../rate-limits-and-tiers.md) guides for how the Bearer key and
  per-tier limits apply across the platform.
