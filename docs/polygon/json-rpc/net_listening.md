> Live version: https://triport.io/docs/polygon/json-rpc/net_listening

# net_listening

> Returns `true` if the node is actively listening for p2p network connections.

| | |
|---|---|
| **Method / Endpoint** | `net_listening` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_listening` reports whether the underlying Polygon node is currently
listening for inbound peer-to-peer connections. The result is a single boolean.

In practice a healthy, production node always returns `true`, so the method is
most useful as a lightweight liveness check rather than a source of changing
state. It takes no parameters and is available on the Free trial.

If you need richer network information, pair this with
[`net_peerCount`](./net_peerCount.md) (number of connected peers) and
[`net_version`](./net_version.md) (the network ID as a decimal string).

## Parameters

This method takes no parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | Pass an empty array `[]` as `params`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "net_listening",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": true
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | boolean | `true` when the node is listening for p2p connections. For a healthy node this is effectively always `true`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | Your tier is below the level required for this method. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry after `retry_after_sec`. |
| `401` | `subscription_expired` | The subscription tied to this key has lapsed. |
| `401` | `unauthorized` | The API key is missing, malformed, or lacks the `polygon_read_rpc` scope. |
| HTTP `403` | `method_unknown` | The method name is not recognized on this network. |

Errors are returned in the standard JSON-RPC envelope. See the shared
[errors reference](../../errors.md) for the full error object shape and handling
guidance.

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
    method: "net_listening",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result);   // true
```

## Notes

* The result is a plain boolean, not a hex quantity — no decoding is required.
* A `false` result from a healthy production endpoint is not expected; treat it
  as a signal that the node is degraded rather than as routine state.
* Because the value rarely changes, there is little benefit to polling it at high
  frequency. Use it as an occasional health-ping, not a per-request gate.
* Related network-info methods: [`net_version`](./net_version.md) and
  [`net_peerCount`](./net_peerCount.md).
