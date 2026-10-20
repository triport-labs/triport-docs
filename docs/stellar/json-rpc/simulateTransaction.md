> Live version: https://triport.io/docs/stellar/json-rpc/simulateTransaction

# simulateTransaction

> Submits a trial contract invocation transaction through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `simulateTransaction` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Evaluates a base64-encoded transaction envelope without submitting it and can calculate transaction data, authorizations, resource fees, events, state changes, and restore data.

Use it before a Soroban invocation or for a read-only contract call. The result is advisory input to a separate submission workflow.

`sendTransaction` is unavailable on this API. Optional result fields may be absent, and `result.error` is an execution outcome rather than a transport error.

## Parameters

JSON-RPC `params` is a by-name object. Only the fields below are defined by the OpenRPC catalog.

| Name | Type | Required | Description |
|---|---|---|---|
| `transaction` | string | yes | In order for the RPC server to successfully simulate a Stellar transaction, the provided transaction must contain only a single operation of the type `invokeHostFunction`. |
| `resourceConfig` | object | no | Contains configuration for how resources will be calculated when simulating transactions. |
| `xdrFormat` | string | no | Lets the user choose the format in which the response should be returned - either as unpacked JSON or as base64-encoded XDR strings. Note that you should not rely on any schema for the JSON, as it will change when the underlying XDR changes. |
| `authMode` | string | no | Specifies the authorization mode to use when simulating the transaction. The options are 'enforce' (default, enforces all authorization checks), 'record' (records authorization without enforcement), and 'record_allow_nonroot' (records authorization while allowing non-root invocations). |

### Parameter sub-fields

| Field | Type | Description |
|---|---|---|
| `resourceConfig.instructionLeeway` | number | Allow this many extra instructions when budgeting resources. |

## Request

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "simulateTransaction",
  "params": {
    "transaction": "<base64 transaction envelope XDR>"
  }
}'
```

The request body is copied from `_examples/stellar/simulateTransaction.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "latestLedger": 64234094,
    "minResourceFee": "100",
    "results": []
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.error` | string | (optional) - This field will include details about why the invoke host function call failed. Only present if the transaction simulation failed. |
| `result.events` | array of string | (optional) Array of serialized base64 strings - Array of the events emitted during the contract invocation. The events are ordered by their emission time. (an array of serialized base64 strings). Only present when simulating of `InvokeHostFunction` operations, note that it can be present on error, providing extra context about what failed. |
| `result.latestLedger` | number | The sequence number of the latest ledger known to Stellar RPC at the time it handled the request. |
| `result.minResourceFee` | string | (optional) Stringified number - Recommended minimum resource fee to add when submitting the transaction. This fee is to be added on top of the [Stellar network fee](https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee). Not present in case of error. |
| `result.restorePreamble` | object | (optional) - It can only be present on successful simulation (i.e. no error) of `InvokeHostFunction` operations. If present, it indicates that the simulation detected archived ledger entries which need to be restored before the submission of the `InvokeHostFunction` operation. The `minResourceFee` and `transactionData` fields should be used to submit a transaction containing a `RestoreFootprint` operation. |
| `result.restorePreamble.minResourceFee` | string | Stringified number - Recommended minimum resource fee to add when submitting the `RestoreFootprint` operation. This fee is to be added on top of the [Stellar network fee](https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee). |
| `result.restorePreamble.transactionData` | string | Serialized base64 string - The recommended Soroban Transaction Data to use when submitting the `RestoreFootprint` operation. |
| `result.results` | array of object | (optional) - This array will only have one element: the result for the Host Function invocation. Only present on successful simulation (i.e. no error) of `InvokeHostFunction` operations. |
| `result.results[].auth` | array of string | Array of serialized base64 strings - Per-address authorizations recorded when simulating this Host Function call. |
| `result.results[].xdr` | string | Serialized base64 string - return value of the Host Function call. |
| `result.stateChanges` | array of object | (optional) - On successful simulation of `InvokeHostFunction` operations, this field will be an array of `LedgerEntry`s before and after simulation occurred. Note that _at least_ one of `before` or `after` will be present: `before` and no `after` indicates a deletion event, the inverse is a creation event, and both present indicates an update event. Or just check the `type`. |
| `result.stateChanges[].after` | string or null | Base64, if present - `LedgerEntry` state after simulation |
| `result.stateChanges[].before` | string or null | Base64, if present - `LedgerEntry` state prior to simulation |
| `result.stateChanges[].key` | string | Base64 - the `LedgerKey` for this delta |
| `result.stateChanges[].type` | string | Indicates if the entry was created, updated, or deleted |
| `result.transactionData` | string | (optional) Serialized base64 string - The recommended Soroban Transaction Data to use when submitting the simulated transaction. This data contains the refundable fee and resource usage information such as the ledger footprint and IO access data (serialized in a base64 string). Not present in case of error. |

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
  "method": "simulateTransaction",
  "params": {
    "transaction": "<base64 transaction envelope XDR>"
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

- Simulation does not guarantee a later submission result.
- Fee-like values are string encoded.
- Related: `getLedgerEntries` and `getEvents`; transaction submission is unavailable.
- This is a read-only surface. No write or transaction-submission method is published.
