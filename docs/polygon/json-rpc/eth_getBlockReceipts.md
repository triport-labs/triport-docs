> Live version: https://triport.io/docs/polygon/json-rpc/eth_getBlockReceipts

# eth_getBlockReceipts

> Returns every transaction receipt for a single Polygon block in one call — the fast path for block-level indexing.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockReceipts` (JSON-RPC, `POST /` ) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 rps · basic 20 rps · pro 100 rps · business 250 rps (per-tier RPS with burst; no daily cap) |

## Description

`eth_getBlockReceipts` returns the receipts for **all** transactions in a given
block as a single array. It is the bulk equivalent of calling
[`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) once per
transaction — but in a single round trip, which is dramatically faster when you
need to index or analyze a whole block (gas usage, event logs, contract
creations, status flags).

Use it when you are building an indexer, analytics pipeline, or block explorer
that processes every transaction in a block. For pulling only events that match
a filter (by address/topic), prefer
[`eth_getLogs`](./eth_getLogs.md) instead; for a single transaction's outcome,
use [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md).

**Gotchas to plan for:**

- **Payload-heavy.** A typical Polygon block carries 50–150 transactions, so a
  single response is commonly **50–300 KB**. Make sure your HTTP client and any
  intermediate proxy allow response bodies of that size and set generous read
  timeouts.
- **Block cadence.** Polygon block time is ~2.1 s, so `latest` advances roughly
  every two seconds. When polling the chain tip, align your interval to that
  cadence rather than hammering the endpoint.
- **Still cheaper than N calls.** Even though the response is large, one
  `eth_getBlockReceipts` call avoids the per-transaction network round-trips of
  `N×eth_getTransactionReceipt`, which is the main reason to use it for indexing.

## Parameters

A single positional parameter — a block number, block hash, or a named block tag.

| Position | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `block` | `string` | yes | Block to fetch receipts for. One of: a hex-encoded block number (e.g. `"0x3a1f2c0"`), a 32-byte block hash, or a tag — `"latest"`, `"earliest"`, `"pending"`, `"safe"`, or `"finalized"`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockReceipts",
    "params": ["latest"]
  }'
```

## Response

The `result` is an array of receipt objects — one per transaction, in the order
they appear in the block. (Trimmed to two receipts below; a real block returns
50–150.)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "blockHash": "0x9b8c1f3e2d4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e",
      "blockNumber": "0x3a1f2c0",
      "transactionHash": "0x4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d",
      "transactionIndex": "0x0",
      "from": "0x1a2b3c4d5e6f70819293a4b5c6d7e8f90a1b2c3d",
      "to": "0x7f5e6d4c3b2a1908f7e6d5c4b3a2918073645562",
      "contractAddress": null,
      "cumulativeGasUsed": "0x52f8",
      "gasUsed": "0x52f8",
      "effectiveGasPrice": "0x6fc23ac00",
      "logs": [],
      "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "status": "0x1",
      "type": "0x2"
    },
    {
      "blockHash": "0x9b8c1f3e2d4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e",
      "blockNumber": "0x3a1f2c0",
      "transactionHash": "0x60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f",
      "transactionIndex": "0x1",
      "from": "0x2b3c4d5e6f70819293a4b5c6d7e8f90a1b2c3d4e",
      "to": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "contractAddress": null,
      "cumulativeGasUsed": "0xc350",
      "gasUsed": "0x7058",
      "effectiveGasPrice": "0x6fc23ac00",
      "logs": [
        {
          "address": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000002b3c4d5e6f70819293a4b5c6d7e8f90a1b2c3d4e",
            "0x0000000000000000000000007f5e6d4c3b2a1908f7e6d5c4b3a2918073645562"
          ],
          "data": "0x00000000000000000000000000000000000000000000000000000000000f4240",
          "blockNumber": "0x3a1f2c0",
          "transactionHash": "0x60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f",
          "transactionIndex": "0x1",
          "blockHash": "0x9b8c1f3e2d4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e",
          "logIndex": "0x0",
          "removed": false
        }
      ],
      "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "status": "0x1",
      "type": "0x2"
    }
  ]
}
```

### Response fields

Each element of the `result` array is a transaction receipt:

| Field | Type | Description |
|---|---|---|
| `blockHash` | `string` | Hash of the block containing the transaction. |
| `blockNumber` | `string` | Hex block number. |
| `transactionHash` | `string` | Hash of the transaction. |
| `transactionIndex` | `string` | Hex index of the transaction within the block. |
| `from` | `string` | Sender address. |
| `to` | `string \| null` | Recipient address; `null` for contract-creation transactions. |
| `contractAddress` | `string \| null` | Address of the contract created, or `null` if the transaction was not a contract creation. |
| `cumulativeGasUsed` | `string` | Total gas used in the block up to and including this transaction (hex). |
| `gasUsed` | `string` | Gas used by this transaction alone (hex). |
| `effectiveGasPrice` | `string` | Actual gas price paid per unit, in wei (hex). |
| `logs` | `array` | Event logs emitted by the transaction. |
| `logsBloom` | `string` | Bloom filter over the logs for quick membership tests. |
| `status` | `string` | `"0x1"` on success, `"0x0"` on revert. |
| `type` | `string` | Transaction type (`"0x0"` legacy, `"0x2"` EIP-1559, etc.). |

Each entry in `logs[]` contains `address`, `topics`, `data`, `blockNumber`,
`transactionHash`, `transactionIndex`, `blockHash`, `logIndex`, and `removed`.

## Errors

Errors are returned in the standard JSON-RPC envelope (`error.code`,
`error.message`, optional `error.data`). See [errors.md](../../errors.md) for the
full envelope and the `data` fields attached to tier/rate-limit errors.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `403` | `tier_insufficient` | The key's tier does not include the `polygon_read_rpc` capability. |
| `429` | `rate_limited` | Per-tier RPS exceeded; retry after `data.retry_after_sec`. |
| `401` | `subscription_expired` | The paid subscription lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | Method not available on this network/key. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBlockReceipts",
    params: ["latest"],
  }),
});

const { result: receipts } = await res.json();
const totalGas = receipts.reduce((sum, r) => sum + BigInt(r.gasUsed), 0n);
console.log(`${receipts.length} receipts, ${totalGas} gas used`);
```

## Notes

- **Indexing pattern.** To backfill a range of blocks, iterate block numbers and
  call `eth_getBlockReceipts` once per block rather than fanning out
  `eth_getTransactionReceipt` per transaction — fewer round trips, far less
  overhead. Pace your loop against your tier's RPS limit and handle HTTP `429`
  with the `retry_after_sec` hint.
- **Related methods:**
  [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) (single receipt),
  [`eth_getLogs`](./eth_getLogs.md) (filtered events across a block range),
  [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) (block header and
  transaction list).
- **No pagination.** The full block's receipts are returned in one response;
  size scales with the number of transactions in the block.
