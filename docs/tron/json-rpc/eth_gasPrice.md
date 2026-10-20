> Live version: https://triport.io/docs/tron/json-rpc/eth_gasPrice

# eth_gasPrice

> Returns the current EVM gas price exposed by the Tron JSON-RPC layer.

| | |
|---|---|
| **Method / Endpoint** | `eth_gasPrice` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_gasPrice` returns the EVM-facing gas price as a hex quantity. The measured
example returned `0x64`; consumers should parse the quantity rather than rely on
that sample value remaining current.

This method is for software using the EVM compatibility layer. It is distinct
from the native wallet [`getenergyprices`](../wallet/getenergyprices.md) method,
which returns Tron energy price changes in a wallet response object.

## Parameters

JSON-RPC `params` must be an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| `params` | array | yes | Empty array; no transaction object is accepted. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_gasPrice","params":[]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x64"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Current gas price as an EVM hex quantity. |

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `params` contains an unexpected value. |
| `-32601` | Method not found | The requested method is outside the contract. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
});
const gasPrice = BigInt((await response.json()).result);
```

## Notes

- Treat the response as a quantity, not a decimal string.
- The example is a captured response, not a fixed price guarantee.
- Related: [`getenergyprices`](../wallet/getenergyprices.md) exposes the native wallet view.
