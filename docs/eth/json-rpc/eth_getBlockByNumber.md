> Live version: https://triport.io/docs/eth/json-rpc/eth_getBlockByNumber

# eth_getBlockByNumber

> Returns information about a block on the Ethereum chain, selected by block number or by a named block tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByNumber` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByNumber` returns the full block object for a given block, identified
either by a `0x`-prefixed hexadecimal block number or by one of the supported
named tags. It is the standard way to read a historical or current block,
including its header fields and its list of transactions.

The second parameter controls how much transaction detail comes back. When
`fullTransactions` is `false`, the `transactions` array contains only transaction
hashes (cheaper, smaller payload). When it is `true`, the array contains the
fully expanded transaction objects for every transaction in the block.

If no block matches the requested number or tag — for example a height that has
not been produced yet — the method returns `null` rather than an error. Always
handle the `null` case before reading fields off the result.

## Parameters

Pass a positional array of exactly two elements.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockParameter` | `string` | yes | A `0x`-prefixed hex block number (e.g. `0x149e2c1`) **or** one of the named tags: `latest`, `earliest`, `pending`, `safe`, `finalized`. |
| `fullTransactions` | `boolean` | yes | If `true`, returns full transaction objects in `transactions`. If `false`, returns only transaction hashes. |

**Accepted block tags**

| Tag | Meaning |
|---|---|
| `latest` | The most recent block the node has imported. |
| `earliest` | The genesis block (block `0x0`). |
| `pending` | The pending state/transactions not yet mined into a block. |
| `safe` | The latest block considered safe by the fork-choice rule. |
| `finalized` | The latest block that has reached finality. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockByNumber",
    "params": ["latest", false]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x149e2c1",
    "hash": "0x9c2b1a3f8e0d4c7b6a5f9e2d1c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b",
    "parentHash": "0x8b1a0f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a",
    "nonce": "0x0000000000000000",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0x7a3c8e1d2b4f6a9c0e8d7b5a3f1c2d4e6b8a0f9e7d5c3b1a2f4e6d8c0b9a7f5e",
    "receiptsRoot": "0x4b2c6d8e0f1a3c5b7d9e2f4a6c8b0d1e3f5a7c9b1d3e5f7a9c0b2d4e6f8a0c1b",
    "miner": "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
    "difficulty": "0x0",
    "totalDifficulty": "0xc70d815d562d3cfa955",
    "extraData": "0x6265617665726275696c642e6f7267",
    "size": "0x1a2b3",
    "gasLimit": "0x1c9c380",
    "gasUsed": "0xb8f9e2",
    "baseFeePerGas": "0x3b9aca00",
    "timestamp": "0x65f0a1c0",
    "transactions": [
      "0x2d6a7b8c9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b"
    ],
    "uncles": []
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `number` | `string` | Block number as a `0x`-prefixed hex string. `null` for pending blocks. |
| `hash` | `string` | 32-byte block hash. `null` for pending blocks. |
| `parentHash` | `string` | Hash of the parent block. |
| `nonce` | `string` | 8-byte proof-of-work nonce. `null` for pending blocks. |
| `sha3Uncles` | `string` | SHA3 of the uncles data in the block. |
| `logsBloom` | `string` | Bloom filter for the logs in the block. `null` for pending blocks. |
| `transactionsRoot` | `string` | Root of the transaction trie. |
| `stateRoot` | `string` | Root of the final state trie. |
| `receiptsRoot` | `string` | Root of the receipts trie. |
| `miner` | `string` | Address of the block's fee/coinbase recipient. |
| `difficulty` | `string` | Block difficulty (`0x0` post-merge). |
| `totalDifficulty` | `string` | Total difficulty of the chain up to this block. |
| `extraData` | `string` | Extra data field of the block. |
| `size` | `string` | Block size in bytes, hex-encoded. |
| `gasLimit` | `string` | Maximum gas allowed in the block. |
| `gasUsed` | `string` | Total gas used by all transactions in the block. |
| `baseFeePerGas` | `string` | Base fee per gas (post-EIP-1559 blocks). |
| `timestamp` | `string` | Unix timestamp of block collation, hex-encoded. |
| `transactions` | `array` | Transaction hashes (when `fullTransactions` is `false`) or full transaction objects (when `true`). |
| `uncles` | `array` | Array of uncle block hashes. |

The full result is `null` when no block matches the requested number or tag.

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
    method: "eth_getBlockByNumber",
    params: ["latest", false],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("block not found");
} else {
  console.log("block", parseInt(result.number, 16), "tx count:", result.transactions.length);
}
```

## Notes

- All numeric block fields (`number`, `gasUsed`, `timestamp`, etc.) are hex
  strings — convert with base 16 before arithmetic.
- A `null` result is normal, not an error: it means the requested block does not
  exist yet (e.g. a future height). Check for `null` before dereferencing.
- Setting `fullTransactions` to `true` substantially increases the response size
  on busy blocks; prefer `false` when you only need transaction hashes.
- `eth_getBlockByNumber` is available on the **Free** trial (`eth_read_rpc`
  category). Rate limiting is RPS-per-tier with burst; there is no daily quota.
  An HTTP `429` `rate_limited` error means you should back off and retry shortly.
- To find the current chain head before requesting a concrete block, call
  [eth_blockNumber](./eth_blockNumber.md). To look a block up by its hash instead
  of its number, use `eth_getBlockByHash`.
