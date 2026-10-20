> Live version: https://triport.io/docs/sol/json-rpc/getTransaction

# getTransaction

> Returns the full details of a confirmed Solana transaction, looked up by its signature.

| | |
|---|---|
| **Method / Endpoint** | `getTransaction` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTransaction` fetches a single confirmed transaction by its base-58
signature and returns its decoded contents along with execution metadata —
fees, balance changes, inner instructions, log output, and compute units
consumed.

Use it to inspect the outcome of a transaction you have already submitted (for
example after `sendTransaction`), to confirm whether it succeeded, or to render
the details of any historical transaction. The method returns `null` when no
confirmed transaction matches the supplied signature — either because the
signature is unknown to the cluster or because it has not yet reached the
requested commitment.

Versioned transactions (those using Address Lookup Tables) are only returned
when you pass `maxSupportedTransactionVersion`. If you omit it and the
transaction is a versioned one, the request fails rather than returning the
transaction.

## Parameters

JSON-RPC `params` is a positional array: `[signature, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `signature` | string (base-58) | yes | The transaction signature to look up. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `encoding` | string | no | Encoding for the returned `transaction`: `json`, `jsonParsed`, `base58`, or `base64`. |
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `maxSupportedTransactionVersion` | integer | no | Highest transaction version to return. Required to receive versioned (lookup-table) transactions; pass `0` for current versioned transactions. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransaction",
    "params": [
      "4eEzpJ29YBE7iz6Lw5eVNqYpJEMRDM6kF1pPyDmwbDgTynxJgF6Th9oV66XSh1jKvxhqZpKjJqLBu7nGzrjnVqWv",
      {
        "encoding": "jsonParsed",
        "commitment": "finalized",
        "maxSupportedTransactionVersion": 0
      }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "slot": 348392041,
    "blockTime": 1746950400,
    "version": "legacy",
    "transaction": {
      "signatures": [
        "4eEzpJ29YBE7iz6Lw5eVNqYpJEMRDM6kF1pPyDmwbDgTynxJgF6Th9oV66XSh1jKvxhqZpKjJqLBu7nGzrjnVqWv"
      ],
      "message": {
        "accountKeys": [
          "So11111111111111111111111111111111111111112",
          "11111111111111111111111111111111"
        ],
        "recentBlockhash": "FwRYtTPRk5N4wUeP87rTw9kQVSwigB6kbikGzzeCMrW5",
        "instructions": []
      }
    },
    "meta": {
      "err": null,
      "fee": 5000,
      "preBalances": [10000000000, 1],
      "postBalances": [9999995000, 1],
      "innerInstructions": [],
      "logMessages": [
        "Program 11111111111111111111111111111111 invoke [1]",
        "Program 11111111111111111111111111111111 success"
      ],
      "computeUnitsConsumed": 150
    }
  }
}
```

When no confirmed transaction matches the signature, `result` is `null`:

```json
{ "jsonrpc": "2.0", "id": 1, "result": null }
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object \| null | The transaction response, or `null` if not found. |
| `result.slot` | integer | The slot in which the transaction was processed. |
| `result.blockTime` | integer | Estimated production time of the block, as a Unix timestamp (seconds). May be `null`. |
| `result.version` | string \| integer | Transaction version: `"legacy"` or a version number (e.g. `0`). |
| `result.transaction` | object | The decoded transaction, in the requested `encoding`. |
| `result.meta` | object | Execution metadata (see below). |
| `result.meta.err` | object \| null | `null` on success, or an error object describing why the transaction failed. |
| `result.meta.fee` | integer | Fee charged for the transaction, in lamports. |
| `result.meta.preBalances` | integer[] | Account lamport balances before the transaction, ordered by `accountKeys`. |
| `result.meta.postBalances` | integer[] | Account lamport balances after the transaction, ordered by `accountKeys`. |
| `result.meta.innerInstructions` | array | Cross-program (inner) instructions invoked during execution. |
| `result.meta.logMessages` | string[] | Program log output emitted during execution. |
| `result.meta.computeUnitsConsumed` | integer | Total compute units consumed by the transaction. |

The `meta` object also carries `loadedAddresses` (writable/readonly addresses
resolved from lookup tables), `preTokenBalances` / `postTokenBalances`, and
`rewards` when applicable.

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `signature` is missing or not a valid base-58 string, `config` is malformed, or the transaction is versioned and `maxSupportedTransactionVersion` was not supplied. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

A signature that simply does not match any confirmed transaction is **not** an
error — the call succeeds with `result: null`.

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
    method: "getTransaction",
    params: [
      "4eEzpJ29YBE7iz6Lw5eVNqYpJEMRDM6kF1pPyDmwbDgTynxJgF6Th9oV66XSh1jKvxhqZpKjJqLBu7nGzrjnVqWv",
      { encoding: "jsonParsed", commitment: "finalized", maxSupportedTransactionVersion: 0 },
    ],
  }),
});

const { result } = await res.json();
if (result === null) {
  console.log("Transaction not found");
} else {
  console.log(`Succeeded: ${result.meta.err === null}, fee: ${result.meta.fee} lamports`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const tx = await client.solana.getTransaction(
  "4eEzpJ29YBE7iz6Lw5eVNqYpJEMRDM6kF1pPyDmwbDgTynxJgF6Th9oV66XSh1jKvxhqZpKjJqLBu7nGzrjnVqWv",
  { encoding: "jsonParsed", commitment: "finalized", maxSupportedTransactionVersion: 0 }
);

if (tx === null) {
  console.log("Transaction not found");
} else {
  console.log(`Slot ${tx.slot}, fee ${tx.meta.fee} lamports, ok=${tx.meta.err === null}`);
}
```

## Notes

- **Always handle `null`.** A successful response with `result: null` means the
  signature is unknown at the requested commitment — it is not an error.
- **Versioned transactions:** pass `maxSupportedTransactionVersion: 0` to fetch
  current versioned transactions. Omitting it causes versioned transactions to
  fail rather than return.
- **Confirmation lag:** a freshly submitted transaction may not appear
  immediately. Poll with `commitment: "confirmed"` (or `processed`) for faster
  visibility, then re-read at `finalized` once settled.
- **Related methods:** use [`sendTransaction`](./sendTransaction.md) to submit a
  transaction, [`getSignaturesForAddress`](./getSignaturesForAddress.md) to
  discover signatures for an account, and [`getBlock`](./getBlock.md) to fetch
  every transaction in a slot.
- **`null` for a signature you know existed?** See
  [why getTransaction returns null for an old signature](https://triport.io/learn/transaction-outside-history-window)
  for how to tell "never confirmed" apart from "confirmed, but now outside
  the node's retained history".
