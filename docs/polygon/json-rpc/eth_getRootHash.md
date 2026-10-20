> Live version: https://triport.io/docs/polygon/json-rpc/eth_getRootHash

# eth_getRootHash (deprecated)

> Legacy `eth`-namespace alias for the Polygon Bor root-hash call; **deprecated — use [`bor_getRootHash`](./bor_getRootHash.md) instead.**

> ⚠️ **Deprecated.** This method is kept only for backward compatibility with older clients that hard-coded the `eth_` namespace. It returns `-32601 (method not found)` on every standard backend. New integrations **must** call [`bor_getRootHash`](./bor_getRootHash.md), which has identical behavior in the correct (`bor`) namespace. There is no reason to use `eth_getRootHash` in new code.

| | |
|---|---|
| **Method / Endpoint** | `eth_getRootHash` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro tier (premium `bor` namespace; low per-method RPS) |

## Description

`eth_getRootHash` is a legacy alias for [`bor_getRootHash`](./bor_getRootHash.md). It computes the Bor checkpoint **root hash** over an inclusive block range `(fromBlock, toBlock)`. That root hash is consumed by the Polygon PoS bridge to generate state-sync / withdrawal proofs between Polygon and its L1 settlement layer.

The functionality is a Polygon **Bor-consensus extension**, not part of the standard EVM `eth` namespace. Because of that, the method only ever responds on Bor-backed nodes. On standard Geth / Erigon backends it returns `-32601 (method not found)`. The spec marks this method `deprecated: true`.

**Use [`bor_getRootHash`](./bor_getRootHash.md) instead.** The migration is a one-line change: swap the method name from `eth_getRootHash` to `bor_getRootHash`. Parameters, result shape, range limits, required scope (`polygon_bor`), and tier are all identical.

## Parameters

Positional params array, identical to `bor_getRootHash`.

| Position | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `fromBlock` | integer | yes | First block of the range (inclusive). |
| 1 | `toBlock` | integer | yes | Last block of the range (inclusive). |

> **Range cap:** the block window is bounded (typically ≤ 256 blocks, ~9 minutes of Polygon block production). For historic state sync, iterate over the range in chunks.

## Request

```bash
# DEPRECATED — prefer bor_getRootHash (see Notes for the migrated form).
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getRootHash",
    "params": [0, 255]
  }'
```

## Response

On a Bor-backed endpoint the result is the hex-encoded root hash (no `0x`-prefixed `eth_`-style framing — a bare 64-char hex string, matching `bor_getRootHash`):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "04413066a455f9c1c050b2d7f95a767b09f97f1b53c5d1b6e3e0a3f5c3e3a1d"
}
```

In practice, on standard backends you will instead receive a method-not-found error (see [Errors](./eth_getRootHash.md#errors)).

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Bor checkpoint root hash for the requested `(fromBlock, toBlock)` range, as a hex string. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32601` | Method not found | The standard case for this deprecated alias. Returned by non-Bor backends. Migrate to `bor_getRootHash`. |
| `-32602` | Invalid params | `fromBlock`/`toBlock` missing, out of order, or the range exceeds the allowed window. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` API key. |
| `403` | Forbidden / insufficient scope | Key lacks the `polygon_bor` scope or is below Pro tier. |
| `429` | Too Many Requests | Per-tier RPS limit exceeded (burst-limited; no daily quota). |

See the shared [errors reference](../../errors.md) for the full error envelope and retry guidance.

## Examples

### JavaScript (fetch)
```js
// DEPRECATED — shown for reference only. Use "bor_getRootHash" in new code.
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getRootHash", // ← replace with "bor_getRootHash"
    params: [0, 255],
  }),
});
const { result, error } = await res.json();
if (error) throw new Error(`${error.code}: ${error.message}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

// Deprecated alias — prefer client.polygon.rpc("bor_getRootHash", ...)
const rootHash = await client.polygon.rpc<string>("bor_getRootHash", [0, 255]);
```

### Python (`triport-sdk`)
```python
import os
from triport_sdk import TriportClient

client = TriportClient(api_key=os.environ["TRIPORT_API_KEY"])

# Deprecated alias — prefer "bor_getRootHash".
root_hash = client.polygon.rpc("bor_getRootHash", [0, 255])
```

## Notes

- **Migration:** rename the method only.

  ```diff
  - "method": "eth_getRootHash"
  + "method": "bor_getRootHash"
  ```

  Everything else — params `[fromBlock, toBlock]`, the result hash, the `polygon_bor` scope, and the Pro tier requirement — is unchanged. See [`bor_getRootHash`](./bor_getRootHash.md).
- **Bor extension, not EVM.** Despite the `eth_` prefix, this is a Bor-consensus-specific method. A `0x…`/hex root-hash response (rather than `-32601`) is effectively a fingerprint of a Bor-backed node.
- **Bridge dependency.** The root hash feeds Polygon PoS bridge proof generation for L1 ↔ L2 state sync. Most bridge SDKs already call `bor_getRootHash` directly.
- **Related:** [`bor_getRootHash`](./bor_getRootHash.md) · [`bor_getSnapshot`](./bor_getSnapshot.md) · [`bor_getCurrentValidators`](./bor_getCurrentValidators.md).
