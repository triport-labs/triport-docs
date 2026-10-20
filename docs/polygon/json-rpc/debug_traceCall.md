> Live version: https://triport.io/docs/polygon/json-rpc/debug_traceCall

# debug_traceCall

> Simulate a single Polygon call against a historical or pending state and return its full Geth-style execution trace — without broadcasting anything to the network.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceCall` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro — 3 rps · Business — 10 rps (burst above sustained) |

## Description

`debug_traceCall` executes a transaction-shaped call object against the EVM at a
chosen block, **exactly like `eth_call`**, but instead of returning only the
final return data it returns the complete tree of execution frames the call
produced. Because nothing is signed or broadcast, you can use it to dry-run a
swap, simulate a potential MEV opportunity, or reproduce a revert and inspect
every internal call along the way.

This is the **Geth-style** tracer. It is the lighter, faster counterpart to the
Parity-style [`trace_call`](./trace_call.md): it returns a single nested call
object (`{type, from, to, gas, gasUsed, value, input, output, calls[], error?}`)
rather than a flat array of `trace`/`stateDiff`/`vmTrace` records. The output
**schemas differ** — if you index Polygon execution with both, your decoder must
handle each shape separately.

Typical uses:

- **Pre-confirmation analysis** — simulate a candidate transaction and read the
  full execution path (including internal token transfers) before deciding to
  send it.
- **Revert debugging** — when an `eth_call` fails opaquely, trace it to see
  which sub-call reverted and with what `error`.
- **Forensics** — re-run a call against a past block to reconstruct behavior.

Both `debug_*` trace methods on Polygon belong to the premium `polygon_trace`
category and require **Pro tier**. `debug_traceCall` is the cheapest of them —
single-call traces are small and fast, unlike full-block traces such as
[`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md).

## Parameters

Positional params array, `[callObject, blockParameter, traceConfig?]`:

| Name | Type | Required | Description |
|---|---|---|---|
| `callObject` | object | yes | The call to simulate (same shape as the `eth_call` transaction object). |
| `blockParameter` | string | yes | Block to execute against: a hex block number (e.g. `"0x4470eb3"`), a 32-byte block hash, or a tag (`"latest"`, `"pending"`, `"earliest"`). |
| `traceConfig` | object | no | Tracer options, e.g. `{"tracer": "callTracer"}`. With `callTracer` you get the nested call tree shown below; omit it for the default opcode-level (struct-log) trace. |

### `callObject` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | string | no | Sender address the call executes as. |
| `to` | string | yes* | Target contract / account. Omit only when simulating contract creation. |
| `gas` | string | no | Hex gas cap for the call. |
| `gasPrice` | string | no | Hex gas price (legacy) — or use `maxFeePerGas` / `maxPriorityFeePerGas`. |
| `value` | string | no | Hex wei value to send with the call. |
| `data` | string | no | Hex-encoded calldata (ABI-encoded function selector + args). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_traceCall",
    "params": [
      {
        "from": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f1",
        "to":   "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        "data": "0x70a08231000000000000000000000000ddf252ad1be2c89b69c2b068fc378daa952ba7f1"
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
    "from": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f1",
    "to": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    "value": "0x0",
    "gas": "0x2dc6c0",
    "gasUsed": "0x5b8d",
    "input": "0x70a08231000000000000000000000000ddf252ad1be2c89b69c2b068fc378daa952ba7f1",
    "output": "0x00000000000000000000000000000000000000000000003635c9adc5dea00000",
    "calls": [
      {
        "type": "STATICCALL",
        "from": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        "to": "0x0000000000000000000000000000000000001010",
        "gas": "0x1f4",
        "gasUsed": "0x1a4",
        "input": "0x...",
        "output": "0x..."
      }
    ]
  }
}
```

A call that reverts comes back with an `error` field (and usually no `output`):

```json
{
  "type": "CALL",
  "from": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f1",
  "to": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
  "gas": "0x2dc6c0",
  "gasUsed": "0x1860",
  "input": "0x...",
  "error": "execution reverted"
}
```

### Response fields

Each node in the tree (root and every entry in `calls`) has:

| Field | Type | Description |
|---|---|---|
| `type` | string | Frame opcode: `CALL`, `STATICCALL`, `DELEGATECALL`, `CREATE`, `CREATE2`, `SELFDESTRUCT`. |
| `from` | string | Address that initiated this frame. |
| `to` | string | Address that was called. |
| `value` | string | Hex wei transferred in this frame (absent for zero-value static calls). |
| `gas` | string | Hex gas made available to this frame. |
| `gasUsed` | string | Hex gas actually consumed by this frame and its children. |
| `input` | string | Hex calldata passed to this frame. |
| `output` | string | Hex return data from this frame (absent on revert). |
| `calls` | array | Child frames invoked by this frame; omitted when there are none. |
| `error` | string | Present only if the frame reverted or failed (e.g. `"execution reverted"`, `"out of gas"`). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your key is below Pro tier (or lacks the `polygon_trace` scope). The error `data` includes `current_tier`, `required_tier`, and an `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's RPS for `polygon_trace` (Pro 3 / Business 10). The `data` carries `limit_rps`, `burst_capacity`, and `retry_after_sec`. |
| `401` | `unauthorized` | Missing or invalid `Authorization` header. |
| HTTP `403` | `method_unknown` | Method not enabled for this key/chain. |
| `-32602` | invalid params | Malformed `callObject`, bad block parameter, or unknown `tracer`. |

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
    method: "debug_traceCall",
    params: [
      {
        from: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f1",
        to: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        data: "0x70a08231000000000000000000000000ddf252ad1be2c89b69c2b068fc378daa952ba7f1",
      },
      "latest",
      { tracer: "callTracer" },
    ],
  }),
});

const { result } = await res.json();
console.log(result.type, result.gasUsed, result.calls?.length ?? 0);
```

## Notes

- **Geth vs Parity output.** `debug_traceCall` returns a nested call tree;
  [`trace_call`](./trace_call.md) returns flat Parity `trace` records. They
  describe the same execution but with different schemas — pick one as your
  primary and adapt your decoder accordingly. Polygon's Bor execution may also
  render certain frame types slightly differently from vanilla Geth (e.g.
  `CALL` vs `DELEGATECALL` boundaries), so handle both when reconciling traces.
- **Stay under your RPS.** Single-call traces are light and fast, but the
  `polygon_trace` category is rate-limited to 3 rps (Pro) / 10 rps (Business).
  For high-volume simulation, batch your logic per call rather than fanning out
  many concurrent `debug_traceCall` requests.
- **Heavier relatives.** To trace an already-mined transaction use a
  transaction-trace method; to trace an entire block use
  [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) — both share the
  same Pro-tier `polygon_trace` limits.
- **Block selection matters.** Tracing against `"latest"` reflects current
  state; pass a specific hex block number to reproduce historical behavior.
