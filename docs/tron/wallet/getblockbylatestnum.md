> Live version: https://triport.io/docs/tron/wallet/getblockbylatestnum

# getblockbylatestnum

> Returns a requested count of the latest native Tron blocks.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/getblockbylatestnum` |
| **Type** | Native wallet HTTP block read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getblockbylatestnum` returns the requested count of recent blocks in the
native wallet representation. It is useful for polling a short confirmed range
without issuing one request per block.

The `num` field is a positive decimal count, not a block height and not an EVM
hex quantity. This reads included blocks; Tron does not expose a public pending
transaction queue or mempool through the wallet surface.

## Parameters

The JSON body contains one required field.

| Name | Type | Required | Description |
|---|---|---|---|
| `num` | integer | yes | Positive decimal count of latest blocks to return. |

## Request

```bash
curl https://triport.io/rpc/tron/wallet/getblockbylatestnum \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"num":3}'
```

## Response

```json
{}
```

The concrete response example is **unknown**: the OpenAPI operation supplies a
request example but no response example. The response schema guarantees only an
extensible JSON object, represented above by a schema-valid placeholder.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Operation-dependent wallet result; field names are not specified in the contract. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | `num` is missing, not an integer, or less than one. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/getblockbylatestnum", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ num: 3 }),
});
const recentBlocks = await response.json();
```

## Notes

- This endpoint returns recent included blocks, not pending transactions.
- No wallet WebSocket or mempool API is published for Tron.
- Related: [`getnowblock`](./getnowblock.md) returns one current solid block.
