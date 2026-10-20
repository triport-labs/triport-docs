> Live version: https://triport.io/docs/tron/wallet/getnowblock

# getnowblock

> Returns the current solid block reported by the selected Tron wallet node.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getnowblock` |
| **Type** | Native wallet HTTP read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getnowblock` returns the native wallet representation of the node's current
solid block. It is the wallet-layer choice when a consumer needs a complete
native block object rather than only an EVM-form height.

## Parameters

The request body is a required empty JSON object.

| Name | Type | Required | Description |
|---|---|---|---|
| body | object | yes | Must be `{}`; additional properties are not accepted by the contract. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getnowblock \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response

```json
{}
```

The concrete response example is **unknown**: `tron.yaml` defines an extensible
wallet object but publishes no response example. The empty object above is a
schema-valid placeholder, not a captured successful block.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Operation-dependent native wallet object; fields are not enumerated by the contract. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | The JSON body is malformed or contains unsupported fields. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/getnowblock", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: "{}",
});
const block = await response.json();
```

## Notes

- The native block object can be larger than the height returned by JSON-RPC.
- No wallet WebSocket or public mempool stream is available.
- Related: [`getblockbynum`](./getblockbynum.md) reads a specified height.
