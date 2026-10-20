> Live version: https://triport.io/docs/bsc/json-rpc/eth_getBlockReceipts

# eth_getBlockReceipts

> Return all transaction receipts in a block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockReceipts` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockReceipts` returns an array containing the transaction receipts for one BNB Smart Chain block.

Use it when an indexer needs status, gas, logs, and contract-creation results for the complete block without looking up every receipt separately. The block is selected with a standard tag or hex block number.

Unlike `eth_getTransactionReceipt`, this method is block-scoped and can return many receipts. Unlike `eth_getLogs`, it returns receipt objects rather than only matching event logs.

## Parameters

JSON-RPC `params` is a positional array: `[block]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `block` | string (block tag or hex quantity) | yes | Block selector: `latest`, `earliest`, `pending`, or an EVM hex block number. |

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBlockReceipts",
  "params": [
    "latest"
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getBlockReceipts",
  "params": [
    "latest"
  ]
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": []
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | array<object> | Transaction receipts returned for the block. |
| `result[].transactionHash` | string | Transaction hash. |
| `result[].transactionIndex` | string | Transaction index as a hex quantity. |
| `result[].blockHash` | string | Containing block hash. |
| `result[].blockNumber` | string | Containing block number as a hex quantity. |
| `result[].from` | string | Sender address. |
| `result[].to` | string | Destination address, or `null` for contract creation. |
| `result[].contractAddress` | string | Created contract address when applicable. |
| `result[].cumulativeGasUsed` | string | Cumulative block gas used as a hex quantity. |
| `result[].gasUsed` | string | Transaction gas used as a hex quantity. |
| `result[].effectiveGasPrice` | string | Effective gas price as a hex quantity. |
| `result[].logs` | array<object> | Event logs emitted by the transaction. |
| `result[].logsBloom` | string | Receipt logs bloom as hex data. |
| `result[].status` | string | Execution status as a hex quantity. |
| `result[].type` | string | Transaction type as a hex quantity. |

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
    "method": "eth_getBlockReceipts",
    "params": [
      "latest"
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md), [`eth_getBlockByNumber`](./eth_getBlockByNumber.md), [`eth_getLogs`](./eth_getLogs.md).
