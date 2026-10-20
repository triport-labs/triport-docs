> Live version: https://triport.io/docs/stellar/json-rpc/getLedgerEntries

# getLedgerEntries

> Returns ledger entries through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getLedgerEntries` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Reads current ledger state for base64-encoded XDR ledger keys, including accounts, trustlines, offers, data, claimable balances, liquidity pools, and contract entries.

Use it for the current value of a known key. Use `getEvents` for retained activity or `simulateTransaction` for a prospective invocation.

At most 200 keys are accepted. Missing keys are not fabricated in `entries`; correlate results by `key`.

## Parameters

JSON-RPC `params` is a by-name object. Only the fields below are defined by the OpenRPC catalog.

| Name | Type | Required | Description |
|---|---|---|---|
| `keys` | array of string | yes | Array containing the keys of the ledger entries you wish to retrieve. (an array of serialized base64 strings) |
| `xdrFormat` | string | no | Lets the user choose the format in which the response should be returned - either as unpacked JSON or as base64-encoded XDR strings. Note that you should not rely on any schema for the JSON, as it will change when the underlying XDR changes. |

## Request

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getLedgerEntries",
  "params": {
    "keys": [
      "AAAAAAAAAAA7mRE4Dv6Yi6CokA6xz+RPNm99vpRr7QdyQPf2JN8VxQ=="
    ]
  }
}'
```

The request body is copied from `_examples/stellar/getLedgerEntries.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "entries": [
      {
        "key": "AAAAAAAAAAA7mRE4Dv6Yi6CokA6xz+RPNm99vpRr7QdyQPf2JN8VxQ==",
        "xdr": "<base64 LedgerEntryData XDR>"
      }
    ],
    "latestLedger": 64234094
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.entries` | array of object | Array of objects containing all found ledger entries |
| `result.entries[].key` | string | The [LedgerKey](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-ledger-entries.x#L600) corresponding to the ledger entry (base64 string). |
| `result.entries[].lastModifiedLedgerSeq` | number | The ledger sequence number of the last time this entry was updated. |
| `result.entries[].liveUntilLedgerSeq` | number | The ledger sequence number of the ledger that the entry will be live until. May be zero if the entry is no longer live. |
| `result.entries[].xdr` | string | The key's current [LedgerEntryData](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-ledger-entries.x#L564) value (base64 string). |
| `result.latestLedger` | number | The sequence number of the latest ledger known to Stellar RPC at the time it handled the request. |

## Errors

Errors use the standard JSON-RPC envelope. See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | the by-name object or a field has the wrong type; positional-array style params are rejected. |
| `-32601` | Method not found | The method is absent from the published Stellar OpenRPC catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `stellar_read_rpc` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const request = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getLedgerEntries",
  "params": {
    "keys": [
      "AAAAAAAAAAA7mRE4Dv6Yi6CokA6xz+RPNm99vpRr7QdyQPf2JN8VxQ=="
    ]
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

- At most 200 ledger keys are accepted.
- JSON XDR representation can change when underlying XDR changes.
- Related: `getEvents` and `simulateTransaction`.
- This is a read-only surface. No write or transaction-submission method is published.
