> Live version: https://triport.io/docs/stellar/json-rpc/getEvents

# getEvents

> Returns contract events through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getEvents` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns contract and system events matching a ledger range and optional contract, topic, or type filters.

Use it for event ingestion and deduplicate retries by event `id`. Use `getTransactions` when envelopes and execution results are required.

Both measured Soroban nodes retained 120,960 ledgers. Check `getHealth` before choosing a historical start.

## Parameters

JSON-RPC `params` is a by-name object. Only the fields below are defined by the OpenRPC catalog.

| Name | Type | Required | Description |
|---|---|---|---|
| `startLedger` | number | no | Ledger sequence number to start fetching responses from (inclusive). This method will return an error if `startLedger` is less than the oldest ledger stored in this node, or greater than the latest ledger seen by this node. If a cursor is included in the request, `startLedger` must be omitted. |
| `endLedger` | number | no | Ledger sequence number represents the end of search window (exclusive). If a cursor is included in the request, `endLedger` must be omitted. |
| `filters` | array of object | no | List of filters for the returned events. Events matching any of the filters are included. To match a filter, an event must match both a contractId and a topic. Maximum 5 filters are allowed per request. |
| `pagination` | object | no | Pagination in stellar-rpc is similar to pagination in Horizon. See [Pagination](https://developers.stellar.org/docs/data/rpc/api-reference/structure/pagination). |
| `xdrFormat` | string | no | Lets the user choose the format in which the response should be returned - either as unpacked JSON or as base64-encoded XDR strings. Note that you should not rely on any schema for the JSON, as it will change when the underlying XDR changes. |

### Parameter sub-fields

| Field | Type | Description |
|---|---|---|
| `filters[].contractIds` | array of string | List of contract IDs to query for events. If omitted, return events for all contracts. Maximum 5 contract IDs are allowed per request. |
| `filters[].topics` | array of array of string | A list of topic filters. Each filter is itself an array of one to four `SegmentMatcher` elements (see below). If omitted, query for all events. If multiple filters are specified, events will be included if they match any of the filters. |
| `filters[].type` | string | Filter events by type. If omitted, all event types are included. |
| `pagination.cursor` | string | An opaque string which acts as a paging token. To obtain the next page of results occurring after a given response set this value to the `cursor` field of the response. |
| `pagination.limit` | number | The maximum number of records returned. The limit for getEvents can range from 1 to 10000 - an upper limit that is hardcoded in Stellar-RPC for performance reasons. If this argument isn't designated, it defaults to 100. |

## Request

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getEvents",
  "params": {
    "startLedger": 64234000,
    "filters": [
      {
        "type": "contract"
      }
    ],
    "pagination": {
      "limit": 5
    }
  }
}'
```

The request body is copied from the [accepted fixture](https://triport.io/api-specs/json-rpc/_examples/stellar/getEvents.json).
It is read-only. Pick `startLedger` inside the window the node reports in
[`getHealth`](./getHealth.md) (`oldestLedger` … `latestLedger`); the value above sits
inside the window shown in the response below.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "latestLedger": 64234094,
    "oldestLedger": 64113135,
    "events": [],
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
| `result.events` | array of object | Defined by the OpenRPC schema. |
| `result.events[].contractId` | string | StrKey representation of the contract address that emitted this event. |
| `result.events[].id` | string | Unique identifier for this event, based on the [TOID](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0035.md#specification) format. It combines a 19-character TOID and a 10-character, zero-padded event index, separated by a hyphen. - For example: `0000000000000123456-0000000001` |
| `result.events[].inSuccessfulContractCall` | boolean | If true the event was emitted during a successful contract call. |
| `result.events[].ledger` | number | Sequence number of the ledger in which this event was emitted. |
| `result.events[].ledgerClosedAt` | string | [ISO-8601](https://www.iso.org/iso-8601-date-and-time-format.html) timestamp of the ledger closing time |
| `result.events[].operationIndex` | number | The index of the operation within the transaction this event occurred in. |
| `result.events[].topic` | array of string | The [ScVal](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-contract.x#L214)s containing the topics this event was emitted with (as a base64 string). |
| `result.events[].transactionIndex` | number | The index of the transaction within the ledger this event occurred in. |
| `result.events[].txHash` | string | The transaction which triggered this event. |
| `result.events[].type` | string | The type of event emission. |
| `result.events[].value` | string | The data emitted by the event (an [ScVal](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-contract.x#L214), serialized as a base64 string). |
| `result.latestLedger` | number | The sequence number of the latest ledger known to Stellar RPC at the time it handled the request. |
| `result.latestLedgerCloseTime` | string | The unix timestamp (as a string) of the close time of the latest ledger known to Stellar RPC when it handled the request. |
| `result.oldestLedger` | number | The sequence number of the oldest ledger ingested by Stellar RPC at the time it handled the request. |
| `result.oldestLedgerCloseTime` | string | The unix timestamp (as a string) of the close time of the oldest ledger kept in history by Stellar RPC when it handled the request. |

## Errors

Errors use the standard JSON-RPC envelope. See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `pagination.limit` exceeds 10,000; positional-array style params are rejected. A start ledger below the node window returns `beyond_retention` and `oldest N`. |
| `-32601` | Method not found | The method is absent from the published Stellar OpenRPC catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `stellar_read_rpc_heavy` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const request = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getEvents",
  "params": {
    "startLedger": 64234000,
    "filters": [
      {
        "type": "contract"
      }
    ],
    "pagination": {
      "limit": 5
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

- Maximum five filters and five contract IDs per filter.
- `pagination.limit` accepts 1 through 10,000; 10,001 was rejected in measurement.
- Related: `getHealth`, `getTransactions`, and `getLedgers`.
- This is a read-only surface. No write or transaction-submission method is published.
- An empty `events` list usually means the filters matched nothing; see [why Stellar RPC getEvents returns no events](https://triport.io/learn/soroban-getevents-empty).
