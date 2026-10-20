> Live version: https://triport.io/docs/eth/json-rpc/debug_traceCall

# debug_traceCall

> Executes an `eth_call` against the state of a chosen block and returns the full EVM execution trace, without broadcasting a transaction.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceCall` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | pro — 5 RPS sustained · up to 10 burst · business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceCall` simulates a contract call exactly as
[`eth_call`](./eth_call.md) would, but instead of returning only the call's
return data it returns a structured EVM execution trace. The call is evaluated
against the state at the supplied block — nothing is broadcast and no state is
persisted. Use it to debug why a call reverts, to inspect internal call
hierarchies and gas accounting, or to preview the effect of a transaction
before sending it.

The method is part of the `debug` namespace and is available on the **pro** and
**business** tiers. Because producing a trace is more expensive than a plain
`eth_call`, the per-second limits are lower than for standard `eth_*` read
methods.

By default the method uses the built-in **struct/opcode logger**, which emits one
entry per executed opcode. For higher-level output pass a named tracer such as
`callTracer` (call hierarchy) or `prestateTracer` (pre-execution state) in the
options object.

## Parameters

The `params` array is positional: `[callObject, blockParameter, options?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `callObject` | object | yes | The transaction-call object to simulate. See fields below. |
| `blockParameter` | string | yes | Block to evaluate the call against — a hex-encoded block number (e.g. `0x10d4f`) or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. |
| `options` | object | no | Tracer configuration object. See fields below. |

### `callObject` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | yes | Address of the contract being called. |
| `from` | string | no | Sender address the call executes as. Defaults to the zero address. |
| `data` | string | no | Hex-encoded ABI call data (method selector + arguments). |
| `value` | string | no | Hex-encoded wei value to send with the call. |
| `gas` | string | no | Hex-encoded gas limit for the call. |
| `gasPrice` | string | no | Hex-encoded gas price in wei. |

### `options` fields

| Field | Type | Default | Description |
|---|---|---|---|
| `tracer` | string | struct logger | Named tracer: `callTracer`, `prestateTracer`, `4byteTracer`, or a custom JS tracer. |
| `tracerConfig` | object | — | Tracer-specific options, e.g. `{ "onlyTopCall": true }` for `callTracer`. |
| `timeout` | string | `5s` | Max trace duration, Go duration string (e.g. `10s`). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_traceCall",
    "params": [
      {
        "from": "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
        "to": "0xb5a5f22694352c15b00323844ad545abb2b11028",
        "data": "0xa9059cbb0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc40000000000000000000000000000000000000000000000000000000000000064"
      },
      "latest",
      { "tracer": "callTracer" }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "type": "CALL",
    "from": "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
    "to": "0xb5a5f22694352c15b00323844ad545abb2b11028",
    "value": "0x0",
    "gas": "0x13880",
    "gasUsed": "0x6c1c",
    "input": "0xa9059cbb0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc40000000000000000000000000000000000000000000000000000000000000064",
    "output": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "calls": []
  }
}
```

### Response fields

The shape of `result` depends on the selected tracer. The example above shows the
`callTracer` output (a single top-level call frame).

| Field | Type | Description |
|---|---|---|
| `result` | object | Trace output for the simulated call. |
| `result.type` | string | Call type: `CALL`, `DELEGATECALL`, `STATICCALL`, `CREATE`, etc. |
| `result.from` | string | Sender address of the call frame. |
| `result.to` | string | Recipient address of the call frame. |
| `result.value` | string | Wei transferred with the call frame, hex-encoded. |
| `result.gas` | string | Gas supplied to the call frame, hex-encoded. |
| `result.gasUsed` | string | Gas consumed by the call frame, hex-encoded. |
| `result.input` | string | Call data passed into the frame. |
| `result.output` | string | Return data from the frame. |
| `result.calls` | array | Nested child call frames (present with `callTracer`). |
| `result.error` | string | Present only when the frame reverted; holds the revert reason. |

With the default struct logger, `result` instead contains `gas`, `failed`,
`returnValue`, and a `structLogs` array with one entry per executed opcode.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| -32602 | Invalid params | Malformed call object, bad block parameter, unknown tracer name, or bad `tracerConfig`. |
| 403 | Tier insufficient | API key is on the Free trial; `debug` methods require pro or business. |
| 429 | Rate limited | Per-second limit for your tier exceeded; back off and retry. |
| -32000 | Server error | Block not found, the call reverted at the EVM level, or the trace exceeded the configured `timeout`. |

See [errors.md](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "debug_traceCall",
    params: [
      {
        from: "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
        to: "0xb5a5f22694352c15b00323844ad545abb2b11028",
        data: "0xa9059cbb0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc40000000000000000000000000000000000000000000000000000000000000064",
      },
      "latest",
      { tracer: "callTracer" },
    ],
  }),
});
const { result } = await res.json();
console.log(result);
```

## Notes

- Unlike [`eth_call`](./eth_call.md), this method does not return only the call's
  return data — it returns a full trace. If you only need the return value, use
  `eth_call`; it is available from the Free trial up and far cheaper.
- The struct logger (default tracer) can produce very large responses for complex
  calls. Prefer `callTracer` or `prestateTracer` unless you need opcode-level
  detail.
- To trace a call that has already been mined, use
  [`debug_traceTransaction`](./debug_traceTransaction.md). To trace every
  transaction in a block, use
  [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) or
  [`debug_traceBlockByHash`](./debug_traceBlockByHash.md).
- Tracer selection, `tracerConfig`, and `timeout` behave identically across all
  `debug_trace*` methods.
- A call that reverts is still a successful JSON-RPC response: the revert is
  reported inside the trace (`result.error` with `callTracer`, or
  `failed: true` with the struct logger), not as a top-level error.
