> Live version: https://triport.io/docs/polygon/json-rpc/bor_getAuthor

# bor_getAuthor

> Returns the block author — the validator address that proposed a given Polygon block.

| | |
|---|---|
| **Method / Endpoint** | `bor_getAuthor` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro and above — premium `bor` namespace, rate limited per tier (low single-digit to ~10 RPS sustained · up to 20 burst depending on method weight) with a short burst allowance; no daily quota; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`bor_getAuthor` returns the **block author** for a given block — the address of
the validator that proposed (signed) that block under Polygon's Bor consensus.
It is the historic counterpart of
[`bor_getCurrentProposer`](./bor_getCurrentProposer.md): where the latter tells
you who is proposing right now, `bor_getAuthor` answers "who proposed block *N*?"
for any block in the chain's history.

This is a method in the **`bor` namespace**, a Polygon-exclusive extension of
the standard EVM JSON-RPC surface. It exposes Bor consensus state — validator
sets, proposers, signers, and snapshots — that is **not available on standard
Geth or Erigon nodes**; calling these methods against a plain EVM provider
returns a method-not-found error. Triport serves the full `bor` namespace on
the Polygon endpoint.

The most common use is **validator productivity indexing**: by resolving the
author of each block over an epoch you can measure how many blocks each
validator proposed. Because the Polygon archive depth is **≥ 5,000,000 blocks**
(roughly four months at ~2.1 s block time), you can look up authors well into
the past, not just for recent blocks. `bor` methods require the **Pro** tier or
higher.

## Parameters

One positional parameter.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockNumber` | string | no | The block to resolve the author for, as a `0x`-prefixed hex block number (e.g. `"0x3a6cf2f"`). The string tags `"latest"`, `"earliest"`, and `"pending"` are also accepted. If omitted, the latest block is used. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bor_getAuthor",
    "params": ["0x3a6cf2f"]
  }'
```

## Response

The result is the validator's signer address as a `0x`-prefixed hex string.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0375b2fc7140977c9c76d45421564e354ed42277"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The `0x`-prefixed 20-byte signer address of the validator that authored (proposed) the requested block. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**, so the `bor` namespace is not enabled for it. The `error.data` carries `current_tier`, `required_tier`, and `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's request rate (including burst) for this premium namespace. Honor the `Retry-After` header / `error.data.retry_after_sec` and retry after a short back-off. |

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
    method: "bor_getAuthor",
    params: ["0x3a6cf2f"],
  }),
});

const { result } = await res.json();
console.log("block author:", result);
```

## Notes

- **Historic lookups.** The Polygon archive holds **≥ 5M blocks** (~4 months),
  so `bor_getAuthor` works for both recent and well-aged blocks — ideal for
  back-filling validator productivity metrics over past epochs.
- **Block number is hex.** Pass the block as a `0x`-prefixed hex string, not a
  decimal integer. To resolve the most recent block, omit the parameter or pass
  `"latest"`.
- **Polygon-only.** `bor_getAuthor` and its sibling `bor_*` methods exist only
  on Polygon's Bor consensus layer; there is no Ethereum equivalent.
- **Related methods:**
  [`bor_getCurrentProposer`](./bor_getCurrentProposer.md) (current block's
  proposer), [`bor_getCurrentValidators`](./bor_getCurrentValidators.md) (the
  active validator set), [`bor_getSigners`](./bor_getSigners.md) (authorized
  signers at a block), and [`bor_getSnapshot`](./bor_getSnapshot.md) (full
  consensus snapshot, including recent signers).
