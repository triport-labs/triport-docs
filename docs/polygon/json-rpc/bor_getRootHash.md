> Live version: https://triport.io/docs/polygon/json-rpc/bor_getRootHash

# bor_getRootHash

> Returns the Bor consensus root hash that commits a contiguous range of Polygon blocks — the proof input the Polygon PoS bridge uses for L1↔L2 state sync.

| | |
|---|---|
| **Method / Endpoint** | `bor_getRootHash` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) (or `x-token`) |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro and above — premium `bor` namespace, low per-second cap with burst (see [Rate Limits](../../rate-limits-and-tiers.md)) |

## Description

`bor_getRootHash` computes the Bor root hash over a block range `[fromBlock,
toBlock]`. The root hash is a single 32-byte digest that commits to every block
header in that window; it is the value the Polygon PoS bridge anchors on
Ethereum so that L1 can verify L2 state without replaying individual blocks.

Use it when you are generating state-sync proofs for the Polygon bridge, or when
you need a compact commitment over a span of Polygon blocks for your own
verification pipeline. This is a Bor-consensus-specific method: it exposes
Polygon's `bor` namespace, which is not part of the standard Geth/EVM RPC
surface.

The range is bounded — a single call typically accepts **at most 256 blocks**
(roughly nine minutes of Polygon block time). For longer spans, iterate in
chunks of ≤256 blocks and combine the results downstream. This method supersedes
the deprecated `eth_getRootHash` alias; new integrations should call
`bor_getRootHash` directly.

## Parameters

Positional parameters: the inclusive start and end block numbers of the range.

| Name | Type | Required | Description |
|---|---|---|---|
| `fromBlock` | integer (uint) | yes | First block of the range, as a decimal block number. |
| `toBlock` | integer (uint) | yes | Last block of the range, inclusive. Must be ≥ `fromBlock`, and the span `toBlock - fromBlock + 1` must not exceed the range cap (typically 256). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bor_getRootHash",
    "params": [50000000, 50000255]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "fb43b3b75e6e1a76c80c2c9dec6b8e2a3a8a6f4f9d3b6c2e1a0f7d8c9b4e3a21"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The Bor root hash committing the requested block range — a 32-byte hex digest. Feed this value into the PoS bridge proof or your own range-commitment check. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**, so the premium `bor` namespace is not enabled for it. |
| `429` | `rate_limited` | You exceeded your tier's per-second budget (including the burst allowance) for this method. Back off and retry. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "bor_getRootHash",
    params: [50000000, 50000255],
  }),
});

const { result } = await res.json();
console.log("root hash:", result);
```

## Notes

- **Range cap.** Keep `toBlock - fromBlock + 1` at or below the per-call limit
  (typically 256 blocks). To commit a longer span, split it into ≤256-block
  chunks and iterate — request each chunk's root hash separately.
- **Deprecated alias.** `eth_getRootHash` returns the same value but lives in the
  `eth` namespace and is deprecated; it is not served on this surface. Use
  `bor_getRootHash`.
- **Related Bor methods.** For validator-set and proposer state, see the other
  `bor`-namespace methods on Polygon (`bor_getCurrentValidators`,
  `bor_getCurrentProposer`, `bor_getSnapshot`, `bor_getAuthor`,
  `bor_getSigners`), which share the `polygon_bor` scope and Pro-tier
  requirement.
