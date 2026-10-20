> Live version: https://triport.io/docs/ton/json-rpc/runGetMethod

# runGetMethod

> Executes a read-only smart-contract getter using TON Center v2 JSON conventions.

| | |
|---|---|
| **Method / Endpoint** | `runGetMethod` at `POST /rpc/ton` |
| **Type** | TON smart-contract state read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`runGetMethod` executes a read-only getter against a TON smart contract. The
facade accepts a raw or user-friendly address, a method name or numeric method
ID, and the legacy TON Center v2 stack representation.

The facade serializes the stack into the BoC form required by
`liteServer.runSmcMethod`, then returns the VM exit code and output stack. The
schema can also include the evaluated block, gas used, and last transaction ID.

Use this compatibility-oriented method for ordinary contract getters. Use
`runSmcMethod` when the caller must explicitly control the liteserver response
mode. Neither method submits a message or mutates contract state.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | TON contract address in raw or user-friendly form. |
| `method` | string or integer | yes | Getter name or signed 64-bit numeric method ID. |
| `stack` | array | yes | Legacy stack entries supplied as two-item pairs. |
| `seqno` | integer | no | Non-negative masterchain sequence number for a historical state read. |

### `stack` entries

Each stack entry is a two-item array such as `["num", value]`,
`["cell", {"bytes": "..."}]`, or the corresponding tuple/list form accepted
by the legacy facade. Cell and slice payloads use base64-encoded BoC data.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "runGetMethod",
    "params": {
      "address": "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
      "method": "seqno",
      "stack": []
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
| `result` | object | Smart-contract getter result. |
| `result.exit_code` | integer | VM exit code returned by the liteserver. |
| `result.stack` | array | Getter output in the legacy stack representation. |
| `result.block_id` | object | Optional block at which execution was evaluated. |
| `result.gas_used` | integer | Optional gas-used value. |
| `result.last_transaction_id` | object | Optional last transaction logical time and hash. |

The response is copied from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/runGetMethod.json).
The example's `exit_code` is preserved exactly and is not rewritten into a
success claim.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Address, method, stack, or historical sequence is missing or malformed. |
| `beyond_retention` | State unavailable | Contract state at the requested `seqno` is outside the selected server's window. |
| `-32601` | Method not found | The JSON-RPC method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const params = {
  address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  method: "seqno",
  stack: [],
};
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "getter", method: "runGetMethod", params }),
});
const { result } = await response.json();
```

## Notes

- Inspect `exit_code` and output `stack`; transport success does not determine
  getter semantics.
- Named params and response matching by `id` apply to JSON-RPC batches.
- `sendBoc` and all writes are absent. There is no REST gateway or WebSocket
  contract surface.
- Related methods: [`runSmcMethod`](./runSmcMethod.md) and
  [`getAddressInformation`](./getAddressInformation.md).
