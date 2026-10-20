> Live version: https://triport.io/docs/eth/json-rpc/net_version

# net_version

> Returns the current network ID as a decimal string (for example `"1"` for Ethereum mainnet).

| | |
|---|---|
| **Method / Endpoint** | `net_version` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`net_version` returns the network ID of the network the node is connected to,
encoded as a **decimal string**. For Ethereum mainnet this is `"1"`.

Use this method for a quick connectivity check or to detect which network your
RPC connection is pointed at. Note that it is distinct from
[`eth_chainId`](./eth_chainId.md): `net_version` returns the legacy network ID as
a decimal string, while `eth_chainId` returns the EIP-155 chain ID as a hex
quantity. The two values happen to coincide on mainnet but are not guaranteed to
match on every network. When you need the chain ID for replay-protected
transaction signing, prefer `eth_chainId`.

This method takes no parameters and is available on every tier.

## Parameters

This method takes no parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | Pass an empty array `[]` as `params`. |

## Request

```bash
curl https://triport.io/eth \
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
  "result": "1"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The network ID as a decimal string. `"1"` is Ethereum mainnet. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry. |

Errors are returned in the standard JSON-RPC envelope. See the shared
[errors reference](../../errors.md) for the full error object shape and handling
guidance.

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
    method: "net_version",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result);              // "1"
console.log(parseInt(result, 10)); // 1
```

## Notes

* The result is a **decimal** string — parse it with `parseInt(result, 10)` (JS)
  or `int(result)` (Python), not base 16.
* The network ID is stable for the lifetime of a network, so the value is safe
  to cache for the duration of a session.
* Related: use [`eth_chainId`](./eth_chainId.md) for the EIP-155 chain ID as a
  hex quantity (the value you need when signing transactions), and
  [`eth_blockNumber`](./eth_blockNumber.md) to read the current head once you
  have confirmed the network.
