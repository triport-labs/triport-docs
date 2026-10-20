> Live version: https://triport.io/docs/polygon/json-rpc/eth_getBlockTransactionCountByHash

# eth_getBlockTransactionCountByHash

> Returns the number of transactions in a Polygon block, identified by its block hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockTransactionCountByHash` (JSON-RPC over `POST /rpc/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free (15 rps) · basic (20 rps) · pro (100 rps) · business (250 rps) |

## Description

`eth_getBlockTransactionCountByHash` returns a single integer: how many
transactions are contained in the block whose hash you pass. It is the standard
EVM read for "how big is this block" when you already hold the block hash (for
example, from a `logs` entry, a receipt, or a prior `eth_getBlockByHash` call).

The count is returned as a hex-encoded quantity (e.g. `"0x4d"` = 77). If no block
with the given hash exists on the canonical chain — an unknown hash, or a hash
that was orphaned by a re-org — the method returns `null` rather than an error.

This is a light, low-cost read. In practice it is often redundant: a single
`eth_getBlockByNumber`/`eth_getBlockByHash` already returns the transaction
hashes, so their length gives you the same count without a second round-trip.
Reach for this method when you specifically want the count and nothing else.

> **Polygon note:** Polygon runs Bor consensus with ~2.1 s block time and no
> uncle blocks. A typical block carries ~50–150 transactions.

## Parameters

Positional `params` array, one element:

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `blockHash` | string (32-byte hex, `0x`-prefixed) | yes | Hash of the block to count transactions in. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockTransactionCountByHash",
    "params": [
      "0x8e38b4dbf6b11fcc3b9dee84fb7986e29ca0a02cecd8977c161ff7333329681e"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x4d"
}
```

For a hash that is not found on the canonical chain:

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
| `result` | string \| null | Hex-encoded transaction count for the block (`"0x4d"` = 77), or `null` if no block with that hash exists. |

## Errors

The `result: null` case above is **not** an error — it is the normal response
for an unknown hash. The errors below are platform-level (auth, tier, rate
limit) and share the standard JSON-RPC error envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The trial period for the key has ended. |
| `403` | `tier_insufficient` | Key's tier is below what the method requires. |
| `429` | `rate_limited` | Per-tier RPS budget exceeded; back off and retry. |
| `401` | `subscription_expired` | The key's paid subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | Method name not recognized / not enabled for this key. |

See [errors.md](../../errors.md) for the full error envelope and field-by-field
breakdown.

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
    method: "eth_getBlockTransactionCountByHash",
    params: ["0x8e38b4dbf6b11fcc3b9dee84fb7986e29ca0a02cecd8977c161ff7333329681e"],
  }),
});

const { result } = await res.json();
const count = result === null ? null : parseInt(result, 16);
console.log(count); // 77, or null if the block hash is unknown
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const result = await client.polygon.call<string | null>(
  "eth_getBlockTransactionCountByHash",
  ["0x8e38b4dbf6b11fcc3b9dee84fb7986e29ca0a02cecd8977c161ff7333329681e"],
);

const count = result === null ? null : parseInt(result, 16);
console.log(count);
```

### Python (`triport-sdk`)

```python
import os
from triport_sdk import TriportClient

client = TriportClient(api_key=os.environ["TRIPORT_API_KEY"])

result = client.polygon.call(
    "eth_getBlockTransactionCountByHash",
    ["0x8e38b4dbf6b11fcc3b9dee84fb7986e29ca0a02cecd8977c161ff7333329681e"],
)

count = None if result is None else int(result, 16)
print(count)
```

## Notes

- **`null` vs error:** an unknown or orphaned block hash returns `result: null`,
  not a JSON-RPC error. Always handle `null` explicitly before parsing the hex
  count.
- **Decode the result:** the count is a hex quantity string — convert with
  `parseInt(result, 16)` (JS/TS) or `int(result, 16)` (Python).
- **Re-org safety:** because Polygon blocks can be re-orged out (Bor finality is
  ~2–3 epochs), a hash that resolved a moment ago can later return `null`. For
  confirmation logic, wait several blocks before trusting a hash.
- **Related methods:**
  [`eth_getBlockTransactionCountByNumber`](./eth_getBlockTransactionCountByNumber.md)
  is the same read by block number;
  [`eth_getBlockByHash`](./eth_getBlockByHash.md) returns the full block (whose
  transaction list length gives the same count in one call).
