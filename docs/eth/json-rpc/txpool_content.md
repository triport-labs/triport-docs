> Live version: https://triport.io/docs/eth/json-rpc/txpool_content

# txpool_content

> Returns every pending and queued transaction currently held in the node's transaction pool, grouped by sender address and nonce.

| | |
|---|---|
| **Method / Endpoint** | `txpool_content` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | Pro — 1 RPS sustained · up to 2 burst · Business — 2 RPS sustained · up to 4 burst (with burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`txpool_content` returns the full content of the backing node's transaction
pool: the complete transaction objects for every transaction that is either
**pending** (executable on the next block) or **queued** (not yet executable,
typically because of a nonce gap). It is the heavyweight introspection call in
the `txpool` family — where [txpool_status](./txpool_status.md) returns only
counts and [txpool_inspect](./txpool_inspect.md) returns short summary strings,
`txpool_content` returns every field of every transaction.

This method belongs to the `eth_txpool` category and is available from the
**Pro** tier. Because the response can be very large and the pool is highly
node-specific, the rate limit is intentionally **very low — 1 RPS on Pro, 2 RPS
on Business**. Call it sparingly: poll on the order of seconds, never in a tight
loop, and prefer `txpool_status` / `txpool_inspect` when you only need counts or
a summary. The contents reflect the specific node serving your request, so the
exact set of transactions will vary between calls and between nodes, and is not
a consensus view of the network mempool.

It takes no parameters.

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
    "method": "txpool_content",
    "params": []
  }'
```

## Response

The `result` is an object with two top-level keys, `pending` and `queued`. Each
is a map keyed by **sender address**; the value is a map keyed by the
transaction's **nonce** (as a decimal string), whose value is the full
transaction object.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "pending": {
      "0x1f9090aae28b8a3dceadf281b0f12828e676c326": {
        "42": {
          "blockHash": null,
          "blockNumber": null,
          "from": "0x1f9090aae28b8a3dceadf281b0f12828e676c326",
          "gas": "0x5208",
          "gasPrice": "0x4a817c800",
          "maxFeePerGas": "0x6fc23ac00",
          "maxPriorityFeePerGas": "0x59682f00",
          "hash": "0x3f1c9e8d7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e",
          "input": "0x",
          "nonce": "0x2a",
          "to": "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
          "transactionIndex": null,
          "value": "0xde0b6b3a7640000",
          "type": "0x2",
          "chainId": "0x1",
          "v": "0x0",
          "r": "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
          "s": "0x7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d"
        }
      }
    },
    "queued": {
      "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e": {
        "7": {
          "blockHash": null,
          "blockNumber": null,
          "from": "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e",
          "gas": "0x15f90",
          "gasPrice": "0x3b9aca00",
          "hash": "0x0e1f2d3c4b5a69788796a5b4c3d2e1f00e1f2d3c4b5a69788796a5b4c3d2e1f0",
          "input": "0xa9059cbb",
          "nonce": "0x7",
          "to": "0xdac17f958d2ee523a2206206994597c13d831ec7",
          "transactionIndex": null,
          "value": "0x0",
          "type": "0x0",
          "v": "0x25",
          "r": "0xc3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2",
          "s": "0x18293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f607"
        }
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
| `result` | object | Pool contents. Has two keys: `pending` and `queued`. |
| `result.pending` | object | Executable transactions, keyed by sender address → nonce → transaction object. Empty object if none. |
| `result.queued` | object | Non-executable transactions (e.g. nonce gaps), same nested shape as `pending`. Empty object if none. |
| `…<address>.<nonce>` | object | A full transaction object. The same shape returned by [eth_getTransactionByHash](./eth_getTransactionByHash.md), with `blockHash`, `blockNumber`, and `transactionIndex` all `null` since the transaction is not yet mined. |
| `…from` | string | 20-byte sender address (hex). Matches the outer address key. |
| `…to` | string \| null | 20-byte recipient address, or `null` for contract-creation transactions. |
| `…nonce` | string | Transaction nonce (hex quantity). The outer key is the same value in decimal. |
| `…value` | string | Value transferred, in wei (hex quantity). |
| `…gas` | string | Gas limit (hex quantity). |
| `…gasPrice` | string | Gas price in wei (hex quantity). Present on all types; equals the effective price for legacy txs. |
| `…maxFeePerGas` | string | Max fee per gas (hex quantity). Present on type `0x2` (EIP-1559) transactions. |
| `…maxPriorityFeePerGas` | string | Max priority fee per gas (hex quantity). Present on type `0x2` transactions. |
| `…input` | string | Call data (hex). |
| `…type` | string | Transaction type: `0x0` legacy, `0x1` access-list, `0x2` dynamic-fee. |
| `…hash` | string | 32-byte transaction hash (hex). |
| `…v`, `…r`, `…s` | string | ECDSA signature components (hex). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your plan is below the **Pro** tier required for `txpool_content`. A plain HTTP body with `current_tier`, `required_tier` and `upgrade_url` at the top level, plus an `X-Required-Tier` header. |
| `429` | `rate_limited` | You exceeded the per-method limit (1 RPS sustained · up to 2 burst on Pro, 2 RPS sustained · up to 4 burst on Business). A plain HTTP body with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After`. |

Example response body (rate limited) — HTTP `429`, no JSON-RPC envelope:

```json
{
  "error": "rate_limited",
  "message": "rate limited for method txpool_content",
  "method": "txpool_content",
  "category": "eth_txpool",
  "chain": "eth",
  "limit_rps": 1,
  "burst_capacity": 2,
  "retry_after_sec": 1
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
    method: "txpool_content",
    params: [],
  }),
});

const { result } = await res.json();
const pendingCount = Object.values(result.pending)
  .reduce((n, byNonce) => n + Object.keys(byNonce).length, 0);
console.log(`pending transactions: ${pendingCount}`);
```

## Notes

* **Very low rate limit — call sparingly.** 1 RPS on Pro, 2 RPS on Business. The
  response can be large; do not poll in a tight loop. Exceeding the limit
  returns HTTP `429` `rate_limited` with a `retry_after_sec` hint.
* No parameters and no pagination — the entire pool is returned in one response.
  For lighter-weight checks use [txpool_status](./txpool_status.md) (counts only)
  or [txpool_inspect](./txpool_inspect.md) (summary strings).
* The pool is node-local and changes constantly; results are not a consensus
  view of the global mempool and will differ between calls and between nodes.
* Requires the **Pro** tier; a lower tier is rejected with HTTP `403`
  `tier_insufficient`.
* Rate limiting is RPS-per-tier with burst; there is no daily quota.
