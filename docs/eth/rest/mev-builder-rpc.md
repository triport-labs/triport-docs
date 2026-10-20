> Live version: https://triport.io/docs/eth/rest/mev-builder-rpc

# Block-builder direct RPC

> Send a bundle straight to a named Ethereum block builder over JSON-RPC, bypassing the public mempool.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/eth-builder/{builder_id}` |
| **Type** | Triport product (REST API) |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `mev.builder_direct` feature (Scale tier) |
| **Tier / rate limit** | Scale tier only; RPS-per-tier with burst (no daily cap) |

## Description

`/rpc/eth-builder/` is a direct, write-only JSON-RPC channel to the
block-builder pool. Each request targets one builder by appending its short
id to the path (`/rpc/eth-builder/beaverbuild`), and the body is forwarded
verbatim to that builder's RPC endpoint. Use it when you need
builder-specific bundle submission — sending or simulating a bundle against a
single builder rather than fanning out through the [private RPC
forwarder](./mev-private-rpc.md).

The endpoint is **method-whitelisted**: only the bundle-dispatch methods
`eth_sendBundle`, `eth_callBundle`, and `mev_sendBundle` are accepted. Any
read method (`eth_getBalance`, `eth_call`, etc.) is rejected with
`method_not_allowed_on_builder` — this is a write canal, not a general-purpose
RPC. Both single requests and JSON-RPC batch arrays are supported; in a batch,
**every** element must use an allowed method or the whole request is rejected.

Access is tier-gated to the **Scale** plan via the `mev.builder_direct`
feature. Requests on any lower plan return `403 tier_locked`. The request body
is capped at 2 MiB, and the upstream call uses a configurable timeout (default
10 s) — a slow or unreachable builder surfaces as a `502`.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `builder_id` | string | yes | Short id of the target block builder (e.g. `beaverbuild`, `titanbuilder`, `rsync`). Must be a single path segment — a trailing slash, an empty id, or extra path segments return `404 invalid_path`. Unknown ids return `404 builder_not_found`. |

### Request body

A standard JSON-RPC 2.0 request object, or an array of them for a batch. The
`method` must be one of the whitelisted bundle methods.

| Field | Type | Required | Description |
|---|---|---|---|
| `jsonrpc` | string | yes | JSON-RPC version, `"2.0"`. |
| `id` | number \| string | yes | Client request id, echoed in the response. |
| `method` | string | yes | One of `eth_sendBundle`, `eth_callBundle`, `mev_sendBundle`. |
| `params` | array | yes | Method-specific parameters (e.g. the bundle object). Forwarded unchanged to the builder. |

## Request

```bash
curl https://triport.io/rpc/eth-builder/beaverbuild \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_sendBundle",
    "params": [{
      "txs": ["0x02f8..."],
      "blockNumber": "0x1310f30"
    }]
  }'
```

## Response

The builder's JSON-RPC response is passed through unchanged, with its original
status code preserved:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "bundleHash": "0x2e4b4534a1c9f0d8b6e7a3f5c0d9e8b7a6f5e4d3c2b1a09f8e7d6c5b4a3928170"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC version, `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | object | Builder-defined result. For `eth_sendBundle` / `mev_sendBundle` this typically contains the accepted `bundleHash`; for `eth_callBundle` it is the simulation result. |
| `error` | object | Present instead of `result` when the builder rejects the bundle (standard JSON-RPC error object). |

> Note: builder result shapes are defined by the destination builder, not by
> Triport. The proxy forwards the response body and status verbatim.

## Errors

Errors raised by the proxy use the shared envelope
`{"error": "<code>", "code": <http_status>}`. See [errors.md](../../errors.md)
for the full envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `body_read_error` | The request body could not be read. |
| `401` | — | Missing or invalid `Authorization` bearer key. |
| `403` | `tier_locked` | The API key's plan does not include `mev.builder_direct` (anything below Scale). |
| `404` | `invalid_path` | No builder id segment, an empty id, or extra path segments after the id. |
| `404` | `builder_not_found` | The builder id is not present in the configured builder pool. |
| `405` | `method_not_allowed` | The HTTP method is not `POST`. |
| `405` | `method_not_allowed_on_builder` | A non-whitelisted JSON-RPC method was used (only `eth_sendBundle` / `eth_callBundle` / `mev_sendBundle` are allowed). |
| `429` | — | Per-tier RPS limit exceeded (burst-limited; there is no daily quota). |
| `502` | `builder_unavailable` | The upstream builder did not respond (connection failure or timeout). |
| `502` | `builder_read_error` | The builder responded but its body could not be read. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch(
  "https://triport.io/rpc/eth-builder/beaverbuild",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendBundle",
      params: [{ txs: ["0x02f8..."], blockNumber: "0x1310f30" }],
    }),
  },
);
const data = await res.json();
console.log(data.result?.bundleHash);
```

## Notes

- **Write-only by design.** Only `eth_sendBundle`, `eth_callBundle`, and
  `mev_sendBundle` reach the builder. Use `eth_callBundle` to simulate a bundle
  before submitting it with `eth_sendBundle`.
- **One builder per call.** The path selects a single builder. To dispatch to
  multiple builders, send to each id, or use the
  [private RPC forwarder](./mev-private-rpc.md) which spreads a bundle across
  the configured set.
- **Batch atomicity is per-method only.** A batch array is accepted as a whole;
  if any element uses a disallowed method the entire request returns
  `method_not_allowed_on_builder`. There is no partial acceptance.
- **Body limit:** 2 MiB. Larger payloads are truncated at read and will fail
  validation.
- **Timeout:** the upstream call uses a configurable timeout (default 10 s);
  exceeding it returns `502 builder_unavailable`.
- Related: [Private RPC forwarder](./mev-private-rpc.md).
