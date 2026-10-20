> Live version: https://triport.io/docs/eth/json-rpc/debug_traceBlockByHash

# debug_traceBlockByHash

> Replays every transaction in a block (identified by its hash) through the EVM and returns a trace for each one.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceBlockByHash` (JSON-RPC, `POST /v1/eth`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | pro (5 RPS sustained · up to 10 burst) · business (15 RPS sustained · up to 30 burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceBlockByHash` re-executes all transactions contained in the block with the
given hash and returns an EVM trace for each transaction, in block order. It is the
hash-addressed counterpart to [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md)
and produces the same per-transaction trace shape as
[`debug_traceTransaction`](./debug_traceTransaction.md).

Use it when you need to reconstruct exactly what happened inside a block — internal
calls, value transfers, reverts, and state changes — without tracing each transaction
individually. Common uses are indexing internal transactions, reconciling token
transfers, and post-mortem analysis of a failed or exploited block.

Tracing replays the full block against an archived state, so it is significantly more
expensive than a normal read. It is gated to the **pro** and **business** tiers and rate
limited more tightly than `eth_*` reads. Choose a tracer with the `tracer` option to
control the output: omit it for the raw opcode-level struct log, or pass a built-in
tracer such as `callTracer` (call tree) or `prestateTracer` (touched state) for a
compact, structured result.

## Parameters

Positional params array: `[blockHash, options]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | string | yes | 32-byte block hash, `0x`-prefixed hex. |
| `options` | object | no | Tracer selection and configuration. Omit for the default struct (opcode) logger. |

### `options` object

| Field | Type | Required | Description |
|---|---|---|---|
| `tracer` | string | no | Built-in tracer name: `callTracer` or `prestateTracer`. Omit for the default struct/opcode logger. |
| `tracerConfig` | object | no | Tracer-specific configuration (see below). |
| `timeout` | string | no | Per-block trace timeout as a Go duration string, e.g. `"30s"`. |

#### `callTracer`

Returns the call tree of each transaction: the top-level call and all nested internal
calls, with `from`, `to`, `value`, `gas`, `gasUsed`, `input`, `output`, and any `error`.

`tracerConfig`:

| Field | Type | Description |
|---|---|---|
| `onlyTopCall` | boolean | If `true`, only the top-level call is returned and nested calls are omitted. |
| `withLog` | boolean | If `true`, logs emitted by each call are included. |

#### `prestateTracer`

Returns the state (balance, nonce, code, storage) of every account touched while
executing each transaction.

`tracerConfig`:

| Field | Type | Description |
|---|---|---|
| `diffMode` | boolean | If `true`, returns `pre`/`post` state diffs instead of the full prestate. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_traceBlockByHash",
    "params": [
      "0xf3f3f3a1c2d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
      { "tracer": "callTracer" }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "txHash": "0x9a8b7c6d5e4f30211a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f7081",
      "result": {
        "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4",
        "to": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        "value": "0x0",
        "gas": "0x186a0",
        "gasUsed": "0xb2f8",
        "input": "0xa9059cbb0000000000000000000000004b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e0000000000000000000000000000000000000000000000000de0b6b3a7640000",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "type": "CALL",
        "calls": [
          {
            "from": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            "to": "0x4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
            "value": "0x0",
            "gas": "0x12a3c",
            "gasUsed": "0x1f4e",
            "type": "STATICCALL"
          }
        ]
      }
    },
    {
      "txHash": "0x2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f708192",
      "result": {
        "from": "0xc3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6",
        "to": "0xd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607",
        "value": "0xde0b6b3a7640000",
        "gas": "0x5208",
        "gasUsed": "0x5208",
        "input": "0x",
        "output": "0x",
        "type": "CALL"
      }
    }
  ]
}
```

### Response fields

`result` is an array with one entry per transaction in the block, in execution order.

| Field | Type | Description |
|---|---|---|
| `result[].txHash` | string | Hash of the traced transaction. |
| `result[].result` | object | The trace for that transaction. Shape depends on the selected `tracer`. |

For the `callTracer` shape, each `result` is a call frame:

| Field | Type | Description |
|---|---|---|
| `from` | string | Sender address of the call. |
| `to` | string | Recipient (or created contract) address. |
| `value` | string | Wei transferred, `0x`-hex. |
| `gas` | string | Gas provided to the call, `0x`-hex. |
| `gasUsed` | string | Gas consumed by the call, `0x`-hex. |
| `input` | string | Call input data. |
| `output` | string | Return data. |
| `type` | string | Opcode of the call: `CALL`, `STATICCALL`, `DELEGATECALL`, `CREATE`, etc. |
| `error` | string | Present only if the call reverted or failed. |
| `calls` | array | Nested child call frames (same shape). Omitted when there are none or `onlyTopCall` is set. |

With no `tracer`, each `result` is the default struct logger output (`gas`, `failed`,
`returnValue`, `structLogs[]`). With `prestateTracer`, each `result` maps touched
account addresses to their state.

## Errors

Errors use the shared JSON-RPC error envelope — see [errors.md](../../errors.md) for the
full structure.

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your plan is below the **pro** tier required for `eth_debug` methods. |
| `429` | `rate_limited` | You exceeded your tier's RPS for this method (5 RPS sustained · up to 10 burst on pro, 15 RPS sustained · up to 30 burst on business). |

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
    method: "debug_traceBlockByHash",
    params: [
      "0xf3f3f3a1c2d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e",
      { tracer: "callTracer", tracerConfig: { onlyTopCall: false } },
    ],
  }),
});

const { result } = await res.json();
console.log(`traced ${result.length} transactions`);
```

## Notes

- **Pick a tracer.** The default struct (opcode) logger produces a large `structLogs`
  array per transaction and is expensive to transfer; prefer `callTracer` or
  `prestateTracer` unless you specifically need opcode-level detail.
- **Block must exist.** Trace the block by number instead with
  [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md), or trace a single
  transaction with [`debug_traceTransaction`](./debug_traceTransaction.md).
- Tracing replays against archived state; very old or pruned state may not be available
  on all tiers.
- Rate limits are RPS-per-tier with burst — there is no daily quota.
