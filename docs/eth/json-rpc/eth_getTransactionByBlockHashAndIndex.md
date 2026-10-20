> Live version: https://triport.io/docs/eth/json-rpc/eth_getTransactionByBlockHashAndIndex

# eth_getTransactionByBlockHashAndIndex

> Returns the transaction at a given position inside the block identified by its block hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByBlockHashAndIndex` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByBlockHashAndIndex` locates a block by its 32-byte hash and
returns the single transaction sitting at the supplied zero-based index within
that block. The transaction is returned as the standard Ethereum transaction
object.

Use it when you already hold a block hash — from a log, a receipt, or an
`eth_getBlockByHash` response — and want to walk that block's transactions one
at a time without downloading the full block body. Pair it with
[`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md):
fetch the count, then iterate `0 … count-1`, requesting each transaction by
index.

If the block hash is unknown (e.g. an orphaned/uncle block, or a block the node
has not yet seen) or the index is out of range for the block, the method returns
`null` instead of an error. Always check for `null` before reading fields off
the result.

## Parameters

Two positional parameters, in order.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | `string` | yes | 32-byte block hash, `0x`-prefixed (66 characters total). |
| `index` | `string` | yes | Zero-based transaction position within the block, as a `0x`-prefixed hexadecimal integer (e.g. `0x0` for the first transaction). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionByBlockHashAndIndex",
    "params": [
      "0xb9b8b8b1b0c9e6a0f3d4c5b6a7988e9d0c1b2a3948576f5e4d3c2b1a09876543",
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
    "blockHash": "0xb9b8b8b1b0c9e6a0f3d4c5b6a7988e9d0c1b2a3948576f5e4d3c2b1a09876543",
    "blockNumber": "0x12a05f2",
    "transactionIndex": "0x0",
    "hash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
    "nonce": "0x1a",
    "from": "0xa7d9ddbe1f17865597fbd27ec712455208b6b76d",
    "to": "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f",
    "value": "0x16345785d8a0000",
    "gas": "0x5208",
    "gasPrice": "0x4a817c800",
    "maxFeePerGas": "0x6fc23ac00",
    "maxPriorityFeePerGas": "0x59682f00",
    "input": "0x",
    "type": "0x2",
    "chainId": "0x1",
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

`result` is the transaction object (or `null`). Its principal fields:

| Field | Type | Description |
|---|---|---|
| `hash` | `string` | 32-byte transaction hash. |
| `blockHash` | `string` | Hash of the block containing the transaction (echoes the request). |
| `blockNumber` | `string` | Block height as `0x`-prefixed hex. |
| `transactionIndex` | `string` | Position of the transaction in the block, as `0x`-prefixed hex (echoes the request index). |
| `nonce` | `string` | Sender's transaction count prior to this transaction, hex. |
| `from` | `string` | 20-byte sender address. |
| `to` | `string \| null` | 20-byte recipient address, or `null` for a contract-creation transaction. |
| `value` | `string` | Value transferred in wei, `0x`-prefixed hex. |
| `gas` | `string` | Gas supplied by the sender, hex. |
| `gasPrice` | `string` | Effective gas price in wei, hex. |
| `maxFeePerGas` | `string` | EIP-1559 max fee per gas in wei, hex (type `0x2` transactions). |
| `maxPriorityFeePerGas` | `string` | EIP-1559 max priority fee per gas in wei, hex (type `0x2` transactions). |
| `input` | `string` | Call data sent with the transaction. |
| `type` | `string` | Transaction type — `0x0` legacy, `0x1` access-list, `0x2` EIP-1559. |
| `chainId` | `string` | Chain ID, hex (`0x1` for Ethereum mainnet). |
| `v`, `r`, `s` | `string` | ECDSA signature components. |

Wrapper fields `jsonrpc` (always `"2.0"`) and `id` (echoes the request `id`)
surround the result.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |

A missing block or out-of-range index is **not** an error — it is reported as
`result: null` (see above). An HTTP `429` response carries `Retry-After` and
`X-RateLimit-Reset` headers plus a `data` object with `limit_rps`,
`burst_capacity`, and `retry_after_sec`. See [errors.md](../../errors.md) for the
full error envelope and handling guidance.

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
    method: "eth_getTransactionByBlockHashAndIndex",
    params: [
      "0xb9b8b8b1b0c9e6a0f3d4c5b6a7988e9d0c1b2a3948576f5e4d3c2b1a09876543",
      "0x0",
    ],
  }),
});

const { result } = await res.json();
console.log(result === null ? "no transaction at that index" : result.hash);
```

## Notes

- The `index` is a **hex** string (`0x0`, `0x1`, …), not a decimal number.
- Always handle the `null` case: an unknown block hash or an out-of-range index
  returns `result: null` rather than an error.
- EIP-1559 fee fields (`maxFeePerGas`, `maxPriorityFeePerGas`) appear only on
  type `0x2` transactions; legacy transactions expose `gasPrice` only.
- Available on the **Free** trial (`eth_read_rpc` category).
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- To fetch the same transaction by block height instead of hash, use
  `eth_getTransactionByBlockNumberAndIndex`. To look a transaction up directly by
  its hash, use `eth_getTransactionByHash`. To learn how many transactions a
  block holds, use
  [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md).
