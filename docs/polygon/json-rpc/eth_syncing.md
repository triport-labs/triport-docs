> Live version: https://triport.io/docs/polygon/json-rpc/eth_syncing

# eth_syncing

> Reports whether the Polygon node serving your request is still catching up to the chain head, or fully synced.

| | |
|---|---|
| **Method / Endpoint** | `eth_syncing` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) (or `x-token`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | Free and above — Free 15 rps, Basic 20 rps, Pro 100 rps, Business 250 rps (per-second with burst; see [Rate Limits](../../rate-limits-and-tiers.md)) |

## Description

`eth_syncing` returns the synchronization status of the backend node. If the
node is at the chain head and not importing historical blocks, it returns the
boolean `false`. If the node is still catching up, it returns a sync-progress
object describing how far along it is: `{ startingBlock, currentBlock,
highestBlock }`.

Use it as a lightweight health indicator before relying on a node for
freshness-sensitive reads — for example, to confirm a backend is at the tip
before trusting its `eth_blockNumber` or balance results. It takes no parameters
and is one of the cheapest calls on the standard EVM read surface.

In practice, Triport fronts a pool of upstream Polygon providers and steers
traffic away from any node that is not at the head, so on this surface
`eth_syncing` almost always returns `false`. Treat a non-`false` response as the
exception — a backend that briefly fell behind — rather than the normal case. Do
not use `eth_syncing` as your sole liveness check: a CDN-fronted backend can
return `false` even when it is stale, so pair it with a tip-freshness check
(compare `eth_blockNumber` against expected block time, ~2s on Polygon).

## Parameters

This method takes no parameters. Pass an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | `params` must be `[]`. |

## Request

```bash
curl https://triport.io/polygon \
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

When the node is fully synced (the common case):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": false
}
```

When the node is still catching up, `result` is a progress object:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "startingBlock": "0x3a1f2c0",
    "currentBlock": "0x3a1f380",
    "highestBlock": "0x3a1f4a0"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | boolean \| object | `false` when the node is at the chain head; otherwise a sync-progress object. |
| `result.startingBlock` | string (hex) | Block number at which the current sync run began. |
| `result.currentBlock` | string (hex) | Block number the node has imported so far. |
| `result.highestBlock` | string (hex) | Estimated chain-head block number the node is syncing toward. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended. |
| `403` | `tier_insufficient` | The key's tier is below the level required for this category. (`eth_syncing` is included in the Free trial, so this is rare here.) |
| `429` | `rate_limited` | You exceeded your tier's per-second budget (including burst) for `polygon_read_rpc`. Returned with HTTP 429 and a `Retry-After` header — back off and retry. |
| `401` | `subscription_expired` | The key's paid subscription has lapsed. |
| `401` | `unauthorized` | The key is missing, invalid, or lacks the `polygon_read_rpc` scope. |
| HTTP `403` | `method_unknown` | The method name was not recognised on the `polygon` chain (e.g. a typo). |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
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
  console.log("node is synced to head");
} else {
  console.log(`syncing: ${parseInt(result.currentBlock, 16)} / ${parseInt(result.highestBlock, 16)}`);
}
```

## Notes

- **Boolean vs object.** Always branch on `result === false` (strict) before
  treating `result` as a progress object — `false` and the object are the only
  two shapes returned. Block numbers inside the object are hex strings.
- **Not a freshness guarantee.** Because traffic is routed across pooled
  upstreams, a `false` response confirms the chosen backend reports itself
  synced — not that it is necessarily at the absolute tip. For real-time work,
  combine with [`eth_blockNumber`](./eth_blockNumber.md) and compare against
  expected Polygon block time (~2s).
- **Related methods.** Other standard network-state reads on this surface include
  [`eth_blockNumber`](./eth_blockNumber.md), [`net_listening`](./net_listening.md),
  and [`net_peerCount`](./net_peerCount.md) — all in the same `polygon_read_rpc`
  category, available from the Free trial up.
