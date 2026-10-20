> Live version: https://triport.io/docs/stellar/json-rpc/getHealth

# getHealth

> Returns node health through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getHealth` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Reports node health plus its newest ledger, oldest retained ledger, and configured retention window.

Use it for readiness checks and to choose a valid starting ledger for history methods. `getLatestLedger` instead focuses on ledger header data.

Both measured Soroban nodes reported a 120,960-ledger window; boundaries remain properties of the selected node.

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
  "method": "getHealth",
  "params": {}
}'
```

The request body is copied from `_examples/stellar/getHealth.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "healthy",
    "latestLedger": 64234094,
    "oldestLedger": 64113135,
    "ledgerRetentionWindow": 120960
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.latestLedger` | number | Most recent known ledger sequence |
| `result.latestLedgerCloseTime` | string | The unix timestamp (as a string) of the close time of the most recent known ledger |
| `result.ledgerRetentionWindow` | number | Maximum retention window configured. A full window state can be determined via: ledgerRetentionWindow = latestLedger - oldestLedger + 1 |
| `result.oldestLedger` | number | Oldest ledger sequence kept in history |
| `result.oldestLedgerCloseTime` | string | The unix timestamp (as a string) of the close time of the oldest ledger kept in history |
| `result.status` | string | "healthy" |

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
  "method": "getHealth",
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

- The inclusive window is `latestLedger - oldestLedger + 1`.
- Healthy does not imply archive access beyond `oldestLedger`.
- Related: `getLatestLedger`, `getEvents`, and `getTransactions`.
- This is a read-only surface. No write or transaction-submission method is published.
