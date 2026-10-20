> Live version: https://triport.io/docs/stellar/json-rpc/getTransactions

# getTransactions

> Returns a list of transactions with their details through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getTransactions` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns a cursor-paginated list of retained transactions, including status and XDR envelope/result data when records are present.

Use it for transaction-level ingestion. Use `getEvents` when only emitted contract events are needed, or Horizon for HAL resources.

Both measured Soroban nodes retained 120,960 ledgers. The page limit is 200.

## Parameters

JSON-RPC `params` is a by-name object. Only the fields below are defined by the OpenRPC catalog.

| Name | Type | Required | Description |
|---|---|---|---|
| `startLedger` | number | no | Ledger sequence number to start fetching responses from (inclusive). This method will return an error if `startLedger` is less than the oldest ledger stored in this node, or greater than the latest ledger seen by this node. If a cursor is included in the request, `startLedger` must be omitted. |
| `pagination` | object | no | Pagination in stellar-rpc is similar to pagination in Horizon. See [Pagination](https://developers.stellar.org/docs/data/rpc/api-reference/structure/pagination). |
| `xdrFormat` | string | no | Lets the user choose the format in which the response should be returned - either as unpacked JSON or as base64-encoded XDR strings. Note that you should not rely on any schema for the JSON, as it will change when the underlying XDR changes. |

### Parameter sub-fields

| Field | Type | Description |
|---|---|---|
| `pagination.cursor` | string | An opaque string which acts as a paging token. To obtain the next page of results occurring after a given response set this value to the `cursor` field of the response. |
| `pagination.limit` | number | The maximum number of records returned. The limit for getTransactions can range from 1 to 200 - an upper limit that is hardcoded in Stellar-RPC for performance reasons. If this argument isn't designated, it defaults to 50. |

## Request

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTransactions",
  "params": {
    "startLedger": 64234000,
    "pagination": {
      "limit": 2
    }
  }
}'
```

The request body is copied from the [accepted fixture](https://triport.io/api-specs/json-rpc/_examples/stellar/getTransactions.json).
It is read-only. Pick `startLedger` inside the window the node reports in
[`getHealth`](./getHealth.md) (`oldestLedger` … `latestLedger`); the value above sits
inside the window shown in the response below.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "transactions": [],
    "latestLedger": 64234094,
    "oldestLedger": 64113135,
    "cursor": "0275883182695419925-0000000003"
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.cursor` | string | A token which can be included in a subsequent request to obtain the next page of results. |
| `result.latestLedger` | number | The sequence number of the latest ledger known to Stellar RPC at the time it handled the request. |
| `result.latestLedgerCloseTimestamp` | number | The unix timestamp of the close time of the latest ledger known to Stellar RPC at the time it handled the request. |
| `result.oldestLedger` | number | The sequence number of the oldest ledger ingested by Stellar RPC at the time it handled the request. |
| `result.oldestLedgerCloseTimestamp` | number | The unix timestamp of the close time of the oldest ledger ingested by Stellar RPC at the time it handled the request. |
| `result.transactions` | array of object | Defined by the OpenRPC schema. |
| `result.transactions[].applicationOrder` | number | The 1-based index of the transaction among all transactions included in the ledger. |
| `result.transactions[].createdAt` | number | The unix timestamp of when the transaction was included in the ledger. |
| `result.transactions[].diagnosticEventsXdr` | array of string | (optional) A base64 encoded slice of xdr.DiagnosticEvent. This is only present if the `ENABLE_SOROBAN_DIAGNOSTIC_EVENTS` has been enabled on the RPC server. |
| `result.transactions[].envelopeXdr` | string | The [TransactionEnvelope](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-transaction.x#L1009) structure for this transaction (base64-encoded string). |
| `result.transactions[].events` | object | Contains all events emitted during transaction execution. _Note: Available only on RPC v23.x (currently testnet only)._ |
| `result.transactions[].events.contractEventsXdr` | array of array of string | A nested array of base64-encoded [xdr.ContractEvent](https://github.com/stellar/stellar-xdr/blob/v23.0/Stellar-ledger.x#L371-L390). Each inner array represents the contract events emitted by a single operation within the transaction. |
| `result.transactions[].events.transactionEventsXdr` | array of string | An array of base64-encoded [xdr.TransactionEvent](https://github.com/stellar/stellar-xdr/blob/v23.0/Stellar-ledger.x#L503-L506). These include events such as fees being charged or refunded. |
| `result.transactions[].feeBump` | boolean | Indicates whether the transaction was fee bumped. |
| `result.transactions[].ledger` | number | The sequence number of the ledger which included the transaction. |
| `result.transactions[].resultMetaXdr` | string | The TransactionResultMeta structure for this transaction (base64-encoded string). |
| `result.transactions[].resultXdr` | string | The [TransactionResult](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-transaction.x#L2088) structure for this transaction (base64-encoded string). |
| `result.transactions[].status` | string | Indicates whether the transaction was successful or not. |
| `result.transactions[].txHash` | string | The hex-encoded hash of the transaction. |

## Errors

Errors use the standard JSON-RPC envelope. See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `pagination.limit` exceeds 200; positional-array style params are rejected. A start ledger below the node window returns `beyond_retention` and `oldest N`. |
| `-32601` | Method not found | The method is absent from the published Stellar OpenRPC catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `stellar_read_rpc_heavy` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const request = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getTransactions",
  "params": {
    "startLedger": 64234000,
    "pagination": {
      "limit": 2
    }
  }
};
const response = await fetch("https://triport.io/rpc/stellar", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(request),
});
const payload = await response.json();
if (!response.ok || payload.error) throw new Error(JSON.stringify(payload.error));
console.log(payload.result);
```

## Notes

- The measured retention is 120,960 ledgers.
- `pagination.limit` is at most 200; XDR remains string encoded.
- Related: `getEvents`, `getLedgers`, and Horizon transactions.
- This is a read-only surface. No write or transaction-submission method is published.
