> Live version: https://triport.io/docs/eth/json-rpc/net_listening

# net_listening

> Returns whether the Ethereum node is actively listening for network connections.

| | |
|---|---|
| **Method / Endpoint** | `net_listening` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_listening` reports whether the underlying Ethereum node is currently
listening for inbound peer-to-peer network connections. It returns a single
boolean: `true` when the node is accepting connections, `false` otherwise.

Use it as a lightweight health/liveness probe before issuing heavier calls, or
as part of a monitoring loop. It takes no parameters and is available on the
Free trial, so it is a cheap way to confirm the endpoint is reachable and your
API key is valid.

This is a read-only method in the `net` namespace. It does not reflect peer
count — use [`net_peerCount`](./net_peerCount.md) for that.

## Parameters

This method takes no parameters. Pass an empty array for `params`.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | no | No parameters. |

## Request

```bash
curl https://triport.io/eth \
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
| `jsonrpc` | string | JSON-RPC version, always `"2.0"`. |
| `id` | number | Echoes the request `id`. |
| `result` | boolean | `true` if the node is listening for network connections, otherwise `false`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade the plan to continue. |
| `429` | `rate_limited` | Requests exceeded the per-tier RPS limit (10 RPS sustained · up to 20 burst on free). Back off and retry. |

Errors are returned in the standard JSON-RPC error envelope. See the shared
[Errors](../../errors.md) page for the full envelope and handling guidance.

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
    method: "net_listening",
    params: [],
  }),
});

const { result } = await res.json();
console.log("listening:", result); // true
```

## Notes

- The result is almost always `true` for a healthy synced node; a `false`
  value indicates the node has disabled inbound networking.
- For richer connectivity diagnostics, pair this with
  [`net_peerCount`](./net_peerCount.md) (number of connected peers) and
  [`net_version`](./net_version.md) (network ID).
- No parameters and no daily quota — rate limiting is purely RPS-per-tier with
  burst allowance.
