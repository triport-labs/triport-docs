> Live version: https://triport.io/docs/sol/json-rpc/getBlock

# getBlock

> Returns identity and transaction information about a confirmed block in the Solana ledger.

| | |
|---|---|
| **Method / Endpoint** | `getBlock` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlock` returns the contents of a confirmed block at a given **slot**: its
blockhash, the parent slot it builds on, the block height and block time, and —
depending on the config you pass — the full list of transactions, just their
account keys, just their signatures, or none of them.

Use it to inspect or index ledger history: replay the transactions in a block,
correlate on-chain activity to a wall-clock time via `blockTime`, or walk the
chain by following `parentSlot`. Because a fully-detailed block can be large,
shape the response with `transactionDetails` and `rewards` to fetch only what
you need.

Not every slot produces a block (slots can be skipped). If you request a slot
that was skipped or is not available in the node's ledger, the call returns a
JSON-RPC error rather than an empty result — see [Errors](./getBlock.md#errors).

## Parameters

JSON-RPC `params` is a positional array: `[slot, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `slot` | integer (u64) | yes | The slot of the block to retrieve. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | Transaction encoding: `json`, `jsonParsed`, `base58`, or `base64`. Defaults to `json`. |
| `transactionDetails` | string | no | Level of transaction detail to return: `full`, `accounts`, `signatures`, or `none`. Defaults to `full`. |
| `rewards` | boolean | no | Whether to populate the `rewards` array. Defaults to `true`. |
| `commitment` | string | no | Commitment level: `confirmed` or `finalized`. **`processed` is not supported** for this method. |
| `maxSupportedTransactionVersion` | integer | no | Highest transaction version to return. Omit to receive only legacy transactions; set `0` to also return versioned (v0) transactions. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlock",
    "params": [
      348392040,
      {
        "encoding": "json",
        "transactionDetails": "signatures",
        "rewards": false,
        "maxSupportedTransactionVersion": 0
      }
    ]
  }'
```

## Response

The example uses `transactionDetails: "signatures"`, so `transactions` is
omitted and the block's transaction signatures are returned in `signatures`
instead.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "blockhash": "8QkYt1d3Z3y9Lz5p9q1r2s3t4u5v6w7x8y9z0A1B2C3",
    "previousBlockhash": "5n9d2Kc8r7w1Vb3F6gH4jL2mN8pQ0sT1uV5wX9yZ7aB",
    "parentSlot": 348392039,
    "blockHeight": 326118774,
    "blockTime": 1748563200,
    "signatures": [
      "5j7s4F1q9Xz2bN8pK3rT6uV0wY5cD1eH4gL7mP9sR2tU6vW3xZ8aB1cE4fH7jK0nQ",
      "3h2k9D7m4Lp1Rs6Tu8Vw0Xy5Zc2eF4gH6jN8qS1tU3vW5xY7zA9bC1dE3fG5hJ7kL"
    ],
    "rewards": []
  }
}
```

With the default `transactionDetails: "full"`, the response instead carries a
`transactions` array — each entry an object with `transaction` (encoded per
`encoding`) and `meta` (fee, balances, logs, status) — and `signatures` is
omitted.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | The `Block` object, or `null` if the slot was skipped. |
| `result.blockhash` | string (base-58 hash) | The block's blockhash. |
| `result.previousBlockhash` | string (base-58 hash) | The blockhash of the parent block. |
| `result.parentSlot` | integer (u64) | The slot of the parent block. |
| `result.blockHeight` | integer | The number of blocks beneath this block. |
| `result.blockTime` | integer | Estimated production time as a Unix timestamp (seconds). May be `null` if not available. |
| `result.transactions` | array | Present when `transactionDetails` is `full` or `accounts`; each entry holds the transaction and its `meta`. |
| `result.signatures` | array of string | Present when `transactionDetails` is `signatures`; the transaction signatures in the block. |
| `result.rewards` | array | Block rewards (e.g. staking, fees). Empty or omitted when `rewards: false`. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `slot` is missing or not an integer, or `config` is malformed (e.g. `commitment: "processed"`). |
| `-32001` | Block cleaned up | The block for this slot existed and was served in the past, but the node has since pruned it from its ledger retention. |
| `-32004` | Block not available | The block for the requested slot is not available on the node yet. |
| `-32007` | Slot skipped | The slot was skipped, or missing due to ledger jump to recent snapshot. |
| `-32009` | Slot skipped (long-term storage) | The slot was skipped, or missing in long-term storage. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getBlock",
    params: [
      348392040,
      { transactionDetails: "signatures", rewards: false, maxSupportedTransactionVersion: 0 },
    ],
  }),
});

const { result } = await res.json();
console.log(`Block ${result.blockHeight} @ slot ${result.parentSlot + 1}`);
console.log(`Produced at ${new Date(result.blockTime * 1000).toISOString()}`);
console.log(`${result.signatures.length} transactions`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const block = await client.solana.getBlock(348392040, {
  transactionDetails: "signatures",
  rewards: false,
  maxSupportedTransactionVersion: 0,
  commitment: "finalized",
});

console.log(`Blockhash ${block.blockhash}, ${block.signatures.length} txs`);
```

## Notes

- **`processed` is not a valid commitment** here — use `confirmed` or
  `finalized`. Passing `processed` yields an invalid-params error.
- **Skipped slots:** not every slot produces a block. Requesting a skipped slot
  returns a slot-skipped error (`-32007` / `-32009`), not an empty block — handle
  it as expected for sparse ranges.
- **Versioned transactions:** if a block contains v0 transactions and you omit
  `maxSupportedTransactionVersion`, the request fails. Set it to `0` to receive
  versioned transactions alongside legacy ones.
- **Shape the payload:** full blocks can be large. Use
  `transactionDetails: "signatures"` or `"none"` and `rewards: false` to keep
  responses small when you only need a summary.
- **Related methods:** use [`getBlocks`](./getBlocks.md) /
  [`getBlockTime`](./getBlockTime.md) to discover and time slots,
  [`getBlockHeight`](./getBlockHeight.md) for the current height, and
  [`getSlot`](./getSlot.md) for the slot the cluster has reached.
- **Got `-32001` for a slot that used to work?** See
  [why getBlock returns -32001 for a cleaned-up block](https://triport.io/errors/block-cleaned-up)
  for how it differs from `-32004`, `-32007` and `-32009`, the other three
  slot errors this method can return.
