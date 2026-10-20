> Live version: https://triport.io/docs/polygon/json-rpc/trace_filter

# trace_filter

> **Unavailable.** This method is absent from the executable Polygon catalog. Range and address filtering require a trace index that this interface does not provide. The reference below is historical and must not be used as a claim of current support.

> Returns all Polygon transaction traces (call frames) across a range of blocks that match an optional sender/recipient filter, with cursor-style pagination.

| | |
|---|---|
| **Method / Endpoint** | `trace_filter` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_trace` |
| **Tier / rate limit** | Pro — 3 rps · Business — 10 rps (burst above sustained) |

## Description

`trace_filter` scans a contiguous range of Polygon blocks and returns every
trace (internal `call`, `create`, or `suicide` frame) whose sender and/or
recipient match the supplied filter. Unlike [`trace_block`](./trace_block.md) —
which is keyed to a single block — or [`trace_transaction`](./trace_transaction.md)
— which is keyed to one transaction hash — `trace_filter` lets you sweep a window
of history and narrow it down by address. It is the right tool for building an
account's incoming/outgoing internal-transfer history, or for indexing all
activity that touched a particular contract.

This is the **Parity-style** tracer. Note that Polygon's Bor client can emit a
slightly different frame shape than vanilla Geth-Parity (for example `call` vs
`delegatecall` mapping), so an indexer should be tolerant of both. If you also
consume the Geth-style [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md),
its output schema differs and your decoder must handle each shape separately.

Because a single block range can produce a very large number of traces, results
are paginated with the `after` (offset) and `count` (limit) fields and the
payload grows roughly **linearly with the block range**. Keep ranges modest and
page through large result sets rather than requesting a huge window in one call.

This method requires the **Pro** tier. Calls authenticated with a lower-tier key
are rejected with HTTP `403` `tier_insufficient`.

## Parameters

A single positional parameter: a **filter object**.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | object | yes | Trace filter criteria (see fields below). |

### `filter` object fields

| Field | Type | Required | Description |
|---|---|---|---|
| `fromBlock` | quantity | no | First block to scan, as a **hex block number** (e.g. `"0x2faf080"`). Defaults to the latest block if omitted. |
| `toBlock` | quantity | no | Last block to scan, inclusive, as a **hex block number**. Defaults to the latest block. |
| `fromAddress` | array of address | no | Only return traces sent **from** one of these addresses. Omit to match any sender. |
| `toAddress` | array of address | no | Only return traces sent **to** one of these addresses. Omit to match any recipient. |
| `after` | integer | no | Pagination offset — number of matching traces to skip before returning results. Defaults to `0`. |
| `count` | integer | no | Pagination limit — maximum number of traces to return. Omit to return all matches in the range. |

> **Numeric blocks only.** On Polygon, `trace_filter` requires `fromBlock` /
> `toBlock` to be **numeric hex block values** — block tags such as `"latest"`,
> `"earliest"`, or `"pending"` are rejected with `-32602 invalid params`. Resolve
> a tag to a concrete number with [`eth_blockNumber`](./eth_blockNumber.md) first,
> then pass the hex number.

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "trace_filter",
    "params": [{
      "fromBlock": "0x2faf080",
      "toBlock": "0x2faf090",
      "fromAddress": ["0x8d12a197cb00d4747a1fe03395095ce2a5cc6819"],
      "after": 0,
      "count": 100
    }]
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
        "from": "0x8d12a197cb00d4747a1fe03395095ce2a5cc6819",
        "callType": "call",
        "gas": "0x4c40",
        "input": "0xa9059cbb",
        "to": "0x4f76e3b3cd2cf3a23e0c11a9f6f5f29c5e3f1f0a",
        "value": "0x16345785d8a0000"
      },
      "blockHash": "0x9c7e1f5c0e1d2a3b4c5d6e7f8091a2b3c4d5e6f70819a2b3c4d5e6f7081920a3b",
      "blockNumber": 50000000,
      "result": {
        "gasUsed": "0x2982",
        "output": "0x0000000000000000000000000000000000000000000000000000000000000001"
      },
      "subtraces": 0,
      "traceAddress": [],
      "transactionHash": "0x17104ac9d3312d8c136b7f44d4b8b47852618065ebfa534bd2d3b5ef218ca1f3",
      "transactionPosition": 11,
      "type": "call"
    }
  ]
}
```

### Response fields

`result` is an array of trace objects. Each object contains:

| Field | Type | Description |
|---|---|---|
| `action` | object | Details of the call frame: `from`, `to`, `value`, `gas`, `input`, and `callType` (`call` / `delegatecall` / `staticcall`). For `create` traces, `init` and `creationMethod` appear instead; for `suicide`, `address`, `refundAddress`, and `balance`. |
| `result` | object | Outcome of the frame: `gasUsed` and `output` (or `address` + `code` for a `create`). Absent when `error` is present. |
| `error` | string | Present instead of `result` when the frame reverted (e.g. `"Reverted"`, `"out of gas"`). |
| `blockHash` | string | Hash of the block containing the trace. |
| `blockNumber` | integer | Number of the block containing the trace. |
| `subtraces` | integer | Number of child traces directly under this frame. |
| `traceAddress` | array of integer | Path of the frame within the call tree (empty for a top-level call). |
| `transactionHash` | string | Hash of the transaction that produced this trace. |
| `transactionPosition` | integer | Index of that transaction within its block. |
| `type` | string | Frame type: `call`, `create`, or `suicide`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; upgrade to call `trace_filter`. |
| `429` | `rate_limited` | You exceeded your tier's request rate (Pro 3 rps / Business 10 rps); retry after a short backoff. |
| `-32602` | `invalid params` | A block field used a tag (`"latest"` / `"earliest"` / `"pending"`) instead of a numeric hex block, or the filter object was otherwise malformed. |

These follow the standard Triport JSON-RPC error envelope — see the shared
[errors reference](../../errors.md) for the full response shape, HTTP status
mapping, and retry guidance.

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
    method: "trace_filter",
    params: [{
      fromBlock: "0x2faf080",
      toBlock: "0x2faf090",
      toAddress: ["0x4f76e3b3cd2cf3a23e0c11a9f6f5f29c5e3f1f0a"],
      after: 0,
      count: 100,
    }],
  }),
});
const { result } = await res.json();
console.log(`${result.length} traces`);
```

## Notes

* **Numeric blocks, not tags.** This is the most common cause of a `-32602` on
  Polygon `trace_filter`. Always resolve `"latest"` to a concrete block number
  (e.g. via [`eth_blockNumber`](./eth_blockNumber.md)) and pass the hex value.
* **Chunk wide ranges.** The response payload grows roughly linearly with the
  block range; a full-history filter in a single call can run to many megabytes.
  Iterate in fixed-size block windows (e.g. 100–1000 blocks) and paginate within
  each window rather than requesting one enormous range.
* **Pagination.** To page through a large result set, keep `count` fixed and
  advance `after` by `count` on each call (`after: 0`, then `after: 100`, …)
  until a page returns fewer than `count` traces. The result order is stable for
  a fixed block range.
* **Address filters are OR-within / AND-across.** Multiple entries in
  `fromAddress` match any of them; supplying both `fromAddress` and `toAddress`
  requires a trace to satisfy both sides.
* **Related methods:** [`trace_block`](./trace_block.md) for a single block,
  [`trace_transaction`](./trace_transaction.md) for one transaction,
  [`trace_call`](./trace_call.md) to trace a hypothetical call, and
  [`trace_replayBlockTransactions`](./trace_replayBlockTransactions.md) for a
  full block replay with state diff. All `trace_*` methods require the Pro tier.
