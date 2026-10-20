> Live version: https://triport.io/docs/eth/json-rpc/trace_call

# trace_call

> Executes a transaction call against the state of a chosen block and returns the requested Parity-style traces (`trace`, `vmTrace`, `stateDiff`) without broadcasting anything.

| | |
|---|---|
| **Method / Endpoint** | `trace_call` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_trace` |
| **Tier / rate limit** | pro — 5 RPS sustained · up to 10 burst · business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`trace_call` simulates a transaction call exactly as
[`eth_call`](./eth_call.md) would, evaluating it against the state at a chosen
block, but instead of returning only the call's return data it returns the
Parity/OpenEthereum-style traces you ask for. Nothing is broadcast and no state
is persisted. Use it to inspect the internal call hierarchy of a transaction, to
preview the exact storage and balance changes a call would cause, or to capture
a low-level VM execution trace — all before sending the transaction on-chain.

You control which traces are produced with a **trace-type array**. Request any
combination of:

- `trace` — the flat list of call/create/suicide actions (the call tree).
- `vmTrace` — a full virtual-machine execution trace, opcode by opcode.
- `stateDiff` — the set of storage, balance, nonce, and code changes the call
  would apply, expressed as before/after diffs.

The method belongs to the `trace` namespace and is available on the **pro** and
**business** tiers. Because producing traces is more expensive than a plain
`eth_call`, the per-second limits are lower than for standard `eth_*` read
methods.

## Parameters

The `params` array is positional: `[callObject, traceTypes, blockParameter]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `callObject` | object | yes | The transaction-call object to simulate. See fields below. |
| `traceTypes` | array of strings | yes | Which traces to produce. Any subset of `"trace"`, `"vmTrace"`, `"stateDiff"`. |
| `blockParameter` | string | no | Block to evaluate the call against — a hex-encoded block number (e.g. `0x10d4f`) or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. Defaults to `latest`. |

### `callObject` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | yes | Address of the contract being called. |
| `from` | string | no | Sender address the call executes as. Defaults to the zero address. |
| `data` | string | no | Hex-encoded ABI call data (method selector + arguments). |
| `value` | string | no | Hex-encoded wei value to send with the call. |
| `gas` | string | no | Hex-encoded gas limit for the call. |
| `gasPrice` | string | no | Hex-encoded gas price in wei. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_call",
    "params": [
      {
        "from": "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
        "to": "0xb5a5f22694352c15b00323844ad545abb2b11028",
        "data": "0xa9059cbb0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc40000000000000000000000000000000000000000000000000000000000000064"
      },
      ["trace"],
      "latest"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "output": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "stateDiff": null,
    "trace": [
      {
        "action": {
          "callType": "call",
          "from": "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
          "to": "0xb5a5f22694352c15b00323844ad545abb2b11028",
          "value": "0x0",
          "gas": "0x13880",
          "input": "0xa9059cbb0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc40000000000000000000000000000000000000000000000000000000000000064"
        },
        "result": {
          "gasUsed": "0x6c1c",
          "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
        },
        "subtraces": 0,
        "traceAddress": [],
        "type": "call"
      }
    ],
    "vmTrace": null
  }
}
```

### Response fields

`result` is a single object containing one entry per trace type. Entries you did
not request are `null`.

| Field | Type | Description |
|---|---|---|
| `result.output` | string | Hex-encoded return data of the simulated call. |
| `result.trace` | array | Flat list of call/create/suicide actions. Present when `"trace"` was requested, else `null`. |
| `result.trace[].action` | object | The action performed (`callType`, `from`, `to`, `value`, `gas`, `input`). |
| `result.trace[].result` | object | Outcome of the action (`gasUsed`, `output`). Replaced by `error` if the action reverted. |
| `result.trace[].subtraces` | number | Number of child actions spawned by this action. |
| `result.trace[].traceAddress` | array | Path of this action within the call tree. |
| `result.trace[].type` | string | Action type: `call`, `create`, `suicide`. |
| `result.stateDiff` | object | Per-address storage/balance/nonce/code before-after diffs. Present when `"stateDiff"` was requested, else `null`. |
| `result.vmTrace` | object | Opcode-level VM execution trace. Present when `"vmTrace"` was requested, else `null`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| -32602 | Invalid params | Malformed call object, unknown trace type in `traceTypes`, or a bad block parameter. |
| 403 | Tier insufficient | API key is on the Free trial; `trace` methods require pro or business. |
| 429 | Rate limited | Per-second limit for your tier exceeded; back off and retry. |
| -32000 | Server error | Block not found, or the call could not be executed against the requested state. |

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
    method: "trace_call",
    params: [
      {
        from: "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
        to: "0xb5a5f22694352c15b00323844ad545abb2b11028",
        data: "0xa9059cbb0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc40000000000000000000000000000000000000000000000000000000000000064",
      },
      ["trace"],
      "latest",
    ],
  }),
});
const { result } = await res.json();
console.log(result.trace);
```

## Notes

- Request only the trace types you need. `vmTrace` and `stateDiff` are
  considerably more expensive to produce — and far larger — than a plain
  `["trace"]` call.
- `trace_call` is the Parity/OpenEthereum-style tracer. For the Geth-style
  struct/`callTracer` output of the same simulation, use
  [`debug_traceCall`](./debug_traceCall.md) instead.
- To trace a transaction that has already been mined, use `trace_transaction`.
  To filter historical traces across a block range, use `trace_filter`.
- Unlike [`eth_call`](./eth_call.md) (available from the Free trial up), this method returns full
  traces rather than just the return data. If you only need the return value,
  `eth_call` is cheaper.
