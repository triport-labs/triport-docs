> Live version: https://triport.io/docs/bsc/json-rpc/eth_feeHistory

# eth_feeHistory

> Return fee-market history.

| | |
|---|---|
| **Method / Endpoint** | `eth_feeHistory` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_feeHistory` returns recent fee-market observations ending at a selected BNB Smart Chain block.

The response contains the oldest block in the window, base-fee quantities, gas-used ratios, and optional reward rows for the requested percentiles. Quantities are hex encoded; gas-used ratios are numbers between zero and one.

Use it to build fee suggestions from a block window. For a single current gas-price estimate use `eth_gasPrice`; for a single priority-fee estimate use `eth_maxPriorityFeePerGas`.

## Parameters

JSON-RPC `params` is a positional array: `[blockCount, newestBlock, rewardPercentiles]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `blockCount` | string (hex quantity) | yes | Number of blocks in the history window, encoded as an EVM hex quantity. |
| `newestBlock` | string (block tag or hex quantity) | yes | Newest block in the requested history window. |
| `rewardPercentiles` | array<number> | yes | Percentiles between 0 and 100 for optional priority-fee reward rows. |

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_feeHistory",
  "params": [
    "0x1",
    "latest",
    [
      50
    ]
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_feeHistory",
  "params": [
    "0x1",
    "latest",
    [
      50
    ]
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
    "oldestBlock": "0x1",
    "baseFeePerGas": [
      "0x0",
      "0x0"
    ],
    "gasUsedRatio": [
      0.5
    ],
    "reward": [
      [
        "0x0"
      ]
    ]
  }
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | object | Fee history response. |
| `result.oldestBlock` | string | Oldest block in the returned window as a hex quantity. |
| `result.baseFeePerGas` | array<string> | Base-fee hex quantities for the window. |
| `result.gasUsedRatio` | array<number> | Gas-used ratios between zero and one. |
| `result.reward` | array<array<string>> | Optional reward quantities corresponding to the requested percentiles. |

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
    "method": "eth_feeHistory",
    "params": [
      "0x1",
      "latest",
      [
        50
      ]
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_gasPrice`](./eth_gasPrice.md), [`eth_maxPriorityFeePerGas`](./eth_maxPriorityFeePerGas.md), [`eth_getBlockByNumber`](./eth_getBlockByNumber.md).
