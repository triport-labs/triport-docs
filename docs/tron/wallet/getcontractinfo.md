> Live version: https://triport.io/docs/tron/wallet/getcontractinfo

# getcontractinfo

> Returns native metadata for a Tron contract address.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getcontractinfo` |
| **Type** | Native wallet HTTP contract read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getcontractinfo` returns the native wallet metadata object for a contract. The
contract address is carried in `value`, not `address` or `contract_address`.

The default address representation is hex-41. Base58 is valid only together
with `visible: true`. Use [`eth_getCode`](../json-rpc/eth_getCode.md) when the
only required value is EVM bytecode encoded as data.

## Parameters

The JSON body contains the contract address and an optional encoding switch.

| Name | Type | Required | Description |
|---|---|---|---|
| `value` | string | yes | Contract address in hex-41 form by default. |
| `visible` | boolean | no | Defaults to `false`; set `true` only for a Base58 address. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getcontractinfo \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"value":"41a614f803b6fd780986a42c78ec9c7f77e6ded13c"}'
```

## Response

```json
{}
```

The concrete response example is **unknown**. The OpenAPI response allows an
extensible object but supplies no example or property list. `{}` is therefore a
schema-valid placeholder, not a captured contract metadata response.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Native contract metadata; properties are not enumerated by the schema. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | `value` is missing or its address representation is invalid. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

An address/`visible` mismatch can result in an empty object instead of a
transport error.

## Examples

```js
const body = { value: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c" };
const response = await fetch("https://triport.io/rpc/tron/wallet/getcontractinfo", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const contract = await response.json();
```

## Notes

- The request field is named `value` in the published contract.
- This is current native metadata; the schema has no historical block selector.
- Related: [`eth_getCode`](../json-rpc/eth_getCode.md).
