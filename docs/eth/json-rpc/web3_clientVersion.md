> Live version: https://triport.io/docs/eth/json-rpc/web3_clientVersion

# web3_clientVersion

> Returns the version string of the Ethereum node client serving your requests.

| | |
|---|---|
| **Method / Endpoint** | `web3_clientVersion` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free · 10 RPS sustained · up to 20 burst · basic 20 · pro 100 · business 250; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`web3_clientVersion` returns a single string identifying the client software and
version of the Ethereum node that handled the request. It takes no parameters
and is one of the cheapest calls on the API, which makes it a convenient
health/connectivity probe: a successful response confirms that your API key is
valid, your tier is active, and the node is reachable.

The exact contents of the string are determined by the underlying node and may
change over time, so treat it as an opaque diagnostic value rather than
something to parse programmatically. It is available on the **Free** trial and on
every tier above it.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | — | — | `params` must be an empty array `[]`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "web3_clientVersion",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "Geth/v1.14.0-stable/linux-amd64/go1.22.0"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The node client version string. Opaque; format is node-defined and may change. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | Your trial has ended; renew or upgrade to continue. |
| `429` | `rate_limited` | You exceeded the per-second rate limit for your tier (10 RPS sustained · up to 20 burst on free); retry after a short backoff. |

See [errors.md](../../errors.md) for the full JSON-RPC error envelope and the
complete list of tier error codes.

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
    method: "web3_clientVersion",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result); // e.g. "Geth/v1.14.0-stable/linux-amd64/go1.22.0"
```

## Notes

- No parameters and no required scope — this is the lightest Ethereum call and
  is well suited to liveness checks and CI smoke tests.
- The version string is informational only; do not branch application logic on
  its contents.
- Related: [`web3_sha3`](./web3_sha3.md) (Keccak-256 hashing) and the `net_*`
  methods for network/peer status.
