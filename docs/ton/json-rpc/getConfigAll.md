> Live version: https://triport.io/docs/ton/json-rpc/getConfigAll

# getConfigAll

> Returns all available blockchain configuration cells at a masterchain point.

| | |
|---|---|
| **Method / Endpoint** | `getConfigAll` at `POST /rpc/ton` |
| **Type** | TON configuration-state read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getConfigAll` returns the available blockchain configuration encoded as a TON
cell. With no `seqno`, the facade reads configuration at the liteserver's
current masterchain point. Supplying `seqno` asks for historical state.

Use this method when multiple configuration parameters must be decoded from one
cell. Use `getConfigParam` when only one numbered parameter is needed; it maps a
single `config_id` to the underlying liteserver configuration request.

The returned cell is serialized, not expanded into application-level
configuration fields. Historical reads depend on the selected server's state
window and can fail even when a different node can answer the same sequence.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `seqno` | integer | no | Non-negative masterchain sequence number; omit for current configuration. |

Send an empty object when no historical sequence is required. Positional arrays
are invalid for this method.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getConfigAll","params":{}}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "config": {
      "bytes": "te6ccgEBAQEAAgAAAA=="
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Configuration result. |
| `result.config` | object | Serialized TON configuration cell. |
| `result.config.bytes` | string | Base64-encoded bag of cells. |

The JSON is copied from the [accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getConfigAll.json).
The fixture sanitizer replaces `config.bytes`; use the value only to understand
the envelope and base64 representation, not as a real configuration payload.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `seqno` is negative or malformed, or `params` is not a named object. |
| `beyond_retention` | State unavailable | The selected liteserver has no configuration state at the requested `seqno`. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "config", method: "getConfigAll", params: {} }),
});
const { result } = await response.json();
```

## Notes

- Configuration cell decoding is a client responsibility; the JSON facade
  preserves the serialized BoC form.
- Batches are matched by `id`, not response order. TON has no public gateway,
  write, or WebSocket configuration surface in this product.
- Related methods: [`getConfigParam`](./getConfigParam.md) and
  [`getMasterchainInfo`](./getMasterchainInfo.md).
