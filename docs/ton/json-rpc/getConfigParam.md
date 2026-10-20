> Live version: https://triport.io/docs/ton/json-rpc/getConfigParam

# getConfigParam

> Returns one numbered blockchain configuration cell at a masterchain point.

| | |
|---|---|
| **Method / Endpoint** | `getConfigParam` at `POST /rpc/ton` |
| **Type** | TON configuration-parameter read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getConfigParam` returns a single numbered TON blockchain configuration cell.
The facade maps `config_id` to `liteServer.getConfigParams` and returns the
serialized cell in the same JSON shape used by `getConfigAll`.

Use this method when the application already knows the parameter number and
does not need the full configuration bag. The captured request asks for
configuration parameter `34`; the API does not decode the returned cell into
validator-set fields.

An optional `seqno` selects historical masterchain state. Availability follows
the chosen liteserver's measured state depth rather than a network-wide archive
guarantee.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `config_id` | integer | yes | Signed 32-bit configuration parameter number. |
| `seqno` | integer | no | Non-negative masterchain sequence number; omit for current state. |

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getConfigParam",
    "params": { "config_id": 34 }
  }'
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
| `result` | object | Configuration-parameter result. |
| `result.config` | object | Serialized TON configuration cell. |
| `result.config.bytes` | string | Base64-encoded bag of cells. |

The JSON is copied from the [accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getConfigParam.json).
The fixture sanitizer replaces the cell bytes, so the example documents the
wire shape but is not a decodable copy of parameter `34`.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `config_id` is absent or not an integer, `seqno` is invalid, or params are positional. |
| `beyond_retention` | State unavailable | Historical configuration is below the selected server's retained state window. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0", id: "config-34", method: "getConfigParam", params: { config_id: 34 },
  }),
});
const { result } = await response.json();
```

## Notes

- `config_id` and `seqno` are JSON numbers; the returned BoC is base64 text.
- Named params and batch correlation by `id` apply to every TON JSON-RPC call.
- No REST gateway, write method, or WebSocket configuration subscription is
  available. Related method: [`getConfigAll`](./getConfigAll.md).
