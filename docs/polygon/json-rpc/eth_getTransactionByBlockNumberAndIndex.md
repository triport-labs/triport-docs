> Live version: https://triport.io/docs/polygon/json-rpc/eth_getTransactionByBlockNumberAndIndex

# eth_getTransactionByBlockNumberAndIndex

> Returns a single Polygon transaction selected by its block (number or tag) and its zero-based position within that block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByBlockNumberAndIndex` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) (the `x-token: $TRIPORT_API_KEY` header is also accepted) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free (and up) — 15 rps (free) · 20 rps (basic) · 100 rps (pro) · 250 rps (business); burst = 2 × the sustained rps |

## Description

`eth_getTransactionByBlockNumberAndIndex` returns one transaction identified by
two coordinates: the block (given as a hex-encoded block number or one of the
tags `latest`, `earliest`, `pending`, `safe`, `finalized`) and the transaction's
zero-based index within that block. Both parameters are passed as `0x`-prefixed
hex strings.

Reach for it when you already know a transaction's slot in a block — for example
while iterating a Polygon block transaction-by-transaction, or when you have an
index from a prior [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) call and
want only that one body rather than the whole block. This is the by-number
counterpart of `eth_getTransactionByBlockHashAndIndex`; use that sibling when you
hold the block *hash* instead, or [`eth_getTransactionByHash`](./eth_getTransactionByHash.md)
when you already have the transaction's own hash.

Polygon runs Bor consensus with a ~2.1 s block time, so a typical block carries
roughly 50–150 transactions. If the block does not exist, or the index is out of
range for that block, `result` is `null` rather than an error — check for `null`
before reading fields.

## Parameters

Positional params array: `[blockNumber, transactionIndex]`.

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `blockNumber` | string | yes | A hex-encoded block number (e.g. `"0x3b9aca00"`) **or** a tag: `latest`, `earliest`, `pending`, `safe`, or `finalized`. |
| 1 | `transactionIndex` | string | yes | The zero-based position of the transaction in the block, as a `0x`-prefixed hex integer (e.g. `"0x0"` for the first transaction). |

> Historic (archive-depth) block numbers resolve as long as they fall within the
> retained range; very deep reads may not be available on every backing route.
> For the chain tip just use the `latest` tag.

## Request

```bash
curl https://triport.io/polygon \
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
    "blockHash": "0x9b83c12c69edb74f6c8dd5d052765c1adf940e320bd1291696e6fa07829eee71",
    "blockNumber": "0x3b9aca00",
    "from": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    "gas": "0x5208",
    "gasPrice": "0x6fc23ac00",
    "maxFeePerGas": "0x9502f9000",
    "maxPriorityFeePerGas": "0x77359400",
    "hash": "0x2c0a1b3e4d5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
    "input": "0x",
    "nonce": "0x15",
    "to": "0x53bf833a5d6c4dda888f69c22c88c9f356a41614",
    "transactionIndex": "0x0",
    "value": "0xde0b6b3a7640000",
    "type": "0x2",
    "chainId": "0x89",
    "v": "0x1",
    "r": "0x5e1d3a76fbf824220e68236e2d51cb98f349a5a6e4f1f1c3a0f7d2d0c4d7e8a1",
    "s": "0x3a0f7d2d0c4d7e8a15e1d3a76fbf824220e68236e2d51cb98f349a5a6e4f1f1c"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC version, always `"2.0"`. |
| `id` | number | Echoes the request `id`. |
| `result` | object \| null | The transaction object, or `null` if the block was not found or the index is out of range. |

The transaction object carries the standard EVM fields:

| Field | Type | Description |
|---|---|---|
| `blockHash` | string | Hash of the containing block; `null` if pending. |
| `blockNumber` | string (hex) | Block number; `null` if pending. |
| `from` | string | Sender address. |
| `to` | string \| null | Recipient address; `null` for contract-creation transactions. |
| `gas` | string (hex) | Gas supplied by the sender. |
| `gasPrice` | string (hex) | Effective gas price, in wei. |
| `maxFeePerGas` | string (hex) | Max fee per gas — present on EIP-1559 (`type` `0x2`) transactions. |
| `maxPriorityFeePerGas` | string (hex) | Max priority fee per gas — present on EIP-1559 transactions. |
| `hash` | string | Transaction hash. |
| `input` | string | Call data, hex. |
| `nonce` | string (hex) | Sender nonce. |
| `transactionIndex` | string (hex) | Index of the transaction in the block. |
| `value` | string (hex) | Value transferred, in wei. |
| `type` | string | Transaction type (`0x0` legacy, `0x1` access-list, `0x2` EIP-1559). |
| `chainId` | string (hex) | Chain ID — `0x89` (137) for Polygon mainnet. |
| `v`, `r`, `s` | string (hex) | ECDSA signature components. |

## Errors

Errors arrive in the standard JSON-RPC `error` object; the extra fields move
into `error.data`.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The free 7-day trial has ended. |
| `403` | `tier_insufficient` | Your tier is below what the method requires. (Not expected here — this method is included in the Free trial.) |
| `429` | `rate_limited` | You exceeded the sustained rps for your tier; respect `Retry-After` / `data.retry_after_sec`. |
| `401` | `subscription_expired` | A previously active paid subscription has lapsed. |
| `401` | `unauthorized` | Missing, invalid, or revoked credentials. |
| HTTP `403` | `method_unknown` | The method name was not recognised on the `polygon` chain. |

A missing block or an out-of-range index is **not** an error — it returns
`result: null`. See the shared [Errors reference](../../errors.md) for the full
envelope, the HTTP-status mapping, and `error.data` field definitions.

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
    method: "eth_getTransactionByBlockNumberAndIndex",
    params: ["latest", "0x0"],
  }),
});

const { result, error } = await res.json();
if (error) throw new Error(`${error.code}: ${error.message}`);
console.log(result === null ? "no such transaction" : result.hash);
```

## Notes

* **Zero-based index.** `0x0` is the first transaction in the block. Use
  [`eth_getBlockTransactionCountByNumber`](./eth_getBlockTransactionCountByNumber.md)
  to learn the valid index range first.
* **Null on miss.** An out-of-range index or a non-existent block returns
  `result: null`, not an error — guard for `null` before reading fields.
* **Hex numerics.** `value`, `gas`, `gasPrice`, `nonce`, … are hex strings;
  convert with base 16 before doing arithmetic. Values are in wei.
* **Polygon chain ID.** `chainId` is `0x89` (137) for Polygon mainnet.
* **No daily cap.** Rate limiting is sustained-rps-per-tier with a 2× burst
  allowance — there is no daily quota. See [Rate limits](../../rate-limits-and-tiers.md).
* **Related:** `eth_getTransactionByBlockHashAndIndex` (same lookup, by block
  hash) · [`eth_getTransactionByHash`](./eth_getTransactionByHash.md) (by
  transaction hash) · [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) (the
  whole block at once).
