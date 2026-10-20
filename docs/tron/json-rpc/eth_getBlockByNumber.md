> Live version: https://triport.io/docs/tron/json-rpc/eth_getBlockByNumber

# eth_getBlockByNumber

> Returns the EVM representation of a Tron block by quantity or `latest`.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByNumber` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC block read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByNumber` returns an EVM-shaped block object or `null`. The block
selector is either an EVM hex quantity or the literal `latest`; the second
parameter chooses whether transactions are requested in their full form.

## Parameters

JSON-RPC `params` is `[block, fullTransactions]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | EVM hex quantity or the literal `latest`. |
| `fullTransactions` | boolean | yes | Selects the representation of transactions in the returned block. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["latest",false]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x51e650e"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | object or null | EVM block object, or `null` when unavailable. |
| `result.number` | string | Block number shown in the captured example as a hex quantity. |

Other block-object fields are intentionally not enumerated: the result schema
permits implementation-defined properties and the fixture only guarantees
`number`.

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The selector is not a quantity or `latest`, or the flag is not boolean. |
| `-32601` | Method not found | The method is outside the published catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", false] }),
});
const { result: block } = await response.json();
```

## Notes

- Unlike current-state methods, this method accepts a hexadecimal block quantity.
- An unavailable historical block is represented by `null` in the result schema.
- There is no WebSocket block stream on the Tron product surface.
