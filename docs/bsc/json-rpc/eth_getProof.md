> Live version: https://triport.io/docs/bsc/json-rpc/eth_getProof

# eth_getProof

> Return an account and storage Merkle proof.

| | |
|---|---|
| **Method / Endpoint** | `eth_getProof` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getProof` returns an account proof and proofs for the requested storage keys at a selected BNB Smart Chain block.

Use it when a consumer must verify account state against a state root rather than trusting a balance or storage value directly. The response includes proof node byte arrays plus the account balance, nonce, code hash, and storage hash from the schema.

## Parameters

JSON-RPC `params` is a positional array: `[address, storageKeys, block]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | string (20-byte hex address) | yes | The 20-byte EVM account or contract address to query. |
| `storageKeys` | array<string (hex quantity)> | yes | Storage positions to prove, each encoded as an EVM hex quantity. |
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
  "method": "eth_getProof",
  "params": [
    "0x0000000000000000000000000000000000000000",
    [],
    "latest"
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getProof",
  "params": [
    "0x0000000000000000000000000000000000000000",
    [],
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
  "result": {
    "address": "0x0000000000000000000000000000000000000000",
    "accountProof": [],
    "balance": "0x0",
    "codeHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "nonce": "0x0",
    "storageHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "storageProof": []
  }
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | object | Account and storage proof response. |
| `result.address` | string | Proved account address. |
| `result.accountProof` | array<string> | Hex-encoded account proof nodes. |
| `result.balance` | string | Account balance as a hex quantity. |
| `result.codeHash` | string | Hash of account code. |
| `result.nonce` | string | Account nonce as a hex quantity. |
| `result.storageHash` | string | Account storage-root hash. |
| `result.storageProof` | array<object> | Proof entries for the requested storage keys. |

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
    "method": "eth_getProof",
    "params": [
      "0x0000000000000000000000000000000000000000",
      [],
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
- **Related methods:** [`eth_getStorageAt`](./eth_getStorageAt.md), [`eth_getBalance`](./eth_getBalance.md), [`eth_getBlockByNumber`](./eth_getBlockByNumber.md).
