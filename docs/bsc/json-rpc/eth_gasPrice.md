> Live version: https://triport.io/docs/bsc/json-rpc/eth_gasPrice

# eth_gasPrice

> Return the current gas-price estimate.

| | |
|---|---|
| **Method / Endpoint** | `eth_gasPrice` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_gasPrice` returns the selected node's current gas-price estimate as an EVM hex quantity denominated in wei per gas.

Use it as a simple fee input for callers that do not need a historical distribution. Decode the quantity before presenting it in another denomination.

This is a point estimate, unlike `eth_feeHistory`, which returns a block window and reward percentiles. `eth_maxPriorityFeePerGas` returns only a priority-fee estimate.

## Parameters

JSON-RPC `params` must be an empty array: `[]`.

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_gasPrice",
  "params": []
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_gasPrice",
  "params": []
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0"
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | string (hex quantity) | Gas-price estimate in wei per gas as a hex quantity. |

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
    "method": "eth_gasPrice",
    "params": []
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_feeHistory`](./eth_feeHistory.md), [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md), [`eth_estimateGas`](./eth_estimateGas.md).
