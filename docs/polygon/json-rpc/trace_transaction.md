> Live version: https://triport.io/docs/polygon/json-rpc/trace_transaction

# trace_transaction

> **Trace format.** This interface returns Parity-style call frames. Where the response includes `vmTrace` and `stateDiff`, both are `null`: opcode traces and state diffs are not supported. For `trace_callMany`, calls are independent simulations and do not share the state changes of preceding calls.

> Returns the Parity-style call tree for a single already-mined Polygon transaction, identified by its hash.

| | |
|---|---|
| **Method / Endpoint** | `trace_transaction` (JSON-RPC, `POST https://triport.io/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro and up — pro 3 rps · business 10 rps |

## Description

`trace_transaction` replays one transaction that has already been included in a
block and returns its execution as a flat list of **Parity-style trace frames** —
one entry per internal call (`call`, `create`, `suicide`, `reward`), each tagged
with its position in the call tree. It is the most convenient method for
single-transaction forensic analysis: MEV path reconstruction, internal
token-transfer tracing, and revert diagnosis without having to pull and walk a
whole block.

Compared to its siblings, `trace_transaction` is the **lightest** of the
block-scoped trace methods — it returns only the frames for one transaction, so
it is far cheaper than [`trace_block`](./trace_block.md) (the full-block call
tree) or `trace_replayBlockTransactions` (full block replay with state diffs),
yet richer than `eth_getTransactionReceipt`, which gives you only the top-level
result and logs.

This is a `trace`-namespace (Parity) method available on the **Pro** tier and
above. It is rate limited per tier (3 RPS on Pro, 10 RPS on Business) with a
short burst allowance; there is no daily quota. If the hash does not correspond
to a mined transaction — unknown, or still pending in the mempool — the method
returns `null` rather than an error.

## Parameters

One positional parameter.

| Name | Type | Required | Description |
|---|---|---|---|
| `txHash` | string | yes | The `0x`-prefixed 32-byte hash of the transaction to trace. The transaction must already be mined into a block; pending or unknown hashes yield a `null` result. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_transaction",
    "params": [
      "0x3a1f2b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a"
    ]
  }'
```

## Response

The result is an array of trace frames, ordered by `traceAddress` (execution
order). A simple transfer plus one internal call looks like this:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "action": {
        "callType": "call",
        "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
        "to": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        "gas": "0x33450",
        "input": "0xa9059cbb0000000000000000000000009f3c1a8e2b6d4f10c6f2a1d8e3047b9a6c1f0e2d",
        "value": "0x0"
      },
      "result": {
        "gasUsed": "0x5b8d",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
      },
      "subtraces": 1,
      "traceAddress": [],
      "type": "call",
      "blockHash": "0x9c4e2a7f1b08d3c5e6f4a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e",
      "blockNumber": 54218907,
      "transactionHash": "0x3a1f2b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a",
      "transactionPosition": 42
    },
    {
      "action": {
        "callType": "delegatecall",
        "from": "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
        "to": "0x2c2b9c9a4a25e24b174f26114e8926a9f2128fe4",
        "gas": "0x2c1a0",
        "input": "0xa9059cbb",
        "value": "0x0"
      },
      "result": {
        "gasUsed": "0x1f3a",
        "output": "0x"
      },
      "subtraces": 0,
      "traceAddress": [0],
      "type": "call",
      "blockHash": "0x9c4e2a7f1b08d3c5e6f4a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e",
      "blockNumber": 54218907,
      "transactionHash": "0x3a1f2b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a",
      "transactionPosition": 42
    }
  ]
}
```

For an unknown or pending transaction, the result is `null`:

```json
{ "jsonrpc": "2.0", "id": 1, "result": null }
```

### Response fields

Each element of the result array is a trace frame:

| Field | Type | Description |
|---|---|---|
| `action` | object | What the frame did. For a `call` frame: `callType` (`call`, `delegatecall`, `staticcall`, `callcode`), `from`, `to`, `gas`, `input`, `value`. `create` frames carry `init` and `creationMethod`; `suicide` frames carry `address`, `refundAddress`, `balance`. |
| `result` | object | Outcome of the frame: `gasUsed`, and `output` for calls or `address`/`code` for creates. Absent (replaced by `error`) when the frame failed. |
| `error` | string | Present only on failure — the reason, e.g. `Reverted`, `Out of gas`. |
| `subtraces` | integer | Number of direct child frames spawned by this frame. |
| `traceAddress` | array | Path of this frame within the call tree (e.g. `[0, 1]`). Empty for the top-level call. |
| `type` | string | Frame type — `call`, `create`, `suicide`, or `reward`. |
| `blockHash` | string | Hash of the block containing the transaction. |
| `blockNumber` | integer | Number of the block containing the transaction. |
| `transactionHash` | string | Hash of the traced transaction (equals your `txHash`). |
| `transactionPosition` | integer | Index of the transaction within its block. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `trace`-namespace method is not enabled for it. The `error.data` carries `current_tier`, `required_tier`, `method`, `category`, and `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's request rate (3 RPS sustained · up to 6 burst on Pro, 10 RPS sustained · up to 20 burst on Business) including burst. Honor the `Retry-After` header / `error.data.retry_after_sec` and retry after a short back-off. |

Note that an unknown or pending transaction is **not** an error — it returns a
`null` result with HTTP 200. See the shared
[error envelope reference](../../errors.md) for the full error object shape and
handling guidance.

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
    method: "trace_transaction",
    params: ["0x3a1f2b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a"],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("transaction not found (unknown or pending)");
} else {
  console.log(`${result.length} trace frames`);
}
```

## Notes

- **Parity shape, not Geth.** `trace_transaction` returns the flat Parity trace
  format (frames keyed by `traceAddress`), which differs from the nested
  `callTracer` tree returned by Geth-style `debug` methods. If your tooling
  expects the Geth shape, reach for the `debug` namespace instead; if you index
  both, normalise one format to the other.
- **Bor quirk.** Polygon's Bor client can map a frame's `callType` slightly
  differently from a vanilla Geth/Parity node (for example `call` vs
  `delegatecall` for proxy dispatch). Handle both when reconstructing call trees.
- **`null` means not found.** A `null` result is the expected answer for a hash
  that is unknown or still pending — poll again once the transaction is mined
  rather than treating it as a failure.
- **Related methods.** For the full call tree of every transaction in a block,
  use [`trace_block`](./trace_block.md); for a range query across many blocks,
  use `trace_filter`; to simulate a not-yet-sent transaction, use `trace_call`.
  See the [Polygon RPC overview](../../overview.md) for the full trace namespace.
