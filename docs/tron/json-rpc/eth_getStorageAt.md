> Live version: https://triport.io/docs/tron/json-rpc/eth_getStorageAt

# eth_getStorageAt

> Returns one 32-byte storage word from the current Tron EVM state.

| | |
|---|---|
| **Method / Endpoint** | `eth_getStorageAt` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getStorageAt` reads the word at one storage position for an EVM-form
contract address. The position is an EVM hex quantity and the result is exactly
32 bytes encoded as `0x` plus 64 hexadecimal characters.

Use this low-level method only when the contract storage layout and position are
known. For ABI-defined view functions, [`eth_call`](./eth_call.md) is usually
safer. Tron exposes this state only at `latest`; historical quantities are not
supported.

## Parameters

JSON-RPC `params` is `[address, position, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | `0x`-prefixed 20-byte EVM contract address. |
| `position` | string | yes | Storage position as an EVM hex quantity. |
| `block` | string | yes | Must be `latest`. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getStorageAt","params":["0xa614f803b6fd780986a42c78ec9c7f77e6ded13c","0x0","latest"]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | One 32-byte storage word as `0x`-prefixed data. |

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Address or position encoding is invalid, or `block` is not `latest`. |
| `-32601` | Method not found | The method is outside the published catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const params = ["0xa614f803b6fd780986a42c78ec9c7f77e6ded13c", "0x0", "latest"];
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getStorageAt", params }),
});
const { result: word } = await response.json();
```

## Notes

- Storage layout is contract-specific; a zero word does not by itself identify
  the meaning of a slot.
- Only `latest` is supported, so historical storage inspection is unavailable.
- Related: [`eth_getCode`](./eth_getCode.md) and [`eth_call`](./eth_call.md).
