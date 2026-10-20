> Live version: https://triport.io/docs/eth/json-rpc/eth_chainId

# eth_chainId

> Returns the EIP-155 chain ID of the network the node is connected to, as a hex string.

| | |
|---|---|
| **Method / Endpoint** | `eth_chainId` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_chainId` returns the chain ID used for replay-protected transaction signing
as introduced in [EIP-155](https://eips.ethereum.org/EIPS/eip-155). The value is
encoded as a hexadecimal string; for Ethereum mainnet this is `0x1` (decimal
`1`).

Use this method to confirm which network your RPC connection is pointed at
before submitting transactions, and to derive the chain ID that must be included
when signing EIP-155 transactions. It is the recommended way to detect the
active network — prefer it over `net_version`, which returns the network ID as a
decimal string and is not guaranteed to equal the chain ID.

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
    "method": "eth_chainId",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | EIP-155 chain ID as a hex-encoded quantity. `0x1` is Ethereum mainnet. |

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
    method: "eth_chainId",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result);                 // "0x1"
console.log(parseInt(result, 16));   // 1
```

## Notes

* The result is a hex **quantity** — decode it with `parseInt(result, 16)` (JS)
  or `int(result, 16)` (Python) to get the integer chain ID.
* The chain ID is stable for the lifetime of a network and does not change
  between blocks, so the value is safe to cache for the duration of a session.
* Related: use [`net_version`](./net_version.md) for the legacy decimal
  network ID, and [`eth_blockNumber`](./eth_blockNumber.md) to read the current
  head once you have confirmed the network.
* Chain ID vs network ID: see
  [eth_chainId vs net_version](https://triport.io/learn/chain-id-vs-network-id), and the
  [RPC and blockchain glossary](https://triport.io/learn/glossary) for related terms.
