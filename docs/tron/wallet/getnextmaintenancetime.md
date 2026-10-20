> Live version: https://triport.io/docs/tron/wallet/getnextmaintenancetime

# getnextmaintenancetime

> Returns the next native Tron maintenance boundary.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getnextmaintenancetime` |
| **Type** | Native wallet HTTP chain-state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getnextmaintenancetime` returns the next maintenance boundary represented by
the native wallet response. It is a chain-schedule read, not a block lookup.

Use it when an application needs to observe the upcoming native maintenance
transition. The operation has no historical selector and does not accept a
block number.

## Parameters

The request body is a required empty JSON object.

| Name | Type | Required | Description |
|---|---|---|---|
| body | object | yes | Must be `{}`; no request parameters are defined. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getnextmaintenancetime \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response

```json
{}
```

The concrete response example is **unknown** because the OpenAPI contract does
not include one. `{}` is a schema-valid placeholder; no undocumented timestamp
field or unit is asserted here.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Maintenance-boundary result with fields not enumerated by the contract. |

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
const response = await fetch("https://triport.io/rpc/tron/wallet/getnextmaintenancetime", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: "{}",
});
const maintenance = await response.json();
```

## Notes

- The result represents a maintenance boundary, not a block height.
- The response unit remains undocumented because no response schema or example specifies it.
- Related: [`getchainparameters`](./getchainparameters.md).
