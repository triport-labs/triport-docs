> Live version: https://triport.io/docs/tron/wallet/gettransactioninfobyid

# gettransactioninfobyid

> Returns confirmed execution information for a native Tron transaction identifier.

| | |
|---|---|
| **Method / Endpoint** | `POST /rpc/tron/wallet/gettransactioninfobyid` |
| **Type** | Native wallet HTTP receipt read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`gettransactioninfobyid` looks up the execution information associated with a
confirmed transaction identifier. The request uses a 32-byte hexadecimal ID
without a `0x` prefix.

Use this operation for confirmed execution results, not pending detection. Tron
does not expose a public wallet mempool or pending-transaction queue. An empty
wallet object for an unknown or not-yet-confirmed identifier is not a receipt.

## Parameters

The JSON body contains one required transaction identifier.

| Name | Type | Required | Description |
|---|---|---|---|
| `value` | string | yes | Exactly 64 hexadecimal characters with no `0x` prefix. |

## Request

Set `TRON_TRANSACTION_ID` to a confirmed 64-character transaction identifier.

```bash
curl https://triport.io/rpc/tron/wallet/gettransactioninfobyid \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"value\":\"${TRON_TRANSACTION_ID}\"}"
```

## Response

```json
{}
```

The concrete response example is **unknown** because the contract has no
response example or receipt-property schema. `{}` is a schema-valid placeholder
and also represents why callers must distinguish an empty lookup from a receipt.

### Response fields

| Field | Type | Description |
|---|---|---|
| response | object | Confirmed execution information; properties are not enumerated by the contract. |

## Errors

Wallet failures use HTTP status plus JSON. See [Tron errors](../errors.md).

| HTTP | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | `value` is missing or is not 64 hexadecimal characters. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The scope or tier does not permit the request. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

A successful empty object can mean the transaction is unknown or not confirmed;
do not synthesize receipt fields from that outcome.

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron/wallet/gettransactioninfobyid", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ value: process.env.TRON_TRANSACTION_ID }),
});
const transactionInfo = await response.json();
```

## Notes

- The transaction ID has no `0x` prefix in this wallet request.
- The operation is for confirmed execution information, not pending state.
- No public wallet mempool endpoint is part of the Tron product surface.
- An empty `{}` response is explained in [why TRON gettransactioninfobyid returns {}](https://triport.io/learn/tron-transaction-info-empty).
