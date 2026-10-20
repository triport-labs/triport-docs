> Live version: https://triport.io/docs/eth/json-rpc/eth_getBlockByHash

# eth_getBlockByHash

> Returns a block, addressed by its 32-byte block hash, with its transactions either fully expanded or as a list of hashes.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByHash` (JSON-RPC, `POST /v1/ethereum`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByHash` looks up a single block by its hash and returns the full
block header plus its transaction list. Use it when you already hold a block
hash — for example from a log, a receipt's `blockHash`, or a previous
`eth_getBlockByNumber` response — and want the canonical block it identifies.
Looking up by hash is unambiguous across reorgs: a hash pins exactly one block,
whereas a block *number* can be reassigned to a different block after a
reorganization.

The second parameter controls how transactions are returned. Pass `true` to get
each transaction inlined as a full object (sender, recipient, value, input data,
gas, etc.); pass `false` to get just the array of transaction hashes, which is
cheaper to transfer when you only need the IDs.

If no block with the given hash is known to the node, the call succeeds and
returns `null` rather than an error — always check for `null` before reading
fields off the result.

## Parameters

Positional params array: `[blockHash, fullTransactions]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | string (32-byte hex) | yes | Hash of the block to fetch, `0x`-prefixed (66 characters total). |
| `fullTransactions` | boolean | yes | `true` returns full transaction objects in `transactions`; `false` returns only transaction hashes. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockByHash",
    "params": [
      "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
      false
    ]
  }'
```

## Response

With `fullTransactions = false`, `transactions` is an array of hashes:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0xf4629",
    "hash": "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
    "parentHash": "0x6535a44a8e329a3acb40e60c0a1b9d3a8e8a37a4e6f5e8a3c2d1b0a9f8e7d6c5",
    "nonce": "0x539bd4979fef1ec4",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0xd5855eb08b3387c0af375e9cdace543b11ed847df4b6a2c4d0f4f6b3e7a1c2d3",
    "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "miner": "0x829bd824b016326a401d083b33d092293333a830",
    "difficulty": "0x1d2bb1c",
    "totalDifficulty": "0x6c3a4f9c2",
    "extraData": "0x476574682f76312e302e302f6c696e75782f676f312e342e32",
    "size": "0x27f1",
    "gasLimit": "0x1c9c380",
    "gasUsed": "0x9b06d",
    "baseFeePerGas": "0x7",
    "timestamp": "0x55ba467c",
    "transactions": [
      "0x8784d99762bccd03b2086eabccee0d77f14d05463281e121a62abfebcf0d2d5f",
      "0x311be6a9b58748717ac0f70eb801d29973661aaf1365960d159e4ec4f4aa2d7f"
    ],
    "uncles": []
  }
}
```

When `fullTransactions = true`, each entry in `transactions` is a full
transaction object instead of a hash:

```json
"transactions": [
  {
    "hash": "0x8784d99762bccd03b2086eabccee0d77f14d05463281e121a62abfebcf0d2d5f",
    "blockHash": "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
    "blockNumber": "0xf4629",
    "transactionIndex": "0x0",
    "from": "0xa1e4380a3b1f749673e270229993ee55f35663b4",
    "to": "0x5df9b87991262f6ba471f09758cde1c0fc1de734",
    "value": "0x7f110",
    "gas": "0x4cb26",
    "gasPrice": "0x2d79883d2000",
    "nonce": "0x15",
    "input": "0x"
  }
]
```

### Response fields

`result` is the block object, or `null` if no such block exists.

| Field | Type | Description |
|---|---|---|
| `number` | string (hex) | Block number. |
| `hash` | string (hex) | Hash of this block — equals the requested `blockHash`. |
| `parentHash` | string (hex) | Hash of the parent block. |
| `nonce` | string (hex) | Proof-of-work nonce (pre-Merge blocks). |
| `sha3Uncles` | string (hex) | Keccak-256 of the uncles data. |
| `logsBloom` | string (hex) | Bloom filter for the block's logs. |
| `transactionsRoot` | string (hex) | Root of the transaction trie. |
| `stateRoot` | string (hex) | Root of the final state trie. |
| `receiptsRoot` | string (hex) | Root of the receipts trie. |
| `miner` | string (hex) | Address credited with the block reward / fees. |
| `difficulty` | string (hex) | Block difficulty (pre-Merge). |
| `totalDifficulty` | string (hex) | Total chain difficulty up to this block. |
| `extraData` | string (hex) | Arbitrary extra data field of the block. |
| `size` | string (hex) | Block size in bytes. |
| `gasLimit` | string (hex) | Maximum gas allowed in this block. |
| `gasUsed` | string (hex) | Total gas used by all transactions in the block. |
| `baseFeePerGas` | string (hex) | Base fee per gas (EIP-1559 blocks). |
| `timestamp` | string (hex) | Unix timestamp of when the block was collated. |
| `transactions` | array | Transaction hashes (when `fullTransactions = false`) or full transaction objects (when `true`). |
| `uncles` | array | Hashes of uncle blocks. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded (10 / 20 / 100 / 250 RPS sustained · short burst 20 / 40 / 200 / 500 for free / basic / pro / business). Back off and retry after `retry_after_sec`. |
| `-32602` | Invalid params | `blockHash` is not a 32-byte hex string, or `fullTransactions` is missing or not a boolean. |

A non-existent block hash is **not** an error — the call returns `result: null`.
Every error follows the shared JSON-RPC error envelope — see
[Errors](../../errors.md) for the full structure and handling guidance.

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
    method: "eth_getBlockByHash",
    params: [
      "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
      false,
    ],
  }),
});

const { result: block } = await res.json();
if (block === null) {
  console.log("no such block");
} else {
  console.log(`block #${BigInt(block.number)} — ${block.transactions.length} txs`);
}
```

## Notes

- **`null` means not found.** Unknown hashes return `result: null`, not an error.
  Guard for it before reading any field.
- **Hashes are reorg-stable.** A block hash identifies exactly one block, so
  lookups by hash are unaffected by chain reorganizations — unlike lookups by
  block number.
- **Pick the cheaper transaction form.** Use `fullTransactions = false` when you
  only need transaction IDs; it avoids transferring every transaction body. Pass
  `true` only when you need the inlined transaction objects.
- **Related methods:** [`eth_getBlockByNumber`](./eth_getBlockByNumber.md),
  [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md),
  [`eth_blockNumber`](./eth_blockNumber.md).
