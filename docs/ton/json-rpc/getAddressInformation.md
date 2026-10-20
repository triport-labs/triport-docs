> Live version: https://triport.io/docs/ton/json-rpc/getAddressInformation

# getAddressInformation

> Returns an account's balance, state, code, data, and last-transaction reference.

| | |
|---|---|
| **Method / Endpoint** | `getAddressInformation` at `POST /rpc/ton` |
| **Type** | TON account-state read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getAddressInformation` reads the state of one TON account. It returns the
balance as a decimal string, the account state, the last transaction ID, and,
when present, the account code, data, and block reference.

Use this method when an application needs the full account-state summary. A
raw `workchain:hex` address and a user-friendly base64url address are both
accepted. To read transactions instead of current state, use
`getTransactions`; to execute a contract getter, use `runGetMethod`.

The optional `seqno` asks for state at a masterchain block. That makes the
request retention-sensitive: the selected liteserver must have state for that
point, and a successful genesis block lookup does not by itself prove
continuous historical state.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | TON account in raw `workchain:hex` or user-friendly base64url form. |
| `seqno` | integer | no | Non-negative masterchain sequence number at which to read state. |

Positional parameter arrays are not accepted on the TON surface.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getAddressInformation",
    "params": {
      "address": "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "balance": "1070960018987",
    "block_id": {
      "file_hash": "fg/ifwcqGbSY5FWQtBYSBmjzbr5MunvIyIQWNBIC1Ds=",
      "root_hash": "HdnpiyOhIr4b0D//bCcUmO86xqAlq/sRHOJZ2IyZ0LU=",
      "seqno": 90094847,
      "shard": "-9223372036854775808",
      "workchain": -1
    },
    "last_transaction_id": {
      "hash": "yTbbsEEvpcRE7GQPtpBV0BRe2q48fs9oM7eDsI6QXXk=",
      "lt": "100805585000013"
    },
    "state": "active"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Account-state result. |
| `result.balance` | string | Account balance encoded as unsigned decimal text in TON's smallest unit. |
| `result.state` | string | `uninitialized`, `active`, or `frozen`. |
| `result.last_transaction_id` | object | Last transaction's logical time and hash. |
| `result.last_transaction_id.lt` | string | Unsigned logical time as decimal text. |
| `result.last_transaction_id.hash` | string | Transaction hash. |
| `result.block_id` | object | Block used for the state read when returned. |
| `result.code` | string | Optional serialized account code. |
| `result.data` | string | Optional serialized account data. |

The JSON is copied from the [accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getAddressInformation.json).
Its sanitizer provenance lists account code and data among redacted fields, so
their absence here must not be interpreted as a promise that they are always
absent from live responses.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `address` is missing or malformed, `seqno` is invalid, or `params` is positional. |
| `beyond_retention` | State unavailable | The requested `seqno` is below the selected liteserver's state window. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "account-state",
    method: "getAddressInformation",
    params: { address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs" },
  }),
});
const { result } = await response.json();
```

## Notes

- Named parameters are required. In a JSON-RPC batch, match each response by
  `id`; response order is not guaranteed.
- Triport does not use public HTTP gateways as upstreams and does not publish
  TON write methods or WebSocket subscriptions.
- Related methods: [`getTransactions`](./getTransactions.md),
  [`runGetMethod`](./runGetMethod.md), and
  [`getMasterchainInfo`](./getMasterchainInfo.md).
- Address formats: the same account can appear as raw `0:…`, bounceable `EQ…` or non-bounceable `UQ…` — see
  [one TON address, several formats](https://triport.io/learn/ton-address-formats).
- Funds returned with the `bounced` flag are explained in
  [why TON funds came back: bounced messages](https://triport.io/learn/ton-bounced-message).
