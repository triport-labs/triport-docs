> Live version: https://triport.io/docs/tron/json-rpc/web3_clientVersion

# web3_clientVersion

> Returns the implementation-defined client version of the selected Tron node.

| | |
|---|---|
| **Method / Endpoint** | `web3_clientVersion` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`web3_clientVersion` returns the software version string reported by whichever
eligible Tron node serves the request. The captured response identifies a
java-tron implementation.

Use the value for diagnostics and compatibility logging. Do not branch product
behavior on the exact string: routing can select another eligible node and the
schema deliberately leaves the format implementation-defined.

## Parameters

JSON-RPC `params` must be an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| `params` | array | yes | Empty array; this method accepts no positional parameters. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"web3_clientVersion","params":[]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "TRON/v4.8.2.1/Linux/Java1.8"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Implementation-defined upstream client version. |

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | A positional parameter was supplied. |
| `-32601` | Method not found | The method is outside the published catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "web3_clientVersion", params: [] }),
});
console.log((await response.json()).result);
```

## Notes

- The example is a measured response, not a pinned version guarantee.
- Node identity, peer lists, and mempool access are not exposed by this method.
- Related: [`getnodeinfo`](../wallet/getnodeinfo.md) is the native wallet status call.
