> Live version: https://triport.io/docs/eth/json-rpc/trace_transaction

# trace_transaction

> Returns the OpenEthereum-style action traces for every call frame inside a single already-mined transaction.

| | |
|---|---|
| **Method / Endpoint** | `trace_transaction` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_trace` |
| **Tier / rate limit** | Pro — 5 RPS sustained · up to 10 burst · Business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`trace_transaction` re-executes a transaction that has already been included in a
block and returns a **flat list of action traces** — one entry per call frame
(the top-level call plus every internal `CALL`, `DELEGATECALL`, `CREATE`, and
`SELFDESTRUCT` it triggered). This is the OpenEthereum / Parity `trace` format:
instead of the nested call tree produced by
[`debug_traceTransaction`](./debug_traceTransaction.md)'s `callTracer`, each frame
is a separate array element, and its position in the call hierarchy is encoded by
the `traceAddress` path.

Use it when you want a compact, post-hoc accounting of value movement and
internal calls — for example reconstructing internal ETH transfers, attributing
gas across sub-calls, or finding exactly which frame reverted. Because the output
is flat and value-oriented (rather than opcode-level), it is much smaller than a
struct log and is the trace format most block explorers and accounting tools
expect.

This is a `trace`-namespace method available on the **Pro** tier and above. It is
rate limited per tier (5 RPS on Pro, 15 RPS on Business) with a short burst
allowance; there is no daily quota. The transaction must already be mined — to
trace a transaction you have not yet sent, simulate it first.

## Parameters

One positional parameter.

| Name | Type | Required | Description |
|---|---|---|---|
| `txHash` | string | yes | The `0x`-prefixed 32-byte hash of the transaction to trace. The transaction must already be mined into a block. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_transaction",
    "params": [
      "0x5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a"
    ]
  }'
```

## Response

The result is an array of action traces. The first entry (with an empty
`traceAddress`) is the top-level call; subsequent entries are internal frames,
ordered by their position in the call tree.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "action": {
        "callType": "call",
        "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
        "to": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
        "value": "0x0",
        "gas": "0x33450",
        "input": "0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000"
      },
      "result": {
        "gasUsed": "0x1a2b3",
        "output": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"
      },
      "subtraces": 1,
      "traceAddress": [],
      "type": "call",
      "blockHash": "0x9c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6",
      "blockNumber": 19500000,
      "transactionHash": "0x5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a",
      "transactionPosition": 42
    },
    {
      "action": {
        "callType": "call",
        "from": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
        "to": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "value": "0x0",
        "gas": "0x2c1a0",
        "input": "0x23b872dd"
      },
      "result": {
        "gasUsed": "0x5b8d",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
      },
      "subtraces": 0,
      "traceAddress": [0],
      "type": "call",
      "blockHash": "0x9c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6",
      "blockNumber": 19500000,
      "transactionHash": "0x5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a",
      "transactionPosition": 42
    }
  ]
}
```

A frame that failed has its `result` replaced by an `error` string and omits the
`result` object — for example `"error": "Reverted"`.

### Response fields

Each element of the array is a trace object:

| Field | Type | Description |
|---|---|---|
| `action` | object | What this frame attempted to do. Its fields depend on `type` (see below). |
| `result` | object | Outcome of the frame on success. Contains `gasUsed` (hex) and, for calls, `output` (hex return data); for `create` frames, the new contract `address` and deployed `code`. Absent when the frame failed. |
| `error` | string | Present only when the frame failed (e.g. `Reverted`, `Out of gas`). Replaces `result`. |
| `subtraces` | integer | Number of direct child frames spawned by this frame. |
| `traceAddress` | array | Path of child indices from the root to this frame. `[]` is the top-level call; `[0]` is its first child; `[0,1]` is the second child of that child. |
| `type` | string | Frame kind: `call`, `create`, or `suicide` (self-destruct). |
| `blockHash` | string | Hash of the block containing the transaction. |
| `blockNumber` | integer | Number of the block containing the transaction. |
| `transactionHash` | string | Hash of the transaction being traced. |
| `transactionPosition` | integer | Index of the transaction within its block. |

For `type: "call"`, `action` contains `callType` (`call`, `delegatecall`,
`staticcall`, or `callcode`), `from`, `to`, `value`, `gas`, and `input`. For
`type: "create"`, it contains `from`, `value`, `gas`, and `init` (the creation
bytecode). For `type: "suicide"`, it contains `address`, `refundAddress`, and
`balance`.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `trace`-namespace method is not enabled for it. The `error.data` carries `current_tier`, `required_tier`, and `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's request rate (5 RPS sustained · up to 10 burst on Pro, 15 RPS sustained · up to 30 burst on Business) including burst. Honor the `Retry-After` header / `error.data.retry_after_sec` and retry after a short back-off. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance. An unknown or not-yet-mined `txHash` returns
an empty `result` array rather than an error.

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
    method: "trace_transaction",
    params: ["0x5b8d2a3c9f1e7b04c6f2a1d8e3047b9a6c1f0e2d4b8a7c5e9f3a1d2c4b6e8f0a"],
  }),
});

const { result } = await res.json();
for (const t of result) {
  console.log(t.traceAddress.join("."), t.type, t.action.to, t.result?.gasUsed);
}
```

## Notes

- **Flat vs. nested.** `trace_transaction` returns a flat, value-oriented list;
  if you want a nested call tree or opcode-level detail instead, use
  [`debug_traceTransaction`](./debug_traceTransaction.md) with `callTracer` or the
  struct logger.
- **Reconstructing the tree.** Rebuild the hierarchy from `traceAddress`: an entry
  with `traceAddress: [0, 2]` is the third child of the first child of the root.
  `subtraces` tells you how many direct children to expect for each frame.
- **Internal ETH transfers.** Sum the `action.value` of every frame to account for
  all ETH movement, including transfers made by internal calls that
  [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) does not expose.
- To trace every transaction in a block instead of one, use the block-level
  trace methods; to filter traces across a range of blocks by address, use
  `trace_filter`.
- Internal ether transfers emit no log; see [why internal ETH transfers are not in logs](https://triport.io/learn/internal-transactions-not-in-logs).
