> Live version: https://triport.io/docs/tron/wallet/getnodeinfo

# getnodeinfo

> Returns the public status exposed by the selected Tron wallet node.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getnodeinfo` |
| **Type** | Native wallet HTTP node read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getnodeinfo` returns the node-status object made public by the selected native
wallet upstream. Use it for operational diagnostics when a wallet-layer view is
more useful than an EVM client version string.

Peer identifiers are not part of the measured response surface. The response
must not be interpreted as a peer graph, a mempool view, or a replacement for
gateway health and chain-freshness checks.

## Parameters

The request body is a required empty JSON object.

| Name | Type | Required | Description |
|---|---|---|---|
| body | object | yes | Must be `{}`; the contract permits no additional request fields. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getnodeinfo \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response

```json
{}
```

The concrete response example is **unknown**: the contract publishes no example
and models the result only as an extensible object. `{}` is a schema-valid
placeholder, not a captured node-status response.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Public node information; individual fields are not guaranteed by the schema. |

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
const response = await fetch("https://triport.io/rpc/tron/wallet/getnodeinfo", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: "{}",
});
const nodeInfo = await response.json();
```

## Notes

- Node-specific output can vary after routing selects another eligible node.
- No peer graph, WebSocket, or public mempool is promised by this endpoint.
- Related: [`web3_clientVersion`](../json-rpc/web3_clientVersion.md).
