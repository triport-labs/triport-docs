> Live version: https://triport.io/docs/eth/json-rpc/debug_storageRangeAt

# debug_storageRangeAt

> Returns a page of contract storage slots as they existed at a specific transaction within a given block.

| | |
|---|---|
| **Method / Endpoint** | `debug_storageRangeAt` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_debug` |
| **Tier / rate limit** | Pro — 5 RPS sustained · up to 10 burst · Business — 15 RPS sustained · up to 30 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_storageRangeAt` reads the storage trie of a single contract and returns a
range (page) of its slots, reconstructed at the state that existed *after* a
chosen transaction in a chosen block. Each entry is a preimage `key` and its
32-byte `value`, indexed by the hash of the slot key. Because storage is a large
keyed map, the method is paginated: you give it a starting key and a maximum
count, and it returns the slots from that point plus a `nextKey` cursor to
continue from.

Use this when you need to inspect or snapshot raw contract state at a precise
point in history — for example to audit a storage layout, diff a contract's
slots across two transactions, or recover a value that is not exposed through a
view function. Unlike a single-slot read, it walks the trie and hands back many
slots in one call.

This is a `debug`-namespace method and is available on the **Pro** tier and
above. It is rate limited per tier (5 RPS on Pro, 15 RPS on Business) with a
short burst allowance; there is no daily quota.

## Parameters

Five positional parameters, in order.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | string | yes | `0x`-prefixed 32-byte hash of the block whose state is inspected. |
| `txIndex` | number | yes | Index of the transaction within that block. State is reconstructed as of *after* this transaction executes; use `0` for the state at the start of the block. |
| `contractAddress` | string | yes | `0x`-prefixed 20-byte address of the contract whose storage is read. |
| `startKey` | string | yes | `0x`-prefixed 32-byte hash of the storage slot to start from (the trie is keyed by the hash of each slot key). Use `0x0000…0000` to start at the beginning. |
| `maxResult` | number | yes | Maximum number of storage slots to return in this page. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "debug_storageRangeAt",
    "params": [
      "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",
      0,
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      2
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "storage": {
      "0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563": {
        "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "value": "0x000000000000000000000000000000000000000000000000000000000000000a"
      },
      "0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6": {
        "key": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "value": "0x0000000000000000000000000000000000000000000000056bc75e2d63100000"
      }
    },
    "nextKey": "0xc2575a0e9e593c00f959f8c92f12db2869c3395a3b0502d05e2516446f71f85b"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result.storage` | object | Map of storage entries for this page, keyed by the `0x`-prefixed hash of the slot key. |
| `result.storage[hash].key` | string \| null | The `0x`-prefixed preimage of the slot key, or `null` if the node could not recover the preimage. |
| `result.storage[hash].value` | string | The `0x`-prefixed 32-byte value stored in that slot. |
| `result.nextKey` | string \| null | Cursor: the `0x`-prefixed hash to pass as `startKey` to fetch the next page, or `null` when this page is the last one. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your API key's tier is below **Pro**; this `debug`-namespace method is not enabled for it. |
| `429` | `rate_limited` | You exceeded your tier's request rate (5 RPS sustained · up to 10 burst on Pro, 15 RPS sustained · up to 30 burst on Business) including burst. Retry after a short back-off. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "debug_storageRangeAt",
    params: [
      "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331",
      0,
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      2,
    ],
  }),
});

const { result } = await res.json();
console.log(result.storage, result.nextKey);
```

## Notes

- **Pagination.** Keep calling with `startKey` set to the previous response's
  `nextKey` until `nextKey` comes back `null`. Choose `maxResult` to balance
  response size against the number of round-trips.
- **State point.** `txIndex` selects the state *after* that transaction in the
  block; pass `0` to read the storage as it stood at the start of the block.
- **`key` may be `null`.** The node returns the slot-key preimage when it has
  it; for some slots only the hashed key is known, in which case `key` is
  `null` while `value` is still returned.
- **Archive history.** Reconstructing storage at an old block requires archive
  state; very old blocks may be unavailable depending on retention.
- For tracing execution rather than reading state, see
  [`debug_traceTransaction`](./debug_traceTransaction.md); for a contract's full
  storage proof at a block, see [`eth_getProof`](./eth_getProof.md).
