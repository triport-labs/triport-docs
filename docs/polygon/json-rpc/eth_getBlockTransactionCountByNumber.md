> Live version: https://triport.io/docs/polygon/json-rpc/eth_getBlockTransactionCountByNumber

# eth_getBlockTransactionCountByNumber

> Returns the number of transactions in a Polygon block identified by its number or a block tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockTransactionCountByNumber` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 RPS sustained · up to 30 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockTransactionCountByNumber` returns how many transactions are
contained in a given Polygon block, selected by block number (a `0x`-prefixed
hex integer) or by one of the named block tags. The count is returned as a
`0x`-prefixed hexadecimal string.

Use it when you only need the transaction *count* and not the full block body —
for example to size pagination, to detect empty blocks, or to decide whether a
heavier [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) call is worth issuing.
If you already have a block hash instead of a number, use the sibling method
[`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md).

This is a light read available on the **Free** trial (`polygon_read_rpc` category). Polygon
blocks are produced about every ~2.1 seconds and typically carry ~50–150
transactions, so `latest` advances quickly — poll on roughly that cadence if you
are tracking the chain tip. A request for a block that does not exist (e.g. a
height beyond the current chain head) returns a `result` of `null` rather than
an error.

## Parameters

Pass a single-element positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockParameter` | `string` | yes | Either a `0x`-prefixed hex block number (e.g. `0x3a2b1f0`) or a block tag: `latest`, `earliest`, `pending`, `safe`, or `finalized`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockTransactionCountByNumber",
    "params": ["latest"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x5e"
}
```

`"0x5e"` decodes to `94` transactions in the block.

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | `string` | JSON-RPC version, always `"2.0"`. |
| `id` | `number` | Echoes the request `id`. |
| `result` | `string \| null` | Number of transactions in the block as a `0x`-prefixed hex string, or `null` if the block was not found. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `403` | `tier_insufficient` | The API key's tier is below the level required for this method. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |
| `401` | `subscription_expired` | The account's subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | The method name is not recognized or not enabled for this network. |

See [errors.md](../../errors.md) for the full error envelope and handling guidance.

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
    method: "eth_getBlockTransactionCountByNumber",
    params: ["latest"],
  }),
});

const { result } = await res.json();
console.log("tx count:", result === null ? null : parseInt(result, 16)); // 94
```

## Notes

- The result is a hex string — convert with base 16 before arithmetic.
- A non-existent block returns `result: null`, not an error; check for `null`
  before parsing.
- Polygon blocks are produced roughly every 2.1 seconds; a `latest` count goes
  stale almost immediately, so re-request rather than caching it.
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- To look up the count by block hash instead, use
  [`eth_getBlockTransactionCountByHash`](./eth_getBlockTransactionCountByHash.md).
  To fetch the full block including the transactions themselves, use
  [`eth_getBlockByNumber`](./eth_getBlockByNumber.md).
