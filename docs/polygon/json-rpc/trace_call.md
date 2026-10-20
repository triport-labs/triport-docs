> Live version: https://triport.io/docs/polygon/json-rpc/trace_call

# trace_call

> **Trace format.** This interface returns Parity-style call frames. Where the response includes `vmTrace` and `stateDiff`, both are `null`: opcode traces and state diffs are not supported. For `trace_callMany`, calls are independent simulations and do not share the state changes of preceding calls.

> Simulate a transaction against Polygon state and return its full Parity-style execution trace — without broadcasting anything on-chain.

| | |
|---|---|
| **Method / Endpoint** | `trace_call` (JSON-RPC, `POST https://triport.io/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro — 3 rps · Business — 10 rps (burst above the steady rate is allowed; no daily quota) |

## Description

`trace_call` executes a single call against the chain state at a given block
(no broadcast, no state mutation) and returns the complete Parity `trace`
array for that call. Optionally it also returns a state diff and/or a low-level
VM trace, depending on the trace types you request.

It is the lightweight sibling of [`trace_block`](./trace_block.md): instead of
re-executing every transaction in a block, it runs exactly one call, so it is
fast enough for interactive and pre-confirmation use. The primary use case is
**MEV pre-confirmation analysis** — simulate a candidate transaction (or a
single leg of a sandwich bundle) and read the full internal call tree to
compute expected profit *before* you sign and broadcast. A plain `eth_call`
only returns the final return data; `trace_call` exposes every internal call,
value transfer, and (optionally) storage change along the way.

This is a premium capability: it requires the `polygon_trace` scope and **Pro
tier or higher**. Calls below Pro tier are rejected with HTTP `403` `tier_insufficient`, and calls
that exceed your tier's per-second rate are rejected with HTTP `429`.

## Parameters

Positional params array: `[transaction, traceTypes, blockTag]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `transaction` | object | yes | The call object to simulate (see fields below). |
| `traceTypes` | array of string | yes | Use `["trace"]` for call frames. The `vmTrace` and `stateDiff` fields are unsupported and remain null. |
| `blockTag` | string | no | Block number (hex) or tag (`latest`, `earliest`, `pending`) to execute against. Defaults to `latest`. |

### `transaction` object fields

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | string | no | 20-byte sender address (hex). Defaults to the zero address. |
| `to` | string | no | 20-byte recipient / contract address (hex). |
| `gas` | string | no | Gas limit (hex quantity). |
| `gasPrice` | string | no | Gas price in wei (hex quantity). |
| `value` | string | no | Value to send in wei (hex quantity). |
| `data` | string | no | Call data — encoded function selector + arguments (hex). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_call",
    "params": [
      {
        "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
        "to": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        "value": "0x0",
        "data": "0x70a08231000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9001122334"
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
    "output": "0x00000000000000000000000000000000000000000000000ad78ebc5ac6200000",
    "trace": [
      {
        "action": {
          "callType": "call",
          "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
          "to": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
          "gas": "0x2fa9e",
          "input": "0x70a08231000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
          "value": "0x0"
        },
        "result": {
          "gasUsed": "0x5d3",
          "output": "0x00000000000000000000000000000000000000000000000ad78ebc5ac6200000"
        },
        "subtraces": 0,
        "traceAddress": [],
        "type": "call"
      }
    ],
    "stateDiff": null,
    "vmTrace": null
  }
}
```

### Response fields

The `result` object:

| Field | Type | Description |
|---|---|---|
| `output` | string | Return data of the simulated call (hex). |
| `trace` | array | Parity call frames. Each frame carries `action`, `result`, `subtraces`, `traceAddress`, and `type`. |
| `stateDiff` | null | Unsupported by this interface; always null, including when requested. |
| `vmTrace` | null | Unsupported by this interface; always null, including when requested. |

Each entry in `trace` describes one internal call frame:

| Frame field | Type | Description |
|---|---|---|
| `action` | object | The call itself — `callType`, `from`, `to`, `gas`, `input`, `value`. |
| `result` | object | Outcome — `gasUsed` and `output`. |
| `subtraces` | number | Count of direct child frames. |
| `traceAddress` | array of number | Position of this frame within the call tree. |
| `type` | string | Frame type, e.g. `call`, `create`, `delegatecall`, `staticcall`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` (HTTP 403) — method requires Pro tier or higher | The key's tier is below Pro, or the `polygon_trace` category is not enabled for it. The error `data` includes `required_tier`, `current_tier`, and `upgrade_url`. |
| `429` | `rate_limited` (HTTP 429) — per-second limit exceeded for the current tier | You exceeded your tier's rps (Pro 3 / Business 10). The error `data` includes `limit_rps`, `burst_capacity`, and `retry_after_sec`. |

See the shared [errors reference](../../errors.md) for the full error
envelope and the structure of the `data` field.

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
    method: "trace_call",
    params: [
      {
        from: "0xa1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
        to: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        value: "0x0",
        data: "0x70a08231000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
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

- **Supported output.** Request `["trace"]`; state diffs and opcode traces remain unavailable.
- **Pre-confirmation MEV workflow.** Simulate a candidate transaction against
  `latest` (or `pending`) state, walk the returned `trace` to follow internal
  token flows and value transfers, and compute expected profit before signing.
  Because nothing is broadcast, you can probe many candidate inputs cheaply.
- **Parity shape, not Geth.** This method returns the Parity `trace` format
  (`action` / `result` / `subtraces` / `traceAddress`). It is a different shape
  from Geth-style debug tracing — if your tooling consumes the Geth `calls`
  tree, you will need an adapter.
- **Block tags.** Use `latest` for real-time pre-confirmation analysis and a hex
  block number for reproducible historical simulation. `pending` reflects the
  current pending state.
- **Related methods:** [`trace_block`](./trace_block.md) (full block call tree),
  [`trace_transaction`](./trace_transaction.md) (trace one already-mined tx),
  [`trace_filter`](./trace_filter.md) (range/address filter over historical
  traces), and [`trace_replayBlockTransactions`](./trace_replayBlockTransactions.md)
  (full block replay with state diff). For an unsimulated read of final state
  only, use `eth_call`.
