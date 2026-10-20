> Live version: https://triport.io/docs/eth/json-rpc/eth_getUncleCountByBlockHash

# eth_getUncleCountByBlockHash

> Returns the number of uncle (ommer) blocks referenced by the block identified by its block hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getUncleCountByBlockHash` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getUncleCountByBlockHash` looks up a block by its 32-byte hash and returns
how many uncle (ommer) blocks it references, encoded as a `0x`-prefixed
hexadecimal string.

Uncles were a feature of Ethereum's proof-of-work era: stale blocks that were
mined at nearly the same height as a canonical block and rewarded for their
work. Since **The Merge** (proof-of-stake), Ethereum no longer produces uncles,
so for any post-Merge block this method returns `0x0`. The method remains
available for inspecting historical pre-Merge blocks, where the count can be
non-zero.

If no block matches the supplied hash (e.g. it belongs to an orphaned block, or
the node has not yet seen it), the method returns `null` instead of an error.
Always check for `null` before parsing the result as a number.

## Parameters

The method takes a single positional parameter.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | `string` | yes | 32-byte block hash, `0x`-prefixed (66 characters total). |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getUncleCountByBlockHash",
    "params": ["0xb9b8b8b1b0c9e6a0f3d4c5b6a7988e9d0c1b2a3948576f5e4d3c2b1a09876543"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0"
}
```

When the block hash is unknown, the result is `null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `string \| null` | Uncle count as a `0x`-prefixed hex integer. Always `0x0` for post-Merge blocks; may be non-zero for historical pre-Merge blocks. `null` if no block matches the hash. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |

A missing block is **not** an error — it is reported as `result: null` (see
above). See [errors.md](../../errors.md) for the full error envelope and
handling guidance.

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
    method: "eth_getUncleCountByBlockHash",
    params: ["0xb9b8b8b1b0c9e6a0f3d4c5b6a7988e9d0c1b2a3948576f5e4d3c2b1a09876543"],
  }),
});

const { result } = await res.json();
console.log("uncle count:", result === null ? "block not found" : parseInt(result, 16));
```

## Notes

- The result is a hex string (or `null`), not a number — convert with base 16
  before arithmetic.
- Post-Merge Ethereum does not produce uncles, so this method returns `0x0` for
  any block after the September 2022 transition to proof-of-stake. Non-zero
  counts only appear for historical pre-Merge blocks.
- Always handle the `null` case: an unknown or non-canonical block hash returns
  `result: null` rather than an error.
- Available on the **Free** trial (`eth_read_rpc` category).
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- To count uncles by block height instead of hash, use
  `eth_getUncleCountByBlockNumber`. To look up a block by hash, use
  `eth_getBlockByHash`.
