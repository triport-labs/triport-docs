> Live version: https://triport.io/docs/stellar/json-rpc/getVersionInfo

# getVersionInfo

> Returns version information of RPC and Captive Core through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getVersionInfo` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns build and version metadata for Stellar RPC and its Captive Core, together with the protocol version.

Use it for diagnostics and compatibility checks. Use `getNetwork` for the passphrase or `getHealth` for readiness and retention.

Values can change when the selected node rotates or is upgraded; no SLA is attached to a particular upstream build.

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
  "method": "getVersionInfo",
  "params": {}
}'
```

The request body is copied from `_examples/stellar/getVersionInfo.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "version": "27.x",
    "captiveCoreVersion": "stellar-core 27.x",
    "protocolVersion": 27
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.buildTimestamp` | string | The build timestamp of the RPC server. |
| `result.captiveCoreVersion` | string | The version of the Captive Core. |
| `result.commitHash` | string | The commit hash of the RPC server. |
| `result.protocolVersion` | integer | The protocol version. |
| `result.version` | string | The version of the RPC server. |

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
  "method": "getVersionInfo",
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

- Version strings are node-specific.
- The fixture uses illustrative `27.x` strings while preserving schema fields.
- Related: `getNetwork` and `getHealth`.
- This is a read-only surface. No write or transaction-submission method is published.
