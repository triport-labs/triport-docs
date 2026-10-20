> Live version: https://triport.io/docs/tron/json-rpc/eth_getBalance

# eth_getBalance

> Returns the current TRX balance of a 20-byte EVM address.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBalance` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBalance` reads the native balance associated with an EVM-form Tron
address. The result is an EVM hexadecimal quantity; the method does not return
an account object or token balances.

The Tron EVM state surface is current-state only. The second positional
parameter must be the literal `latest`; historical block quantities are not
supported. Use wallet [`getaccount`](../wallet/getaccount.md) when native Tron
account fields, rather than only the balance quantity, are required.

## Parameters

JSON-RPC `params` is `[address, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | `0x`-prefixed 20-byte EVM address matching `^0x[0-9a-fA-F]{40}$`. |
| `block` | string | yes | Must be `latest`; numeric historical tags are unavailable. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBalance","params":["0xa614f803b6fd780986a42c78ec9c7f77e6ded13c","latest"]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Current native balance as an EVM hex quantity. |

## Errors

See [Tron errors](../errors.md) for the common envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The address is malformed or `block` is not `latest`. |
| `-32601` | Method not found | The method is outside the catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const params = ["0xa614f803b6fd780986a42c78ec9c7f77e6ded13c", "latest"];
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params }),
});
const balance = BigInt((await response.json()).result);
```

## Notes

- Block tags other than `latest` are rejected; this endpoint does not provide
  historical EVM state.
- TRC20 token balances require a contract call, not this native-balance method.
- Related: [`eth_call`](./eth_call.md) and [`getaccount`](../wallet/getaccount.md).
