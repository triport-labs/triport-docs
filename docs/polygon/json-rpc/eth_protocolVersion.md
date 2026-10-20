> Live version: https://triport.io/docs/polygon/json-rpc/eth_protocolVersion

# eth_protocolVersion

> Returns the current EVM protocol version of the Polygon node as a hex string constant.

| | |
|---|---|
| **Method / Endpoint** | `eth_protocolVersion` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 rps · basic — 20 rps · pro — 100 rps · business — 250 rps |

## Description

`eth_protocolVersion` returns the protocol version advertised by the Polygon
execution layer. On Polygon mainnet (chain ID `0x89` / 137) the underlying
client is Bor, which reports a small hex constant — typically `0x42` (66) or
`0x41` (65).

The value is effectively static: it only changes across a node software
upgrade, so clients may cache it indefinitely after the first successful
response. It is most often used as a lightweight capability/identity check
during connection setup, not on a hot path.

This is a read method included in the Free trial (`polygon_read_rpc`) and takes no parameters.
One quirk worth knowing: this method is noticeably slower than its sibling
network-state reads (`eth_chainId`, `net_version`) — the backend recomputes the
value rather than serving it from cache — so prefer to call it once and reuse
the result.

## Parameters

`eth_protocolVersion` takes no parameters. Pass an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | no | This method accepts no parameters. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_protocolVersion",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x42"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC version, always `"2.0"`. |
| `id` | number \| string | Echoes the `id` from the request. |
| `result` | string | EVM protocol version as a hex-encoded integer (e.g. `0x42`). |

## Errors

Errors use the standard JSON-RPC envelope; see [errors.md](../../errors.md) for
the full shape and handling guidance.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The trial window for the API key has ended. |
| `403` | `tier_insufficient` | The key's tier is below what this method requires. |
| `429` | `rate_limited` | The tier's RPS limit (with burst) was exceeded. |
| `401` | `subscription_expired` | The key's paid subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid `Authorization` bearer token. |
| HTTP `403` | `method_unknown` | Method not found / not enabled for this key. |

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
    method: "eth_protocolVersion",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result); // "0x42"
```

## Notes

- **Cache indefinitely.** The value only changes on a node upgrade. Fetch it
  once per connection and reuse it; avoid calling it in a loop.
- **Not cached.** The backend does not serve this from cache — one more
  reason to call it once and reuse it.
- **Related methods:** [`eth_chainId`](./eth_chainId.md) (`0x89` for Polygon
  mainnet) and [`net_version`](./net_version.md) (`"137"` as a decimal string)
  are the better choices for chain-identity checks.
- **Decoding:** parse with `parseInt(result, 16)` in JS or `int(result, 16)`
  in Python.
