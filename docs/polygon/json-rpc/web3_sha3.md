> Live version: https://triport.io/docs/polygon/json-rpc/web3_sha3

# web3_sha3

> Computes the keccak256 (SHA3) hash of the given data on the server and returns it as a hex string.

| | |
|---|---|
| **Method / Endpoint** | `web3_sha3` (JSON-RPC, `POST /polygon/rpc`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon (mainnet, chainId `0x89` / 137) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — free 15 rps · basic 20 rps · pro 100 rps · business 250 rps |

## Description

`web3_sha3` takes a single 0x-prefixed hex byte string, computes its keccak256
digest server-side, and returns the 32-byte result as a 0x-prefixed hex string.
This is the same keccak256 used throughout the EVM (function selectors, event
topics, storage slots), not the NIST SHA3-256 variant — despite the method name.

In practice you rarely need this method in production. Every major client
library (ethers, web3.js, web3.py) computes keccak256 locally without a network
round-trip, which is faster and avoids spending your rate-limit budget. Reach
for `web3_sha3` only when you have no local hashing primitive available, or when
you want to confirm a hash against the node's own implementation.

The method is read-only and available on the Free trial under the
`polygon_read_rpc` category.

## Parameters

Positional params array with exactly one element.

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `data` | string (0x-prefixed hex) | yes | The byte string to hash. Must be valid hex with a `0x` prefix; an empty payload is encoded as `0x`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "web3_sha3",
    "params": ["0x68656c6c6f20776f726c64"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"
}
```

(`0x68656c6c6f20776f726c64` is the ASCII bytes for `hello world`; its keccak256
digest is the value shown above.)

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string (0x-prefixed hex) | The keccak256 digest of the input — always 32 bytes (66 characters including the `0x` prefix). |

## Errors

Errors follow the standard JSON-RPC error envelope. See [errors.md](../../errors.md)
for the full structure.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The trial period for the API key has ended. |
| `403` | `tier_insufficient` | The key's tier is below the required tier for this method. |
| `429` | `rate_limited` | The per-tier RPS limit (15/20/100/250) was exceeded. |
| `401` | `subscription_expired` | The subscription tied to the key has lapsed. |
| `401` | `unauthorized` | Missing, malformed, or invalid API key. |
| HTTP `403` | `method_unknown` | The method name is not recognized or not enabled for this key. |

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
    method: "web3_sha3",
    params: ["0x68656c6c6f20776f726c64"],
  }),
});

const { result } = await res.json();
console.log(result);
// 0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad
```

## Notes

- **Prefer local hashing.** Libraries such as `ethers.keccak256`,
  `web3.utils.sha3`, and `eth_utils.keccak` produce the identical result without
  a request. Use them in hot paths to avoid consuming your RPS budget.
- **keccak256, not SHA3-256.** The output matches the EVM's keccak256 (used for
  selectors, event topics, and storage layout), not the finalized NIST SHA3.
- **Input must be hex.** `data` has to be a `0x`-prefixed hex string. Pass `0x`
  for the empty input; the result is the keccak256 of zero bytes.
- **Related:** [`web3_clientVersion`](./web3_clientVersion.md) is the other
  method in the `web3` namespace. For network identity see
  [`net_version`](./net_version.md) and `eth_chainId`.
