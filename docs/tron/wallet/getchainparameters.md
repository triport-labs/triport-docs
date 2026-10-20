> Live version: https://triport.io/docs/tron/wallet/getchainparameters

# getchainparameters

> Returns the current native Tron chain-parameter object.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getchainparameters` |
| **Type** | Native wallet HTTP chain-state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getchainparameters` returns the native network parameters visible at the time
the request is served. It is intended for clients that need the wallet-layer
chain configuration rather than one EVM-compatible scalar.

The response is a current snapshot. The request does not accept a block number,
so it cannot be used to reconstruct historical chain-parameter state.

## Parameters

The request body is a required empty JSON object.

| Name | Type | Required | Description |
|---|---|---|---|
| body | object | yes | Must be `{}`; additional properties are rejected by the contract. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getchainparameters \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response

```json
{}
```

The concrete response example is **unknown**. `tron.yaml` defines an extensible
wallet object and does not publish a response example, so `{}` is shown only as
a schema-valid placeholder.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Current chain parameters; field names are not enumerated by the contract. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | The request body is malformed or contains fields. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/getchainparameters", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: "{}",
});
const parameters = await response.json();
```

## Notes

- This is current chain state; no historical selector exists in the schema.
- Consumers should tolerate contract-permitted additional response properties.
- Related: [`getnextmaintenancetime`](./getnextmaintenancetime.md).
