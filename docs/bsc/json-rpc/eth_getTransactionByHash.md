> Live version: https://triport.io/docs/bsc/json-rpc/eth_getTransactionByHash

# eth_getTransactionByHash

> Return a transaction by hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByHash` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByHash` returns a BNB Smart Chain transaction identified by its 32-byte hash, or `null` when the selected node cannot find it.

Use it to retrieve sender, destination, value, gas fields, input data, nonce, type, and block placement for a known hash. Pending transactions can have `null` block fields under the OpenRPC schema.

This method returns the transaction itself, while `eth_getTransactionReceipt` returns execution status, gas consumption, and logs. It is read-only; raw transaction submission is not exposed for BSC.

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
  "method": "eth_getTransactionByHash",
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
  "method": "eth_getTransactionByHash",
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
| `result` | object or null | Transaction object, or `null` when unavailable. |
| `result.hash` | string | Transaction hash. |
| `result.from` | string | Sender address. |
| `result.to` | string or null | Destination address, or `null` for contract creation. |
| `result.value` | string | Transferred native value as a hex quantity. |
| `result.gas` | string | Gas limit as a hex quantity. |
| `result.gasPrice` | string | Gas price as a hex quantity. |
| `result.input` | string | Transaction input byte data. |
| `result.nonce` | string | Sender nonce as a hex quantity. |
| `result.type` | string | Transaction type as a hex quantity. |
| `result.blockHash` | string or null | Containing block hash, or `null` while pending. |
| `result.blockNumber` | string or null | Containing block number, or `null` while pending. |
| `result.transactionIndex` | string or null | Index in the containing block, or `null` while pending. |

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
    "method": "eth_getTransactionByHash",
    "params": [
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- A `null` result means the selected node did not return the transaction; it is not a synthetic error envelope.
- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md), [`eth_getBlockByNumber`](./eth_getBlockByNumber.md), [`txpool_content`](./txpool_content.md).
