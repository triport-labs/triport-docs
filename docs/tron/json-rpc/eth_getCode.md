> Live version: https://triport.io/docs/tron/json-rpc/eth_getCode

# eth_getCode

> Returns the bytecode stored at an EVM address in the current Tron state.

| | |
|---|---|
| **Method / Endpoint** | `eth_getCode` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getCode` returns the byte sequence stored as contract code at a 20-byte EVM
address. The result uses EVM data encoding: `0x` followed by an even number of
hexadecimal characters. `0x` represents an empty byte sequence.

The state read is available only at `latest`; historical block quantities are
not accepted. Use this method to distinguish deployed bytecode from an empty
address. Native contract metadata is available from
[`getcontractinfo`](../wallet/getcontractinfo.md).

## Parameters

JSON-RPC `params` is `[address, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | `0x`-prefixed 20-byte EVM address. |
| `block` | string | yes | Must be `latest`; historical quantities are unsupported. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0xa614f803b6fd780986a42c78ec9c7f77e6ded13c","latest"]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Contract code as `0x`-prefixed EVM data. |

## Errors

See [Tron errors](../errors.md) for the common envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The address is malformed or the block tag is not `latest`. |
| `-32601` | Method not found | The method is outside the published catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const params = ["0xa614f803b6fd780986a42c78ec9c7f77e6ded13c", "latest"];
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getCode", params }),
});
const { result: code } = await response.json();
```

## Notes

- `0x` is an empty data value; the schema does not assign a separate null case.
- Historical EVM code is unavailable because only the `latest` state tag is supported.
- Related: [`eth_getStorageAt`](./eth_getStorageAt.md) and
  [`getcontractinfo`](../wallet/getcontractinfo.md).
