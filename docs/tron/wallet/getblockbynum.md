> Live version: https://triport.io/docs/tron/wallet/getblockbynum

# getblockbynum

> Returns a native Tron block by its decimal block number.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getblockbynum` |
| **Type** | Native wallet HTTP history read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc_heavy`: 2 / 5 / 20 / 80 RPS sustained · short burst 4 / 10 / 40 / 160 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getblockbynum` returns the native wallet block object for a non-negative
decimal height. Wallet HTTP uses a JSON integer here, unlike
`eth_getBlockByNumber`, whose EVM selector is a hexadecimal quantity.

## Parameters

The JSON body contains one required field.

| Name | Type | Required | Description |
|---|---|---|---|
| `num` | integer | yes | Non-negative decimal block number; hexadecimal strings are not accepted. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getblockbynum \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"num":1}'
```

## Response

```json
{}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Native block object with operation-dependent fields not enumerated by the schema. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | `num` is missing, negative, or not a decimal integer. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/getblockbynum", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ num: 1 }),
});
const block = await response.json();
```

## Notes

- `num` is decimal JSON, not an EVM quantity.
- Retention depth varies by node; the measured 2,219,797-block window is not an SLA.
- Related: [`eth_getBlockByNumber`](../json-rpc/eth_getBlockByNumber.md).
