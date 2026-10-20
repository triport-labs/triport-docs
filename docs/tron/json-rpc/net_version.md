> Live version: https://triport.io/docs/tron/json-rpc/net_version

# net_version

> Returns the Tron EVM network identifier as a decimal string.

| | |
|---|---|
| **Method / Endpoint** | `net_version` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_version` returns the network identifier as a decimal string. The response
is a string even though it contains only decimal digits.

Use it for compatibility with clients that still inspect the `net` namespace.
For modern EVM chain selection, [`eth_chainId`](./eth_chainId.md) exposes the
same identifier using the standard hexadecimal quantity representation.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"net_version","params":[]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "728126428"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Network identifier in decimal notation. |

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | A positional parameter was supplied. |
| `-32601` | Method not found | The method is not in the published Tron catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "net_version", params: [] }),
});
console.log((await response.json()).result);
```

## Notes

- Do not interpret the result as a hexadecimal quantity.
- The measured mainnet response is `"728126428"`.
- Related: [`eth_chainId`](./eth_chainId.md) returns `0x2b6653dc`.
