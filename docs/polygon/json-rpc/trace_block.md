> Live version: https://triport.io/docs/polygon/json-rpc/trace_block

# trace_block

> **Trace format.** This interface returns Parity-style call frames. Where the response includes `vmTrace` and `stateDiff`, both are `null`: opcode traces and state diffs are not supported. For `trace_callMany`, calls are independent simulations and do not share the state changes of preceding calls.

> Returns the complete Parity-style call tree for every transaction in a single Polygon block.

| | |
|---|---|
| **Method / Endpoint** | `trace_block` (JSON-RPC, `POST https://triport.io/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro and up — pro 3 rps · business 10 rps (category `polygon_trace`) |

## Description

`trace_block` returns the full Parity-style execution trace for **all**
transactions in one block. The result is a flat array of trace frames: every
external call and every internal call (`call`, `delegatecall`, `staticcall`,
`create`, `suicide`) produced while the block executed, tagged with the
transaction it belongs to and its position in the call tree. This is the
whole-block counterpart to [`trace_transaction`](./trace_transaction.md), which
traces a single transaction.

Use it when you need the complete internal-execution picture of a block rather
than just its receipts. Typical use cases:

- **MEV indexing** — reconstruct the full execution path of each transaction to
  detect sandwiches, atomic arbitrage, and JIT liquidity.
- **DeFi internal-transfer tracking** — follow `transferFrom` and value moves
  between contracts that never appear as top-level transactions.
- **Compliance / forensic auditing** — produce a verifiable execution trail for
  a transaction inside its block context.

This is a premium trace method: it requires the **Pro** tier or above and is
rate limited per tier (3 RPS on Pro, 10 RPS on Business) with a short burst
allowance. There is no daily quota. Tracing a whole block is **heavy**: a
typical Polygon block holds ~50–150 transactions, each expanding into several to
many trace frames, so a single response is commonly **100 KB–2 MB** and latency
runs into the **seconds**. Keep concurrency low and prefer recent or specific
blocks over wide historical sweeps.

> **Trace-shape note.** Polygon runs the Bor execution layer, whose trace output
> can differ slightly from a stock Geth/Parity node — most visibly in how a frame
> is typed (`"call"` vs `"delegatecall"` and the other call variants). Write your
> indexer to accept both type spellings rather than matching one exact string.

## Parameters

Positional parameters: a single block reference.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | The block to trace, given as a `0x`-prefixed hex block number (e.g. `"0x3A2B4C0"`) or a block tag (`latest`, `earliest`). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_block",
    "params": ["latest"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "action": {
        "from": "0x8b3392483ba26d65e331db86d4f430e9b3814e5e",
        "callType": "call",
        "gas": "0x13458",
        "input": "0xa9059cbb...",
        "to": "0x2c4bd064b998838076fa341a83d007fc2fa50957",
        "value": "0x0"
      },
      "result": {
        "gasUsed": "0x8fc",
        "output": "0x"
      },
      "subtraces": 1,
      "traceAddress": [],
      "type": "call",
      "blockHash": "0x1d2e...c9af",
      "blockNumber": 61024960,
      "transactionHash": "0x2c5f8a...d11b",
      "transactionPosition": 0
    },
    {
      "action": {
        "from": "0x2c4bd064b998838076fa341a83d007fc2fa50957",
        "callType": "delegatecall",
        "gas": "0xf618",
        "input": "0x70a08231...",
        "to": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        "value": "0x0"
      },
      "result": {
        "gasUsed": "0x523",
        "output": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"
      },
      "subtraces": 0,
      "traceAddress": [0],
      "type": "call",
      "blockHash": "0x1d2e...c9af",
      "blockNumber": 61024960,
      "transactionHash": "0x2c5f8a...d11b",
      "transactionPosition": 0
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array | One entry per trace frame across the whole block, ordered by transaction position and then by execution order within each transaction. |
| `result[].action` | object | The call that produced this frame. |
| `result[].action.callType` | string | Type of call: `call`, `delegatecall`, `staticcall`, etc. May vary by Bor execution shape (see note above). |
| `result[].action.from` | string | Address that initiated the call. |
| `result[].action.to` | string | Target address of the call. |
| `result[].action.value` | string | `0x`-prefixed hex wei value transferred. |
| `result[].action.gas` | string | `0x`-prefixed hex gas supplied to the call. |
| `result[].action.input` | string | Call input data. |
| `result[].result` | object | Outcome of the call: `gasUsed` and `output` (absent and replaced by an `error` string on a reverted frame). |
| `result[].subtraces` | number | Number of direct child calls of this frame. |
| `result[].traceAddress` | array | Path of this frame within its transaction's call tree (empty for the top-level call). |
| `result[].type` | string | Frame type — `call`, `create`, or `suicide`. |
| `result[].blockHash` | string | Hash of the block being traced. |
| `result[].blockNumber` | number | Number of the block being traced. |
| `result[].transactionHash` | string | Hash of the transaction this frame belongs to. |
| `result[].transactionPosition` | number | Index of that transaction within the block. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; the `polygon_trace` category is not enabled for it. |
| `429` | `rate_limited` | You exceeded your tier's request rate (3 RPS sustained · up to 6 burst on Pro, 10 RPS sustained · up to 20 burst on Business) including burst. Back off and retry. |

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
    method: "trace_block",
    params: ["latest"],
  }),
});

const { result } = await res.json();
console.log(result.length, "trace frames in block");
```

## Notes

- Pass either a block tag (`latest`, `earliest`) or a `0x`-prefixed hex block
  number. Tracing `latest` is the common path for real-time MEV detection;
  historical blocks are available for indexing and archival analysis.
- Responses are large (100 KB–2 MB) and slow (seconds, not milliseconds). Keep
  concurrency low — a handful of in-flight requests is plenty — and avoid
  fanning the method across long block ranges in parallel.
- For a single transaction rather than a whole block, use
  [`trace_transaction`](./trace_transaction.md). To simulate and trace a call
  that is not yet on chain, use [`trace_call`](./trace_call.md). To filter trace
  frames across a block range by address, use
  [`trace_filter`](./trace_filter.md). For full per-transaction state diffs in
  addition to the trace, use
  [`trace_replayBlockTransactions`](./trace_replayBlockTransactions.md).
- The Geth-style equivalent of this method is
  [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md), which returns a
  nested call-tree shape rather than the flat Parity frame array. Cross-checking
  the two is useful for trace-shape verification.
