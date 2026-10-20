> Live version: https://triport.io/docs/polygon/json-rpc/net_version

# net_version

> Returns the network ID as a decimal string — `"137"` for Polygon mainnet.

| | |
|---|---|
| **Method / Endpoint** | `net_version` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_version` returns the network identifier of the connected chain as a
**decimal string**. For Polygon mainnet the value is `"137"`.

This is a legacy companion to [`eth_chainId`](./eth_chainId.md): both identify
the chain, but `net_version` returns a decimal string (`"137"`) while
`eth_chainId` returns a hex quantity (`0x89`). Web3.js versions before 4.x call
`net_version` during network detection, which is the main reason to keep it
around. For new integrations prefer `eth_chainId` — it is the EIP-155 chain ID
used for replay-protected transaction signing.

This method takes no parameters and is available on every tier
(`polygon_read_rpc`).

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
    "method": "net_version",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "137"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Network ID as a decimal string. `"137"` is Polygon mainnet. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | Your tier does not include the `polygon_read_rpc` scope. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry. |
| `401` | `subscription_expired` | The subscription tied to the API key has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | The method is not available on the resolved upstream for your request. |

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
    method: "net_version",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result);              // "137"
console.log(Number(result));      // 137
```

## Notes

* The result is a **decimal string**, not a hex quantity — convert with
  `Number(result)` (JS) or `int(result)` (Python). This differs from
  [`eth_chainId`](./eth_chainId.md), which returns the hex quantity `0x89`.
* The network ID is stable for the lifetime of the chain and never changes
  between blocks, so the value is safe to cache for the duration of a session.
* Polygon Amoy testnet returns `"80002"`.
* Related: [`eth_chainId`](./eth_chainId.md) is the preferred chain-detection
  method for modern clients; [`net_listening`](./net_listening.md) and
  [`net_peerCount`](./net_peerCount.md) cover the rest of the `net` namespace.
