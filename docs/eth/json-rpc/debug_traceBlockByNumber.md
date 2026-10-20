> Live version: https://triport.io/docs/eth/json-rpc/debug_traceBlockByNumber

# debug_traceBlockByNumber

> Replays every transaction in a block identified by number or tag and returns the EVM execution trace for each one.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceBlockByNumber` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | Pro — 5 RPS sustained · up to 10 burst · Business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceBlockByNumber` re-executes all transactions contained in a single
block — selected by block number or by a block tag — against the historical
state at that block, and returns the EVM trace produced for each transaction.
This is the per-block equivalent of tracing one transaction with
[`debug_traceTransaction`](./debug_traceTransaction.md): the result is an array
with one trace entry per transaction, in block order.

Use it when you need to inspect the execution of an entire block at once — for
example to audit every internal call in a block, to attribute gas usage across
transactions, or to reconstruct state transitions for analytics. By default the
node uses the built-in opcode-level (struct-log) tracer; pass a `tracer` in the
options object to switch to a higher-level tracer such as `callTracer` or
`prestateTracer`.

This is a `debug`-namespace method and is available on the **Pro** tier and
above. It is rate limited per tier (5 RPS on Pro, 15 RPS on Business) with a
short burst allowance; there is no daily quota. Tracing a full block is an
expensive operation — for older blocks or struct-log output the call can return
a large response, so prefer a specific `tracer` and tight options when you can.

## Parameters

Positional parameters: a required block reference, plus an optional trace
configuration object.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | The block to trace, given as a `0x`-prefixed hex block number (e.g. `"0x10D4F"`) or a block tag (`latest`, `earliest`, hex number). |
| `options` | object | no | Trace configuration. Omit for the default opcode-level struct-log tracer. |

### `options` fields

| Field | Type | Description |
|---|---|---|
| `tracer` | string | Name of a built-in tracer, e.g. `callTracer` or `prestateTracer`. When omitted, the default struct-log tracer is used. |
| `tracerConfig` | object | Tracer-specific configuration (for example `{ "onlyTopCall": true }` with `callTracer`). |
| `timeout` | string | Maximum time to spend tracing (Go duration string, e.g. `"60s"`). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_traceBlockByNumber",
    "params": ["0x10D4F", { "tracer": "callTracer" }]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "txHash": "0x2c5f8a...",
      "result": {
        "type": "CALL",
        "from": "0x8b3392483ba26d65e331db86d4f430e9b3814e5e",
        "to": "0x2c4bd064b998838076fa341a83d007fc2fa50957",
        "value": "0x0",
        "gas": "0x13458",
        "gasUsed": "0x8fc",
        "input": "0xa9059cbb...",
        "output": "0x",
        "calls": []
      }
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array | One entry per transaction in the block, in execution order. |
| `result[].txHash` | string | Hash of the transaction this trace belongs to. |
| `result[].result` | object | The trace for that transaction. Its shape depends on the `tracer` requested — the `callTracer` returns a nested call frame (shown above); the default struct-log tracer returns `gas`, `failed`, `returnValue`, and a `structLogs` array of per-opcode steps. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `debug`-namespace method is not enabled for it. |
| `429` | `rate_limited` | You exceeded your tier's request rate (5 RPS sustained · up to 10 burst on Pro, 15 RPS sustained · up to 30 burst on Business) including burst. Retry after a short back-off. |

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
    method: "debug_traceBlockByNumber",
    params: ["0x10D4F", { tracer: "callTracer" }],
  }),
});

const { result } = await res.json();
console.log(result.length, "transactions traced");
```

## Notes

- The first parameter accepts a block tag (`latest`, `earliest`) or a
  `0x`-prefixed hex block number — pass whichever you have. To trace a block by
  its hash instead, use
  [`debug_traceBlockByHash`](./debug_traceBlockByHash.md).
- To trace a single transaction rather than a whole block, use
  [`debug_traceTransaction`](./debug_traceTransaction.md); to trace a call that
  is not yet on chain, use [`debug_traceCall`](./debug_traceCall.md).
- Without a `tracer`, the response uses the verbose opcode-level struct-log
  format, which can be very large for busy blocks. Specifying `callTracer`
  yields a compact, call-tree view that is usually what integrations want.
