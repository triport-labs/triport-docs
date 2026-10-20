> Live version: https://triport.io/docs/polygon/json-rpc/eth_newBlockFilter

# eth_newBlockFilter

> Creates a server-side block filter and returns a filter ID you can poll for newly arrived block hashes.

| | |
|---|---|
| **Method / Endpoint** | `eth_newBlockFilter` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 RPS sustained · up to 30 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_newBlockFilter` registers a new block filter on the server and returns a
hex filter ID. From then on, the server tracks the hash of every block that is
added to the chain after the filter was created. You retrieve those hashes by
calling [`eth_getFilterChanges`](./eth_getFilterChanges.md) with the ID; each poll
returns the block hashes seen since your previous poll and advances the filter's
cursor.

This is the HTTP-based alternative to a WebSocket subscription
(`eth_subscribe` with `newHeads`): instead of the server pushing new blocks to
you over a persistent connection, you create a filter once and poll it on an
interval. On Polygon, where block time is roughly 2 seconds, a polling loop of
about that interval keeps you close to the chain tip. It is the right choice for
clients that cannot hold a WebSocket open — serverless functions, simple cron
jobs, or environments behind restrictive proxies.

A filter is a **stateful server-side resource**. It is not tied to the lifetime
of any single request, so a filter you create but never clean up lingers as an
orphan and can accumulate over time. Always release a filter you are done with
by calling [`eth_uninstallFilter`](./eth_uninstallFilter.md). Filters also expire
after a period of inactivity; once expired, polling them returns
`-32000 filter not found`, which is your signal to recreate the filter and
resume.

## Parameters

This method takes **no parameters**. Send an empty positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | — | — | `eth_newBlockFilter` takes no arguments; pass `params: []`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_newBlockFilter",
    "params": []
  }'
```

## Response

The `result` is a single `0x`-prefixed hex string — the filter ID. Pass it to
[`eth_getFilterChanges`](./eth_getFilterChanges.md) to poll and to
[`eth_uninstallFilter`](./eth_uninstallFilter.md) to release it.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1a4b0d2e9f7c8a6b5d3e1f0c2b4a6d8e"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | `string` | The newly created filter ID, a `0x`-prefixed hex value. Use it as the `filterId` argument to `eth_getFilterChanges` and `eth_uninstallFilter`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The account's trial period has ended. |
| `403` | `tier_insufficient` | The account's tier is below the required level for this method. |
| `429` | `rate_limited` | The per-tier RPS limit was exceeded. Back off and retry. |
| `401` | `subscription_expired` | The account's subscription has lapsed. |
| `401` | `unauthorized` | Missing or invalid API key. |
| HTTP `403` | `method_unknown` | The method is not available on this surface. |

See [errors.md](../../errors.md) for the full error envelope and handling guidance.

## Examples

### JavaScript (fetch)
```js
async function newBlockFilter() {
  const res = await fetch("https://triport.io/polygon", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_newBlockFilter",
      params: [],
    }),
  });

  const { result, error } = await res.json();
  if (error) throw new Error(error.message);
  return result; // e.g. "0x1a4b0d2e9f7c8a6b5d3e1f0c2b4a6d8e"
}

// Create a filter, poll it once per Polygon block (~2s), and clean up on exit.
const filterId = await newBlockFilter();
console.log("filter:", filterId);
```

## Notes

- **Create once, poll many.** A single `eth_newBlockFilter` call yields one
  filter ID; reuse it across many [`eth_getFilterChanges`](./eth_getFilterChanges.md)
  polls rather than creating a fresh filter per poll.
- **Always clean up.** Filters are server-side resources with no
  request-scoped lifetime. Release each one with
  [`eth_uninstallFilter`](./eth_uninstallFilter.md) when you are done; otherwise it
  lingers as an orphan until it expires through inactivity.
- **Expiry is normal.** If a poll returns `-32000 filter not found`, the filter
  expired or was already removed — recreate it with `eth_newBlockFilter` and
  resume polling.
- **No daily cap.** This method is available on the **Free** trial (`polygon_read_rpc`
  category). Rate limiting is sustained RPS per tier with a burst allowance;
  there is no daily quota.
- **Filter the polling interval to block time.** Polygon produces a block roughly
  every 2 seconds, so polling much faster than that wastes requests without
  surfacing new blocks any sooner.
- **Related:** [`eth_getFilterChanges`](./eth_getFilterChanges.md) (poll),
  [`eth_uninstallFilter`](./eth_uninstallFilter.md) (release). For push delivery where a persistent connection is possible, prefer a WebSocket
  `newHeads` subscription instead of polling.
