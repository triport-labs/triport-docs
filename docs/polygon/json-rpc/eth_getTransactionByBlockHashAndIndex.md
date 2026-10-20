> Live version: https://triport.io/docs/polygon/json-rpc/eth_getTransactionByBlockHashAndIndex

# eth_getTransactionByBlockHashAndIndex

> Returns a single Polygon transaction by the hash of its block and its zero-based position within that block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByBlockHashAndIndex` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByBlockHashAndIndex` looks up a Polygon block by its 32-byte
hash and returns the one transaction sitting at the supplied zero-based index
within that block. The transaction comes back as the standard Ethereum/Bor
transaction object.

Use it when you already hold a block hash — from a log, a receipt's `blockHash`,
or a prior `eth_getBlockByHash` response — and want to walk that block's
transactions one at a time without downloading the full block body. It is a
common primitive for **block-by-block indexers**: pair it with
[`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md)
to read the transaction count, then iterate `0x0 … count-1`, fetching each
transaction by index. Addressing by hash (rather than by number) is unambiguous —
a hash pins exactly one block even across a reorganization.

If the block hash is unknown to the node (for example a block it has not yet
seen, or one orphaned by a reorg) or the index is out of range for the block,
the method **succeeds and returns `null`** rather than an error. Always check for
`null` before reading fields off the result.

## Parameters

Positional params array: `[blockHash, index]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | string (32-byte hex) | yes | Hash of the block, `0x`-prefixed (66 characters total). |
| `index` | string (hex) | yes | Zero-based transaction position within the block, as a `0x`-prefixed hexadecimal integer (e.g. `0x0` for the first transaction). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionByBlockHashAndIndex",
    "params": [
      "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
      "0x0"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "blockHash": "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
    "blockNumber": "0x3753f00",
    "transactionIndex": "0x0",
    "hash": "0x8784d99762bccd03b2086eabccee0d77f14d05463281e121a62abfebcf0d2d5f",
    "nonce": "0x15",
    "from": "0xa1e4380a3b1f749673e270229993ee55f35663b4",
    "to": "0x5df9b87991262f6ba471f09758cde1c0fc1de734",
    "value": "0x7f110",
    "gas": "0x4cb26",
    "gasPrice": "0x6fc23ac00",
    "maxFeePerGas": "0x6fc23ac00",
    "maxPriorityFeePerGas": "0x59682f00",
    "input": "0x",
    "type": "0x2",
    "chainId": "0x89",
    "v": "0x0",
    "r": "0x8d5b3e0c9b4f3a2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d",
    "s": "0x4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d"
  }
}
```

When the block hash is unknown or the index is out of range, the result is
`null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

`result` is the transaction object, or `null`. Its principal fields:

| Field | Type | Description |
|---|---|---|
| `hash` | string (hex) | 32-byte transaction hash. |
| `blockHash` | string (hex) | Hash of the block containing the transaction (echoes the request). |
| `blockNumber` | string (hex) | Block height, `0x`-prefixed. |
| `transactionIndex` | string (hex) | Position of the transaction in the block (echoes the request `index`). |
| `nonce` | string (hex) | Sender's transaction count prior to this transaction. |
| `from` | string (hex) | 20-byte sender address. |
| `to` | string (hex) \| null | 20-byte recipient address, or `null` for a contract-creation transaction. |
| `value` | string (hex) | Value transferred in wei. |
| `gas` | string (hex) | Gas supplied by the sender. |
| `gasPrice` | string (hex) | Effective gas price in wei. |
| `maxFeePerGas` | string (hex) | EIP-1559 max fee per gas in wei (type `0x2` transactions). |
| `maxPriorityFeePerGas` | string (hex) | EIP-1559 max priority fee per gas in wei (type `0x2` transactions). |
| `input` | string (hex) | Call data sent with the transaction. |
| `type` | string (hex) | Transaction type — `0x0` legacy, `0x1` access-list, `0x2` EIP-1559. |
| `chainId` | string (hex) | Chain ID — `0x89` (137) for Polygon mainnet. |
| `v`, `r`, `s` | string (hex) | ECDSA signature components. |

Wrapper fields `jsonrpc` (always `"2.0"`) and `id` (echoes the request `id`)
surround the result.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | The key's tier is below the level required for this method. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded (15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 for free / basic / pro / business). Back off and retry. |
| `401` | `subscription_expired` | The subscription tied to the key has lapsed. |
| `401` | `unauthorized` | Missing, malformed, or invalid API key. |
| HTTP `403` | `method_unknown` | The method name is not recognized on this path. |

An unknown block hash or an out-of-range index is **not** an error — it is
reported as `result: null` (see above). Every error follows the shared JSON-RPC
error envelope — see [Errors](../../errors.md) for the full structure and
handling guidance.

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
    method: "eth_getTransactionByBlockHashAndIndex",
    params: [
      "0x9b7f2a3c1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcd",
      "0x0",
    ],
  }),
});

const { result } = await res.json();
console.log(result === null ? "no transaction at that index" : result.hash);
```

## Notes

- **`index` is hex, not decimal.** Pass `0x0`, `0x1`, … — not `0`, `1`.
- **Always handle `null`.** An unknown block hash or an out-of-range index
  returns `result: null` rather than an error. Guard for it before reading any
  field.
- **Indexer iteration pattern.** Read the transaction count with
  [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md),
  then request indices `0x0` through `count-1`. When you need every transaction
  in a block at once, fetching the full block with
  [`eth_getBlockByHash`](./eth_getBlockByHash.md) (`fullTxBodies = true`) is
  cheaper than many per-index calls.
- **EIP-1559 fee fields.** `maxFeePerGas` and `maxPriorityFeePerGas` appear only
  on type `0x2` transactions; legacy transactions expose `gasPrice` only.
- **Rate limiting is RPS-per-tier** with a burst allowance; there is no daily
  quota. An HTTP `429` `rate_limited` response means you should back off and retry
  shortly.
- **Related methods:**
  [`eth_getTransactionByBlockNumberAndIndex`](./eth_getTransactionByBlockNumberAndIndex.md)
  (same lookup by block number),
  [`eth_getTransactionByHash`](./eth_getTransactionByHash.md) (look up directly
  by transaction hash),
  [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md).
