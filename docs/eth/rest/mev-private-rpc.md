> Live version: https://triport.io/docs/eth/rest/mev-private-rpc

# Private RPC forwarder

> Submit raw transactions and bundles to MEV-protected private endpoints without ever touching the public mempool.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/eth-private/{forwarder_id}` |
| **Type** | Triport product (REST API) |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — (gated by plan tier) |
| **Tier / rate limit** | Growth or Scale; per-tier RPS with burst (see [Rate limits](../../rate-limits-and-tiers.md)) |

## Description

The private RPC forwarder is a write-only JSON-RPC channel. You `POST` a signed
transaction (or a bundle) to a named private-transaction endpoint and Triport
forwards it verbatim, returning the upstream JSON-RPC response. Because the
payload goes straight to a private builder/relay forwarder, it is never gossiped
to the public mempool — which protects it from front-running and sandwich
attacks.

The target forwarder is selected by the `{forwarder_id}` path segment. Each
configured forwarder is a distinct privacy destination; the set of available
IDs is deployment-specific. The path must contain **exactly one** segment after
`/rpc/eth-private/` — there are no sub-paths, because a write request is the
entire forwarder endpoint.

Only write methods are accepted. The request body is parsed and every JSON-RPC
`method` in it must be on the allow-list:

* `eth_sendRawTransaction`
* `eth_sendBundle`
* `mev_sendBundle`

A batch (JSON array) is allowed, but every element must use an allowed method.
Any read method (e.g. `eth_getBalance`) is rejected with `405
method_not_allowed_on_forwarder` — deliberately a 405 (not 403) so a client SDK
can transparently retry the read against a public RPC route.

The request body is capped at **2 MiB** (large enough for a bundle), and the
upstream forward has a configurable timeout (default **10 s**). The
`Authorization` header you send is consumed by Triport for tier resolution and
is **not** forwarded upstream.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `forwarder_id` | string | yes | Short identifier of the private-transaction forwarder to route through. Exactly one path segment; no sub-paths. |

### Request body (JSON-RPC)

| Name | Type | Required | Description |
|---|---|---|---|
| `jsonrpc` | string | yes | JSON-RPC version, `"2.0"`. |
| `id` | number \| string | yes | Client-chosen request id, echoed in the response. |
| `method` | string | yes | One of `eth_sendRawTransaction`, `eth_sendBundle`, `mev_sendBundle`. Any other value → `405 method_not_allowed_on_forwarder`. |
| `params` | array | yes | Method params — e.g. the signed raw tx hex for `eth_sendRawTransaction`, or the bundle object for `eth_sendBundle` / `mev_sendBundle`. |

The body may also be a JSON **array** (batch); each element is validated
independently and must use an allowed method.

## Request

```bash
curl https://triport.io/rpc/eth-private/protect \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_sendRawTransaction",
    "params": ["0x02f8730182..."]
  }'
```

## Response

The upstream JSON-RPC response is returned as-is. For a successful
`eth_sendRawTransaction` the result is the transaction hash:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x9b2c...e41d"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | number \| string | Echoes the `id` from your request. |
| `result` | string \| object | Method result passed through from the forwarder — e.g. the transaction hash, or a bundle acknowledgement object. |
| `error` | object | Present instead of `result` if the forwarder rejects the JSON-RPC call (standard JSON-RPC error object). |

The transport-level HTTP status mirrors the forwarder's status. Hop-by-hop
headers and the upstream `Server` header are stripped before the response is
returned.

## Errors

Transport-level failures use the shared error envelope
`{"error":"<code>","code":<http_status>}`. See [Errors](../../errors.md) for the
full envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `body_read_error` | Request body could not be read, or exceeds the 2 MiB cap. |
| `401` | `unauthorized` | Missing or invalid `Authorization` bearer key. |
| `403` | `tier_locked` | Your plan does not include the private RPC forwarder (Free and Starter are locked; Growth and Scale are permitted). |
| `404` | `invalid_path` | Path is missing the `{forwarder_id}` segment or contains a sub-path. |
| `404` | `forwarder_not_found` | The `{forwarder_id}` is not a configured forwarder. |
| `405` | `method_not_allowed` | HTTP method other than `POST`. |
| `405` | `method_not_allowed_on_forwarder` | A JSON-RPC method in the body is not a write method on the allow-list. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded. There is no daily quota. |
| `502` | `forwarder_unavailable` | The upstream forwarder did not respond (e.g. timed out). |

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/rpc/eth-private/protect", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_sendRawTransaction",
    params: [signedRawTx],
  }),
});

const { result, error } = await res.json();
if (error) throw new Error(error.message);
console.log("tx hash:", result);
```

## Notes

* **Write-only.** Reads are intentionally rejected with `405
  method_not_allowed_on_forwarder` so SDKs can fall back to a public RPC route.
* **Bundles.** `eth_sendBundle` and `mev_sendBundle` accept a bundle object in
  `params`; batch arrays are supported as long as every method is on the
  allow-list.
* **No key leakage.** Your `Authorization` header is used only for tier checks
  and is never forwarded to the upstream forwarder.
* **Choosing a forwarder.** The `{forwarder_id}` must match a configured
  destination; an unknown id returns `404 forwarder_not_found`.
* **Related:** for direct-to-builder submission see the block-builder direct RPC
  (`POST /rpc/eth-builder/`), and for the standard public transport use the
  Ethereum JSON-RPC endpoint (`POST /rpc/eth`).
