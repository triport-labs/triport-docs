> Live version: https://triport.io/docs/eth/json-rpc/debug_traceTransaction

# debug_traceTransaction

> Replays a single already-mined transaction and returns its full EVM execution trace.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceTransaction` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | Pro — 5 RPS sustained · up to 10 burst · Business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceTransaction` re-executes a transaction that has already been included
in a block and records every step of its EVM execution. It is the canonical way
to understand *why* a transaction behaved the way it did — which opcodes ran,
how gas was consumed, what state was touched, where it reverted, and the revert
reason.

By default the method returns a **struct (opcode) log**: a step-by-step list of
every executed opcode with its program counter, gas, stack, memory, and storage
deltas. Because these logs can be very large for complex transactions, you will
usually pass a `tracer` in the options object instead — for example
`callTracer` to get a compact tree of internal calls, or `prestateTracer` to get
the accounts and storage the transaction read. See
[Tracer options](./debug_traceTransaction.md#tracer-options) below.

This is a `debug`-namespace method available on the **Pro** tier and above. It
is rate limited per tier (5 RPS on Pro, 15 RPS on Business) with a short burst
allowance; there is no daily quota. Tracing is computationally heavy — keep the
opcode-level default reserved for the transactions you genuinely need to inspect,
and prefer a focused `tracer` where possible.

## Parameters

Two positional parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| `txHash` | string | yes | The `0x`-prefixed 32-byte hash of the transaction to trace. The transaction must already be mined into a block. |
| `options` | object | no | Tracing options. Selects the tracer and tunes what the struct logger captures. See [Tracer options](./debug_traceTransaction.md#tracer-options). Omit it to get the default opcode-level struct log. |

### Tracer options

The optional second parameter is an object with the following fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `tracer` | string | *(struct logger)* | Name of a built-in tracer: `callTracer` (call tree), `prestateTracer` (touched accounts/storage), `4byteTracer` (function-selector counts), or `opcodeTracer`. If omitted, the default opcode-level struct logger is used. |
| `tracerConfig` | object | — | Per-tracer settings. For `callTracer`, `{ "onlyTopCall": true }` limits output to the top-level call (no internal calls); `{ "withLog": true }` includes emitted logs. |
| `timeout` | string | `"5s"` | Maximum wall-clock time for the trace, as a Go duration string (e.g. `"10s"`). Long traces that exceed this are aborted. |
| `disableStorage` | boolean | `false` | Struct logger only — skip capturing storage at each step (smaller, faster). |
| `disableStack` | boolean | `false` | Struct logger only — skip capturing the EVM stack at each step. |
| `enableMemory` | boolean | `false` | Struct logger only — capture full memory at each step (very large output). |
| `enableReturnData` | boolean | `false` | Struct logger only — capture return data at each step. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_traceTransaction",
    "params": [
      "0x5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a",
      { "tracer": "callTracer", "tracerConfig": { "withLog": true } }
    ]
  }'
```

## Response

With `tracer: "callTracer"`, the result is the transaction's call tree:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "type": "CALL",
    "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
    "to": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "value": "0x0",
    "gas": "0x33450",
    "gasUsed": "0x1a2b3",
    "input": "0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000",
    "output": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
    "calls": [
      {
        "type": "CALL",
        "from": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
        "to": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "value": "0x0",
        "gas": "0x2c1a0",
        "gasUsed": "0x5b8d",
        "input": "0x23b872dd",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
      }
    ]
  }
}
```

The default struct logger (no `tracer`) instead returns an object with
`gas`, `failed`, `returnValue`, and a `structLogs` array (one entry per opcode).

### Response fields

For the `callTracer` result, each call frame contains:

| Field | Type | Description |
|---|---|---|
| `type` | string | Frame opcode — `CALL`, `STATICCALL`, `DELEGATECALL`, `CREATE`, `CREATE2`, or `SELFDESTRUCT`. |
| `from` | string | Sender address of this frame. |
| `to` | string | Recipient (or created contract) address. |
| `value` | string | `0x`-prefixed hex wei transferred with the call. |
| `gas` | string | `0x`-prefixed hex gas supplied to the frame. |
| `gasUsed` | string | `0x`-prefixed hex gas actually consumed. |
| `input` | string | `0x`-prefixed hex calldata. |
| `output` | string | `0x`-prefixed hex return data. |
| `error` | string | Present only if the frame failed; the failure reason (e.g. `out of gas`, `execution reverted`). |
| `revertReason` | string | Decoded revert string, when the frame reverted with a reason. |
| `calls` | array | Nested child frames, in execution order. Absent for leaf frames. |

For the default struct-logger result:

| Field | Type | Description |
|---|---|---|
| `gas` | integer | Total gas used by the transaction. |
| `failed` | boolean | `true` if the transaction reverted or otherwise failed. |
| `returnValue` | string | Hex return value of the top-level call. |
| `structLogs` | array | Per-opcode steps: `pc`, `op`, `gas`, `gasCost`, `depth`, and (unless disabled) `stack`, `memory`, `storage`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `debug`-namespace method is not enabled for it. The `error.data` carries `current_tier`, `required_tier`, and `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's request rate (5 RPS sustained · up to 10 burst on Pro, 15 RPS sustained · up to 30 burst on Business) including burst. Honor the `Retry-After` header / `error.data.retry_after_sec` and retry after a short back-off. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "debug_traceTransaction",
    params: [
      "0x5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a",
      { tracer: "callTracer", tracerConfig: { withLog: true } },
    ],
  }),
});

const { result } = await res.json();
console.log(result.type, result.gasUsed, result.calls?.length ?? 0);
```

## Notes

- **Pick the smallest tracer that answers your question.** `callTracer` is the
  right default for "what calls did this transaction make and where did it
  revert"; reach for the opcode-level struct logger only when you need
  step-by-step EVM detail, and use `disableStack` / `disableStorage` to keep the
  payload manageable.
- The transaction **must already be mined**. To trace a hypothetical call that
  has not been sent, use [`debug_traceCall`](./debug_traceCall.md) instead; to
  trace every transaction in a block, use
  [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) or
  [`debug_traceBlockByHash`](./debug_traceBlockByHash.md).
- `callTracer` results are returned for the whole transaction as a single tree;
  set `tracerConfig.onlyTopCall: true` if you only need the outermost frame.
- Raise `timeout` (e.g. `"30s"`) for unusually deep or compute-heavy
  transactions whose default 5-second trace would otherwise be aborted.
