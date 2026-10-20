> Live version: https://triport.io/docs/polygon/json-rpc/bor_getCurrentProposer

# bor_getCurrentProposer

> Returns the address of the validator currently scheduled to propose blocks on Polygon's Bor consensus layer.

| | |
|---|---|
| **Method / Endpoint** | `bor_getCurrentProposer` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_bor` |
| **Tier / rate limit** | Pro and above — rate limited per tier with a short burst allowance; no daily quota |

## Description

`bor_getCurrentProposer` returns a single `0x`-prefixed address: the signer of
the validator that is the **current block proposer** on Polygon. This is part of
the `bor` namespace — Polygon's Bor (Proof-of-Stake) consensus extension — and is
not exposed by standard EVM/Geth methods.

The proposer rotates **every block** (Polygon block time is ~2.1s), selected by
stake weight within the active validator set. Because the answer changes so
frequently, this method is best suited to *real-time* "who is proposing right
now" lookups — for example, MEV pre-confirmation logic or live validator
dashboards. Poll it once per block at most; the value is stale almost
immediately after it is read.

If you need the **full proposer schedule for an epoch** rather than the single
current proposer, call [`bor_getSnapshot`](./bor_getSnapshot.md) instead, which
returns the validator set together with the recent-signers history. To resolve
the proposer (author) of a *historic* block, use
[`bor_getAuthor`](./bor_getAuthor.md).

This is a `bor`-namespace method available on the **Pro** tier and above. It is
rate limited per tier with a short burst allowance; there is no daily quota.

## Parameters

This method takes **no parameters**. Pass an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. `params` must be `[]`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "bor_getCurrentProposer",
    "params": []
  }'
```

## Response

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
| `result` | string | The `0x`-prefixed 20-byte signer address of the validator currently scheduled to propose. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `bor`-namespace method is not enabled for it. The `error.data` carries `current_tier`, `required_tier`, and `upgrade_url`. |
| `429` | `rate_limited` | You exceeded your tier's request rate (including burst). Honor the `Retry-After` header / `error.data.retry_after_sec` and retry after a short back-off. |

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
    method: "bor_getCurrentProposer",
    params: [],
  }),
});

const { result } = await res.json();
console.log("current proposer:", result);
```

## Notes

- **The proposer changes every block (~2.1s).** Treat the result as a
  point-in-time snapshot; do not cache it across blocks.
- For the **full epoch proposer schedule** (validator set + recent signers),
  use [`bor_getSnapshot`](./bor_getSnapshot.md). For the proposer of a specific
  historic block, use [`bor_getAuthor`](./bor_getAuthor.md). For the active
  validator set with stake weights, see
  [`bor_getCurrentValidators`](./bor_getCurrentValidators.md).
- `bor_*` methods reflect Polygon Bor consensus state and have no Ethereum
  equivalent.
