> Live version: https://triport.io/docs/eth/json-rpc/debug_getRawBlock

# debug_getRawBlock

> Returns the RLP-encoded bytes of an entire Ethereum block, identified by block number or block hash.

| | |
|---|---|
| **Method / Endpoint** | `debug_getRawBlock` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | Pro — 5 RPS sustained · up to 10 burst · Business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_getRawBlock` returns the raw, RLP-encoded serialization of a full block —
header plus the body (transactions and uncles) — exactly as it is stored and
gossiped on the wire. The result is a single `0x`-prefixed hex string.

Use this when you need the canonical byte representation of a block rather than
the decoded JSON object that [`eth_getBlockByNumber`](./eth_getBlockByNumber.md)
returns: for example to recompute the block hash locally, to re-import a block
into another client, or to verify block contents against an independent encoder.

This is a `debug`-namespace method and is available on the **Pro** tier and
above. It is rate limited per tier (5 RPS on Pro, 15 RPS on Business) with a
short burst allowance; there is no daily quota.

## Parameters

A single positional parameter.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string | yes | The block to encode, given as a `0x`-prefixed hex block number, a block tag (`latest`, `earliest`, `safe`, `finalized`, `pending`), or a `0x`-prefixed 32-byte block hash. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_getRawBlock",
    "params": ["0x10D4F"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0xf90211a0d8...c0c0"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The `0x`-prefixed, RLP-encoded bytes of the full block (header + transactions + uncles). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `debug`-namespace method is not enabled for it. |
| `429` | `rate_limited` | You exceeded your tier's request rate (5 RPS sustained · up to 10 burst on Pro, 15 RPS sustained · up to 30 burst on Business) including burst. Retry after a short back-off. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "debug_getRawBlock",
    params: ["0x10D4F"],
  }),
});

const { result } = await res.json();
console.log(result); // "0xf90211a0..."
```

## Notes

- The `block` argument accepts a hex block number, a block tag, or a 32-byte
  block hash — pass whichever you have.
- The result is RLP bytes, not JSON. To work with decoded fields, use
  [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) or
  [`eth_getBlockByHash`](./eth_getBlockByHash.md) instead.
- For just the encoded header, see
  [`debug_getRawHeader`](./debug_getRawHeader.md); for an individual encoded
  transaction, see `debug_getRawTransaction`.
