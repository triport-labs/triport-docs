> Live version: https://triport.io/docs/eth/json-rpc/debug_getRawHeader

# debug_getRawHeader

> Returns the RLP-encoded bytes of a block header, as a single hex string.

| | |
|---|---|
| **Method / Endpoint** | `debug_getRawHeader` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | pro + 5 rps, business + 15 rps |

## Description

`debug_getRawHeader` returns the consensus-layer RLP encoding of a single block
header as a `0x`-prefixed hex string. This is the exact byte sequence that is
hashed to produce the block hash, so it is the canonical input for verifying a
header or re-deriving its hash off-chain.

Use it when you need the raw header bytes rather than the decoded JSON object
that `eth_getBlockByNumber` / `eth_getBlockByHash` return — for example to feed
a light-client verifier, to recompute and check a block hash, or to relay a
header to another system that expects RLP.

This is a **pro-tier** method in the `eth_debug` category. It is rate-limited to
**5 requests per second** on the pro tier and **15 requests per second** on the
business tier, with burst.

## Parameters

The method takes a single positional parameter: the block to encode.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | The block to encode, given as a hex block number (e.g. `"0x10d4f"`), a 32-byte block hash, or a tag (`"latest"`, `"earliest"`, `"pending"`, `"safe"`, `"finalized"`). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_getRawHeader",
    "params": ["latest"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0xf90222a0d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347940000000000000000000000000000000000000000a0d7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b9010000000000000000000000000000000000000000000000000000000000000000"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The RLP-encoded block header as a `0x`-prefixed hex string. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| 403 | `tier_insufficient` | Your plan is below the pro tier required for `eth_debug` methods. |
| 429 | `rate_limited` | You exceeded the per-second limit for your tier (5 rps pro / 15 rps business). |

See the shared [errors page](../../errors.md) for the full error envelope and
retry guidance.

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
    method: "debug_getRawHeader",
    params: ["latest"],
  }),
});

const { result } = await res.json();
console.log(result); // "0xf90222..."
```

## Notes

- The `block` argument accepts the same forms as the standard block selectors: a
  hex block number, a 32-byte block hash, or a tag such as `"latest"` or
  `"finalized"`.
- The Keccak-256 hash of the returned bytes equals the block hash, which lets
  you verify a header without trusting the decoded JSON fields.
- For the decoded, human-readable header and its transactions, use
  `eth_getBlockByNumber` or `eth_getBlockByHash` instead. To fetch the raw RLP
  of a full block (header plus body), see the companion `eth_debug` methods.
