> Live version: https://triport.io/docs/eth/json-rpc/eth_getTransactionByBlockNumberAndIndex

# eth_getTransactionByBlockNumberAndIndex

> Returns the transaction at a given position within the block identified by its number or a block tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByBlockNumberAndIndex` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByBlockNumberAndIndex` returns a single transaction object
selected by two coordinates: the block (by number or block tag) and the
transaction's zero-based index within that block. Both the block number and the
index are `0x`-prefixed hexadecimal strings.

Use it when you already know a transaction's position in a block — for example
when iterating a block's transactions one at a time, when you have the index
from a prior `eth_getBlockByNumber` call, or when reconstructing a block body
without fetching every transaction at once. If you have the block *hash* rather
than its number, use the sibling method
`eth_getTransactionByBlockHashAndIndex`. If you have the transaction hash
directly, use `eth_getTransactionByHash`.

If the block does not exist, or the index is out of range for that block, the
`result` is `null` rather than an error.

## Parameters

Pass a two-element positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockParameter` | `string` | yes | Either a `0x`-prefixed hex block number (e.g. `0x149e2c1`) or a block tag: `latest`, `earliest`, `pending`, `safe`, or `finalized`. |
| `transactionIndex` | `string` | yes | The zero-based position of the transaction in the block, as a `0x`-prefixed hex integer (e.g. `0x0` for the first transaction). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionByBlockNumberAndIndex",
    "params": ["latest", "0x0"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "blockHash": "0x9c4f3e1a2b6d8f0e1c2a3b4c5d6e7f8091a2b3c4d5e6f7081920a1b2c3d4e5f6",
    "blockNumber": "0x149e2c1",
    "from": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    "gas": "0x5208",
    "gasPrice": "0x4a817c800",
    "maxFeePerGas": "0x6fc23ac00",
    "maxPriorityFeePerGas": "0x59682f00",
    "hash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
    "input": "0x",
    "nonce": "0x15",
    "to": "0x53bf833a5d6c4dda888f69c22c88c9f356a41614",
    "transactionIndex": "0x0",
    "value": "0xde0b6b3a7640000",
    "type": "0x2",
    "chainId": "0x1",
    "v": "0x1",
    "r": "0x5e1d3a76fbf824220e68236e2d51cb98f349a5a6e4f1f1c3a0f7d2d0c4d7e8a1",
    "s": "0x3a0f7d2d0c4d7e8a15e1d3a76fbf824220e68236e2d51cb98f349a5a6e4f1f1c"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `object \| null` | The transaction object, or `null` if the block was not found or the index is out of range. |

The transaction object contains the standard Ethereum fields:

| Field | Type | Description |
|---|---|---|
| `blockHash` | `string` | Hash of the containing block, or `null` if pending. |
| `blockNumber` | `string` | Block number as `0x`-prefixed hex, or `null` if pending. |
| `from` | `string` | Sender address. |
| `to` | `string \| null` | Recipient address; `null` for contract-creation transactions. |
| `gas` | `string` | Gas supplied, hex. |
| `gasPrice` | `string` | Effective gas price, hex (in wei). |
| `maxFeePerGas` | `string` | Max fee per gas, hex — present on EIP-1559 (`type` `0x2`) transactions. |
| `maxPriorityFeePerGas` | `string` | Max priority fee per gas, hex — present on EIP-1559 transactions. |
| `hash` | `string` | Transaction hash. |
| `input` | `string` | Call data, hex. |
| `nonce` | `string` | Sender nonce, hex. |
| `transactionIndex` | `string` | Index of the transaction in the block, hex. |
| `value` | `string` | Value transferred in wei, hex. |
| `type` | `string` | Transaction type (`0x0` legacy, `0x1` access-list, `0x2` EIP-1559). |
| `chainId` | `string` | Chain ID, hex (`0x1` for Ethereum mainnet). |
| `v`, `r`, `s` | `string` | ECDSA signature components, hex. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |
| `-32602` | `invalid_params` | The block parameter or index is missing, or not a valid hex value / tag. |

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
    method: "eth_getTransactionByBlockNumberAndIndex",
    params: ["latest", "0x0"],
  }),
});

const { result } = await res.json();
console.log(result === null ? "no such transaction" : result.hash);
```

## Notes

- The index is zero-based: `0x0` is the first transaction in the block.
- An out-of-range index or a non-existent block returns `result: null`, not an
  error — check for `null` before reading fields.
- Numeric fields (`value`, `gas`, `gasPrice`, `nonce`, …) are hex strings;
  convert with base 16 before arithmetic.
- `eth_getTransactionByBlockNumberAndIndex` is available on the **Free** trial
  (`eth_read_rpc` category).
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- To select by block hash instead, use `eth_getTransactionByBlockHashAndIndex`.
  To look up a transaction by its own hash, use `eth_getTransactionByHash`. To
  count a block's transactions first, use `eth_getBlockTransactionCountByNumber`.
