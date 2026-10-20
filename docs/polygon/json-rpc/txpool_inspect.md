> Live version: https://triport.io/docs/polygon/json-rpc/txpool_inspect

# txpool_inspect

> Returns a human-readable, formatted summary of every transaction currently in the Polygon mempool, grouped by sender address and nonce.

| | |
|---|---|
| **Method / Endpoint** | `txpool_inspect` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_txpool` |
| **Tier / rate limit** | pro (1 RPS sustained · up to 2 burst) · business (2 RPS sustained · up to 4 burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`txpool_inspect` returns a textual snapshot of the node's transaction pool. Each
pending and queued transaction is rendered as a one-line summary string of the
form `sender: amount wei + gas × gasPrice wei`, keyed by the originating address
and then by nonce. It is the formatted, debug-friendly middle ground between
[`txpool_status`](./txpool_status.md) (just the pending/queued counts) and
[`txpool_content`](./txpool_content.md) (the full transaction bodies).

Use it for observability and ad-hoc debugging — eyeballing what an address has
sitting in the pool, spotting nonce gaps that leave transactions stuck in
`queued`, or checking the gas price of pending transactions during congestion.
Because the values are pre-formatted strings rather than structured fields, it is
**not** suited to production indexing or programmatic fee analysis; reach for
`txpool_content` when you need machine-parseable transaction data.

The mempool is a live, node-local view: results reflect the state of the
upstream node at the instant of the call and differ between successive requests.
This is a premium, **pro**-tier capability with a deliberately low rate limit —
the payload is mid-weight (larger than `txpool_status`, smaller than
`txpool_content`) and the upstream node spends CPU formatting each entry.

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
      "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4": {
        "1542": "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984: 0 wei + 90000 gas × 30000000000 wei",
        "1543": "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0: 1000000000000000000 wei + 21000 gas × 32000000000 wei"
      },
      "0xc3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6": {
        "87": "0x4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e: 0 wei + 120000 gas × 45000000000 wei"
      }
    },
    "queued": {
      "0xd4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607": {
        "204": "0xe5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718: 500000000000000000 wei + 21000 gas × 28000000000 wei"
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.pending` | object | Transactions ready for inclusion in the next block. Keyed by sender address. |
| `result.queued` | object | Transactions not yet executable (e.g. a nonce gap ahead of them). Keyed by sender address. |
| `result.pending[address]` | object | Map of nonce → formatted summary string for that sender's pending transactions. |
| `result.queued[address]` | object | Map of nonce → formatted summary string for that sender's queued transactions. |
| `result.*[address][nonce]` | string | One-line summary: `<recipient>: <value> wei + <gas> gas × <gasPrice> wei`. |

Both `pending` and `queued` are always present; either may be an empty object
`{}` when there are no transactions of that kind.

## Errors

Errors use the shared JSON-RPC error envelope — see [errors.md](../../errors.md)
for the full structure.

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your plan is below the **pro** tier required for the `polygon_txpool` category. |
| `429` | `rate_limited` | You exceeded your tier's RPS for this method (1 RPS sustained · up to 2 burst on pro, 2 RPS sustained · up to 4 burst on business). |

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
    method: "txpool_inspect",
    params: [],
  }),
});

const { result } = await res.json();
const pendingCount = Object.values(result.pending)
  .reduce((n, byNonce) => n + Object.keys(byNonce).length, 0);
console.log(`${pendingCount} pending transactions in the pool`);
```

## Notes

- **Formatted, not structured.** Values are human-readable strings. For
  programmatic access to transaction fields (calldata, value, gas, gas price as
  discrete values) use [`txpool_content`](./txpool_content.md) instead.
- **Low rate limit by design.** At 1 RPS (pro) / 2 RPS (business), poll
  sparingly. For lightweight, high-frequency pool-depth tracking use
  [`txpool_status`](./txpool_status.md), which returns only the two counts.
- **Live, node-local snapshot.** The mempool view is taken from the upstream node
  at call time and changes between requests; it is not a consensus-confirmed
  value.
- Rate limits are RPS-per-tier with a burst allowance (`burst_capacity =
  2 × limit_rps`) — there is no daily quota. See
  [Rate limits](../../rate-limits-and-tiers.md).
