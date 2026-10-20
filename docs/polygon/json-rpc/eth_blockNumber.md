> Live version: https://triport.io/docs/polygon/json-rpc/eth_blockNumber

# eth_blockNumber

> Returns the latest Polygon block number as a hex-encoded string.

| | |
|---|---|
| **Method / Endpoint** | `eth_blockNumber` (JSON-RPC, `POST https://triport.io/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | Free and up — free 15 rps · basic 20 rps · pro 100 rps · business 250 rps |

## Description

`eth_blockNumber` returns the height of the latest block at the tip of the
Polygon chain. The value is a string containing a `0x`-prefixed hexadecimal
integer (e.g. `"0x3a1f2c0"` = `60_945_088`). It is the canonical way to discover
the current chain tip before issuing range queries such as `eth_getLogs`, before
computing confirmation depth for a transaction, or to drive a polling loop that
watches for new blocks.

The method takes no parameters and is available on the **Free** trial under the
`polygon_read_rpc` scope, making it one of the cheapest calls you can issue. It
reflects the chain tip as seen by the gateway; under normal conditions this is
the canonical head, but during a reorg the returned height can briefly move
backward, so treat any single value as the *current best tip* rather than a
finalized height.

Polygon produces a block roughly every **~2.1 seconds**. A client that needs to
track the real-time tip should poll at a **sub-block-time interval** (e.g. every
1–1.5 s) so it does not miss blocks, while staying within the rps limit of its
tier. For event-driven workflows that cannot tolerate polling latency, prefer a
subscription-based channel over busy-polling this method.

## Parameters

This method takes **no parameters**. Pass an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| _(none)_ | — | — | `params` must be an empty array `[]`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_blockNumber",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x3a1f2c0"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version, always `"2.0"`. |
| `id` | number \| string | Echoes the `id` from the request. |
| `result` | string | The latest block number (`blockNumber`) as a `0x`-prefixed hex string. Parse with `parseInt(result, 16)` / `int(result, 16)`. |

## Errors

Errors are returned in the standard JSON-RPC envelope under the `error` object
(`{ "code": <int>, "message": <string> }`). See [errors.md](../../errors.md)
for the full error envelope and shared semantics.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` (HTTP 401) | The free trial window for the key has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` (HTTP 403) | The key's tier is not entitled to this method. (`eth_blockNumber` is included in the Free trial, so this normally only surfaces on disabled keys.) |
| `429` | `rate_limited` (HTTP 429) | Requests exceeded the per-second limit for the key's tier (free 15 · basic 20 · pro 100 · business 250 rps). Back off and retry. |
| `401` | `subscription_expired` (HTTP 401) | The paid subscription tied to the key has lapsed. |
| `401` | `unauthorized` (HTTP 401) | The `Authorization` credential is missing, malformed, or invalid. |
| `-32601` | `method_unknown` (HTTP 403) | The `method` name was misspelled or is not exposed on this network. |

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
    method: "eth_blockNumber",
    params: [],
  }),
});

const { result } = await res.json();
const blockNumber = parseInt(result, 16);
console.log(`Latest Polygon block: ${blockNumber}`);
```

## Notes

- **Polling cadence:** with a ~2.1 s block time, poll at sub-block-time
  intervals (≈1–1.5 s) to avoid missing blocks. Confirm your polling rate stays
  under your tier's rps ceiling, and prefer a subscription channel over tight
  polling when you need every new block as it is announced.
- **Reorgs:** the returned height tracks the gateway's view of the tip and can
  move backward briefly during a reorg. For settlement decisions, wait for a
  confirmation depth appropriate to your risk tolerance rather than acting on
  the bare tip.
- **Hex encoding:** the result is always a `0x`-prefixed hex string, never a
  decimal number — convert before doing arithmetic.
- **Related methods:** [`eth_getBlockByNumber`](./eth_getBlockByNumber.md) to
  fetch a full block once you have its height, and
  [`eth_getLogs`](./eth_getLogs.md) for log queries over a block range whose
  upper bound you derive from this call.
