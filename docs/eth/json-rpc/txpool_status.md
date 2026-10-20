> Live version: https://triport.io/docs/eth/json-rpc/txpool_status

# txpool_status

> Returns the number of transactions currently pending and queued in the node's transaction pool, as hex-encoded integers.

| | |
|---|---|
| **Method / Endpoint** | `txpool_status` (JSON-RPC, `POST /v1/eth`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_txpool` |
| **Tier / rate limit** | pro (1 rps) · business (2 rps) |

## Description

`txpool_status` reports the current depth of the node's transaction pool: how
many transactions are **pending** (ready to be included in the next block) and
how many are **queued** (valid but not yet executable, e.g. waiting on a nonce
gap or balance). Both counts are returned as hex-encoded integers.

Use it for lightweight monitoring of mempool pressure — dashboards, alerting on
queue depth, or deciding whether to bump gas before submitting a transaction.
It is the cheap counterpart to `txpool_content`: where `txpool_content` returns
the full transaction objects (which can be very large), `txpool_status` returns
only the two counts, so it is the right choice when you just need queue depth.

The counts reflect the state of the pool on the node that serves your request
at the moment it is answered; they are a point-in-time snapshot and will vary
between calls.

## Parameters

This method takes no parameters. Pass an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | `[]` | no | The `params` array must be empty. |

## Request

```bash
curl https://triport.io/eth \
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
    "pending": "0x1c",
    "queued": "0x7"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | The transaction-pool status. |
| `result.pending` | hex string | Count of pending (executable) transactions, e.g. `"0x1c"` = 28. |
| `result.queued` | hex string | Count of queued (non-executable) transactions, e.g. `"0x7"` = 7. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below `pro`. This method requires the pro or business tier. |
| `429` | `rate_limited` | You exceeded the per-tier RPS limit (1 rps on pro, 2 rps on business). Retry after a short backoff. |

Errors are returned in the standard JSON-RPC error envelope. See
[errors.md](../../errors.md) for the full structure and shared error codes.

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
    method: "txpool_status",
    params: [],
  }),
});

const { result } = await res.json();
const pending = parseInt(result.pending, 16);
const queued = parseInt(result.queued, 16);
console.log(`pending=${pending} queued=${queued}`);
```

## Notes

- **Hex decoding:** most upstream clients return the counts as hex strings
  (`"0x1c"`). Decode with `parseInt(value, 16)` in JS/TS or `int(value, 16)` in
  Python before doing arithmetic or comparisons.
- **Encoding varies by upstream client:** the request may be served by any of
  several execution clients (Erigon, Geth, Reth, Nethermind). Most return hex
  strings, but some (e.g. Nethermind) return **decimal integers**
  (`{"pending": 2048, "queued": 0}`). Normalise defensively — accept both a
  number and a `0x`-prefixed string — rather than assuming hex. Prefer
  `Number(value)` / `int(str(value), 0)` style parsing that tolerates either form.
- **Lighter alternative to content:** for the full pending/queued transaction
  objects use [`txpool_content`](./txpool_content.md). Prefer `txpool_status`
  whenever you only need counts — it is far cheaper to fetch and parse.
- **Tier gating:** this is a `pro`-tier method. The Free trial cannot call it; a
  request on an insufficient tier returns HTTP `403` `tier_insufficient`.
- **Low rate limits:** txpool methods are capped at 1–2 rps. For continuous
  monitoring, poll on an interval (e.g. once per second) rather than per-request,
  and handle HTTP `429` with backoff.
