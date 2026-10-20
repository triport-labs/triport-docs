> Live version: https://triport.io/docs/eth/json-rpc/eth_syncing

# eth_syncing

> Reports whether the Ethereum node is currently syncing, returning `false` when fully synced or a sync-progress object while catching up.

| | |
|---|---|
| **Method / Endpoint** | `eth_syncing` (JSON-RPC, `POST /` ) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 / 20 / 100 / 250 RPS sustained · short burst 20 / 40 / 200 / 500 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_syncing` tells you whether the node serving your request is fully
synchronized with the head of the Ethereum chain. When the node is caught up,
it returns the boolean `false`. While the node is still importing blocks, it
returns an object describing how far the sync has progressed.

Use this as a lightweight health probe before depending on the freshness of
data from other reads such as [`eth_blockNumber`](./eth_blockNumber.md) or
[`eth_getBlockByNumber`](./eth_getBlockByNumber.md). On the Triport platform
requests are routed to synced nodes, so in normal operation you should expect
`false`; a sync object is the signal that the node you reached is still
backfilling and its latest-block data may lag the true chain head.

Note that the numeric fields are returned as hex-encoded quantity strings
(e.g. `"0x9e64d"`), not decimal numbers — decode them before doing arithmetic.

## Parameters

This method takes no parameters. Pass an empty array for `params`.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This method accepts no parameters. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_syncing",
    "params": []
  }'
```

## Response

When the node is fully synced:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": false
}
```

When the node is still syncing:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "startingBlock": "0x9e640",
    "currentBlock": "0x9e64d",
    "highestBlock": "0x9f2a1"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | `boolean` \| `object` | `false` when fully synced; otherwise a sync-status object (fields below). |
| `result.startingBlock` | `string` (hex quantity) | Block number at which the current sync import started. |
| `result.currentBlock` | `string` (hex quantity) | Block number the node has imported up to so far. |
| `result.highestBlock` | `string` (hex quantity) | Estimated highest block number on the network (the sync target). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry. |

Both are plain HTTP responses: they are decided before the request reaches the
RPC layer, so there is no JSON-RPC `error` object. Upstream node errors do use
the JSON-RPC envelope. See the shared [errors reference](../../errors.md) for
both shapes and retry guidance.

Example rate-limited response (HTTP `429`):

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 10 requests/s for eth_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "eth_read_rpc",
  "limit_rps": 10,
  "burst_capacity": 20,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_syncing",
    params: [],
  }),
});

const { result } = await res.json();
if (result === false) {
  console.log("Node is fully synced");
} else {
  console.log(`Syncing: ${parseInt(result.currentBlock, 16)} / ${parseInt(result.highestBlock, 16)}`);
}
```

## Notes

- A `false` result is the common case on Triport, since requests are routed to
  synced nodes. Treat a returned object as a transient condition.
- All block numbers are hex-encoded quantity strings; convert with
  `parseInt(value, 16)` (JS/TS) or `int(value, 16)` (Python).
- For the absolute current head once synced, use
  [`eth_blockNumber`](./eth_blockNumber.md).
- This method takes no parameters and is safe to poll, subject to your tier's
  RPS limit. See [rate limits](../../rate-limits-and-tiers.md) for burst behavior.
