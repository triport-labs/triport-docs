> Live version: https://triport.io/docs/tron/json-rpc/eth_blockNumber

# eth_blockNumber

> Returns the latest Tron block number as an EVM hexadecimal quantity.

| | |
|---|---|
| **Method / Endpoint** | `eth_blockNumber` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_blockNumber` returns the number of the latest block visible to the selected
Tron JSON-RPC node. The result uses the EVM quantity format: a `0x`-prefixed
hexadecimal string with no unnecessary leading zeroes.

Use this method to establish a current head before requesting blocks or bounded
log ranges. It reports a height, not a complete block; use
`eth_getBlockByNumber` when block data is required.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x51e650e"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Latest block number as an EVM hex quantity. |

## Errors

See [Tron errors](../errors.md) for the shared envelope and routing behavior.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `params` is not empty or the request shape is invalid. |
| `-32601` | Method not found | The requested method is outside the published Tron catalog. |
| `401` | Unauthorized | The `x-token` header is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const body = { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] };
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
console.log((await response.json()).result);
```

## Notes

- Convert the result with `BigInt(result)` when a decimal height is needed.
- Tron has no WebSocket head subscription on this product surface; poll this
  method at an interval that fits the tier budget.
- Related: [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) returns block data.
