> Live version: https://triport.io/docs/eth/json-rpc/net_peerCount

# net_peerCount

> Returns the number of peers currently connected to the Ethereum node, encoded as a hexadecimal integer.

| | |
|---|---|
| **Method / Endpoint** | `net_peerCount` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic 20 · pro 100 · business 250; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_peerCount` reports how many peers the node serving your request is
currently connected to on the Ethereum peer-to-peer network. The count is
returned as a hex-encoded integer string (e.g. `"0x2a"` for 42 peers).

Use it as a lightweight liveness/health signal — a healthy node maintains a
stable, non-zero peer count. It pairs naturally with
[`net_listening`](./net_listening.md) (is the node accepting connections) and
[`net_version`](./net_version.md) (which network the node is on).

The value reflects the state of the node that handled the request at that
moment; because requests may be served by different backends, treat the number
as an instantaneous reading rather than a fixed property of your endpoint.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | no | None. `params` must be `[]`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "net_peerCount",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x2a"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Number of connected peers as a hex-encoded integer (e.g. `"0x2a"` = 42). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier (free 10 · basic 20 · pro 100 · business 250 RPS sustained · up to 500 burst). Retry after backing off. |

Errors follow the standard JSON-RPC error envelope. See
[Errors](../../errors.md) for the full structure and shared error codes.

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
    method: "net_peerCount",
    params: [],
  }),
});

const { result } = await res.json();
const peers = parseInt(result, 16);
console.log(`Connected peers: ${peers}`);
```

## Notes

- The result is **hex-encoded** — convert with `parseInt(value, 16)` (JS/TS) or
  `int(value, 16)` (Python) before using it numerically.
- A result of `"0x0"` means the node currently has no connected peers, which
  usually indicates it is still discovering peers or is unhealthy.
- Available on the **Free** trial; no scope required.
- Related: [`net_listening`](./net_listening.md),
  [`net_version`](./net_version.md), [`eth_syncing`](./eth_syncing.md).
