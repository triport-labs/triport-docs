> Live version: https://triport.io/docs/eth/json-rpc/eth_getTransactionReceipt

# eth_getTransactionReceipt

> Returns the receipt of a transaction by its hash — including execution status, gas used, emitted logs, and (for contract deployments) the new contract address.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionReceipt` (JSON-RPC over `POST /`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst (basic 20, pro 100, business 250); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionReceipt` retrieves the receipt produced when a transaction was
mined into a block. The receipt is the authoritative record of what actually
happened on-chain: whether the transaction succeeded, how much gas it consumed,
the logs (events) it emitted, and — when the transaction created a contract — the
address of the deployed contract.

Use this method to **confirm a transaction's outcome** after you have submitted it
with [eth_sendRawTransaction](./eth_sendRawTransaction.md). A common pattern is to
poll this method with the transaction hash until a non-null receipt is returned,
then read `status` to determine success or failure.

The method returns `null` when the transaction is still **pending** (not yet
mined) or **unknown** (never seen by the node, or dropped from the mempool). A
`null` result is not an error — it simply means there is no receipt yet. Note that
a non-null receipt does not by itself guarantee finality; for high-value flows,
wait for a sufficient number of block confirmations after the receipt appears.

## Parameters

`eth_getTransactionReceipt` takes a single positional parameter.

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `transactionHash` | string (32-byte hex, `0x`-prefixed) | yes | Hash of the transaction whose receipt you want to fetch. |

```json
"params": ["0x1f2a...e9c4"]
```

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionReceipt",
    "params": ["0x1f2a90d6c0a8b4d7c9e3f1a2b3c4d5e6f70819203a4b5c6d7e8f90112233e9c4"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "transactionHash": "0x1f2a90d6c0a8b4d7c9e3f1a2b3c4d5e6f70819203a4b5c6d7e8f90112233e9c4",
    "transactionIndex": "0x3a",
    "blockHash": "0x9b7c0e4d2f1a6b8c3d5e7f90a1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
    "blockNumber": "0x12a4b2c",
    "from": "0xa1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
    "to": "0xdac17f958d2ee523a2206206994597c13d831ec7",
    "cumulativeGasUsed": "0x8f1c2d",
    "gasUsed": "0xc350",
    "effectiveGasPrice": "0x4a817c800",
    "contractAddress": null,
    "logs": [
      {
        "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x000000000000000000000000a1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
          "0x000000000000000000000000ffeeddccbbaa99887766554433221100aabbccdd"
        ],
        "data": "0x00000000000000000000000000000000000000000000000000000000000f4240",
        "blockNumber": "0x12a4b2c",
        "transactionHash": "0x1f2a90d6c0a8b4d7c9e3f1a2b3c4d5e6f70819203a4b5c6d7e8f90112233e9c4",
        "transactionIndex": "0x3a",
        "blockHash": "0x9b7c0e4d2f1a6b8c3d5e7f90a1b2c3d4e5f60718293a4b5c6d7e8f9001122334",
        "logIndex": "0x5c",
        "removed": false
      }
    ],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000",
    "status": "0x1",
    "type": "0x2"
  }
}
```

For a pending or unknown transaction:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

The `result` is the receipt object, or `null` if no receipt exists yet.

| Field | Type | Description |
|---|---|---|
| `status` | string (hex) | `0x1` if the transaction succeeded, `0x0` if it was reverted. |
| `transactionHash` | string | Hash of the transaction. |
| `transactionIndex` | string (hex) | Index of the transaction within its block. |
| `blockHash` | string | Hash of the block containing the transaction. |
| `blockNumber` | string (hex) | Number of the block containing the transaction. |
| `from` | string | Sender address. |
| `to` | string \| null | Recipient address; `null` for contract-creation transactions. |
| `gasUsed` | string (hex) | Gas used by this transaction alone. |
| `cumulativeGasUsed` | string (hex) | Total gas used in the block up to and including this transaction. |
| `effectiveGasPrice` | string (hex) | Actual gas price paid per unit of gas, in wei. |
| `contractAddress` | string \| null | Address of the contract created, if this was a deployment; otherwise `null`. |
| `logs` | array | List of log (event) objects emitted by the transaction. |
| `logsBloom` | string | Bloom filter over the logs, for fast log lookups. |
| `type` | string (hex) | Transaction type (`0x0` legacy, `0x1` access-list, `0x2` EIP-1559). |

Each entry in `logs` contains `address`, `topics`, `data`, `blockNumber`,
`transactionHash`, `transactionIndex`, `blockHash`, `logIndex`, and `removed`.

## Errors

Errors are returned in the standard JSON-RPC envelope (`error.code` +
`error.message`). See [errors.md](../../errors.md) for the full envelope and
shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry. |

A non-existent or still-pending transaction is **not** an error — the call
succeeds with `"result": null`.

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
    method: "eth_getTransactionReceipt",
    params: ["0x1f2a90d6c0a8b4d7c9e3f1a2b3c4d5e6f70819203a4b5c6d7e8f90112233e9c4"],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("Transaction is pending or unknown");
} else {
  console.log("Succeeded?", result.status === "0x1");
  console.log("Gas used:", parseInt(result.gasUsed, 16));
}
```

## Notes

- **Polling for confirmation.** After submitting a transaction, poll this method
  with the returned hash until you get a non-null receipt, then inspect `status`.
  Add a short backoff between polls to stay within your tier's RPS limit.
- **Reverted transactions still get a receipt.** A `status` of `0x0` means the
  transaction was mined but reverted — gas was still consumed. Always check
  `status` rather than assuming a non-null receipt implies success.
- **Contract deployments.** When a transaction creates a contract, `to` is `null`
  and `contractAddress` holds the new contract's address.
- **All numeric fields are hex strings.** Convert with `parseInt(value, 16)` (JS)
  or `int(value, 16)` (Python) before doing arithmetic.
- **Rate limits** are enforced per second per tier (no daily cap). On HTTP `429`,
  honor exponential backoff rather than retrying immediately.
- **Related methods:** [eth_getTransactionByHash](./eth_getTransactionByHash.md)
  (the transaction itself, available before it is mined),
  [eth_sendRawTransaction](./eth_sendRawTransaction.md) (submit a transaction),
  and [eth_getLogs](./eth_getLogs.md) (query events across many blocks).
- **Null result?** A `null` receipt is not an error — see
  [why eth_getTransactionReceipt returns null](https://triport.io/learn/transaction-receipt-null)
  for pending, replaced and out-of-index transactions.
