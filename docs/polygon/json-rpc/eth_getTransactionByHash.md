> Live version: https://triport.io/docs/polygon/json-rpc/eth_getTransactionByHash

# eth_getTransactionByHash

> Returns the transaction object for a given transaction hash on Polygon, or `null` if the transaction is unknown or still pending.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByHash` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) (or `x-token`) |
| **Required scope** | — |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst (free) / 20 RPS sustained · up to 40 burst (basic) / 100 RPS sustained · up to 200 burst (pro) / 250 RPS sustained · up to 500 burst (business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByHash` looks up a single Polygon transaction by its 32-byte
hash and returns the full transaction object. Use it to confirm that a
transaction you broadcast was accepted, to read back its calldata and value, or
to find which block it landed in.

The method resolves both **mined** and **pending** transactions. If the hash has
been seen in the mempool but not yet included in a block, `blockHash`,
`blockNumber`, and `transactionIndex` are returned as `null` while the rest of
the object is populated. If the hash is completely unknown to the node — never
broadcast, dropped, or replaced — the `result` is `null`. A `null` result is
**not** an error: the JSON-RPC envelope still returns HTTP 200 with
`"result": null`.

Polygon's block time is roughly **2.1 seconds** (vs ~12s on Ethereum), so a
freshly submitted transaction is usually mined within a couple of blocks. When
you poll for inclusion, poll at about the block interval — every ~2 seconds —
rather than tighter, to avoid burning your RPS budget on a transaction that is
not yet mined. For latency-sensitive pending detection, prefer a WebSocket
`newPendingTransactions` subscription over polling this method. To read the
execution outcome (status, gas used, logs) once mined, use
[`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md).

## Parameters

The `params` array takes a single positional element.

| Index | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `txHash` | string | yes | 32-byte transaction hash, `0x`-prefixed hex (66 characters total). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionByHash",
    "params": [
      "0x6f3a1c8e5b9d2a47f0c1e8b6d4a2f9c3e7b1d0a5c8e2f4b6a9d1c3e5f7a0b2c4d"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "hash": "0x6f3a1c8e5b9d2a47f0c1e8b6d4a2f9c3e7b1d0a5c8e2f4b6a9d1c3e5f7a0b2c4d",
    "nonce": "0x2f1a",
    "blockHash": "0x9c1f0b3e7a5d2c84f6b1e9d0a3c7f5b2e8d4a1c6f9b0e3d7a2c5f8b1e4d6a0c93",
    "blockNumber": "0x39d8f4a",
    "transactionIndex": "0x2c",
    "from": "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "to": "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    "value": "0x0",
    "gas": "0x186a0",
    "gasPrice": "0x6fc23ac00",
    "input": "0xa9059cbb0000000000000000000000003f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be00000000000000000000000000000000000000000000000000000000004c4b40",
    "chainId": "0x89"
  }
}
```

When the transaction is unknown or has not yet been seen:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

The `result` is the transaction object, or `null`.

| Field | Type | Description |
|---|---|---|
| `hash` | string | 32-byte hash of the transaction. |
| `nonce` | string | Number of transactions made by the sender prior to this one, as `0x`-hex. |
| `blockHash` | string \| null | Hash of the block this transaction was included in; `null` while pending. |
| `blockNumber` | string \| null | Block number this transaction was included in, as `0x`-hex; `null` while pending. |
| `transactionIndex` | string \| null | Index of the transaction within its block, as `0x`-hex; `null` while pending. |
| `from` | string | 20-byte address of the sender. |
| `to` | string \| null | 20-byte address of the receiver; `null` for contract-creation transactions. |
| `value` | string | Value transferred in wei (MATIC has 18 decimals), as `0x`-hex. |
| `gas` | string | Gas supplied by the sender, as `0x`-hex. |
| `gasPrice` | string | Gas price provided by the sender in wei, as `0x`-hex. |
| `input` | string | The calldata sent with the transaction, as `0x`-hex. |
| `chainId` | string | Chain id of the transaction; `0x89` (137) for Polygon mainnet. |

## Errors

Polygon RPC calls return errors inside the standard JSON-RPC `error` object. The
codes most relevant to this method:

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's free 7-day trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | Your tier is below the minimum for the requested method. The `data` block carries `current_tier`, `required_tier`, and `upgrade_url`. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. The `data` block carries `limit_rps`, `retry_after_sec`, and `upgrade_url`. |
| HTTP `403` | `method_unknown` | The method is not part of the Polygon product, or the name is misspelled. |

A malformed or wrong-length `txHash` is rejected as an invalid-params error
before the lookup runs. See the shared [errors reference](../../errors.md) for
the full envelope, the `data` payload, and the complete code list.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getTransactionByHash",
    params: [
      "0x6f3a1c8e5b9d2a47f0c1e8b6d4a2f9c3e7b1d0a5c8e2f4b6a9d1c3e5f7a0b2c4d",
    ],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("transaction unknown or pending");
} else if (result.blockNumber === null) {
  console.log("seen in mempool, not yet mined");
} else {
  console.log(`included in block ${result.blockNumber}`);
}
```

## Notes

- A `blockHash` / `blockNumber` of `null` means the transaction is still in the
  mempool. Poll at roughly the Polygon block interval (**~2.1 s**) until those
  fields populate to detect inclusion, then call
  [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) for the execution
  status, effective gas used, and emitted logs.
- To detect pending transactions without polling, prefer a WebSocket
  `newPendingTransactions` subscription instead of polling this method — polling
  a not-yet-mined hash wastes requests against your per-second budget.
- All numeric fields (`nonce`, `value`, `gas`, `gasPrice`, `blockNumber`,
  `transactionIndex`, `chainId`) are quantity-encoded `0x`-hex strings, not JSON
  numbers.
- To fetch a transaction by its position instead of its hash, use
  [`eth_getTransactionByBlockHashAndIndex`](./eth_getTransactionByBlockHashAndIndex.md)
  or
  [`eth_getTransactionByBlockNumberAndIndex`](./eth_getTransactionByBlockNumberAndIndex.md).
- This method belongs to the `polygon_read_rpc` category, so it draws from the
  same per-tier RPS budget as the other Polygon read methods.
