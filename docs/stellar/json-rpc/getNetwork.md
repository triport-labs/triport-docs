> Live version: https://triport.io/docs/stellar/json-rpc/getNetwork

# getNetwork

> Returns network config through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getNetwork` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns the configured network passphrase and current protocol version. A friendbot URL is optional and normally relevant only outside production.

Use it to verify the intended network before hashing or signing transaction data. `getVersionInfo` describes software builds instead.

This catalog is read-only: the method describes the network but cannot submit an envelope.

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
  "method": "getNetwork",
  "params": {}
}'
```

The request body is copied from `_examples/stellar/getNetwork.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "passphrase": "Public Global Stellar Network ; September 2015",
    "protocolVersion": 27
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.friendbotUrl` | string | (optional) The URL of this network's "friendbot" faucet |
| `result.passphrase` | string | Network passphrase configured for this Stellar RPC node. |
| `result.protocolVersion` | number | Stellar Core protocol version associated with the latest ledger. |

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
  "method": "getNetwork",
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

- The fixture passphrase identifies Stellar mainnet.
- No friendbot is promised on this production surface.
- Related: `getVersionInfo` and `getHealth`.
- This is a read-only surface. No write or transaction-submission method is published.
