> Live version: https://triport.io/docs/polygon/json-rpc/eth_getFilterChanges

# eth_getFilterChanges

> Polls a previously created server-side filter and returns everything that has matched since the last poll.

| | |
|---|---|
| **Method / Endpoint** | `eth_getFilterChanges` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 RPS sustained · up to 30 burst · basic 20 RPS sustained · up to 40 burst · pro 100 RPS sustained · up to 200 burst · business 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getFilterChanges` is the polling half of the stateful filter API. You first
create a filter — with [`eth_newBlockFilter`](./eth_newBlockFilter.md) for new
blocks or `eth_newFilter` for logs — and receive a filter ID. You then call
`eth_getFilterChanges` with that ID, and the server returns the items that have
appeared **since your previous call** (or since the filter was created, for the
first poll). Each call advances the filter's cursor, so consecutive polls never
return the same item twice.

This is the HTTP-based alternative to WebSocket subscriptions (`eth_subscribe`):
instead of the server pushing updates to you, your client polls on an interval.
On Polygon, where block time is roughly 2 seconds, a polling loop of about that
interval keeps you close to the chain tip. The trade-off versus a WebSocket
subscription is more requests and slightly higher latency, in exchange for
working over plain request/response HTTP with no persistent connection.

The shape of the returned array depends on the **type** of filter the ID refers
to: a block filter yields an array of 32-byte block hashes, while a log filter
yields an array of log objects. A poll that finds nothing new returns an empty
array — this is normal and not an error.

Filters are server-side resources with a limited lifetime. If a filter ID is
unknown — never created, already removed with `eth_uninstallFilter`, or expired
through inactivity — the call fails with `-32000 filter not found`. Treat that
as a signal to recreate the filter and resume polling.

## Parameters

Pass a positional array with exactly one element.

| Name | Type | Required | Description |
|---|---|---|---|
| `filterId` | `string` | yes | A `0x`-prefixed hex filter ID returned by a prior [`eth_newBlockFilter`](./eth_newBlockFilter.md) or `eth_newFilter` call. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getFilterChanges",
    "params": ["0x1a4b0d2e9f7c8a6b5d3e1f0c2b4a6d8e"]
  }'
```

## Response

For a **block filter**, the result is an array of new block hashes:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    "0x9c2b1a3f8e0d4c7b6a5f9e2d1c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b",
    "0x8b1a0f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a"
  ]
}
```

For a **log filter**, the result is an array of log objects:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "address": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "blockHash": "0x9c2b1a3f8e0d4c7b6a5f9e2d1c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b",
      "blockNumber": "0x2f1a3c5",
      "data": "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
      "logIndex": "0x2",
      "removed": false,
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      ],
      "transactionHash": "0x2d6a7b8c9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
      "transactionIndex": "0x1"
    }
  ]
}
```

A poll with nothing new since the last call returns an empty array:

```json
{ "jsonrpc": "2.0", "id": 1, "result": [] }
```

### Response fields

The `result` is an array. For a block filter each element is a block-hash string.
For a log filter each element is a log object with these fields:

| Field | Type | Description |
|---|---|---|
| `address` | `string` | Address of the contract that emitted the log. |
| `blockHash` | `string` | Hash of the block containing the log. `null` while pending. |
| `blockNumber` | `string` | Block number as a `0x`-prefixed hex string. `null` while pending. |
| `data` | `string` | Non-indexed event arguments, ABI-encoded. |
| `logIndex` | `string` | Index of this log within the block, hex-encoded. `null` while pending. |
| `removed` | `boolean` | `true` if the log was removed due to a chain reorganization. |
| `topics` | `array` | Indexed event arguments; `topics[0]` is usually the event signature hash. |
| `transactionHash` | `string` | Hash of the transaction that produced the log. `null` while pending. |
| `transactionIndex` | `string` | Index of the transaction within the block, hex-encoded. `null` while pending. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32000` | `filter not found` | The `filterId` is unknown — never created, already uninstalled, or expired through inactivity. Recreate the filter and resume polling. |
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
async function poll(filterId) {
  const res = await fetch("https://triport.io/polygon", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getFilterChanges",
      params: [filterId],
    }),
  });

  const { result, error } = await res.json();
  if (error) {
    if (error.code === -32000) throw new Error("filter expired — recreate it");
    throw new Error(error.message);
  }
  return result; // array of block hashes or log objects, possibly empty
}

// Poll roughly once per Polygon block (~2s).
setInterval(async () => {
  const changes = await poll("0x1a4b0d2e9f7c8a6b5d3e1f0c2b4a6d8e");
  if (changes.length) console.log("new items:", changes.length);
}, 2000);
```

## Notes

- The cursor advances on every call: each poll returns only what is new since the
  previous poll, so you never see the same item twice. Process the full array
  before polling again.
- An empty array means "nothing new yet" — it is the expected result between
  blocks, not an error.
- Filters expire after a period of inactivity. A `-32000 filter not found` means
  the ID is no longer valid; recreate the filter with
  [`eth_newBlockFilter`](./eth_newBlockFilter.md) (or `eth_newFilter`) and continue.
- Filters are server-side resources. When you are done polling, release the
  filter with [`eth_uninstallFilter`](./eth_uninstallFilter.md) so it does not
  linger as an orphaned resource.
- `eth_getFilterChanges` is available on the **Free** trial (`polygon_read_rpc`
  category). Rate limiting is RPS-per-tier with burst; there is no daily quota.
- For high-frequency log streams, polling can fall behind the chain tip; a
  WebSocket subscription is the push-based option where one is available.
