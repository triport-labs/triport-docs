> Live version: https://triport.io/docs/eth/json-rpc/eth_getUncleByBlockHashAndIndex

# eth_getUncleByBlockHashAndIndex

> Returns the uncle (ommer) block at a given index within a block addressed by its 32-byte hash, or `null` if there is no uncle at that position.

| | |
|---|---|
| **Method / Endpoint** | `eth_getUncleByBlockHashAndIndex` (JSON-RPC, `POST /v1/ethereum`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getUncleByBlockHashAndIndex` looks up an uncle block (also called an
*ommer*) by the hash of the block that references it and the uncle's position in
that block's `uncles` array. It returns a block header object describing the
uncle, or `null` when the index is out of range or the referencing block is
unknown to the node.

Uncles only exist on the pre-Merge, proof-of-work chain. Before the Merge, two
miners could produce a valid block at the same height; the canonical chain
included one and could reward the other as an uncle. **After the Merge
(September 2022), Ethereum's proof-of-stake consensus produces exactly one block
per slot, so post-Merge blocks have no uncles.** For any block at or after the
Merge this method returns `null`, and the `uncles` array on such blocks is
always empty.

The returned object is a block *header* — it carries the uncle's own hash,
number, miner, and roots, but it does **not** include the uncle's transactions
(uncle transactions are never executed or rewarded).

## Parameters

Positional params array: `[blockHash, uncleIndex]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | string (32-byte hex) | yes | Hash of the block whose uncle you want, `0x`-prefixed (66 characters total). |
| `uncleIndex` | string (hex) | yes | Zero-based index into the referencing block's `uncles` array, encoded as a `0x`-prefixed hex quantity (e.g. `"0x0"` for the first uncle). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getUncleByBlockHashAndIndex",
    "params": [
      "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
      "0x0"
    ]
  }'
```

## Response

For a pre-Merge block that has an uncle at the requested index, `result` is the
uncle's block-header object:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0xf4628",
    "hash": "0x9c2e0e7a6f8b3d4c1a05e7d2f9b8c6a3e1d0f7b6a5c4d3e2f1a09b8c7d6e5f40",
    "parentHash": "0x6535a44a8e329a3acb40e60c0a1b9d3a8e8a37a4e6f5e8a3c2d1b0a9f8e7d6c5",
    "nonce": "0x04994ecf7e3a9c11",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0xd5855eb08b3387c0af375e9cdace543b11ed847df4b6a2c4d0f4f6b3e7a1c2d3",
    "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "miner": "0x1b7047b4338acf65be94c1a3e8c5c9338ad7d67c",
    "difficulty": "0x1d2a8f0",
    "totalDifficulty": "0x6c3a4f8d1",
    "extraData": "0x476574682f76312e302e302f6c696e75782f676f312e342e32",
    "size": "0x21f",
    "gasLimit": "0x1c9c380",
    "gasUsed": "0x0",
    "timestamp": "0x55ba4670"
  }
}
```

For a post-Merge block, an out-of-range index, or an unknown block hash, the
call succeeds with `result: null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

`result` is the uncle's block-header object, or `null` if there is no uncle at
the given index.

| Field | Type | Description |
|---|---|---|
| `number` | string (hex) | Block number of the uncle. |
| `hash` | string (hex) | Hash of the uncle block. |
| `parentHash` | string (hex) | Hash of the uncle's parent block. |
| `nonce` | string (hex) | Proof-of-work nonce of the uncle. |
| `sha3Uncles` | string (hex) | Keccak-256 of the uncle's own uncles data. |
| `logsBloom` | string (hex) | Bloom filter for the uncle's logs. |
| `transactionsRoot` | string (hex) | Root of the uncle's transaction trie. |
| `stateRoot` | string (hex) | Root of the uncle's final state trie. |
| `receiptsRoot` | string (hex) | Root of the uncle's receipts trie. |
| `miner` | string (hex) | Address that mined the uncle. |
| `difficulty` | string (hex) | Difficulty of the uncle block. |
| `totalDifficulty` | string (hex) | Total chain difficulty up to the uncle. |
| `extraData` | string (hex) | Arbitrary extra data field of the uncle. |
| `size` | string (hex) | Uncle header size in bytes. |
| `gasLimit` | string (hex) | Maximum gas that was allowed in the uncle. |
| `gasUsed` | string (hex) | Gas used in the uncle. |
| `timestamp` | string (hex) | Unix timestamp of when the uncle was collated. |

The uncle object carries header fields only — it has no `transactions` field,
since an uncle's transactions are not included in the canonical chain.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded (10 / 20 / 100 / 250 RPS sustained · short burst 20 / 40 / 200 / 500 for free / basic / pro / business). Back off and retry after `retry_after_sec`. |
| `-32602` | Invalid params | `blockHash` is not a 32-byte hex string, or `uncleIndex` is missing or not a hex quantity. |

A missing uncle, an out-of-range index, and a post-Merge block are **not**
errors — the call returns `result: null`. Every error follows the shared
JSON-RPC error envelope — see [Errors](../../errors.md) for the full structure
and handling guidance.

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
    method: "eth_getUncleByBlockHashAndIndex",
    params: [
      "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35",
      "0x0",
    ],
  }),
});

const { result: uncle } = await res.json();
if (uncle === null) {
  console.log("no uncle at that index (post-Merge blocks never have uncles)");
} else {
  console.log(`uncle #${BigInt(uncle.number)} mined by ${uncle.miner}`);
}
```

## Notes

- **Post-Merge blocks have no uncles.** Proof-of-stake produces one block per
  slot, so for any block at or after the Merge this method always returns
  `null`. Uncles are only present on the historical proof-of-work chain.
- **`null` is not an error.** An out-of-range index or an unknown block hash
  returns `result: null`. Guard for it before reading any field.
- **Header only, no transactions.** The returned object is the uncle's header;
  it has no transaction list because uncle transactions are never executed.
- **Find the count first.** Use
  [`eth_getUncleCountByBlockHash`](./eth_getUncleCountByBlockHash.md) to learn
  how many uncles a block has before indexing into them.
- **Related methods:**
  [`eth_getUncleByBlockNumberAndIndex`](./eth_getUncleByBlockNumberAndIndex.md),
  [`eth_getBlockByHash`](./eth_getBlockByHash.md),
  [`eth_getUncleCountByBlockHash`](./eth_getUncleCountByBlockHash.md).
