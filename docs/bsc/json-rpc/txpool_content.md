> Live version: https://triport.io/docs/bsc/json-rpc/txpool_content

# txpool_content

> Return pending and queued transaction maps.

| | |
|---|---|
| **Method / Endpoint** | `txpool_content` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | BNB Smart Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `bsc:rpc` |
| **Tier / rate limit** | `bsc_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`txpool_content` returns the selected BNB Smart Chain node's pending and queued transaction maps.

Each top-level map is keyed by sender address and then nonce, with full transaction objects as values. Use it when an operator needs transaction-level txpool detail rather than aggregate counts.

Unlike `txpool_inspect`, this method returns transaction objects; unlike `txpool_status`, it returns the pool contents rather than two counters. It is observational only, and Triport does not expose BSC transaction submission.

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
  "method": "txpool_content",
  "params": []
}'
```

### JSON-RPC payload

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "txpool_content",
  "params": []
}
```

## Response

The response below is the checked fixture for this method; it is reproduced without changing its fields or values.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "pending": {},
    "queued": {}
  }
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `result` | object | Selected node's txpool content. |
| `result.pending` | object | Pending transactions grouped by sender and nonce. |
| `result.queued` | object | Queued transactions grouped by sender and nonce. |

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
    "method": "txpool_content",
    "params": []
  }),
});

const payload = await response.json();
console.log(payload.result);
```

## Notes

- The BSC categories use configured defaults of 15 / 20 / 100 / 250 RPS; they are marked unmeasured in the tier matrix.
- **Related methods:** [`txpool_inspect`](./txpool_inspect.md), [`txpool_status`](./txpool_status.md), [`eth_getTransactionByHash`](./eth_getTransactionByHash.md).
