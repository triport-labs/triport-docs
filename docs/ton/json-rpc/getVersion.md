> Live version: https://triport.io/docs/ton/json-rpc/getVersion

# getVersion

> Returns version and capability fields reported by the selected liteserver.

| | |
|---|---|
| **Method / Endpoint** | `getVersion` at `POST /rpc/ton` |
| **Type** | TON liteserver diagnostic read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getVersion` exposes the version and capability data returned by
`liteServer.getVersion`. The values describe the selected upstream liteserver,
not the Triport API version or the TON network protocol as a whole.

Use it for diagnostics and capability inspection. Applications that need chain
progress should call `getMasterchainInfo`; applications that only need the
server clock can call `getTime`.

The result schema intentionally allows additional properties because a
liteserver can report implementation-defined version fields. This direct
liteserver name has no public HTTP-gateway compatibility promise.

## Parameters

JSON-RPC `params` is an empty by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This method has no parameters; send `params: {}`. |

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getVersion","params":{}}'
```

## Response

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Liteserver version and capability result. |
| `result.mode` | integer | Response mode value returned by the liteserver. |
| `result.now` | integer | Unix time reported with the version response. |
| `result.version` | integer | Selected liteserver's version value. |

The response is copied from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getVersion.json).
Other liteservers may expose additional fields allowed by the OpenRPC schema.

## Errors

See [TON errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The parameter structure is malformed or positional. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "version", method: "getVersion", params: {} }),
});
const { result: liteserver } = await response.json();
```

## Notes

- Treat all returned values as properties of the selected liteserver, not a
  uniform product-wide version declaration.
- Requests use named params and batched responses are matched by `id`.
- TON WebSocket diagnostics and public gateway upstreams are not published.
- Related methods: [`getTime`](./getTime.md) and
  [`getMasterchainInfo`](./getMasterchainInfo.md).
