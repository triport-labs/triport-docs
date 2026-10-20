> Live version: https://triport.io/docs/tron/wallet/getenergyprices

# getenergyprices

> Returns native Tron energy price changes through wallet HTTP.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getenergyprices` |
| **Type** | Native wallet HTTP chain-state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getenergyprices` returns the native wallet representation of Tron energy price
changes. It is intended for consumers using Tron resource accounting rather
than a generic EVM gas-price interface. It does not estimate how much energy a particular contract call uses.

The result format is distinct from [`eth_gasPrice`](../json-rpc/eth_gasPrice.md),
which returns one EVM hex quantity. The wallet operation accepts no range or
historical selector in its request.

## Parameters

The request body is a required empty JSON object.

| Name | Type | Required | Description |
|---|---|---|---|
| body | object | yes | Must be `{}`; no request parameters are defined. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getenergyprices \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response

```json
{}
```

The concrete response example is **unknown**. The OpenAPI response is an
extensible wallet object with no example, so `{}` is a schema-valid placeholder
and no undocumented history fields are claimed.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Native energy-price result; fields are not enumerated by the contract. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | The request body is malformed or not empty. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/getenergyprices", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: "{}",
});
const energyPrices = await response.json();
```

## Notes

- Do not parse this response as an EVM quantity.
- No response-field units are documented because the contract supplies neither fields nor an example.
- Related: [`eth_gasPrice`](../json-rpc/eth_gasPrice.md).
