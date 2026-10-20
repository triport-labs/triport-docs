> Live version: https://triport.io/docs/polygon/json-rpc/debug_traceBlockByNumber

# debug_traceBlockByNumber

> Replays every transaction in a Polygon block selected by number or tag and returns the Geth-style EVM execution trace for each one.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceBlockByNumber` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro — 3 RPS sustained · up to 6 burst · Business — 10 RPS sustained · up to 20 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceBlockByNumber` re-executes all transactions in a single Polygon
block — selected by block number or by a block tag — against the historical
state at that block, and returns the Geth-style EVM trace produced for each
transaction. The result is an array with one trace entry per transaction, in
block order. This is the per-block, Geth-namespace counterpart to the
single-transaction `debug_traceCall`; for the Parity-style equivalent see
[`trace_block`](./trace_block.md), whose output schema is different.

Use it when you need to inspect the execution of an entire block at once — for
example to index every internal call in a block (MEV / DeFi analytics), to
attribute gas usage across transactions, or to reconstruct state transitions
for forensic and compliance review. By default the node uses the built-in
opcode-level (struct-log) tracer; pass a `tracer` in the options object to
switch to a higher-level tracer such as `callTracer` or `prestateTracer`.

This is a `debug`-namespace method available on the **Pro** tier and above. It
is rate limited per tier (3 RPS on Pro, 10 RPS on Business) with a short burst
allowance; there is no daily quota. Tracing a full Polygon block is an
**expensive operation** — a typical mainnet block contains dozens to hundreds of
transactions, each expanding into many trace frames, so responses are heavy
(commonly 100 KB–2 MB) and latency is measured in **seconds**, not
milliseconds. Prefer a specific `tracer` with tight options, and keep
concurrency low.

## Parameters

Positional parameters: a required block reference, plus an optional trace
configuration object.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | The block to trace, given as a `0x`-prefixed hex block number (e.g. `"0x3A2F4C0"`) or a block tag (`latest`, `earliest`). |
| `options` | object | no | Trace configuration. Omit for the default opcode-level struct-log tracer. |

### `options` fields

| Field | Type | Description |
|---|---|---|
| `tracer` | string | Name of a built-in tracer, e.g. `callTracer` or `prestateTracer`. When omitted, the default struct-log tracer is used. |
| `tracerConfig` | object | Tracer-specific configuration (for example `{ "onlyTopCall": true }` with `callTracer`). |
| `timeout` | string | Maximum time to spend tracing (Go duration string, e.g. `"60s"`). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_traceBlockByNumber",
    "params": ["0x3A2F4C0", { "tracer": "callTracer" }]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "txHash": "0x2c5f8a9d1b4e0f3c7a86d2e15b9c0473f8a1d6e29c4b7503fa8e1c2d3b4a5f60",
      "result": {
        "type": "CALL",
        "from": "0x8b3392483ba26d65e331db86d4f430e9b3814e5e",
        "to": "0x2c4bd064b998838076fa341a83d007fc2fa50957",
        "value": "0x0",
        "gas": "0x13458",
        "gasUsed": "0x8fc",
        "input": "0xa9059cbb0000000000000000000000007d1afa7b718fb893db30a3abc0cfc608aacfebb0",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001",
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
| `result[].result` | object | The Geth-style trace for that transaction. Its shape depends on the `tracer` requested — the `callTracer` returns a nested call frame (`type`, `from`, `to`, `value`, `gas`, `gasUsed`, `input`, `output`, `calls[]`, and `error` when the call reverted); the default struct-log tracer returns `gas`, `failed`, `returnValue`, and a `structLogs` array of per-opcode steps. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `debug`-namespace method (`polygon_trace`) is not enabled for it. HTTP-equivalent 403. |
| `429` | `rate_limited` | You exceeded your tier's request rate (3 RPS sustained · up to 6 burst on Pro, 10 RPS sustained · up to 20 burst on Business) including burst. Retry after the `retry_after_sec` hint in the error `data`. HTTP-equivalent 429. |

The other product rejections are plain HTTP responses, not JSON-RPC errors:
`401` `trial_expired`, `401` `unauthorized` (missing/invalid key), and `403`
`method_unknown` for a method outside the Polygon catalog.
See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "debug_traceBlockByNumber",
    params: ["0x3A2F4C0", { tracer: "callTracer" }],
  }),
});

const { result } = await res.json();
console.log(result.length, "transactions traced");
```

## Notes

- **Geth shape ≠ Parity shape.** This method returns the Geth call-frame
  format. The Parity-style alternative, [`trace_block`](./trace_block.md),
  returns a flat array of `{action, result, subtraces, traceAddress, type}`
  frames instead. An indexer that consumes both should normalize the two
  schemas; they are useful together for cross-verification in forensic work.
- **Heavy payload, seconds of latency.** A busy Polygon block traces into
  thousands of frames. Without a `tracer` the verbose opcode-level struct-log
  format is returned, which can be very large — specifying `callTracer` yields a
  compact call-tree view that is usually what integrations want. Keep
  concurrency low and expect multi-second responses for full blocks.
- The first parameter accepts a block tag (`latest`, `earliest`) or a
  `0x`-prefixed hex block number — pass whichever you have. Tracing `latest` is
  the common real-time path-detection use case; historic block numbers are used
  for backfilling and indexing.
- To trace a call that is not yet on chain, use
  [`debug_traceCall`](./debug_traceCall.md).
