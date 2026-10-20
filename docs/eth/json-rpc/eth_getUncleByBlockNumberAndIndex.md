> Live version: https://triport.io/docs/eth/json-rpc/eth_getUncleByBlockNumberAndIndex

# eth_getUncleByBlockNumberAndIndex

> Returns the uncle (ommer) block at a given index within the block identified by its number or a block tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getUncleByBlockNumberAndIndex` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getUncleByBlockNumberAndIndex` returns the uncle block (also called an
*ommer*) at a given position within a parent block. The parent block is
identified by a `0x`-prefixed hex block number or a named block tag, and the
uncle is selected by its zero-based index in that block's uncle list. The
returned value is a block **header** object — uncle headers are stored without
their own transaction bodies, so the `transactions` and `uncles` arrays of the
returned object are always empty.

Uncles are a proof-of-work artifact. They only ever appeared on pre-Merge
Ethereum (blocks mined before the September 2022 transition to proof-of-stake).
**Since the Merge, no new uncles are produced**, so for any post-Merge block this
method always returns `null`. It remains useful for reading historical
pre-Merge blocks that did include uncles.

If the parent block does not exist, or the uncle index is out of range for that
block, the `result` is `null` rather than an error. Always handle the `null`
case before reading fields off the result. To find how many uncles a block has
before indexing into them, call
[eth_getUncleCountByBlockNumber](./eth_getUncleCountByBlockNumber.md).

## Parameters

Pass a two-element positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockParameter` | `string` | yes | Either a `0x`-prefixed hex block number (e.g. `0xf4240`) or a block tag: `latest`, `earliest`, `pending`, `safe`, or `finalized`. |
| `uncleIndex` | `string` | yes | The zero-based position of the uncle in the block's uncle list, as a `0x`-prefixed hex integer (e.g. `0x0` for the first uncle). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getUncleByBlockNumberAndIndex",
    "params": ["0xf4240", "0x0"]
  }'
```

## Response

A pre-Merge block that has an uncle at the requested index returns the uncle's
header object:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0xf423f",
    "hash": "0x5a4f3e1a2b6d8f0e1c2a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4e5f6",
    "parentHash": "0x8b1a0f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a",
    "nonce": "0x04994f67dc06d3c8",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0x7a3c8e1d2b4f6a9c0e8d7b5a3f1c2d4e6b8a0f9e7d5c3b1a2f4e6d8c0b9a7f5e",
    "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "miner": "0x1b7047b4338acf65be94c1a3e8c5c9338ad7d67c",
    "difficulty": "0x57f117f5c",
    "totalDifficulty": "0x39a55deb627",
    "extraData": "0x476574682f76312e302e302f6c696e75782f676f312e342e32",
    "size": "0x21d",
    "gasLimit": "0x2fefd8",
    "gasUsed": "0x0",
    "timestamp": "0x55ba4339",
    "transactions": [],
    "uncles": []
  }
}
```

For any post-Merge block, or when the block or index does not exist, the
response is:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `object \| null` | The uncle header object, or `null` if there is no uncle at that index (always `null` for post-Merge blocks). |

The uncle header object contains the standard block-header fields:

| Field | Type | Description |
|---|---|---|
| `number` | `string` | The uncle's own block number, `0x`-prefixed hex. |
| `hash` | `string` | 32-byte hash of the uncle header. |
| `parentHash` | `string` | Hash of the uncle's parent block. |
| `nonce` | `string` | 8-byte proof-of-work nonce. |
| `sha3Uncles` | `string` | SHA3 of the uncle's own uncles data. |
| `logsBloom` | `string` | Bloom filter for the logs in the uncle. |
| `transactionsRoot` | `string` | Root of the uncle's transaction trie. |
| `stateRoot` | `string` | Root of the uncle's final state trie. |
| `receiptsRoot` | `string` | Root of the uncle's receipts trie. |
| `miner` | `string` | Address that mined the uncle. |
| `difficulty` | `string` | Difficulty of the uncle, hex. |
| `totalDifficulty` | `string` | Total difficulty of the chain up to the uncle, hex. |
| `extraData` | `string` | Extra data field of the uncle header. |
| `size` | `string` | Uncle header size in bytes, hex. |
| `gasLimit` | `string` | Maximum gas allowed in the uncle. |
| `gasUsed` | `string` | Total gas used, hex. |
| `timestamp` | `string` | Unix timestamp of the uncle, hex. |
| `transactions` | `array` | Always empty — uncle bodies are not stored. |
| `uncles` | `array` | Always empty. |

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
    method: "eth_getUncleByBlockNumberAndIndex",
    params: ["0xf4240", "0x0"],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("no uncle at that index (or post-Merge block)");
} else {
  console.log("uncle", result.hash, "mined by", result.miner);
}
```

## Notes

- **Post-Merge blocks always return `null`.** Uncles are a proof-of-work
  concept; no uncles have been produced since the Merge. Use this method only
  against historical pre-Merge blocks.
- The returned object is a block *header*, not a full block: its `transactions`
  and `uncles` arrays are always empty.
- The uncle index is zero-based: `0x0` is the first uncle. Both the block
  parameter and the index are `0x`-prefixed hex strings.
- An out-of-range index or a non-existent block returns `result: null`, not an
  error — check for `null` before reading fields.
- Numeric fields (`number`, `difficulty`, `timestamp`, …) are hex strings;
  convert with base 16 before arithmetic.
- `eth_getUncleByBlockNumberAndIndex` is available on the **Free** trial
  (`eth_read_rpc` category). Rate limiting is RPS-per-tier with burst; there is
  no daily quota. An HTTP `429` `rate_limited` error means you should back off and
  retry shortly.
- To count a block's uncles first, use
  [eth_getUncleCountByBlockNumber](./eth_getUncleCountByBlockNumber.md). To select
  the parent block by hash instead of number, use
  `eth_getUncleByBlockHashAndIndex`.
