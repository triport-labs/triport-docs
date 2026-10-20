> Live version: https://triport.io/docs/bsc/json-rpc/eth_estimateGas

# eth_estimateGas

> Estimate gas for an EVM call.

| | |
|---|---|
| **Method / Endpoint** | `eth_estimateGas` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_estimateGas` simulates an EVM call against current BNB Smart Chain state and returns the estimated gas requirement as a hex quantity.

Use the estimate to prepare a transaction's gas limit. The call object can supply sender, destination, value, calldata, fee fields, gas, and an access list; it must contain at least one of `to`, `data`, or `input` according to the OpenRPC schema.

Unlike `eth_call`, this method returns a gas amount rather than contract output. It does not broadcast or mutate state, and raw transaction submission is not exposed for BSC. Execution can still fail for malformed calldata or a reverting call.

## Parameters

JSON-RPC `params` is a positional array: `[call]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `call` | object | yes | EVM call object to simulate; see the object fields below. |

### `call` object

At least one of `to`, `data`, or `input` is required by the contract.

| Field | Type | Required | Description |
|---|---|---|---|
| `accessList` | array<object> | no | EIP-2930 access-list entries; each contains `address` and `storageKeys`. |
| `data` | string (hex data) | conditional | ABI-encoded call data; an alternative to `input`. |
| `from` | string (address) | no | Address used as the simulated sender. |
| `gas` | string (hex quantity) | no | Gas made available to the simulation. |
| `gasPrice` | string (hex quantity) | no | Legacy gas-price field. |
| `input` | string (hex data) | conditional | ABI-encoded call data; an alternative to `data`. |
| `maxFeePerGas` | string (hex quantity) | no | Maximum fee-per-gas field. |
| `maxPriorityFeePerGas` | string (hex quantity) | no | Maximum priority-fee field. |
| `to` | string (address) | conditional | Destination account or contract. |
| `value` | string (hex quantity) | no | Native value supplied to the simulated call. |

### `accessList[]` object

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string (address) | yes | Account whose storage is predeclared. |
| `storageKeys` | array<string> | yes | 32-byte storage-key hashes for that account. |

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_estimateGas",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "value": "0x0"
    }
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_estimateGas",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "value": "0x0"
    }
  ]
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x5208"
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | string (hex quantity) | Estimated gas as a hex quantity. |

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
    "method": "eth_estimateGas",
    "params": [
      {
        "to": "0x0000000000000000000000000000000000000000",
        "value": "0x0"
      }
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- An estimate is a simulation result, not a guarantee that a later transaction will use exactly the same gas.
- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_call`](./eth_call.md), [`eth_gasPrice`](./eth_gasPrice.md), [`eth_feeHistory`](./eth_feeHistory.md).
