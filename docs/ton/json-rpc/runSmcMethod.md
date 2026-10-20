> Live version: https://triport.io/docs/ton/json-rpc/runSmcMethod

# runSmcMethod

> Executes a read-only liteserver smart-contract method with an explicit mode.

| | |
|---|---|
| **Method / Endpoint** | `runSmcMethod` at `POST /rpc/ton` |
| **Type** | TON smart-contract state read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`runSmcMethod` exposes `liteServer.runSmcMethod` with an optional response-field
mode. Address, method, stack, and historical sequence retain the TON Center v2
JSON conventions and are converted into TL and BoC values by the facade.

The result requires a VM `exit_code` and output `stack`. Depending on the
selected response mode and liteserver response, it can also include the block
ID, gas used, and last transaction ID.

Use this method when explicit mode control is necessary. For the ordinary
compatibility path without an exposed mode bitmask, use `runGetMethod`. Both
methods are read-only; no message is sent to the chain.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | TON contract address in raw or user-friendly form. |
| `method` | string or integer | yes | Getter name or signed 64-bit numeric method ID. |
| `stack` | array | yes | Legacy stack entries represented as two-item pairs. |
| `seqno` | integer | no | Non-negative masterchain sequence for historical state. |
| `mode` | integer | no | Non-negative response-field mode; default `4`. |

### `stack` entries

Each item is a two-element legacy pair. Numeric entries carry their value next
to `"num"`; cell and slice entries carry base64 BoC bytes; tuple and list forms
are also accepted by the legacy stack schema.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "runSmcMethod",
    "params": {
      "address": "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
      "method": "seqno",
      "stack": [],
      "mode": 4
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "block_id": {
      "file_hash": "+DeG/GYcRlYkY9wtKpiT9CW7sAPt6c6Ios3wvjwChLA=",
      "root_hash": "dq8stoamKy1Wx5Hu9Mw02WpPAHJUEDYvRVyNbMk6aMs=",
      "seqno": 90110438,
      "shard": "-9223372036854775808",
      "workchain": -1
    },
    "exit_code": 11,
    "stack": []
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Smart-contract execution result. |
| `result.exit_code` | integer | VM exit code returned by the liteserver. |
| `result.stack` | array | Method output in legacy stack representation. |
| `result.block_id` | object | Optional block used for execution. |
| `result.gas_used` | integer | Optional gas-used value. |
| `result.last_transaction_id` | object | Optional last transaction logical time and hash. |

The response is copied from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/runSmcMethod.json).
The captured `exit_code` is shown as observed rather than interpreted.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Address, method, stack, sequence, or mode is missing or malformed. |
| `beyond_retention` | State unavailable | The requested historical contract state is outside the selected server's window. |
| `-32601` | Method not found | The JSON-RPC method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const params = {
  address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  method: "seqno",
  stack: [],
  mode: 4,
};
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "smc", method: "runSmcMethod", params }),
});
const { result } = await response.json();
```

## Notes

- `mode` controls liteserver response fields; it does not authorize a write.
- Named params and batch correlation by `id` are required.
- `sendBoc`, all other writes, REST gateways, and WebSocket subscriptions are
  unavailable for TON.
- Related method: [`runGetMethod`](./runGetMethod.md).
