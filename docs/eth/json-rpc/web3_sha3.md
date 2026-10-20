> Live version: https://triport.io/docs/eth/json-rpc/web3_sha3

# web3_sha3

> Returns the Keccak-256 hash of the given data.

| | |
|---|---|
| **Method / Endpoint** | `web3_sha3` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`web3_sha3` computes the Keccak-256 hash of a single piece of input data and
returns it as a `0x`-prefixed hex string. It is a pure utility method: it
performs no chain lookups, so the result depends only on the bytes you pass in.

Despite the `sha3` name, this method returns a **Keccak-256** digest, not the
finalized NIST SHA-3 standard. The two differ in their padding, so hashing the
same input with a generic SHA-3 library produces a different result. This
Keccak-256 variant is the one used throughout Ethereum — for function selectors,
event topic signatures, storage-slot derivation, and address checksums — which
is why this method exists on the JSON-RPC surface.

The input must be a `0x`-prefixed hex string. To hash a UTF-8 string, encode it
to hex first — for example, `"hello world"` becomes `0x68656c6c6f20776f726c64`.

## Parameters

The `params` array takes exactly one positional argument.

| Name | Type | Required | Description |
|---|---|---|---|
| `data` | `string` | yes | The data to hash, as a `0x`-prefixed hexadecimal string. |

## Request

```bash
curl https://triport.io/eth \
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

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `string` | The Keccak-256 hash of the input, as a 32-byte (66-character including the `0x` prefix) hex string. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `403` | `tier_insufficient` | The account's tier does not grant access to this method. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |
| `401` | `subscription_expired` | The account's paid subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | The method name is not recognized. |

A malformed input (missing `0x` prefix or non-hex characters) is rejected with
the standard JSON-RPC invalid-params error. See [errors.md](../../errors.md) for
the full error envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
const toHex = (s) =>
  "0x" + [...new TextEncoder().encode(s)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "web3_sha3",
    params: [toHex("hello world")],
  }),
});

const { result } = await res.json();
console.log("keccak256:", result);
```

## Notes

- This is **Keccak-256**, not the finalized SHA-3 standard. If you compute the
  hash locally to compare, use a Keccak-256 implementation (e.g. `ethers`'
  `keccak256`, or Python's `eth-hash`/`pysha3` Keccak variant), not a generic
  `sha3_256` function.
- The result is always 32 bytes — a 66-character string including the `0x`
  prefix — regardless of input length.
- Passing an empty input (`"0x"`) returns the Keccak-256 hash of the empty byte
  string: `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`.
- Because the digest is deterministic and computed from your input alone, you
  can also derive it client-side to avoid a round trip; this method is a
  convenience for when you want the node to compute it for you.
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- Related: [web3_clientVersion](./web3_clientVersion.md) — the other method in
  the `web3` namespace.
