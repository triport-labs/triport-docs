> Live version: https://triport.io/docs/bsc/json-rpc/eth_getBlockByNumber

# eth_getBlockByNumber

> Return a block by number or tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByNumber` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockByNumber` returns a BNB Smart Chain block selected by tag or hex block number, or `null` when it is unavailable.

Set `fullTransactions` to `false` for transaction hashes or `true` for transaction objects. The block fields and all numeric quantities use the EVM JSON-RPC encoding defined by the OpenRPC schema.

Use this method when block metadata or transaction membership is required. For only the transaction count, `eth_getBlockTransactionCountByNumber` is smaller; for all receipts, use `eth_getBlockReceipts`.

## Parameters

JSON-RPC `params` is a positional array: `[block, fullTransactions]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `block` | string (block tag or hex quantity) | yes | Block selector: `latest`, `earliest`, `pending`, or an EVM hex block number. |
| `fullTransactions` | boolean | yes | When `true`, return transaction objects; when `false`, return transaction hashes. |

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBlockByNumber",
  "params": [
    "latest",
    false
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBlockByNumber",
  "params": [
    "latest",
    false
  ]
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x1",
    "hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "miner": "0x0000000000000000000000000000000000000000",
    "gasLimit": "0x1",
    "gasUsed": "0x0",
    "timestamp": "0x1",
    "transactions": [],
    "uncles": []
  }
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | object or null | Block object, or `null` when the block is unavailable. |
| `result.number` | string or null | Block number as a hex quantity. |
| `result.hash` | string or null | Block hash. |
| `result.parentHash` | string | Parent block hash. |
| `result.miner` | string | Block producer address. |
| `result.gasLimit` | string | Block gas limit as a hex quantity. |
| `result.gasUsed` | string | Gas used as a hex quantity. |
| `result.timestamp` | string | Block timestamp as a hex quantity. |
| `result.transactions` | array | Transaction hashes or objects, selected by `fullTransactions`. |
| `result.uncles` | array<string> | Uncle hashes returned by the upstream node. |

## Errors

Errors use the standard JSON-RPC error envelope. See [BSC errors](../errors.md) for network-specific classification and the linked shared reference.

| Code | Meaning | When it happens |
| --- | --- | --- |
| `-32602` | Invalid params | A required positional parameter is missing or a value does not match the OpenRPC schema. |
| `-32000` | Upstream request failure | Interpret the message with the code: `header not found` means a missing block; pruned/unsupported state text means unavailable historical state. |
| `401` | Unauthorized | The `x-token` API key is missing or invalid. |
| `429` | Rate limited | The request exceeds the configured category RPS for the caller's tier. |

## Examples

### JavaScript (fetch)

```js
const response = await fetch("https://triport.io/rpc/bsc", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockByNumber",
    "params": [
      "latest",
      false
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_blockNumber`](./eth_blockNumber.md), [`eth_getBlockTransactionCountByNumber`](./eth_getBlockTransactionCountByNumber.md), [`eth_getBlockReceipts`](./eth_getBlockReceipts.md).
