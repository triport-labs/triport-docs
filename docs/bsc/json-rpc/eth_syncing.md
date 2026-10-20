> Live version: https://triport.io/docs/bsc/json-rpc/eth_syncing

# eth_syncing

> Return node sync progress or false.

| | |
|---|---|
| **Method / Endpoint** | `eth_syncing` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_syncing` reports whether the selected BNB Smart Chain node is synchronizing.

A fully synchronized node returns the boolean `false`. A synchronizing node returns an object containing starting, current, and highest block quantities.

Use it for node-state diagnostics, not as the chain's canonical block height. `eth_blockNumber` returns the selected node's current head and `net_peerCount` reports its peer count.

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
  "method": "eth_syncing",
  "params": []
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_syncing",
  "params": []
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": false
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | boolean or object | `false` when synchronized, otherwise a sync progress object. |
| `result.startingBlock` | string | Starting block as a hex quantity when syncing. |
| `result.currentBlock` | string | Current block as a hex quantity when syncing. |
| `result.highestBlock` | string | Highest target block as a hex quantity when syncing. |

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
    "method": "eth_syncing",
    "params": []
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`eth_blockNumber`](./eth_blockNumber.md), [`net_peerCount`](./net_peerCount.md), [`net_listening`](./net_listening.md).
