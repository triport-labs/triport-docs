> Live version: https://triport.io/docs/eth/json-rpc/eth_getBlockReceipts

# eth_getBlockReceipts

> Returns the transaction receipts for every transaction in a single block, in one call.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockReceipts` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockReceipts` returns an array containing the receipt of **every**
transaction in the specified block. It accepts a single block identifier — a
named tag (`latest`, `safe`, `finalized`, `earliest`, `pending`) or a
`0x`-prefixed hex block number — and returns one receipt object per transaction,
in the order the transactions appear in the block.

Use this method whenever you need the receipts for a whole block. Fetching them
this way is far more efficient than calling
[`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) once per
transaction: a busy block can hold hundreds of transactions, and a single
`eth_getBlockReceipts` call replaces all of those round-trips with one request.
This makes it the preferred building block for indexers, log scanners, and
anything that reconciles on-chain state block by block.

If the block has no transactions the result is an empty array (`[]`); if the
block does not exist the result is `null`.

## Parameters

A single positional parameter — the block identifier.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | `string` | yes | Block number as a `0x`-prefixed hex string (e.g. `0x149e2c1`), or one of the tags `latest`, `safe`, `finalized`, `earliest`, `pending`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockReceipts",
    "params": ["0x149e2c1"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "blockHash": "0xb6e2f1c8...d41a",
      "blockNumber": "0x149e2c1",
      "transactionHash": "0x9d0e1f...77c2",
      "transactionIndex": "0x0",
      "from": "0x4e83362442b8d1bec281594cea3050c8eb01311c",
      "to": "0x6b175474e89094c44da98b954eedeac495271d0f",
      "cumulativeGasUsed": "0xa4f8",
      "gasUsed": "0xa4f8",
      "effectiveGasPrice": "0x59682f0e",
      "contractAddress": null,
      "logs": [
        {
          "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
          "topics": [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000004e83362442b8d1bec281594cea3050c8eb01311c",
            "0x000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4"
          ],
          "data": "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
          "blockNumber": "0x149e2c1",
          "transactionHash": "0x9d0e1f...77c2",
          "transactionIndex": "0x0",
          "blockHash": "0xb6e2f1c8...d41a",
          "logIndex": "0x0",
          "removed": false
        }
      ],
      "logsBloom": "0x00000000000000000000000000000000...",
      "status": "0x1",
      "type": "0x2"
    }
  ]
}
```

### Response fields

`result` is an array of receipt objects (or `null` if the block is not found).
Each receipt contains:

| Field | Type | Description |
|---|---|---|
| `blockHash` | `string` | Hash of the block this receipt belongs to. |
| `blockNumber` | `string` | Block number, hex-encoded. |
| `transactionHash` | `string` | Hash of the transaction. |
| `transactionIndex` | `string` | Index of the transaction within the block, hex-encoded. |
| `from` | `string` | Sender address. |
| `to` | `string` | Recipient address, or `null` for contract-creation transactions. |
| `cumulativeGasUsed` | `string` | Total gas used in the block up to and including this transaction, hex-encoded. |
| `gasUsed` | `string` | Gas used by this transaction alone, hex-encoded. |
| `effectiveGasPrice` | `string` | Actual gas price paid per unit, hex-encoded (wei). |
| `contractAddress` | `string \| null` | Address of the created contract, or `null` if the transaction was not a contract creation. |
| `logs` | `array` | Log objects emitted by the transaction. |
| `logsBloom` | `string` | Bloom filter for quick log lookups. |
| `status` | `string` | `0x1` on success, `0x0` if the transaction reverted. |
| `type` | `string` | Transaction type (`0x0` legacy, `0x1` access-list, `0x2` EIP-1559). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |

See [errors.md](../../errors.md) for the full error envelope and handling guidance.

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
    method: "eth_getBlockReceipts",
    params: ["latest"],
  }),
});

const { result } = await res.json();
console.log(`${result.length} receipts in the latest block`);
```

## Notes

- The result preserves transaction order, so `result[i]` corresponds to the
  transaction at `transactionIndex` `i` in the block.
- Prefer this over a fan-out of [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md)
  calls when you need a whole block — it is one request instead of N and counts
  as a single hit against your RPS budget.
- An empty block returns `[]`; a non-existent block returns `null`. Always
  null-check before iterating.
- All numeric fields are `0x`-prefixed hex strings — convert with base 16 before
  arithmetic.
- Available on the **Free** trial (`eth_read_rpc` category). Rate limiting is
  RPS-per-tier with burst; there is no daily quota. An HTTP `429` `rate_limited`
  error means you should back off and retry shortly.
- To list the transactions before fetching their receipts, see
  [`eth_getBlockByNumber`](./eth_getBlockByNumber.md).
