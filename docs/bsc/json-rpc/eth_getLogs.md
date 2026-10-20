> Live version: https://triport.io/docs/bsc/json-rpc/eth_getLogs

# eth_getLogs

> Return event logs matching a filter.

| | |
|---|---|
| **Method / Endpoint** | `eth_getLogs` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getLogs` returns BNB Smart Chain event logs matching one address/topic filter and either a block range or a block hash.

Use it for bounded event indexing and contract-event lookups. Topics are positional and support a hash, `null`, or an array of hashes per position. `blockHash` must not be combined with `fromBlock` according to the OpenRPC schema.

This pool has per-node limits: the limited class accepts 25 blocks and rejects 50, while two standard classes accept 100 blocks and reject 1,000. One standard class requires `address`. Split wider queries before sending them so routing can honor the selected node's capability.

## Parameters

JSON-RPC `params` is a positional array: `[filter]`.

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `filter` | object | yes | Per-node maximum range is ≤ 100 blocks; address is required by some nodes. |

### `filter` object

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string or array<string> | no* | Contract address or non-empty address list. Part of the BSC pool requires it. |
| `blockHash` | string (hash) | no | Match one block. Must not be combined with `fromBlock`. |
| `fromBlock` | string (block tag or hex quantity) | no | Inclusive start of the block range. |
| `toBlock` | string (block tag or hex quantity) | no | Inclusive end of the block range. |
| `topics` | array | no | Up to four positional topic selectors; each is `null`, one hash, or an array of hashes. |

## Request

`POST https://triport.io/rpc/bsc`

```bash
curl https://triport.io/rpc/bsc \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getLogs",
  "params": [
    {
      "fromBlock": "latest",
      "toBlock": "latest",
      "address": "0x0000000000000000000000000000000000000000"
    }
  ]
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getLogs",
  "params": [
    {
      "fromBlock": "latest",
      "toBlock": "latest",
      "address": "0x0000000000000000000000000000000000000000"
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
  "result": []
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | array<object> | Matching log entries. |
| `result[].address` | string | Contract address that emitted the log. |
| `result[].data` | string | Unindexed event data as hex bytes. |
| `result[].topics` | array<string> | Indexed event topics. |
| `result[].blockHash` | string | Containing block hash when supplied. |
| `result[].blockNumber` | string | Containing block number as a hex quantity when supplied. |
| `result[].transactionHash` | string | Containing transaction hash when supplied. |
| `result[].transactionIndex` | string | Transaction index as a hex quantity when supplied. |
| `result[].logIndex` | string | Log index as a hex quantity when supplied. |
| `result[].removed` | boolean | Whether the log was removed by a reorganization when supplied. |

## Errors

Errors use the standard JSON-RPC error envelope. See [BSC errors](../errors.md) for network-specific classification and the linked shared reference.

| Code | Meaning | When it happens |
| --- | --- | --- |
| `-32602` | Invalid params | A required positional parameter is missing or a value does not match the OpenRPC schema. |
| `-32000` | Upstream request failure | Interpret the message with the code: `header not found` means a missing block; pruned/unsupported state text means unavailable historical state. |
| `-32005` or upstream error | Log query limit | The selected node rejects the requested range or requires an address filter. |
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
    "method": "eth_getLogs",
    "params": [
      {
        "fromBlock": "latest",
        "toBlock": "latest",
        "address": "0x0000000000000000000000000000000000000000"
      }
    ]
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- Keep requests within the selected node's 25- or 100-block limit. Include `address` whenever possible because part of the pool requires it.
- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_getBlockReceipts`](./eth_getBlockReceipts.md), [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md), [`eth_getBlockByNumber`](./eth_getBlockByNumber.md).
