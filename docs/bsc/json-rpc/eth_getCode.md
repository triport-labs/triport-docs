> Live version: https://triport.io/docs/bsc/json-rpc/eth_getCode

# eth_getCode

> Return account bytecode at a block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getCode` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getCode` returns the bytecode stored at an address at a selected BNB Smart Chain block.

The result is `0x`-prefixed even-length EVM byte data. An empty `0x` result means the selected state has no bytecode at that address; callers should not treat it as contract metadata or decoded ABI.

## Parameters

JSON-RPC `params` is a positional array: `[address, block]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | string (20-byte hex address) | yes | The 20-byte EVM account or contract address to query. |
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
  "method": "eth_getCode",
  "params": [
    "0x0000000000000000000000000000000000000000",
    "latest"
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getCode",
  "params": [
    "0x0000000000000000000000000000000000000000",
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
| `result` | string (hex data) | Account bytecode as hex data. |

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
    "method": "eth_getCode",
    "params": [
      "0x0000000000000000000000000000000000000000",
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
- **Related methods:** [`eth_getStorageAt`](./eth_getStorageAt.md), [`eth_call`](./eth_call.md), [`eth_getBalance`](./eth_getBalance.md).
