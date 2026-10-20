> Live version: https://triport.io/docs/polygon/json-rpc/eth_getTransactionReceipt

# eth_getTransactionReceipt

> Returns the receipt for a mined Polygon transaction — execution status, gas used, and emitted logs — or `null` if the transaction has not yet been mined.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionReceipt` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst (free) / 20 RPS sustained · up to 40 burst (basic) / 100 RPS sustained · up to 200 burst (pro) / 250 RPS sustained · up to 500 burst (business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionReceipt` looks up a single transaction by its 32-byte hash and
returns the **receipt** generated when the transaction was executed. The receipt
is the authoritative record of *what happened*: whether the transaction
succeeded (`status`), how much gas it actually consumed (`gasUsed`,
`effectiveGasPrice`), which logs it emitted, and — for contract-creation
transactions — the address of the new contract.

A receipt exists only once the transaction has been **mined**. While a
transaction is still pending in the mempool the method returns `"result": null`.
This is **not** an error — the JSON-RPC envelope returns HTTP 200 with a `null`
result. Poll the method (Polygon block time is ~2.1s) until a non-null receipt
appears to detect confirmation. To read a pending transaction's calldata before
it mines, use [`eth_getTransactionByHash`](./eth_getTransactionByHash.md)
instead.

For batch processing — pulling every receipt in a block at once for an indexer
or analytics pipeline — call [`eth_getBlockReceipts`](./eth_getBlockReceipts.md),
which returns all receipts for a block in a single round-trip rather than issuing
N separate `eth_getTransactionReceipt` calls.

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
    "method": "eth_getTransactionReceipt",
    "params": [
      "0x4f1f6c8b4f6c1c2a3b4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "transactionHash": "0x4f1f6c8b4f6c1c2a3b4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b",
    "transactionIndex": "0x2a",
    "blockHash": "0x9b2c1f0d3e4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e",
    "blockNumber": "0x39a8f01",
    "from": "0xa7d9ddbe1f17865597fbd27ec712455208b6b76d",
    "to": "0xf02c1c8e6114b1dbe8937a39260b5b0a374432bb",
    "cumulativeGasUsed": "0x1a2b3c",
    "gasUsed": "0x5208",
    "effectiveGasPrice": "0x6fc23ac00",
    "contractAddress": null,
    "logs": [
      {
        "address": "0xf02c1c8e6114b1dbe8937a39260b5b0a374432bb",
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x000000000000000000000000a7d9ddbe1f17865597fbd27ec712455208b6b76d",
          "0x000000000000000000000000f02c1c8e6114b1dbe8937a39260b5b0a374432bb"
        ],
        "data": "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
        "blockNumber": "0x39a8f01",
        "transactionHash": "0x4f1f6c8b4f6c1c2a3b4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b",
        "transactionIndex": "0x2a",
        "blockHash": "0x9b2c1f0d3e4a5b6c7d8e9f0a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e",
        "logIndex": "0x4",
        "removed": false
      }
    ],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "status": "0x1",
    "type": "0x2"
  }
}
```

While the transaction is still pending (not yet mined):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

The `result` is the receipt object, or `null` if the transaction has not been
mined.

| Field | Type | Description |
|---|---|---|
| `transactionHash` | string | 32-byte hash of the transaction this receipt belongs to. |
| `transactionIndex` | string | Index of the transaction within its block, as `0x`-hex. |
| `blockHash` | string | Hash of the block the transaction was included in. |
| `blockNumber` | string | Block number the transaction was included in, as `0x`-hex. |
| `from` | string | 20-byte address of the sender. |
| `to` | string \| null | 20-byte address of the receiver; `null` for contract-creation transactions. |
| `cumulativeGasUsed` | string | Total gas used in the block up to and including this transaction, as `0x`-hex. |
| `gasUsed` | string | Gas used by this transaction alone, as `0x`-hex. |
| `effectiveGasPrice` | string | The actual per-gas price paid in wei, as `0x`-hex. |
| `contractAddress` | string \| null | Address of the contract created, if the transaction was a contract deployment; otherwise `null`. |
| `logs` | array | List of log objects emitted by this transaction. |
| `logsBloom` | string | 256-byte bloom filter over the receipt's logs, for fast log filtering. |
| `status` | string | `0x1` if the transaction succeeded, `0x0` if it was reverted. |
| `type` | string | The transaction type, as `0x`-hex (`0x0` legacy, `0x2` EIP-1559). |

## Errors

Triport returns standard JSON-RPC error envelopes. The codes most relevant to
this method:

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | The key's tier is below what this method requires. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. The `data` block carries `limit_rps`, `retry_after_sec`, and `upgrade_url`. |
| `401` | `subscription_expired` | The subscription tied to the key has lapsed. |
| `401` | `unauthorized` | The API key is missing, malformed, or invalid. |
| HTTP `403` | `method_unknown` | The method is not enabled for this key's tier or chain. |

A `null` result for an unmined transaction is **not** one of these errors — it is
a normal HTTP 200 response. A malformed or wrong-length `txHash` is rejected as
an invalid-params error before the lookup runs. See the shared
[errors reference](../../errors.md) for the full error envelope and the complete
code list.

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
    method: "eth_getTransactionReceipt",
    params: [
      "0x4f1f6c8b4f6c1c2a3b4d5e6f70819a2b3c4d5e6f70819a2b3c4d5e6f70819a2b",
    ],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("transaction not yet mined");
} else {
  console.log(result.status === "0x1" ? "succeeded" : "reverted");
}
```

## Notes

- **`null` means pending.** A receipt is created only after the transaction is
  mined. Polygon block time is ~2.1s, so poll at roughly that cadence until the
  result is non-null to detect confirmation. Because Polygon (Bor consensus) can
  re-org over the last few epochs, wait for additional confirmations (commonly
  64–128 blocks, ~2–4 minutes) before treating a receipt as final.
- **Check `status`, not just presence.** A receipt with `status: "0x0"` means the
  transaction was included but **reverted** — gas was still spent. Always inspect
  `status` before treating a transaction as successful.
- **Batch reads.** When you need every receipt in a block (indexers, analytics),
  prefer [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) — one call returns
  all receipts instead of issuing N separate `eth_getTransactionReceipt` lookups.
- All numeric fields (`gasUsed`, `cumulativeGasUsed`, `effectiveGasPrice`,
  `blockNumber`, `status`, `type`) are quantity-encoded `0x`-hex strings, not JSON
  numbers.
- This method belongs to the `polygon_read_rpc` category, so it draws from the
  same per-tier RPS budget as the other Polygon read methods. See
  [rate limits and tiers](../../rate-limits-and-tiers.md).
