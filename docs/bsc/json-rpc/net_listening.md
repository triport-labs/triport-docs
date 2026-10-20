> Live version: https://triport.io/docs/bsc/json-rpc/net_listening

# net_listening

> Return whether the node listens for peers.

| | |
|---|---|
| **Method / Endpoint** | `net_listening` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_listening` returns whether the selected BNB Smart Chain node reports that it is listening for peer-to-peer network connections.

This method does not report how many peers are connected. Use `net_peerCount` for the selected node's peer count and `eth_syncing` for its synchronization status.

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
  "method": "net_listening",
  "params": []
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "net_listening",
  "params": []
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": true
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | boolean | Whether the selected node reports that it is listening for peers. |

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
    "method": "net_listening",
    "params": []
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`net_peerCount`](./net_peerCount.md), [`eth_syncing`](./eth_syncing.md), [`web3_clientVersion`](./web3_clientVersion.md).
