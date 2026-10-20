> Live version: https://triport.io/docs/eth/json-rpc/eth_getTransactionByHash

# eth_getTransactionByHash

> Returns the transaction object for a given transaction hash, or `null` if the transaction is unknown or still pending.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByHash` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst (free) / 20 RPS sustained · up to 40 burst (basic) / 100 RPS sustained · up to 200 burst (pro) / 250 RPS sustained · up to 500 burst (business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByHash` looks up a single transaction by its 32-byte hash and
returns the full transaction object. Use it to confirm that a transaction you
broadcast (for example via `eth_sendRawTransaction`) was accepted by the network,
to read back its calldata and value, or to find which block it landed in.

The method resolves both **mined** and **pending** transactions. If the hash has
been seen in the mempool but not yet included in a block, the `blockHash`,
`blockNumber`, and `transactionIndex` fields are returned as `null` while the
rest of the object is populated. If the hash is completely unknown to the node —
never broadcast, dropped, or replaced — the `result` is `null`.

A `null` result is **not** an error: the JSON-RPC envelope still returns HTTP 200
with `"result": null`. To read execution outcome (status, gas used, logs) you
need [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md), which is only
available once the transaction is mined.

## Parameters

The `params` array takes a single positional element.

| Index | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `txHash` | string | yes | 32-byte transaction hash, `0x`-prefixed hex (66 characters total). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionByHash",
    "params": [
      "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "hash": "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
    "nonce": "0x43eb",
    "blockHash": "0x1d59ff54b1eb26b013ce3cb5fc9dab3705b415a67127a003c3e61eb445bb8df2",
    "blockNumber": "0x5daf3b",
    "transactionIndex": "0x41",
    "from": "0xa7d9ddbe1f17865597fbd27ec712455208b6b76d",
    "to": "0xf02c1c8e6114b1dbe8937a39260b5b0a374432bb",
    "value": "0x7f110",
    "gas": "0x4c4b40",
    "gasPrice": "0x4a817c800",
    "input": "0x68656c6c6f21"
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
| `value` | string | Value transferred in wei, as `0x`-hex. |
| `gas` | string | Gas supplied by the sender, as `0x`-hex. |
| `gasPrice` | string | Gas price provided by the sender in wei, as `0x`-hex. |
| `input` | string | The calldata sent with the transaction, as `0x`-hex. |

## Errors

Triport returns standard JSON-RPC error envelopes. The codes most relevant to
this method:

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. The `data` block carries `limit_rps`, `retry_after_sec`, and `upgrade_url`. |

A malformed or wrong-length `txHash` is rejected as an invalid-params error
before the lookup runs. See the shared [errors reference](../../errors.md) for
the full error envelope and the complete code list.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/eth", {
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
      "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b",
    ],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("transaction unknown or pending");
} else {
  console.log(`included in block ${result.blockNumber}`);
}
```

## Notes

- A `blockHash` / `blockNumber` of `null` means the transaction is still in the
  mempool. Poll until those fields populate to detect inclusion, then call
  [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) for the execution
  status, effective gas used, and emitted logs.
- All numeric fields (`nonce`, `value`, `gas`, `gasPrice`, `blockNumber`,
  `transactionIndex`) are quantity-encoded `0x`-hex strings, not JSON numbers.
- To fetch a transaction by its position instead of its hash, use
  [`eth_getTransactionByBlockHashAndIndex`](./eth_getTransactionByBlockHashAndIndex.md)
  or
  [`eth_getTransactionByBlockNumberAndIndex`](./eth_getTransactionByBlockNumberAndIndex.md).
- This method is shared with the `eth_read_rpc` category, so it draws from the
  same per-tier RPS budget as the other Ethereum read methods.
- **Token transfer shows `value` 0?** The amount is in the call data and the
  `Transfer` log — see [why an ERC-20 transfer shows value 0](https://triport.io/learn/erc20-transfer-value-zero).
