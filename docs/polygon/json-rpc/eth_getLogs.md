> Live version: https://triport.io/docs/polygon/json-rpc/eth_getLogs

# eth_getLogs

> Returns the array of event logs on Polygon matching a filter — by block range, contract address, and indexed topics.

| | |
|---|---|
| **Method / Endpoint** | `eth_getLogs` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free+ — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getLogs` returns all event logs emitted on Polygon that match a single
**filter object**. It is the primary event-indexing primitive: ERC-20
`Transfer`s, DEX swaps, mints, bridge events — anything emitted with `LOG0`–`LOG4`
on Polygon mainnet (Bor consensus).

You select logs in one of two mutually exclusive ways:

- **By block range** — set `fromBlock` and `toBlock` (tags or hex block
  numbers). The range is inclusive on both ends.
- **By a single block** — set `blockHash` to pin the query to exactly one
  block. `blockHash` cannot be combined with `fromBlock`/`toBlock`.

Within that window you narrow further by `address` (one or many contracts) and
by `topics` (the indexed event signature and arguments). The result is a flat,
chronologically ordered array of log objects; an empty array means nothing
matched (this is **not** an error).

This is a read method available from the **Free** trial. Polygon's block time is
~2.1 s, so a given wall-clock window covers roughly 6× more blocks than the same
window on Ethereum — keep ranges bounded. For high-frequency Polygon event
streams (e.g. Uniswap-style swaps can exceed 10,000 events/minute) prefer a
WebSocket subscription over polling `eth_getLogs` (see [Notes](./eth_getLogs.md#notes)).

## Parameters

JSON-RPC `params` is a positional array with a single element: `[filter]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | object | yes | The filter selecting which logs to return (see below). |

### `filter` object

| Field | Type | Required | Description |
|---|---|---|---|
| `fromBlock` | string | no | Start of the block range (inclusive). Hex block number (`"0x3658060"`) or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. Defaults to `latest`. |
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
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getLogs",
    "params": [{
      "fromBlock": "0x3658060",
      "toBlock": "0x3658070",
      "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      ]
    }]
  }'
```

The filter above returns USDC.e (`0x2791…4174`) `Transfer` events across a
17-block window on Polygon.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "address": "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x000000000000000000000000a5e0829caced8ffdd4de3c43696c57f7d7a678ff",
        "0x0000000000000000000000001b02da8cb0d097eb8d57a175b88c7d8b47997506"
      ],
      "data": "0x000000000000000000000000000000000000000000000000000000000098967f",
      "blockNumber": "0x3658061",
      "blockHash": "0x9b8c1f5a7c2e0d4b6f3a1e8d2c5b7a90e4f6d3c1b8a2095e7d4c3b6a1f0e9d8c7",
      "transactionHash": "0x2f1c8e4d6b3a9072f5e1d8c4b6a3092e7f1d5c8b4a6093e2f7d1c5b8a4e6093f2",
      "transactionIndex": "0x14",
      "logIndex": "0x2c",
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
| `403` | `tier_insufficient` | The key's tier is below what the method requires. `eth_getLogs` itself is included in the Free trial, so this surfaces only when the key has no qualifying tier at all. |
| `429` | `rate_limited` | More than your tier's RPS for `polygon_read_rpc` (15 / 20 / 100 / 250). The error `data` carries `limit_rps`, `retry_after_sec`, and `upgrade_url`. |
| `401` | `subscription_expired` | The API key's subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid `Authorization: Bearer` key. |
| HTTP `403` | `method_unknown` | `eth_getLogs` was not recognized on the resolved Polygon route. |

A malformed filter — e.g. `blockHash` combined with `fromBlock`/`toBlock`, a
badly formatted address or topic, or a block range that exceeds the provider's
limit — is rejected with the standard `-32602` invalid-params error.

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
    method: "eth_getLogs",
    params: [{
      fromBlock: "0x3658060",
      toBlock: "0x3658070",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
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
- **Bound your ranges:** a maximum block span per call applies, and very wide
  windows (or unfiltered `address` + `topics`) can return large result sets and
  are slow. For historic indexing, walk the chain in fixed-size windows (e.g. a
  couple of thousand blocks per call) and accumulate results. There is no daily
  quota — pacing is RPS-per-tier with burst.
- **Polygon block time:** at ~2.1 s per block, ranges grow quickly in wall-clock
  terms — a one-hour window is roughly 1,700 blocks. Size windows by block
  count, not by time.
- **High-frequency events:** for real-time indexing of hot contracts (DEX swaps,
  bridges) polling `eth_getLogs` will lag and miss bursts. Use a WebSocket
  `eth_subscribe` / `logs` subscription instead and reserve `eth_getLogs` for
  backfill and historic queries.
- **Reorgs:** logs from recent, non-finalized blocks may later be reorged out;
  such logs reappear in a subsequent query with `removed: true`. Query against
  the `finalized` tag when you need stability — Bor finality lands a few epochs
  back.
- **Empty result:** a filter that matches nothing returns `"result": []`, which
  is a success, not an error.
- **Related methods:** use
  [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) to pull every receipt
  (and its logs) for a block, [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md)
  for the logs of a single transaction, and
  [`eth_blockNumber`](./eth_blockNumber.md) to discover the current head before
  paging.
