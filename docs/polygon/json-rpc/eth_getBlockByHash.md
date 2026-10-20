> Live version: https://triport.io/docs/polygon/json-rpc/eth_getBlockByHash

# eth_getBlockByHash

> Returns a Polygon block, addressed by its 32-byte block hash, with its transactions either fully expanded or as a list of hashes.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByHash` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByHash` looks up a single Polygon block by its hash and returns the
block header plus its transaction list. Use it when you already hold a block
hash — for example from a log, a receipt's `blockHash`, or a previous
`eth_getBlockByNumber` response — and want the canonical block it identifies.
Looking up by hash is unambiguous: a hash pins exactly one block, whereas a block
*number* can be reassigned to a different block after a reorganization.

The second parameter controls how transactions are returned. Pass `true` to get
each transaction inlined as a full object (sender, recipient, value, input data,
gas, etc.); pass `false` to get just the array of transaction hashes, which is
much cheaper to transfer when you only need the IDs. A typical Polygon block
carries ~50–150 transactions, so the full-body form can be 30–100 KB versus
~3–5 KB for the hash-only form.

If no block with the given hash is known to the node, the call **succeeds and
returns `null`** rather than an error. Because a hash that was canonical can stop
being canonical after a reorg, a previously-valid hash returning `null` is a
useful signal for **re-org detection** — always check for `null` before reading
fields off the result.

## Parameters

Positional params array: `[blockHash, fullTxBodies]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | string (32-byte hex) | yes | Hash of the block to fetch, `0x`-prefixed (66 characters total). |
| `fullTxBodies` | boolean | yes | `true` returns full transaction objects in `transactions`; `false` returns only transaction hashes. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockByHash",
    "params": [
      "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
      false
    ]
  }'
```

## Response

With `fullTxBodies = false`, `transactions` is an array of hashes:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x3753f00",
    "hash": "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
    "parentHash": "0x6535a44a8e329a3acb40e60c0a1b9d3a8e8a37a4e6f5e8a3c2d1b0a9f8e7d6c5",
    "nonce": "0x0000000000000000",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0xd5855eb08b3387c0af375e9cdace543b11ed847df4b6a2c4d0f4f6b3e7a1c2d3",
    "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "miner": "0x0000000000000000000000000000000000000000",
    "difficulty": "0xb",
    "totalDifficulty": "0x1f3c8a9d4",
    "extraData": "0xd682021183626f7288676f312e32302e35856c696e7578000000000000000000",
    "size": "0x27f1",
    "gasLimit": "0x1c9c380",
    "gasUsed": "0x9b06d",
    "baseFeePerGas": "0x7",
    "timestamp": "0x6655a467",
    "transactions": [
      "0x8784d99762bccd03b2086eabccee0d77f14d05463281e121a62abfebcf0d2d5f",
      "0x311be6a9b58748717ac0f70eb801d29973661aaf1365960d159e4ec4f4aa2d7f"
    ],
    "uncles": []
  }
}
```

When `fullTxBodies = true`, each entry in `transactions` is a full transaction
object instead of a hash:

```json
"transactions": [
  {
    "hash": "0x8784d99762bccd03b2086eabccee0d77f14d05463281e121a62abfebcf0d2d5f",
    "blockHash": "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
    "blockNumber": "0x3753f00",
    "transactionIndex": "0x0",
    "from": "0xa1e4380a3b1f749673e270229993ee55f35663b4",
    "to": "0x5df9b87991262f6ba471f09758cde1c0fc1de734",
    "value": "0x7f110",
    "gas": "0x4cb26",
    "gasPrice": "0x6fc23ac00",
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
| `nonce` | string (hex) | Block nonce. On Bor (proof-of-stake) this is zero. |
| `sha3Uncles` | string (hex) | Keccak-256 of the uncles data. |
| `logsBloom` | string (hex) | Bloom filter for the block's logs. |
| `transactionsRoot` | string (hex) | Root of the transaction trie. |
| `stateRoot` | string (hex) | Root of the final state trie. |
| `receiptsRoot` | string (hex) | Root of the receipts trie. |
| `miner` | string (hex) | Block author address. |
| `difficulty` | string (hex) | Block difficulty (low on Bor). |
| `totalDifficulty` | string (hex) | Total chain difficulty up to this block. |
| `extraData` | string (hex) | Arbitrary extra data field of the block. |
| `size` | string (hex) | Block size in bytes. |
| `gasLimit` | string (hex) | Maximum gas allowed in this block. |
| `gasUsed` | string (hex) | Total gas used by all transactions in the block. |
| `baseFeePerGas` | string (hex) | Base fee per gas (EIP-1559). |
| `timestamp` | string (hex) | Unix timestamp of when the block was produced. |
| `transactions` | array | Transaction hashes (when `fullTxBodies = false`) or full transaction objects (when `true`). |
| `uncles` | array | Always `[]` on Polygon — Bor consensus produces no uncle blocks. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | The key's tier is below the level required for this method. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded (15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 for free / basic / pro / business). Back off and retry. |
| `401` | `subscription_expired` | The subscription tied to the key has lapsed. |
| `401` | `unauthorized` | Missing, malformed, or invalid API key. |
| HTTP `403` | `method_unknown` | The method name is not recognized on this path. |

A non-existent block hash is **not** an error — the call returns `result: null`.
Every error follows the shared JSON-RPC error envelope — see
[Errors](../../errors.md) for the full structure and handling guidance.

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
    method: "eth_getBlockByHash",
    params: [
      "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
      false,
    ],
  }),
});

const { result: block } = await res.json();
if (block === null) {
  console.log("no such block — possible re-org");
} else {
  console.log(`block #${BigInt(block.number)} — ${block.transactions.length} txs`);
}
```

## Notes

- **`null` means not found — and may mean a re-org.** Unknown hashes return
  `result: null`, not an error. If a hash you held earlier now returns `null`,
  the block was likely orphaned by a chain reorganization. Guard for `null`
  before reading any field.
- **Finality on Polygon.** Bor reorgs are rare but real; finality lands after
  roughly 2–3 checkpoints (~256 blocks, about 9 minutes). For confirmation before
  acting on a block, wait at least **64–128 blocks** (~2–4 minutes) past it.
- **No uncles.** Polygon's Bor consensus does not produce uncle blocks, so
  `uncles` is always `[]` and `sha3Uncles` reflects empty uncle data.
- **Pick the cheaper transaction form.** Use `fullTxBodies = false` when you only
  need transaction IDs; it avoids transferring every transaction body (~3–5 KB
  versus 30–100 KB for a full block). Pass `true` only when you need the inlined
  transaction objects.
- **Related methods:** [`eth_getBlockByNumber`](./eth_getBlockByNumber.md),
  [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md),
  [`eth_getBlockReceipts`](./eth_getBlockReceipts.md).
