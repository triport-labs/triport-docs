> Live version: https://triport.io/docs/eth/json-rpc/trace_block

# trace_block

> Returns OpenEthereum-style action traces for every transaction in a single Ethereum block.

| | |
|---|---|
| **Method / Endpoint** | `trace_block` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_trace` |
| **Tier / rate limit** | Pro — 5 RPS sustained · up to 10 burst · Business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`trace_block` replays a block and returns the full set of OpenEthereum-style
**action traces** for all transactions it contains. Each trace describes a
single step of execution — a top-level call, an internal (nested) call, a
contract `create`, or a `suicide`/`selfdestruct` — along with the value moved,
gas used, and the trace's position in the call tree.

Use it when you need a block-wide view of internal value flow that is not
visible from receipts alone: indexing internal ETH transfers, reconstructing
contract-creation events, attributing gas across nested calls, or auditing MEV
activity. For a single transaction, prefer `trace_transaction`; to query traces
across a range with filters, use `trace_filter`.

This is a **Pro-tier** method in the `eth_trace` category. Tracing is
compute-heavy, so rate limits are lower than for plain reads — 5 RPS on Pro and
15 RPS on Business.

## Parameters

A single positional parameter.

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `block` | string | yes | Block to trace, as a hex-encoded block number (e.g. `"0x118b3c5"`) or a block tag (`"latest"`, `"earliest"`, `"pending"`, `"safe"`, `"finalized"`). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_block",
    "params": ["0x118b3c5"]
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
        "callType": "call",
        "from": "0x4f3a120e72c76c22ae802d129f599bfdbc31cb81",
        "to": "0x39755357759ce0d7f32dc8dc45414cca409ae24e",
        "gas": "0x13e99",
        "input": "0xa9059cbb000000000000000000000000...",
        "value": "0x0"
      },
      "blockHash": "0x9b3f...c2a1",
      "blockNumber": 18395077,
      "result": {
        "gasUsed": "0xb2d4",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
      },
      "subtraces": 1,
      "traceAddress": [],
      "transactionHash": "0xe1f2...8d3c",
      "transactionPosition": 0,
      "type": "call"
    },
    {
      "action": {
        "callType": "staticcall",
        "from": "0x39755357759ce0d7f32dc8dc45414cca409ae24e",
        "to": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "gas": "0x8fc",
        "input": "0x70a08231...",
        "value": "0x0"
      },
      "blockHash": "0x9b3f...c2a1",
      "blockNumber": 18395077,
      "result": {
        "gasUsed": "0x216",
        "output": "0x00000000000000000000000000000000000000000000000ad78ebc5ac6200000"
      },
      "subtraces": 0,
      "traceAddress": [0],
      "transactionHash": "0xe1f2...8d3c",
      "transactionPosition": 0,
      "type": "call"
    }
  ]
}
```

### Response fields

`result` is an array of trace objects, ordered by transaction position and then
by execution order within each transaction.

| Field | Type | Description |
|---|---|---|
| `action` | object | The operation performed. Shape depends on `type`. |
| `action.callType` | string | For `call` traces: `call`, `delegatecall`, `staticcall`, or `callcode`. |
| `action.from` | string | Sender address of this action. |
| `action.to` | string | Recipient address (calls only). |
| `action.value` | string | Wei transferred, hex-encoded. |
| `action.gas` | string | Gas provided to this action, hex-encoded. |
| `action.input` | string | Call data, hex-encoded (calls only). |
| `action.init` | string | Contract init bytecode (`create` traces only). |
| `result` | object \| null | Outcome of the action; `null` when the action errored. |
| `result.gasUsed` | string | Gas consumed by this action, hex-encoded. |
| `result.output` | string | Returned data, hex-encoded (calls only). |
| `result.address` | string | Address of the newly deployed contract (`create` traces only). |
| `error` | string | Present instead of `result` when the action reverted or failed (e.g. `"Reverted"`, `"out of gas"`). |
| `subtraces` | number | Number of direct child actions. |
| `traceAddress` | number[] | Path of this trace within the call tree (empty for the top-level call). |
| `type` | string | `call`, `create`, or `suicide`. |
| `blockHash` | string | Hash of the traced block. |
| `blockNumber` | number | Number of the traced block. |
| `transactionHash` | string | Hash of the transaction this trace belongs to. |
| `transactionPosition` | number | Index of the transaction within the block. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your plan does not include the `eth_trace` category. Upgrade to **Pro** or **Business**. |
| `429` | `rate_limited` | You exceeded your tier's RPS for this method (5 RPS sustained · up to 10 burst Pro, 15 RPS sustained · up to 30 burst Business). Back off and retry. |
| `-32602` | Invalid params | The `block` argument is missing or not a valid hex number / block tag. |
| `-32000` | Block not found | The requested block does not exist on the canonical chain. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and retry guidance.

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
    method: "trace_block",
    params: ["0x118b3c5"],
  }),
});

const { result } = await res.json();
const internalTransfers = result.filter(
  (t) => t.type === "call" && t.action.value !== "0x0"
);
console.log(`${internalTransfers.length} value-bearing calls in block`);
```

## Notes

- **`traceAddress` reconstructs the call tree.** An empty array is the
  transaction's top-level call; `[0]` is its first child, `[0, 1]` is the
  second child of that child, and so on. Combined with `transactionPosition`
  you can rebuild each transaction's full execution graph.
- **Failed actions** carry an `error` field instead of `result`. A reverted
  top-level call still appears, along with whatever sub-traces ran before the
  revert.
- The result can be large for busy blocks (hundreds to thousands of traces);
  size your client buffers accordingly.
- Related methods: [`trace_transaction`](./trace_transaction.md) for a single
  transaction, [`trace_filter`](./trace_filter.md) to query traces by address
  and block range, and
  [`trace_replayBlockTransactions`](./trace_replayBlockTransactions.md) for
  traces plus state diffs and VM output.
