> Live version: https://triport.io/docs/polygon/json-rpc/eth_getBlockByNumber

# eth_getBlockByNumber

> Returns a single Polygon block selected by block number or a named tag, optionally with every transaction body inlined.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBlockByNumber` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) (the `x-token: $TRIPORT_API_KEY` header is also accepted) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free (and up) — 15 rps (free) · 20 rps (basic) · 100 rps (pro) · 250 rps (business); burst = 2 × the sustained rps |

## Description

`eth_getBlockByNumber` is the most common block read on Polygon. Given a block
number (or one of the tags `latest`, `earliest`, `pending`, `safe`,
`finalized`) it returns the block's header plus its transaction list. The second
parameter chooses how transactions are rendered: pass `false` to get an array of
transaction **hashes** (a light ~3–5 KB payload), or `true` to inline every
**full transaction body** (a heavier ~30–100 KB payload for a typical block of
50–150 transactions).

Polygon's block time is roughly **2.1 seconds**, so `eth_getBlockByNumber("latest", …)`
advances about every 2 s. A bot tracking the chain tip in real time should poll
on that cadence rather than tighter — there is no new block to fetch in between.

Polygon runs Bor consensus and therefore has **no uncle blocks**: the `uncles`
array is always empty and `sha3Uncles` is the empty-list hash. This is the main
shape difference from Ethereum mainnet. Use [`eth_getBlockByHash`](./eth_getBlockByHash.md)
instead when you already hold a block hash (for example, to detect a re-org by
checking whether a previously seen hash still resolves).

## Parameters

Positional params array: `[blockNumber, fullTxBodies]`.

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `blockNumber` | string | yes | A hex-encoded block number (e.g. `"0x3b9aca00"`) **or** a tag: `latest`, `earliest`, `pending`, `safe`, or `finalized`. |
| 1 | `fullTxBodies` | boolean | yes | `false` → `transactions` is an array of tx hashes (light). `true` → `transactions` holds full transaction objects (heavy). |

> Historic (archive-depth) block numbers resolve as long as they are within the
> retained range; very deep reads may not be available on every backing route.
> For tip tracking just use the `latest` tag.

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBlockByNumber",
    "params": ["latest", false]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x3b9aca00",
    "hash": "0x9b83c12c69edb74f6c8dd5d052765c1adf940e320bd1291696e6fa07829eee71",
    "parentHash": "0x8d2e1f1a2b6f4c0e7a9d3c5b1e8f0a2c4d6e8f0a1b2c3d4e5f60718293a4b5c6d",
    "nonce": "0x0000000000000000",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00200000000000000000000080000000000000000000000000000000...",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0x5b9c1d2e3f405162738495a6b7c8d9e0f10213243546576879a0b1c2d3e4f506",
    "receiptsRoot": "0x4a1d2c3b4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
    "miner": "0x0000000000000000000000000000000000000000",
    "difficulty": "0x1",
    "totalDifficulty": "0x0",
    "extraData": "0xd682021183626f7288676f312e32302e35856c696e7578...",
    "size": "0x4f2a",
    "gasLimit": "0x1c9c380",
    "gasUsed": "0x8f2c1d",
    "baseFeePerGas": "0x6fc23ac00",
    "timestamp": "0x664b8a10",
    "uncles": [],
    "transactions": [
      "0x2c0a1b3e4d5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f9",
      "0x7f8e9d0c1b2a3948576655443322110ffeeddccbbaa99887766554433221100f"
    ]
  }
}
```

With `fullTxBodies: true`, each entry of `transactions` is a full transaction
object (`hash`, `from`, `to`, `value`, `input`, `gas`, `gasPrice`,
`maxFeePerGas`, `nonce`, `blockNumber`, `transactionIndex`, …) instead of a hash
string.

If the requested block does not exist, `result` is `null`.

### Response fields

| Field | Type | Description |
|---|---|---|
| `number` | string (hex) | Block number. `null` for a pending block. |
| `hash` | string | Block hash. `null` for a pending block. |
| `parentHash` | string | Hash of the parent block. |
| `nonce` | string (hex) | PoW nonce; `0x00…0` on Bor. |
| `sha3Uncles` | string | Keccak-256 of the uncle list — always the empty-list hash on Polygon. |
| `logsBloom` | string | Bloom filter over the block's logs. |
| `transactionsRoot` | string | Root of the transaction trie. |
| `stateRoot` | string | Root of the final state trie. |
| `receiptsRoot` | string | Root of the receipts trie. |
| `miner` | string | Address credited with producing the block. |
| `difficulty` | string (hex) | Block difficulty. |
| `totalDifficulty` | string (hex) | Cumulative chain difficulty up to this block. |
| `extraData` | string | Extra data field set by the block producer. |
| `size` | string (hex) | Block size in bytes. |
| `gasLimit` | string (hex) | Maximum gas allowed in the block. |
| `gasUsed` | string (hex) | Gas actually consumed by all transactions. |
| `baseFeePerGas` | string (hex) | EIP-1559 base fee per gas for this block. |
| `timestamp` | string (hex) | Unix timestamp when the block was produced. |
| `uncles` | array | Uncle hashes — always `[]` on Polygon (Bor consensus). |
| `transactions` | array | Tx hashes when `fullTxBodies=false`; full tx objects when `true`. |

## Errors

Errors arrive in the standard JSON-RPC `error` object; the extra fields move
into `error.data`.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The free 7-day trial has ended. |
| `403` | `tier_insufficient` | Your tier is below what the method requires. (Not expected here — this method is included in the Free trial.) |
| `429` | `rate_limited` | You exceeded the sustained rps for your tier; respect `Retry-After` / `data.retry_after_sec`. |
| `401` | `subscription_expired` | A previously active paid subscription has lapsed. |
| `401` | `unauthorized` | Missing, invalid, or revoked credentials. |
| HTTP `403` | `method_unknown` | The method name was not recognised on the `polygon` chain. |

See the shared [Errors reference](../../errors.md) for the full envelope, the
HTTP-status mapping, and `error.data` field definitions.

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
    method: "eth_getBlockByNumber",
    params: ["latest", false],
  }),
});

const { result, error } = await res.json();
if (error) throw new Error(`${error.code}: ${error.message}`);
console.log("tip block:", parseInt(result.number, 16), "tx count:", result.transactions.length);
```

## Notes

* **Payload sizing.** `fullTxBodies=false` is ~3–5 KB; `true` is ~30–100 KB for a
  typical 50–150-tx Polygon block. Fetch hashes first and pull only the bodies
  you need unless you genuinely require all of them.
* **Tip polling.** With ~2.1 s block time, poll `["latest", false]` about every
  2 seconds for real-time tip tracking.
* **No uncles.** `uncles` is always `[]` and `sha3Uncles` is the empty-list hash
  (Bor consensus). Do not write logic that expects uncle data on Polygon.
* **No daily cap.** Rate limiting is sustained-rps-per-tier with a 2× burst
  allowance — there is no daily quota. See [Rate limits](../../rate-limits-and-tiers.md).
* **Related:** [`eth_getBlockByHash`](./eth_getBlockByHash.md) (same shape, by
  hash) · [`eth_getBlockReceipts`](./eth_getBlockReceipts.md) (all receipts in a
  block in one call) · [`eth_getBlockTransactionCountByNumber`](./eth_getBlockTransactionCountByNumber.md).
- **Finality:** read the `finalized` tag instead of counting confirmations —
  see [Polygon PoS finality: milestones and confirmations](https://triport.io/learn/polygon-finality-milestones).
