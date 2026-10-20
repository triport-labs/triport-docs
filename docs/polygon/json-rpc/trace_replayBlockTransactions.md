> Live version: https://triport.io/docs/polygon/json-rpc/trace_replayBlockTransactions

# trace_replayBlockTransactions

> **Trace format.** This interface returns Parity-style call frames. Where the response includes `vmTrace` and `stateDiff`, both are `null`: opcode traces and state diffs are not supported. For `trace_callMany`, calls are independent simulations and do not share the state changes of preceding calls.

> Replays transactions in a Polygon block and returns their Parity-style call frames; state diffs and opcode traces are unavailable.

| | |
|---|---|
| **Method / Endpoint** | `trace_replayBlockTransactions` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro — 3 rps · Business — 10 rps (burst above sustained) |

## Description

This method replays the transactions of one block and groups call frames by transaction. Use it to correlate nested calls with their containing transactions. The adapter fills `trace`; it does not produce storage changes or opcode-level traces. Both `stateDiff` and `vmTrace` remain null.

Block-wide tracing can be expensive. Bound concurrency, handle execution errors per transaction and use [trace_transaction](./trace_transaction.md) when investigating only one transaction. [trace_block](./trace_block.md) exposes the block's call frames in a flat trace list. A block lookup alone does not prove that its execution state remains available for replay.

## Parameters

Positional params array, `[blockParameter, traceTypes]`:

| Name | Type | Required | Description |
|---|---|---|---|
| `blockParameter` | string | yes | Block to replay: a `0x`-prefixed hex block number (e.g. `"0x4470eb3"`) or a tag (`"latest"`, `"earliest"`). |
| `traceTypes` | array of string | yes | Use `["trace"]` for call frames. The `vmTrace` and `stateDiff` fields are unsupported and remain null. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_replayBlockTransactions",
    "params": [
      "0x4470eb3",
      ["trace"]
    ]
  }'
```

## Response

`result` is an array with one entry per transaction in the block, in execution
order. Unsupported `vmTrace` and `stateDiff` fields are always `null`.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "transactionHash": "0x2c5f8a1e3b9d4c6a7f0e2d1c8b4a6f3e9d0c1b2a3e4f5d6c7b8a9e0f1d2c3b4a",
      "output": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "vmTrace": null,
      "trace": [
        {
          "action": {
            "callType": "call",
            "from": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f1",
            "to": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            "value": "0x0",
            "gas": "0x13458",
            "input": "0xa9059cbb..."
          },
          "result": {
            "gasUsed": "0x8fc",
            "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
          },
          "subtraces": 1,
          "traceAddress": [],
          "type": "call"
        },
        {
          "action": {
            "callType": "staticcall",
            "from": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            "to": "0x0000000000000000000000000000000000001010",
            "value": "0x0",
            "gas": "0x1f4",
            "input": "0x..."
          },
          "result": {
            "gasUsed": "0x1a4",
            "output": "0x..."
          },
          "subtraces": 0,
          "traceAddress": [
            0
          ],
          "type": "call"
        }
      ],
      "stateDiff": null
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array | One entry per transaction in the block, in execution order. |
| `result[].transactionHash` | string | Hash of the transaction this entry replays. |
| `result[].output` | string | Hex return data of the top-level transaction call. |
| `result[].trace` | array \| null | Flat list of Parity call frames (present when `"trace"` was requested). Each frame has `action`, `result`, `subtraces`, `traceAddress`, and `type`. |
| `result[].trace[].action` | object | The call/create that this frame performed (`callType`/`from`/`to`/`value`/`gas`/`input`, or creation fields). |
| `result[].trace[].result` | object | Outcome of the frame: `gasUsed` and `output` (or an `error` string if it reverted). |
| `result[].trace[].traceAddress` | array | Path of child-call indices locating this frame in the call tree (`[]` is the top-level call). |
| `result[].trace[].subtraces` | number | Count of direct child frames. |
| `result[].stateDiff` | null | Unsupported by this interface; always null, including when requested. |
| `result[].vmTrace` | null | Unsupported by this interface; always null, including when requested. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your key is below Pro tier (or lacks the `polygon_trace` scope). The error `data` includes `current_tier`, `required_tier`, and an `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's RPS for `polygon_trace` (Pro 3 / Business 10), including burst. The `data` carries `limit_rps`, `burst_capacity`, and `retry_after_sec` — back off and retry. |
| `401` | `unauthorized` | Missing or invalid `Authorization` header. |
| HTTP `403` | `method_unknown` | Method not enabled for this key/chain. |
| `-32602` | invalid params | Bad block parameter, or a `traceTypes` value other than `"trace"` / `"vmTrace"` / `"stateDiff"`. |

Authentication, tier and rate-limit failures use HTTP status codes with top-level error fields. Execution failures use JSON-RPC errors. See the [shared error reference](../../errors.md).

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "trace_replayBlockTransactions",
    params: ["0x4470eb3", ["trace"]],
  }),
});

const { result } = await res.json();
console.log(result.length, "transactions replayed");
```

## Notes

- Retain transaction hashes and trace addresses when indexing nested calls. They identify a frame within a transaction.
- Null state-diff fields mean unsupported output, not proof that no state changed.
- Reconcile recent block results by block hash after a reorganization.
- Polygon `trace_filter` is unavailable; do not use it as a range-query fallback.
- See [trace_block](./trace_block.md), [trace_transaction](./trace_transaction.md) and [debug_traceBlockByNumber](./debug_traceBlockByNumber.md) for related interfaces.
