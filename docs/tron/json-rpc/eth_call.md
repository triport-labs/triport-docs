> Live version: https://triport.io/docs/tron/json-rpc/eth_call

# eth_call

> Executes a read-only call against the current Tron EVM state.

| | |
|---|---|
| **Method / Endpoint** | `eth_call` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_call` executes EVM bytecode without creating or broadcasting a
transaction. It returns the raw ABI-encoded output as `0x`-prefixed EVM data.
Decode that data with the ABI of the function being called.

This is the JSON-RPC route for current contract reads such as token view
functions. The second parameter must be `latest`; historical block quantities
are not supported. The native wallet alternative is
[`triggerconstantcontract`](../wallet/triggerconstantcontract.md), whose request
uses hex-41 addresses and an explicit function selector.

## Parameters

JSON-RPC `params` is `[transaction, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `transaction` | object | yes | Call object; `to` is required and unknown properties are rejected. |
| `block` | string | yes | Must be `latest`; historical quantities are unsupported. |

### `transaction` object

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | yes | `0x`-prefixed 20-byte destination address. |
| `from` | string | no | `0x`-prefixed 20-byte caller address. |
| `data` | string | no | `0x`-prefixed, even-length calldata bytes. |
| `gas` | string | no | Gas allowance as an EVM hex quantity. |
| `gasPrice` | string | no | Gas price as an EVM hex quantity. |
| `value` | string | no | Native value as an EVM hex quantity. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0xa614f803b6fd780986a42c78ec9c7f77e6ded13c","data":"0x18160ddd"},"latest"]}'
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
| `result` | string | Raw return bytes as `0x`-prefixed EVM data. |

## Errors

See [Tron errors](../errors.md) for the common envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `to` is missing, a field is malformed, or `block` is not `latest`. |
| `-32601` | Method not found | The requested RPC method is not published. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const transaction = { to: "0xa614f803b6fd780986a42c78ec9c7f77e6ded13c", data: "0x18160ddd" };
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [transaction, "latest"] }),
});
const { result: returnData } = await response.json();
```

## Notes

- A successful JSON-RPC response can contain ABI-encoded application-level
  output; decode it with the target contract ABI.
- This method is read-only and does not broadcast transactions.
- Historical EVM state is unavailable; only `latest` is accepted.
