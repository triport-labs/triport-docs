> Live version: https://triport.io/docs/eth/json-rpc/trace_replayBlockTransactions

# trace_replayBlockTransactions

> Re-executes every transaction in a block and returns a full execution trace — call graph, optional VM-level steps, and state changes — for each one.

| | |
|---|---|
| **Method / Endpoint** | `trace_replayBlockTransactions` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_trace` |
| **Tier / rate limit** | pro (5 RPS sustained · up to 10 burst) · business (15 RPS sustained · up to 30 burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`trace_replayBlockTransactions` replays all transactions in a single block in
order, against the state as it existed at that block, and returns one trace
result per transaction. Unlike a plain receipt, the result can include the full
internal call tree, a step-by-step virtual-machine trace, and the set of state
slots each transaction read and wrote.

You choose how much detail to return with the `traceTypes` array. Request only
what you need: `vmTrace` in particular produces very large payloads (one entry
per executed opcode) and is the most expensive mode to compute. For most
call-graph analysis, `["trace"]` alone is enough.

Use this method for block-level forensics — reconstructing internal transfers,
auditing MEV activity, or diffing state across a whole block — when per-transaction
calls would be too chatty. This is a `pro`-tier method; requests authenticated
with a lower tier are rejected with HTTP `403` `tier_insufficient`.

## Parameters

Positional params array: `[block, traceTypes]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | Block to replay. A hex block number (`"0x1387f23"`), a 32-byte block hash, or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. |
| `traceTypes` | string[] | yes | Which traces to produce. Any combination of `"trace"` (internal call tree), `"vmTrace"` (per-opcode VM steps), and `"stateDiff"` (state read/write deltas). At least one is required. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_replayBlockTransactions",
    "params": ["0x1387f23", ["trace", "vmTrace", "stateDiff"]]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "transactionHash": "0x3f8e...c21a",
      "output": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "trace": [
        {
          "action": {
            "callType": "call",
            "from": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            "to": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
            "gas": "0x2d6b0",
            "input": "0x38ed1739",
            "value": "0x0"
          },
          "result": {
            "gasUsed": "0x1a2c4",
            "output": "0x"
          },
          "subtraces": 2,
          "traceAddress": [],
          "type": "call"
        }
      ],
      "vmTrace": {
        "code": "0x6080604052...",
        "ops": [
          {
            "pc": 0,
            "cost": 3,
            "ex": { "mem": null, "push": ["0x80"], "store": null, "used": 186776 },
            "sub": null
          }
        ]
      },
      "stateDiff": {
        "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": {
          "balance": {
            "*": { "from": "0x1bc16d674ec80000", "to": "0x1bc16d674ec7f000" }
          },
          "code": "=",
          "nonce": "=",
          "storage": {}
        }
      }
    }
  ]
}
```

### Response fields

`result` is an array with one entry per transaction in the block, in execution
order. Each entry contains:

| Field | Type | Description |
|---|---|---|
| `transactionHash` | string | Hash of the replayed transaction. |
| `output` | string | Hex-encoded return data of the top-level call. |
| `trace` | object[] \| null | Flat list of call-tree frames. `null` unless `"trace"` was requested. |
| `trace[].action` | object | The call/create/suicide being performed (`callType`, `from`, `to`, `gas`, `input`, `value`). |
| `trace[].result` | object | Outcome of the frame (`gasUsed`, `output`). |
| `trace[].subtraces` | number | Number of direct child frames. |
| `trace[].traceAddress` | number[] | Path of this frame within the call tree. |
| `vmTrace` | object \| null | Per-opcode VM execution. `null` unless `"vmTrace"` was requested. |
| `vmTrace.ops[]` | object[] | One entry per executed opcode (`pc`, `cost`, `ex`, `sub`). |
| `stateDiff` | object \| null | Per-address state deltas keyed by address. `null` unless `"stateDiff"` was requested. |
| `stateDiff.<addr>.balance` / `.nonce` / `.code` / `.storage` | object \| string | `"="` means unchanged; `{ "*": { "from", "to" } }` describes a change; `{ "+": v }` an addition. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | The API key's tier is below `pro`. |
| `429` | `rate_limited` | RPS limit for your tier exceeded (5 RPS sustained · up to 10 burst pro, 15 RPS sustained · up to 30 burst business). Back off and retry. |
| `-32602` | Invalid params | Missing/malformed `block`, or `traceTypes` empty or containing an unknown type. |
| `-32000` | Resource not found | The requested block does not exist or is not yet available. |

All errors use the shared JSON-RPC error envelope — see [errors.md](../../errors.md)
for the full structure and retry guidance.

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
    method: "trace_replayBlockTransactions",
    params: ["0x1387f23", ["trace", "stateDiff"]],
  }),
});

const { result } = await res.json();
console.log(`${result.length} transactions replayed`);
```

## Notes

- **Cost scales with what you ask for.** `vmTrace` emits one record per opcode
  and can return megabytes for a busy block; request it only when you need
  opcode-level detail. `["trace"]` is the cheapest useful mode.
- **Ordering.** Results are returned in block execution order, so the array index
  aligns with each transaction's position in the block.
- **Related methods.** To replay arbitrary transactions instead of a whole
  block, see trace_replayTransaction. For a
  single confirmed transaction's call tree, see
  [trace_transaction](./trace_transaction.md). To filter traces across a block
  range by address, see [trace_filter](./trace_filter.md).
