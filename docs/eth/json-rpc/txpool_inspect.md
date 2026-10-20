> Live version: https://triport.io/docs/eth/json-rpc/txpool_inspect

# txpool_inspect

> Returns a compact, human-readable summary of the transactions currently pending and queued in the node's transaction pool.

| | |
|---|---|
| **Method / Endpoint** | `txpool_inspect` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | Pro — 1 RPS sustained · up to 2 burst · Business — 2 RPS sustained · up to 4 burst (with burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`txpool_inspect` lists the transactions the backing Ethereum node is holding in
its mempool, grouped into `pending` (executable now) and `queued` (not yet
executable, e.g. a nonce gap). The result is keyed by sender address and then by
nonce. Each transaction is rendered as a short, human-readable **string** rather
than a full transaction object — `recipient: value wei + gas × gasPrice wei`.

Use it for a quick, low-bandwidth overview of mempool state: which senders have
transactions in flight, at which nonces, and at what value and price. When you
need the full structured transaction objects (input data, signatures, fee
fields, etc.) call [txpool_content](./txpool_content.md) instead; for just the
pending/queued counts call [txpool_status](./txpool_status.md).

This method belongs to the `eth_txpool` category and is restricted to the
**Pro** tier and above. The data reflects the specific node serving your
request — the mempool is local to each node, varies continuously, and is not
consensus state, so successive calls (and calls hitting different nodes) will
differ. It takes no parameters.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "txpool_inspect",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "pending": {
      "0x26588a9301b0428d95e6fc3a5024fce8bec12d51": {
        "31813": "0x3375ee30428b2a71c428afa5e89e427905f95f7e: 0 wei + 5000000 gas × 20000000000 wei"
      },
      "0x9777ed7c89cb76b76b76e4a8c40c0e2c8c0f9b1c": {
        "563": "0xa4f9c2b8a3d0e1f6b7c8d9e0a1b2c3d4e5f60718: 1000000000000000000 wei + 21000 gas × 25000000000 wei",
        "564": "0xa4f9c2b8a3d0e1f6b7c8d9e0a1b2c3d4e5f60718: 0 wei + 90000 gas × 25000000000 wei"
      }
    },
    "queued": {
      "0x39692b3402c2f4f10c6e54f6c1f5c6f5e0d7b8a2": {
        "6": "0x0b9ab0cce5238c0a4cf3a8f9a1b2c3d4e5f60718: 2000000000000000000 wei + 21000 gas × 30000000000 wei"
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version, always `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | object | Container with two keys, `pending` and `queued`. |
| `result.pending` | object | Executable transactions, keyed by sender address. Empty object `{}` if none. |
| `result.queued` | object | Non-executable transactions (e.g. nonce gaps), keyed by sender address. Empty object `{}` if none. |
| `result.pending.<address>` | object | Map of `nonce` → summary string for that sender's executable transactions. |
| `result.queued.<address>` | object | Map of `nonce` → summary string for that sender's queued transactions. |
| `result.*.<address>.<nonce>` | string | Compact summary in the form `recipient: value wei + gas × gasPrice wei`. Values are decimal strings. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your plan is below the Pro tier required for `txpool_inspect`. A plain HTTP body with `current_tier`, `required_tier` and `upgrade_url` at the top level, plus an `X-Required-Tier` header. |
| `429` | `rate_limited` | You exceeded the per-tier RPS limit (1 RPS sustained · up to 2 burst on Pro, 2 RPS sustained · up to 4 burst on Business). A plain HTTP body with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After`. |

Example response body (tier too low) — HTTP `403`, no JSON-RPC envelope:

```json
{
  "error": "tier_insufficient",
  "message": "tier insufficient for method txpool_inspect",
  "method": "txpool_inspect",
  "category": "eth_txpool",
  "chain": "eth",
  "current_tier": "free",
  "required_tier": "pro",
  "upgrade_url": "https://triport.io/upgrade"
}
```

See [errors.md](../../errors.md) for the full error envelope and the shared
error-code reference.

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
    method: "txpool_inspect",
    params: [],
  }),
});

const { result } = await res.json();
const pendingSenders = Object.keys(result.pending).length;
const queuedSenders = Object.keys(result.queued).length;
console.log(`pending senders: ${pendingSenders}, queued senders: ${queuedSenders}`);
```

## Notes

* No parameters and no pagination — the response is the full mempool snapshot as
  seen by the serving node at request time. On a busy node this can be large.
* Each transaction is a **string** summary, not an object. For full transaction
  objects use [txpool_content](./txpool_content.md); for just the counts use
  [txpool_status](./txpool_status.md).
* Requires the **Pro** tier; a lower tier is rejected with HTTP `403`
  `tier_insufficient`. The `eth_txpool` category is rate-limited tightly —
  1 RPS on Pro and 2 RPS on Business — so poll sparingly and cache results.
* The mempool is per-node and non-deterministic: results vary between calls and
  between nodes, and are never part of consensus state.
* Rate limiting is RPS-per-tier with burst; there is no daily quota.
