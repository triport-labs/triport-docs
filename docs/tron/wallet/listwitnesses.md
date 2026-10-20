> Live version: https://triport.io/docs/tron/wallet/listwitnesses

# listwitnesses

> Returns the native Tron witness list.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/listwitnesses` |
| **Type** | Native wallet HTTP chain-state read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`listwitnesses` returns the witness inventory represented by the native wallet
API. It is a chain-state listing rather than a node peer list.

Address fields use native hex-41 representation by default. Pass
`visible: true` to request Base58-visible representation. The request-body
contract contains no filters, pagination fields, or historical selector.

## Parameters

The JSON body may contain only the optional visibility switch.

| Name | Type | Required | Description |
|---|---|---|---|
| `visible` | boolean | no | Defaults to `false`; use `true` for Base58-visible addresses. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/listwitnesses \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response

```json
{}
```

The concrete response example is **unknown**: no example or witness-field
schema is published in `tron.yaml`. `{}` is only a schema-valid placeholder,
not a captured witness list.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Native witness-list object; nested fields are not enumerated by the contract. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | `visible` is not boolean or another field is supplied. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/listwitnesses", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ visible: true }),
});
const witnesses = await response.json();
```

## Notes

- `visible` controls address representation, not which witnesses are returned.
- This endpoint is not a peer graph and does not expose a public mempool.
- Related: [`getnodeinfo`](./getnodeinfo.md).
