> Live version: https://triport.io/docs/polygon/json-rpc/net_peerCount

# net_peerCount

> Returns the number of peers currently connected to the node's p2p network, as a hexadecimal string.

| | |
|---|---|
| **Method / Endpoint** | `net_peerCount` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 rps · basic 20 rps · pro 100 rps · business 250 rps (with burst) |

## Description

`net_peerCount` reports how many p2p peers the underlying Polygon node is
connected to, encoded as a hex-quantity string (e.g. `"0x2a"` → 42). It is part
of the standard `net_*` network-info namespace and takes no parameters.

Use it as a lightweight node-health / connectivity signal. The value is most
meaningful on the Bor-consensus backends that serve Polygon mainnet
(chainId `0x89` / 137), where it reflects the node's real Bor p2p peer count.

**Gotcha — value reliability:** behind some load-balanced / CDN-fronted
infrastructure the peer count is not a real metric. Such backends may return a
fabricated constant or `"0x0"` regardless of the actual peer topology. Treat a
zero or suspiciously static value as "unknown" rather than "no peers", and do
not build alerting on the absolute number unless you have confirmed your route
serves a direct Bor backend. The count is a coarse signal, not a precise gauge.

## Parameters

This method takes **no parameters**. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. `params` must be `[]`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "net_peerCount",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x2a"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | number | Echoes the request `id`. |
| `result` | string | Number of connected p2p peers as a hex-quantity string (e.g. `"0x2a"` = 42). Parse with `parseInt(result, 16)`. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and handling
guidance.

| Code | Meaning | When it happens |
|---|---|---|
| `-32601` | Method not found | The method name is misspelled or not enabled on the route. |
| `401` | Auth / key error | Missing, invalid, or revoked `TRIPORT_API_KEY`. |
| `403` | Insufficient tier / scope | Key lacks the `polygon_read_rpc` capability. |
| `429` | Rate limit exceeded | Per-tier RPS (incl. burst) was exceeded — back off and retry. |
| `502` | Upstream unavailable | No healthy backend could serve the request. A slow backend is not reported separately: a timeout makes the proxy fall back to another upstream, and you only see `502` when none can serve. |

The first three are plain HTTP responses decided before the RPC layer — they carry
no JSON-RPC `error` object. See the [errors reference](../../errors.md).

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "net_peerCount",
    params: [],
  }),
});

const { result } = await res.json();
const peers = parseInt(result, 16);
console.log(`connected peers: ${peers}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const result = await client.polygon.rpc<string>("net_peerCount");
const peers = parseInt(result, 16);
console.log(`connected peers: ${peers}`);
```

## Notes

- **No parameters, no caching semantics on the client side** — the value changes
  as peers connect and disconnect, so re-query when you need a fresh reading.
- This is a `net_*` info method. Related: [`net_version`](./net_version.md)
  (chain id as a decimal string) and [`net_listening`](./net_listening.md)
  (whether the node is accepting p2p connections — practically always `true`).
- For a richer node-identity signal, see
  [`web3_clientVersion`](./web3_clientVersion.md).
- The peer count is best treated as a health hint. For block-level liveness,
  prefer [`eth_blockNumber`](./eth_blockNumber.md).
