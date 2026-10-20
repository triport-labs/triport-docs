> Live version: https://triport.io/docs/polygon/json-rpc/eth_uninstallFilter

# eth_uninstallFilter

> Removes a previously created server-side filter on Polygon, freeing the resource it held on the node.

| | |
|---|---|
| **Method / Endpoint** | `eth_uninstallFilter` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | Free — 15 rps · Basic — 20 rps · Pro — 100 rps · Business — 250 rps |

## Description

`eth_uninstallFilter` deletes a server-side filter that was previously created
with `eth_newBlockFilter`, `eth_newFilter`, or `eth_newPendingTransactionFilter`.
You pass the filter id returned at creation time and the node drops the filter
along with any state it was buffering for you.

Server-side filters are a **stateful** resource. The node keeps a per-filter
buffer of changes between your `eth_getFilterChanges` polls, and a filter that is
never uninstalled lingers until the node times it out on its own. Always call
`eth_uninstallFilter` as soon as you are done polling so you don't leave orphaned
filters accumulating on the upstream node.

The call returns a boolean: `true` when the filter existed and was removed,
`false` when the id was unknown (already uninstalled, expired, or never valid).
Because an unknown id is reported as `false` rather than as an error, this method
is safe to call defensively in cleanup paths.

## Parameters

Positional params array with a single element.

| Name | Type | Required | Description |
|---|---|---|---|
| `filterId` | string (hex quantity) | yes | The id returned by `eth_newBlockFilter` / `eth_newFilter` / `eth_newPendingTransactionFilter`, e.g. `"0x1"`. |

```json
{ "params": ["0x1"] }
```

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_uninstallFilter",
    "params": ["0x1"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": true
}
```

When the filter id is unknown:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": false
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | boolean | `true` if the filter existed and was uninstalled; `false` if the id was not found (already removed, expired, or never valid). |

## Errors

Transport and tier failures use HTTP status codes with top-level error fields, not JSON-RPC error objects. A
valid request with an unknown filter id is **not** an error — it returns
`result: false`.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The trial period for the API key has ended. |
| `403` | `tier_insufficient` | The key's tier is below what this method requires. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded; back off and retry. |
| `401` | `subscription_expired` | The key's subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | Method not enabled for this key or unrecognized. |

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
    method: "eth_uninstallFilter",
    params: [filterId],
  }),
});

const { result } = await res.json();
console.log(result ? "filter removed" : "filter id not found");
```

## Notes

- Pair every filter you create with an `eth_uninstallFilter` call. The
  recommended lifecycle is: create with
  [`eth_newBlockFilter`](./eth_newBlockFilter.md) →
  poll with [`eth_getFilterChanges`](./eth_getFilterChanges.md) →
  uninstall here.
- Calling `eth_uninstallFilter` on an id that has already been removed (or that
  the node has timed out on its own) returns `false`, not an error — it is safe
  to run in `finally`/cleanup blocks.
- Polygon's ~2.1s block time means short-lived filters expire on the node
  quickly if left unpolled; do not assume a filter id stays valid across long
  idle periods.
- For push-style streaming instead of HTTP polling, prefer a WebSocket
  subscription where your client supports it; server-side filters are the
  polling alternative for WebSocket-incompatible clients.
