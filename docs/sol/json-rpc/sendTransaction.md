> Live version: https://triport.io/docs/sol/json-rpc/sendTransaction

# sendTransaction

> Submits a fully-signed transaction to the Solana cluster for processing and returns its signature.

| | |
|---|---|
| **Method / Endpoint** | `sendTransaction` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — free 5 rps · basic 10 rps · pro 50 rps · business 150 rps (`sol_send_tx`) |

## Description

`sendTransaction` broadcasts an already-signed, fully-serialized transaction to
the cluster for execution. The transaction must be signed by all required
signers and contain a recent blockhash before you call this method — Triport
does not sign on your behalf.

By default the receiving node runs a **preflight** check (a simulation against
the `preflightCommitment` bank) before forwarding the transaction. If preflight
fails, the call returns an error and the transaction is not forwarded by that
node. The method returns the transaction's first **signature** (base-58) as
soon as an upstream accepts it — this is *not* a confirmation. Use
`getSignatureStatuses` or
[`getTransaction`](./getTransaction.md) to poll for confirmation.

This method is available on all tiers but is throttled separately under the
`sol_send_tx` category, so send throughput is independent of your read-RPC
budget. To validate a transaction without submitting it, use
[`simulateTransaction`](./simulateTransaction.md) instead.

#### What a successful response means

`result` means an upstream **accepted** the transaction for forwarding. It
does not mean the leader received it, and it does not mean it landed — a
transaction can still be dropped or expire with its blockhash. Confirm with
`getSignatureStatuses`, `signatureSubscribe` on `wss://triport.io/ws/sol`, or
[`getTransaction`](./getTransaction.md).

## Parameters

Positional `params` array: `[transaction, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `transaction` | string | yes | Fully-signed transaction as an encoded string. Defaults to base58; pass base64 via `config.encoding`. |
| `config` | object | no | Send options (see below). |

### `config` object

| Name | Type | Required | Description |
|---|---|---|---|
| `encoding` | `"base58"` \| `"base64"` | no | Encoding of the `transaction` string. `base64` is recommended; `base58` is slower and is supported for compatibility. |
| `skipPreflight` | boolean | no | If `true`, skip the preflight simulation/checks and forward the transaction immediately. Default `false`. |
| `preflightCommitment` | `"processed"` \| `"confirmed"` \| `"finalized"` | no | Commitment level used for the preflight check. Default `"finalized"`. |
| `minContextSlot` | integer | no | Minimum slot at which the request should be evaluated. |
| `maxRetries` | integer | no | Maximum number of times to retry sending to the leader. `0` disables automatic retries. |

> **skipPreflight risk:** skipping preflight removes the safety simulation, so a
> transaction that would certainly fail (bad blockhash, insufficient funds,
> failing instruction) is still broadcast and you pay the round-trip with no
> early error. Only set `skipPreflight: true` when you have already simulated
> the transaction yourself and want to skip the second simulation.
>
> **maxRetries:** `maxRetries: 0` means the node will *not* automatically
> rebroadcast the transaction if it is dropped before the blockhash expires —
> your client is then responsible for resubmitting.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "4eEzpJ29YBE7iz6Lw5eVNqYpJEMRDM6kF1pPyDmwbDgTynxJgF6Th9oV66XSh1jKvxhqZpKjJqLBu7nGzrjnVqWv"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The transaction's first signature, base-58 encoded. Use it to track confirmation status. |

## Errors

Errors are returned in the standard JSON-RPC envelope — see [errors.md](../../errors.md)
for the full shape.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `transaction` is malformed, unsigned, or its encoding does not match `config.encoding`. |
| `-32002` | Transaction simulation failed | Preflight rejected the transaction (e.g. expired blockhash, insufficient funds, failing instruction). Only returned when `skipPreflight` is `false`. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` API key. |
| `429` | Rate limited | Request rate exceeded your tier's `sol_send_tx` RPS limit (free 5 · basic 10 · pro 50 · business 150). Back off and retry. |

## Examples

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const signature = await client.solana.sendTransaction(signedTxBase64, {
  encoding: "base64",
  skipPreflight: false,
  preflightCommitment: "processed",
  maxRetries: 0,
});

console.log("submitted:", signature);
```

## Notes

- The returned signature confirms **acceptance**, not finality. Poll
  `getSignatureStatuses` or fetch the transaction
  with [`getTransaction`](./getTransaction.md) to confirm it landed.
- Set the transaction's blockhash from a recent
  [`getLatestBlockhash`](./getLatestBlockhash.md) result; an expired blockhash
  causes preflight (or eventual processing) to fail.
- Prefer `encoding: "base64"` — it is more compact and faster to decode than
  `base58`.
- To dry-run a transaction without broadcasting it, use
  [`simulateTransaction`](./simulateTransaction.md).
- `sendTransaction` uses the `sol_send_tx` rate-limit category, separate
  from read-RPC limits.
- **Signature but never confirmed?** See
  [why a Solana transaction never lands](https://triport.io/learn/solana-transaction-not-landing)
  for dropped transactions, blockhash expiry and when it is safe to re-sign.
