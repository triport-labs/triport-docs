> Live version: https://triport.io/docs/polygon/json-rpc/eth_getTransactionCount

# eth_getTransactionCount

> Returns the number of transactions sent from a Polygon address — i.e. its nonce — at a given block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionCount` (JSON-RPC, `POST /` ) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — free 15 rps · basic 20 rps · pro 100 rps · business 250 rps (burst-capped) |

## Description

`eth_getTransactionCount` returns the **nonce** of an account: the total number
of transactions that address has sent, counted up to and including the block you
specify. The value comes back as a hex-encoded quantity (e.g. `"0x2a"` = 42).

The nonce is the primary input for **transaction signing**. Every transaction an
account sends must carry a strictly increasing nonce; using the count returned
for the `"pending"` block tag gives you the next nonce to assign to a new
transaction.

> **High-throughput callers:** if you are sending many transactions in quick
> succession (e.g. a bot), do **not** fetch the nonce per transaction. The RPC
> view lags behind transactions you have already broadcast but that are not yet
> mined, so you will reuse a nonce and get rejected — and you will burn your RPS
> budget. Fetch the `"pending"` count once at startup, then **track and
> increment the nonce locally**, reconciling against the RPC only on error.

## Parameters

Positional `params` array, two entries:

| Index | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `address` | string (20-byte hex, `0x`-prefixed) | yes | The address whose nonce you want. |
| 1 | `blockTag` | string | yes | Block to read at: a hex block number, or one of `"latest"`, `"earliest"`, `"pending"`, `"safe"`, `"finalized"`. Use `"pending"` to get the next nonce for signing. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionCount",
    "params": [
      "0x0000000000000000000000000000000000001010",
      "latest"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x2a"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | number | Echoes the request `id`. |
| `result` | string | The transaction count (nonce) as a hex-encoded quantity. Decode to an integer before use (`0x2a` → `42`). A never-used address returns `"0x0"`. |

## Errors

Errors are returned in the standard JSON-RPC envelope with a numeric `code`. See
[errors.md](../../errors.md) for the full envelope and the `data` fields
(`current_tier`, `required_tier`, `limit_rps`, `retry_after_sec`, …).

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | Trial period for the key has ended. |
| `403` | `tier_insufficient` | Key's tier is below what the method requires. |
| `429` | `rate_limited` | Per-second rate limit for your tier exceeded; back off and retry after `retry_after_sec`. |
| `401` | `subscription_expired` | Paid subscription lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | Method not available on this key/chain. |

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
    method: "eth_getTransactionCount",
    params: ["0x0000000000000000000000000000000000001010", "pending"],
  }),
});

const { result } = await res.json();
const nonce = parseInt(result, 16); // next nonce to sign with
```

## Notes

- **`"latest"` vs `"pending"`:** `"latest"` counts only mined transactions;
  `"pending"` also includes transactions queued in the mempool. For signing the
  next transaction, use `"pending"`. For reporting how many transactions an
  account has confirmed, use `"latest"`.
- **Local nonce management:** see the high-throughput note above — track the
  nonce in your application and reconcile with the RPC only on conflict, rather
  than calling this method before every send.
- **Historical reads:** passing a hex block number returns the nonce as of that
  block, useful for backfills and audits. Deep historical lookups depend on the
  archive depth available on your tier.
- **Related methods:** [`eth_sendRawTransaction`](./eth_sendRawTransaction.md)
  (broadcast the signed transaction), [`eth_estimateGas`](./eth_estimateGas.md),
  and [`eth_getBalance`](./eth_getBalance.md).
