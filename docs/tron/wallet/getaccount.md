> Live version: https://triport.io/docs/tron/wallet/getaccount

# getaccount

> Returns the current native Tron account state.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getaccount` |
| **Type** | Native wallet HTTP account read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getaccount` returns the current native wallet account object. Use it when the
wallet-layer account representation is required; [`eth_getBalance`](../json-rpc/eth_getBalance.md)
returns only one EVM-encoded native balance quantity.

Addresses default to the native 21-byte hex form beginning with `41`. A Base58
address is accepted only when `visible` is `true`. A mismatched representation
can produce an empty object rather than an explicit error, so validate the pair
before interpreting absence.

## Parameters

The JSON body contains an address and an optional encoding switch.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | Hex-41 address matching `^41[0-9a-fA-F]{40}$` by default. |
| `visible` | boolean | no | Defaults to `false`; set `true` only when the address is Base58. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getaccount \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address":"41a614f803b6fd780986a42c78ec9c7f77e6ded13c"}'
```

## Response

```json
{}
```

The concrete response example is **unknown** because `tron.yaml` publishes no
response example and does not enumerate account fields. `{}` is a schema-valid
placeholder; it must not be read as a captured response for the address above.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Current native account object; properties are operation-dependent. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | The request shape or address encoding is invalid. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

An empty `200` object can also indicate an address/`visible` mismatch; it is not
equivalent to an HTTP error.

## Examples

```js
const body = { address: "41a614f803b6fd780986a42c78ec9c7f77e6ded13c" };
const response = await fetch("https://triport.io/rpc/tron/wallet/getaccount", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const account = await response.json();
```

## Notes

- Hex-41 pairs with omitted or false `visible`; Base58 pairs with `visible: true`.
- This endpoint reads current account state and has no historical block parameter.
- Related: [`eth_getBalance`](../json-rpc/eth_getBalance.md).
- **Empty object `{}`?** An address/`visible` mismatch and a genuinely empty
  account return the same body — see
  [why Tron wallet/getaccount returns an empty object](https://triport.io/learn/tron-address-format-mismatch)
  for how to tell them apart.
- **TRX burned on transfers?** Bandwidth and energy decide it — see
  [why TRON transfers burn TRX](https://triport.io/learn/tron-energy-bandwidth-fees).
