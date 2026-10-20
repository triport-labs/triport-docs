> Live version: https://triport.io/docs/eth/json-rpc/eth_getLogs

# eth_getLogs

> Returns the array of event logs matching a filter — by block range or block hash, contract address, and indexed topics.

| | |
|---|---|
| **Method / Endpoint** | `eth_getLogs` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free+ — 10 / 20 / 100 / 250 RPS sustained · short burst 20 / 40 / 200 / 500 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getLogs` returns all event logs emitted on-chain that match a single
**filter object**. It is the workhorse for indexing contract activity:
ERC-20 `Transfer`s, swaps, mints, governance events — anything emitted with
`LOG0`–`LOG4`.

You select logs in one of two mutually exclusive ways:

- **By block range** — set `fromBlock` and `toBlock` (tags or hex block
  numbers). The range is inclusive on both ends.
- **By a single block** — set `blockHash` to pin the query to exactly one
  block. `blockHash` cannot be combined with `fromBlock`/`toBlock`.

Within that window you narrow further by `address` (one or many contracts) and
by `topics` (the indexed event signature and arguments). The result is a flat,
chronologically ordered array of log objects; an empty array means nothing
matched (this is **not** an error).

This is a read method available from the **Free** trial. For very large historic
sweeps, page through the chain in bounded block windows rather than requesting
the full history in one call (see [Notes](./eth_getLogs.md#notes)).

## Parameters

JSON-RPC `params` is a positional array with a single element: `[filter]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | object | yes | The filter selecting which logs to return (see below). |

### `filter` object

| Field | Type | Required | Description |
|---|---|---|---|
| `fromBlock` | string | no | Start of the block range (inclusive). Hex block number (`"0x10d4f00"`) or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. Defaults to `latest`. |
| `toBlock` | string | no | End of the block range (inclusive). Same format as `fromBlock`. Defaults to `latest`. |
| `address` | string \| string[] | no | A contract address, or an array of addresses, to restrict logs to. When omitted, logs from any contract match. |
| `topics` | (string \| string[] \| null)[] | no | Ordered topic filters (up to 4). See AND/OR semantics below. |
| `blockHash` | string | no | Restrict the query to the single block with this 32-byte hash. **Mutually exclusive** with `fromBlock`/`toBlock`. |

### Topic AND/OR semantics

`topics` is a positional array — position `0` is the event signature hash,
positions `1`–`3` are the indexed arguments, in order. Matching rules:

- **`null`** at a position matches **any** value there (wildcard).
- **A single string** at a position must match **exactly** (logical **AND**
  across positions).
- **An array of strings** at a position matches if **any** one of them is
  present (logical **OR** within that position).

Examples:

| `topics` value | Matches |
|---|---|
| `[]` or omitted | Any log. |
| `["0xddf2…ef3b"]` | Logs whose first topic is `0xddf2…ef3b` (e.g. ERC-20 `Transfer`). |
| `[A, B]` | First topic is `A` **and** second topic is `B`. |
| `[A, [B, C]]` | First topic is `A` **and** second topic is `B` **or** `C`. |
| `[null, B]` | Any first topic **and** second topic is `B`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getLogs",
    "params": [{
      "fromBlock": "0x10d4f00",
      "toBlock": "0x10d4f10",
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      ]
    }]
  }'
```

The filter above returns USDT (`0xdAC1…1ec7`) `Transfer` events across a
17-block window.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d",
        "0x000000000000000000000000a9d1e08c7793af67e9d92fe308d5697fb81d3e43"
      ],
      "data": "0x000000000000000000000000000000000000000000000000000000003b9aca00",
      "blockNumber": "0x10d4f03",
      "blockHash": "0x9b8c1f5a7c2e0d4b6f3a1e8d2c5b7a90e4f6d3c1b8a2095e7d4c3b6a1f0e9d8c7",
      "transactionHash": "0x2f1c8e4d6b3a9072f5e1d8c4b6a3092e7f1d5c8b4a6093e2f7d1c5b8a4e6093f2",
      "transactionIndex": "0x2b",
      "logIndex": "0x4e",
      "removed": false
    }
  ]
}
```

### Response fields

`result` is an array of log objects. Each object has:

| Field | Type | Description |
|---|---|---|
| `address` | string | Contract that emitted the log. |
| `topics` | string[] | Indexed topics; `topics[0]` is the event signature hash, the rest are indexed arguments. |
| `data` | string | ABI-encoded non-indexed event arguments (0x-prefixed hex). `0x` if there are none. |
| `blockNumber` | string | Block number the log was included in (0x-prefixed hex). |
| `blockHash` | string | Hash of the block containing the log. |
| `transactionHash` | string | Hash of the transaction that produced the log. |
| `transactionIndex` | string | Index of that transaction within the block (hex). |
| `logIndex` | string | Index of this log within the block (hex). |
| `removed` | boolean | `true` if the log was removed by a chain reorganization; `false` for a canonical log. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | More than your tier's RPS for `eth_read_rpc` (10 / 20 / 100 / 250). The body carries `limit_rps`, `retry_after_sec` and `upgrade_url` at the top level. |
| `401` | `unauthorized` | Missing or invalid API key. |
| `-32602` | Invalid params | The `filter` is malformed — e.g. `blockHash` combined with `fromBlock`/`toBlock`, or a badly formatted address/topic. |

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
    method: "eth_getLogs",
    params: [{
      fromBlock: "0x10d4f00",
      toBlock: "0x10d4f10",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      ],
    }],
  }),
});

const { result } = await res.json();
console.log(`Matched ${result.length} logs`);
for (const log of result) {
  console.log(`${log.blockNumber} ${log.transactionHash} logIndex=${log.logIndex}`);
}
```

## Notes

- **Block range vs. block hash:** supply either `fromBlock`/`toBlock` **or**
  `blockHash`, never both. `blockHash` is the precise way to read all logs from
  one specific block regardless of reorgs.
- **Bound your ranges:** very wide block windows (or unfiltered `address` +
  `topics`) can return large result sets and are slow. For historic indexing,
  walk the chain in fixed-size windows (e.g. a few thousand blocks per call)
  and accumulate results. There is no daily quota — pacing is RPS-per-tier with
  burst.
- **Reorgs:** logs from recent, non-finalized blocks may later be reorged out;
  such logs reappear in a subsequent query with `removed: true`. Query against
  the `finalized` tag when you need stability.
- **Empty result:** a filter that matches nothing returns `"result": []`, which
  is a success, not an error.
- **Related methods:** use
  [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) to pull every receipt
  (and its logs) for a block, [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md)
  for the logs of a single transaction, and
  [`eth_blockNumber`](./eth_blockNumber.md) to discover the current head before
  paging.
- **Empty result?** An empty `result` array is not an error — see
  [why eth_getLogs returns an empty array](https://triport.io/learn/eth-getlogs-empty-result)
  for the default block range, topic hashing and proxy-address mismatches.
