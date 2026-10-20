> Live version: https://triport.io/docs/polygon/json-rpc/bor_getSigners

# bor_getSigners

> Returns the list of authorized validator signer addresses for a given Polygon (Bor) block.

| | |
|---|---|
| **Method / Endpoint** | `bor_getSigners` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token` header (preferred) · `Authorization: Bearer` also accepted |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro tier · premium `bor_*` namespace — low sustained RPS with a burst allowance of `2 × limit_rps` (no per-method RPS is published in the spec) |

## Description

`bor_getSigners` returns the set of validator addresses authorized to sign at a
given block on Polygon's Bor consensus layer. The result is a flat array of
`0x`-prefixed addresses.

This is a Bor-consensus-specific method — it is not part of the standard EVM /
Geth namespace and is only meaningful on Polygon. It belongs to the premium
`bor_*` family, so a **Pro** tier key (scope `polygon_bor`) is required.

The signer list it returns is a **subset of `bor_getSnapshot`'s `validators`
field** and exists mainly for legacy compatibility. If you need richer consensus
state — stake/power per validator, the proposer-rotation accumulator, or the
recent-signers history — prefer [`bor_getSnapshot`](./bor_getSnapshot.md), which
returns all of it in one call. Reach for `bor_getSigners` when you only need the
bare authorized-signer set at a block.

## Parameters

Positional params array (JSON-RPC `params`).

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | string \| number | no | Block selector to read the signer set at — a hex block-number quantity (e.g. `"0x3a2c940"`), a decimal block number, or a tag such as `"latest"`. Omit (empty `params`) to use the latest block. |

> The published OpenRPC entry carries an empty `params` scaffold; the method
> semantically accepts the single block selector above, matching the Bor
> consensus API.

## Request

```bash
curl https://triport.io/polygon \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bor_getSigners",
    "params": ["0x3a2c940"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    "0x0375b2fc7140977c9c76d45421564e354ed42277",
    "0x42eefcda06ead475cde3731b8eb138e88cd0bac3",
    "0x5973918275c01f50555d44e92c9d9b353cadad54",
    "0xb8bb158b93c94ed35c1970d610d1e2b34e26652c"
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | array of string | Authorized signer addresses (`0x`-prefixed, 20-byte) for the requested block. A subset of `bor_getSnapshot.validators`. |

## Errors

JSON-RPC errors are returned in the standard `error` object with a numeric
`code`, a `message`, and a `data` payload carrying the extra fields below.

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your key's tier is below **Pro**. `data` includes `current_tier`, `required_tier`, `method`, `category` (`polygon_bor`), and `upgrade_url`. |
| `429` | `rate_limited` | Sustained RPS for your tier and the `polygon_bor` category was exceeded. `data` includes `retry_after_sec`, `limit_rps`, `burst_capacity`, `category`, and `current_tier`. |

A tier rejection is an HTTP `403` with a plain body — there is no JSON-RPC envelope:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'bor_getSigners' requires pro tier or higher",
  "current_tier": "free",
  "required_tier": "pro",
  "method": "bor_getSigners",
  "category": "polygon_bor",
  "upgrade_url": "https://triport.io/upgrade/pro"
}
```

See the shared [errors reference](../../errors.md) for the full envelope, the
HTTP↔JSON-RPC code mapping, and the `X-RateLimit-*` / `X-Required-Tier` response
headers.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "bor_getSigners",
    params: ["latest"],
  }),
});

const { result: signers } = await res.json();
console.log(`${signers.length} authorized signers`, signers);
```

## Notes

- **Prefer [`bor_getSnapshot`](./bor_getSnapshot.md)** for anything beyond the
  bare signer set — it returns the validator set plus recent-signers history and
  block context in a single call. `bor_getSigners` is a legacy-compatibility
  subset of that snapshot's `validators`.
- The Bor validator set rotates roughly once per epoch (~36 minutes), so the
  signer list is stable within an epoch — a client-side cache TTL of ~30 minutes
  is a reasonable default.
- Related Bor methods: [`bor_getCurrentValidators`](./bor_getCurrentValidators.md)
  (current epoch's validators with stake/power), [`bor_getCurrentProposer`](./bor_getCurrentProposer.md)
  (current block proposer), [`bor_getAuthor`](./bor_getAuthor.md) (author of a
  historic block), and [`bor_getRootHash`](./bor_getRootHash.md).
- This method has no Ethereum equivalent — Bor consensus is Polygon-specific.
