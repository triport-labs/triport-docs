> Live version: https://triport.io/docs/eth/rest/rpc-eth-transport

# Ethereum JSON-RPC transport (POST /rpc/eth)

> The raw JSON-RPC 2.0 transport for Ethereum execution-layer (EL) `eth_*` calls — one HTTP endpoint that classifies each method, routes it across the EL node pool, and falls back automatically.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/eth` |
| **Type** | Triport product (REST API) |
| **Network** | Ethereum |
| **Authentication** | `x-token` header (preferred) · `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth:rpc` |
| **Tier / rate limit** | per-method — resolved from the method's category (see [Rate limits](../../rate-limits-and-tiers.md)) |

## Description

`POST /rpc/eth` is the single endpoint through which all Ethereum
execution-layer JSON-RPC methods (`eth_*`, `trace_*`, `debug_*`, `txpool_*`)
are served. You send a standard JSON-RPC 2.0 request object and receive a
standard JSON-RPC 2.0 response. This page documents the **transport** — how a
request is classified, routed, and authorized. The individual methods are
documented separately under the [Ethereum JSON-RPC reference](../json-rpc/index.md)
(generated from [`eth.openrpc.json`](https://triport.io/api-specs/json-rpc/eth.openrpc.json)); they
are not re-listed here.

Each incoming request is inspected and dispatched by method:

- **Read & trace methods** (`eth_*`, `trace_*`, `debug_*`, `txpool_status`,
  `txpool_content`, `txpool_inspect`) are routed to the **EL node pool**: a
  primary mesh host is picked, and on a routing error the request transparently
  falls through a fallback chain — no error surfaces to you as long as one
  upstream can serve the call.
- **Write methods** (`eth_sendRawTransaction`, `eth_sendTransaction`,
  `eth_signTransaction`) are forwarded to the dedicated transaction-send
  channel rather than the read pool.
- **Privileged namespaces** (`admin_*`, `personal_*`, `engine_*`) are **never**
  forwarded. They are rejected at the edge with a JSON-RPC error
  (`-32601`, "<namespace> namespace disabled"). Classification is
  case-insensitive, so `Admin_peers` is rejected exactly like `admin_peers`.
- **Batch requests** (a JSON array of request objects) are accepted but routed
  straight to the fallback chain — the mesh pool serves single calls only.

Authentication, tier, and scope are enforced by the transport before any
routing decision: present a key holding the `eth:rpc` scope, and the per-method
rate limit is applied according to the method's category.

## Parameters

The request body is a single JSON-RPC 2.0 object (or, for batch, an array of
them). The `method` and `params` are those of the underlying Ethereum EL
method.

| Name | Type | Required | Description |
|---|---|---|---|
| `jsonrpc` | string | yes | Must be `"2.0"`. |
| `id` | string \| number \| null | yes | Client-chosen request id; echoed back on the response. |
| `method` | string | yes | The EL JSON-RPC method, e.g. `eth_blockNumber`. See the [method reference](../json-rpc/index.md). |
| `params` | array | no | Positional parameters for the method. Omit or pass `[]` when the method takes none. |

### Method routing

How the transport classifies the `method` field:

| Method pattern | Routing | Notes |
|---|---|---|
| `eth_*`, `trace_*`, `debug_*` | EL node pool (primary + fallback) | Standard reads and trace/debug calls. |
| `txpool_status`, `txpool_content`, `txpool_inspect` | EL node pool | Mempool inspection. |
| `eth_sendRawTransaction`, `eth_sendTransaction`, `eth_signTransaction` | Transaction-send channel | Write path; not served by the read pool. |
| `admin_*`, `personal_*`, `engine_*` | Rejected (`-32601`) | Privileged namespaces are disabled. |
| JSON array (batch) | Fallback chain | Mesh pool is single-call only. |

## Request

```bash
curl https://triport.io/rpc/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_blockNumber",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x12d4f8a"
}
```

The response is the upstream method's JSON-RPC result, passed through
unchanged. The `Content-Type` is always `application/json`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | string \| number \| null | The `id` from your request, echoed back. |
| `result` | (method-specific) | Present on success. Shape depends on the method — see its [reference page](../json-rpc/index.md). |
| `error` | object | Present instead of `result` on a JSON-RPC error. Contains `code` (integer) and `message` (string). |

## Errors

JSON-RPC errors are **envelope-level**: they return HTTP `200` with an `error`
object in the body. Transport-level failures (auth, body parsing, no upstream)
use HTTP status codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32601` (HTTP 200) | Method namespace disabled | The method is in the `admin_`, `personal_`, or `engine_` namespace. Message: `"<namespace> namespace disabled"`. |
| `400` | Bad request | The request body could not be read. |
| `401` | Unauthorized | Missing or invalid token (no `x-token` / `Authorization` / accepted form). |
| `403` | Forbidden | The key lacks the `eth:rpc` scope, or its tier does not cover the method's category. |
| `429` | Rate limited | You exceeded your tier's RPS for this method's category; retry after `Retry-After` seconds. |
| `502` | Bad gateway | No upstream was available to serve the request. |

The underlying method may also return its own JSON-RPC error codes (e.g.
`-32602` invalid params). See [Errors](../../errors.md) for the full envelope
and the typed fields on each code.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/rpc/eth", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_blockNumber",
    params: [],
  }),
});

const { result } = await res.json();
console.log("latest block:", parseInt(result, 16));
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

// The SDK targets POST /rpc/eth under the hood.
const blockHex: string = await client.ethereum.rpc("eth_blockNumber");
console.log("latest block:", parseInt(blockHex, 16));
```

## Notes

- **This is the transport, not the methods.** For parameters, result shapes,
  and per-method tiers, see the [Ethereum JSON-RPC reference](../json-rpc/index.md).
- **Single calls route through the node pool; batches do not.** A JSON-RPC
  batch (array body) is served by the fallback chain rather than the mesh pool.
  Split large batches into single calls when you want pool routing.
- **Privileged namespaces are off by design.** `admin_*`, `personal_*`, and
  `engine_*` always return `-32601` and never reach an upstream node.
- **Writes use a separate path.** `eth_sendRawTransaction` and the other write
  methods are forwarded to the transaction-send channel automatically — you
  call them through this same endpoint.
- Related: [Authentication](../../authentication.md) ·
  [Rate limits](../../rate-limits-and-tiers.md) · [Errors](../../errors.md)
