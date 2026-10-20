> Live version: https://triport.io/docs/polygon/json-rpc/txpool_status

# txpool_status

> Returns the current depth of the Polygon mempool as two integer counts — pending and queued transactions — without any transaction bodies.

| | |
|---|---|
| **Method / Endpoint** | `txpool_status` (JSON-RPC, `POST /`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_txpool` |
| **Tier / rate limit** | Pro — 1 rps · Business — 2 rps |

## Description

`txpool_status` returns the number of transactions currently held in the node's
mempool, split into two buckets: `pending` (transactions that are executable
right now — the account nonce and balance allow them to be included in the next
block) and `queued` (transactions that are not yet executable, usually because
of a nonce gap). The result is counts only — no transaction hashes, senders, or
calldata are included.

This is the lightest of the three mempool snapshot methods: a typical response
is around 30 bytes, so it is well suited to frequent polling (every 1–5 seconds)
when you want to track pool depth or detect congestion in near real time. Use it
as the cheap health-check signal, and reach for the heavier
[`txpool_content`](./txpool_content.md) on a slower cadence (every ~30–60
seconds) only when you actually need the full transaction bodies.

`txpool_status` is a premium capability and requires the **Pro** tier or higher.
It is not part of the free read-RPC namespace.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "txpool_status",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "pending": "0x2a1f",
    "queued": "0x83"
  }
}
```

The `pending` and `queued` counts are returned as hex-encoded quantities (Geth
convention). In the example above, `0x2a1f` = 10783 pending and `0x83` = 131
queued transactions.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Mempool status object. |
| `result.pending` | string (hex quantity) | Count of executable (pending) transactions. |
| `result.queued` | string (hex quantity) | Count of non-executable (queued) transactions waiting on a nonce gap or balance. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your key's tier is below Pro. `txpool_status` requires the `polygon_txpool` scope (Pro or Business). HTTP 403. |
| `429` | `rate_limited` | You exceeded the per-tier RPS limit (Pro 1 rps, Business 2 rps). Back off and retry. HTTP 429. |

See [errors.md](../../errors.md) for the full JSON-RPC error envelope and the
complete list of platform error codes.

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
    method: "txpool_status",
    params: [],
  }),
});

const { result } = await res.json();
const pending = parseInt(result.pending, 16);
const queued = parseInt(result.queued, 16);
console.log(`mempool depth — pending: ${pending}, queued: ${queued}`);
```

## Notes

- **Polling cadence.** Because the payload is tiny (~30 bytes) this method is the
  right tool for tight polling loops to chart mempool depth over time. Stay
  within your tier's RPS budget (Pro 1 rps, Business 2 rps) — at Pro that means
  one call per second.
- **Pair with `txpool_content`.** `txpool_status` tells you *how many*;
  [`txpool_content`](./txpool_content.md) tells you *which* transactions (full
  bodies). A common pattern is `txpool_status` every 1–5 s for depth tracking
  plus a periodic `txpool_content` for the full snapshot.
- **Hex counts.** Both fields follow the Geth quantity encoding (hex string).
  Convert with `parseInt(value, 16)` / `int(value, 16)` before doing arithmetic.
- **Related methods:** [`txpool_content`](./txpool_content.md) (full mempool
  snapshot) and [`txpool_inspect`](./txpool_inspect.md) (human-readable
  per-account summary). All three share the `polygon_txpool` scope and the Pro
  tier requirement.
