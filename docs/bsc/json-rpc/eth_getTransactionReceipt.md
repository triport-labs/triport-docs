> Live version: https://triport.io/docs/bsc/json-rpc/eth_getTransactionReceipt

# eth_getTransactionReceipt

> Return a transaction receipt by hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionReceipt` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionReceipt` returns the execution receipt for a BNB Smart Chain transaction hash, or `null` when no receipt is available.

Use it after mining to inspect status, gas usage, effective gas price, logs, and a created contract address. Receipt quantities and byte fields use standard EVM JSON-RPC encodings.

Unlike `eth_getTransactionByHash`, this method describes execution outcome rather than the submitted transaction. It is read-only; raw transaction submission is not exposed for BSC.

## Parameters

JSON-RPC `params` is a positional array: `[transactionHash]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `transactionHash` | string (32-byte hex hash) | yes | The 32-byte hash of the transaction to query. |

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getTransactionReceipt",
  "params": [
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getTransactionReceipt",
  "params": [
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ]
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | object or null | Receipt object, or `null` when unavailable. |
| `result.transactionHash` | string | Transaction hash. |
| `result.transactionIndex` | string | Transaction index as a hex quantity. |
| `result.blockHash` | string | Containing block hash. |
| `result.blockNumber` | string | Containing block number as a hex quantity. |
| `result.from` | string | Sender address. |
| `result.to` | string or null | Destination address, or `null` for contract creation. |
| `result.contractAddress` | string or null | Created contract address when applicable. |
| `result.cumulativeGasUsed` | string | Cumulative block gas used as a hex quantity. |
| `result.gasUsed` | string | Transaction gas used as a hex quantity. |
| `result.effectiveGasPrice` | string | Effective gas price as a hex quantity. |
| `result.logs` | array<object> | Event logs emitted by the transaction. |
| `result.logsBloom` | string | Receipt logs bloom as hex data. |
| `result.status` | string | Execution status as a hex quantity. |
| `result.type` | string | Transaction type as a hex quantity. |

## Errors

Errors use the standard JSON-RPC error envelope. See [BSC errors](../errors.md) for network-specific classification and the linked shared reference.

| Code | Meaning | When it happens |
| --- | --- | --- |
| `-32602` | Invalid params | A required positional parameter is missing or a value does not match the OpenRPC schema. |
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
    "method": "eth_getTransactionReceipt",
    "params": [
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- A pending or unknown transaction can produce `null`; poll according to your application's confirmation policy.
- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_getTransactionByHash`](./eth_getTransactionByHash.md), [`eth_getBlockReceipts`](./eth_getBlockReceipts.md), [`eth_getLogs`](./eth_getLogs.md).
