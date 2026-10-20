> Live version: https://triport.io/docs/ton/json-rpc/getTransactions

# getTransactions

> Returns an account's transactions newest-first with paired cursor pagination.

| | |
|---|---|
| **Method / Endpoint** | `getTransactions` at `POST /rpc/ton` |
| **Type** | TON account-history read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTransactions` returns transactions for one TON account in newest-first
order. Each transaction has a required transaction ID; the schema also permits
serialized data, fee, Unix time, inbound message, and outbound messages.

Pagination uses a pair, not an independent scalar cursor. To continue, take
both `lt` and `hash` from the oldest transaction returned and send them together
in the next request. `to_lt` supplies an optional lower logical-time boundary.

The `archival` flag is a routing hint for a measured deep-history server. It is
not a promise of continuous history and does not change an unavailable old
range into an empty successful response.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | TON account in raw or user-friendly form. |
| `limit` | integer | no | Maximum number of transactions; minimum `1`, default `10`. |
| `lt` | string | no | Starting logical time encoded as unsigned decimal text. |
| `hash` | string | no | Hash paired with `lt` for continuation. |
| `to_lt` | string | no | Optional lower logical-time boundary as unsigned decimal text. |
| `archival` | boolean | no | Deep-history routing hint; default `false`. |

Always pass `lt` and `hash` together when continuing a page. Neither field is a
complete cursor by itself.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransactions",
    "params": {
      "address": "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
      "limit": 1
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "data": "te6ccgEBAQEAAgAAAA==",
      "fee": "449427",
      "transaction_id": {
        "hash": "BHL9XzxI05RysBF+XyCFWt4u1sKX6dFLsEdIxDB/CJI=",
        "lt": "100812259000021"
      },
      "utime": 1788343492
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | array | Transactions in newest-first order. |
| `result[].transaction_id` | object | Required transaction cursor pair. |
| `result[].transaction_id.lt` | string | Transaction logical time as unsigned decimal text. |
| `result[].transaction_id.hash` | string | Transaction hash. |
| `result[].data` | string | Optional serialized transaction data. |
| `result[].fee` | string | Optional fee value encoded as text. |
| `result[].utime` | integer | Optional Unix timestamp. |
| `result[].in_msg` | object | Optional inbound-message object. |
| `result[].out_msgs` | array | Optional outbound-message objects. |

The JSON is copied from the [accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getTransactions.json).
The fixture sanitizer replaces transaction BoC data, so the displayed `data`
value documents representation rather than a reusable transaction payload.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The address, limit, cursor pair, boundary, or named-object structure is invalid. |
| `beyond_retention` | History unavailable | The requested cursor falls outside the selected liteserver's history window. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const params = { address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", limit: 1 };
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "transactions", method: "getTransactions", params }),
});
const { result: transactions } = await response.json();
const next = transactions.at(-1)?.transaction_id;
```

## Notes

- Preserve both values from `transaction_id` for pagination; `lt` or `hash`
  alone is not a cursor.
- `archival: true` is best-effort routing. No REST gateway, transaction stream,
  write method, or WebSocket subscription is published for TON.
- Named params and response matching by `id` apply to batch calls.
- Related method: [`getAddressInformation`](./getAddressInformation.md).
- A transaction is identified by account, `lt` and hash; see [why a TON transaction can't be found by hash alone](https://triport.io/learn/ton-transaction-lookup-lt-hash).
