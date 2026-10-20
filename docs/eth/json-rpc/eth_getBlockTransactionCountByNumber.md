> Live version: https://triport.io/docs/eth/json-rpc/eth_getBlockTransactionCountByNumber

# eth_getBlockTransactionCountByNumber

> Returns the number of transactions in the block identified by its number or a block tag.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockTransactionCountByNumber` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free 10 RPS sustained · up to 20 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBlockTransactionCountByNumber` returns how many transactions are
contained in a given block, selected by block number (a `0x`-prefixed hex
integer) or by one of the named block tags. The count is returned as a
`0x`-prefixed hexadecimal string.

Use it when you only need the transaction *count* and not the full block body —
for example to size pagination, to detect empty blocks, or to decide whether a
heavier `eth_getBlockByNumber` call is worth issuing. If you already have a block
hash instead of a number, use the sibling method
`eth_getBlockTransactionCountByHash`.

A request for a block that does not exist (e.g. a height beyond the current
chain head) returns a `result` of `null` rather than an error.

## Parameters

Pass a single-element positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockParameter` | `string` | yes | Either a `0x`-prefixed hex block number (e.g. `0x149e2c1`) or a block tag: `latest`, `earliest`, `pending`, `safe`, or `finalized`. |

## Request

```bash
curl https://triport.io/eth \
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
  "result": "0x9d"
}
```

`"0x9d"` decodes to `157` transactions in the block.

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
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |
| `-32602` | `invalid_params` | The block parameter is missing or not a valid hex number / tag. |

See [errors.md](../../errors.md) for the full error envelope and handling guidance.

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
    method: "eth_getBlockTransactionCountByNumber",
    params: ["latest"],
  }),
});

const { result } = await res.json();
console.log("tx count:", result === null ? null : parseInt(result, 16)); // 157
```

## Notes

- The result is a hex string — convert with base 16 before arithmetic.
- A non-existent block returns `result: null`, not an error; check for `null`
  before parsing.
- `eth_getBlockTransactionCountByNumber` is available on the **Free** trial
  (`eth_read_rpc` category).
- Rate limiting is RPS-per-tier with burst; there is no daily quota. An
  HTTP `429` `rate_limited` error means you should back off and retry shortly.
- To look up the count by block hash instead, use
  `eth_getBlockTransactionCountByHash`. To fetch the full block including the
  transactions themselves, use `eth_getBlockByNumber`.
