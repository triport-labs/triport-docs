> Live version: https://triport.io/docs/stellar/json-rpc/getLatestLedger

# getLatestLedger

> Returns latest known ledger through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getLatestLedger` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns the newest ledger known to the selected node, including sequence, identifier, close time, and protocol version.

Use it for a compact chain-head marker. Use `getLedgers` for retained history or `getHealth` for the oldest retained boundary.

Optional header and metadata XDR fields are described from the OpenRPC schema even when absent from the fixture.

## Parameters

JSON-RPC `params` is a by-name object. Send an empty object (`{}`); this method defines no parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No method parameters. |

## Request

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getLatestLedger",
  "params": {}
}'
```

The request body is copied from `_examples/stellar/getLatestLedger.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "id": "0000000000000000000000000000000000000000000000000000000000000000",
    "protocolVersion": 27,
    "sequence": 64234094,
    "closeTime": "1788322664"
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.closeTime` | string | The timestamp at which the latest ledger was closed. |
| `result.headerXdr` | string | The [LedgerHeader](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-ledger.x#L74) structure for this ledger (base64-encoded string). |
| `result.id` | string | Hash identifier of the latest ledger (as a hex-encoded string) known to Stellar RPC at the time it handled the request. |
| `result.metadataXdr` | string | The [LedgerCloseMeta](https://github.com/stellar/stellar-xdr/blob/v22.0/Stellar-ledger.x#L539) union for this ledger (base64-encoded string). |
| `result.protocolVersion` | number | Stellar Core protocol version associated with the latest ledger. |
| `result.sequence` | number | The sequence number of the latest ledger known to Stellar RPC at the time it handled the request. |

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
  "method": "getLatestLedger",
  "params": {}
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

- `closeTime` is a string in the schema.
- XDR fields depend on the selected node response and representation.
- Related: `getHealth` and `getLedgers`.
- This is a read-only surface. No write or transaction-submission method is published.
