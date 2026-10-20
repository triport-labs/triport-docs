> Live version: https://triport.io/docs/bsc/json-rpc/eth_call

# eth_call

> Execute a read-only EVM call.

| | |
|---|---|
| **Method / Endpoint** | `eth_call` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_call` executes a read-only EVM message call against BNB Smart Chain state and returns the raw output bytes without creating a transaction.

Use it for contract getters, simulation, and ABI-encoded calls. The result is `0x`-prefixed byte data; the caller must decode it with the target contract ABI. The optional block tag selects the state snapshot and defaults to the upstream node's current state when omitted.

## Parameters

JSON-RPC `params` is a positional array: `[call, block?]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `call` | object | yes | EVM call object to simulate; see the object fields below. |
| `block` | string (block tag or hex quantity) | no | Block selector: `latest`, `earliest`, `pending`, or an EVM hex block number. |

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
  "method": "eth_call",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "data": "0x"
    },
    "latest"
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_call",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "data": "0x"
    },
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
  "result": "0x"
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | string (hex data) | Raw EVM call output as hex data. |

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
    "method": "eth_call",
    "params": [
      {
        "to": "0x0000000000000000000000000000000000000000",
        "data": "0x"
      },
      "latest"
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- Treat upstream `-32000` by both code and message: `header not found` and pruned historical state are different conditions.
- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_estimateGas`](./eth_estimateGas.md), [`eth_getCode`](./eth_getCode.md), [`eth_getStorageAt`](./eth_getStorageAt.md).
