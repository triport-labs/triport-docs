> Live version: https://triport.io/docs/polygon/json-rpc/txpool_content

# txpool_content

> Returns a complete, atomic snapshot of the node's transaction pool — every pending and queued transaction, grouped by sender address and nonce.

| | |
|---|---|
| **Method / Endpoint** | `txpool_content` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon:rpc` |
| **Tier / rate limit** | Pro — 1 RPS sustained · up to 2 burst · Business — 2 RPS sustained · up to 4 burst (with burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`txpool_content` returns the full contents of the backing node's transaction
pool as a single point-in-time, **atomic snapshot**: the complete transaction
objects for every transaction that is either **pending** (executable on the next
block) or **queued** (valid but not yet executable, typically because of a nonce
gap). It is the heavyweight member of the `txpool` family — where
[txpool_status](./txpool_status.md) returns only counts and
[txpool_inspect](./txpool_inspect.md) returns short summary strings,
`txpool_content` returns every field of every transaction.

Use it when you need the *whole* mempool at once rather than a live feed:
building an MEV snapshot, computing a gas-price distribution across pending
transactions, or running offline mempool analytics. If instead you want to react
to individual transactions as they arrive, prefer a streaming subscription —
`txpool_content` is a periodic snapshot, complementary to (not a replacement
for) a push stream.

This method belongs to the `polygon_txpool` category and requires the **Pro**
tier. It is intentionally heavy: on Polygon mainnet the pool commonly holds
**8,000+ pending transactions**, producing a response payload in the **5–50 MB**
range. The rate limit is correspondingly low — **1 RPS on Pro, 2 RPS on
Business** — and you should keep concurrency very small (see
[Notes](./txpool_content.md#notes)). The contents reflect the specific node serving your request,
so the exact set of transactions varies between calls and is not a consensus
view of the global mempool.

It takes no parameters.

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
      "0x9f8e7d6c5b4a39281706f5e4d3c2b1a009f8e7d6": {
        "42": {
          "blockHash": null,
          "blockNumber": null,
          "from": "0x9f8e7d6c5b4a39281706f5e4d3c2b1a009f8e7d6",
          "gas": "0x5208",
          "gasPrice": "0x6fc23ac00",
          "maxFeePerGas": "0x77359400",
          "maxPriorityFeePerGas": "0x59682f00",
          "hash": "0x3a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff0",
          "input": "0x",
          "nonce": "0x2a",
          "to": "0x1111222233334444555566667777888899990000",
          "transactionIndex": null,
          "value": "0xde0b6b3a7640000",
          "type": "0x2",
          "chainId": "0x89",
          "v": "0x1",
          "r": "0xa1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
          "s": "0x7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d"
        }
      }
    },
    "queued": {
      "0x00112233445566778899aabbccddeeff00112233": {
        "7": {
          "blockHash": null,
          "blockNumber": null,
          "from": "0x00112233445566778899aabbccddeeff00112233",
          "gas": "0x15f90",
          "gasPrice": "0x4a817c800",
          "hash": "0x99887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa",
          "input": "0xa9059cbb",
          "nonce": "0x7",
          "to": "0x2222333344445555666677778888999900001111",
          "transactionIndex": null,
          "value": "0x0",
          "type": "0x0",
          "chainId": "0x89",
          "v": "0x136",
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
| `…<address>.<nonce>` | object | A full transaction object. The outer map key is the decimal nonce; `blockHash`, `blockNumber`, and `transactionIndex` are all `null` since the transaction is not yet mined. |
| `…from` | string | 20-byte sender address (hex). Matches the outer address key. |
| `…to` | string \| null | 20-byte recipient address, or `null` for contract-creation transactions. |
| `…nonce` | string | Transaction nonce (hex quantity). |
| `…value` | string | Value transferred, in wei (hex quantity). |
| `…gas` | string | Gas limit (hex quantity). |
| `…gasPrice` | string | Gas price in wei (hex quantity). Present on all types; equals the effective price for legacy txs. |
| `…maxFeePerGas` | string | Max fee per gas (hex quantity). Present on type `0x2` (EIP-1559) transactions. |
| `…maxPriorityFeePerGas` | string | Max priority fee per gas (hex quantity). Present on type `0x2` transactions. |
| `…input` | string | Call data (hex). |
| `…type` | string | Transaction type: `0x0` legacy, `0x1` access-list, `0x2` dynamic-fee. |
| `…chainId` | string | `0x89` for Polygon mainnet. |
| `…hash` | string | 32-byte transaction hash (hex). |
| `…v`, `…r`, `…s` | string | ECDSA signature components (hex). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your plan is below the **Pro** tier required for `txpool_content`. The error `data` includes `current_tier`, `required_tier`, and an `upgrade_url`. |
| `429` | `rate_limited` | You exceeded the per-method limit (1 RPS sustained · up to 2 burst on Pro, 2 RPS sustained · up to 4 burst on Business). The error `data` includes `limit_rps`, `burst_capacity`, and `retry_after_sec`. |

Example rate-limit response — HTTP `429` with a plain body, not a JSON-RPC envelope:

```json
{
  "error": "rate_limited",
  "message": "Rate limit exceeded: 1 RPS sustained on polygon_txpool (pro tier)",
  "current_tier": "pro",
  "category": "polygon_txpool",
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
const res = await fetch("https://triport.io/polygon", {
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

* **Atomic snapshot, not a stream.** Each call captures the pool at one instant.
  For continuous mempool observation, use a subscription rather than tight
  polling of this method — the two are complementary (snapshot of the whole pool
  vs. an eventually-consistent push of individual transactions).
* **Large payloads.** Polygon mainnet typically returns **8,000+ pending
  transactions** and **5–50 MB** of JSON. Stream-parse the response and avoid
  buffering the whole body in memory where you can.
* **Cap concurrency at ≤ 4.** Keep at most four `txpool_content` requests in
  flight at once; combined with the per-tier limit (1 RPS on Pro, 2 RPS on
  Business) this avoids saturating your bandwidth. Exceeding the limit returns
  HTTP `429` (`rate_limited`) with a `retry_after_sec` hint.
* **No parameters, no pagination** — the entire pool is returned in one
  response. For lighter checks use [txpool_status](./txpool_status.md) (counts
  only) or [txpool_inspect](./txpool_inspect.md) (summary strings).
* Requires the **Pro** tier; a lower tier returns HTTP `403` `tier_insufficient`
  (`tier_insufficient`).
* Rate limiting is RPS-per-tier with burst; there is no daily quota.
