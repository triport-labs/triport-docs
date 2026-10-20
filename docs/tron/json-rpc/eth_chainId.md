> Live version: https://triport.io/docs/tron/json-rpc/eth_chainId

# eth_chainId

> Returns the Tron EVM mainnet chain identifier as a hexadecimal quantity.

| | |
|---|---|
| **Method / Endpoint** | `eth_chainId` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_chainId` identifies the EVM-compatible Tron mainnet represented by this
endpoint. The value is encoded as an EVM hex quantity and is suitable for
network checks in EVM tooling.

Use it to reject an incorrectly configured endpoint before reading state. It is
the hexadecimal form of the same numeric identifier returned as a decimal
string by [`net_version`](./net_version.md).

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
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x2b6653dc"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | string | Chain identifier as an EVM hex quantity. |

## Errors

See [Tron errors](../errors.md) for the common error envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | A positional parameter was supplied. |
| `-32601` | Method not found | The requested method is not in the Tron catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
});
console.log(BigInt((await response.json()).result));
```

## Notes

- The measured mainnet value is `0x2b6653dc`.
- Do not substitute Ethereum chain IDs when configuring EVM libraries for Tron.
- Related: [`net_version`](./net_version.md) returns the identifier in decimal notation.
