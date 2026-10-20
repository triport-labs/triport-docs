> Live version: https://triport.io/docs/sol/json-rpc/isBlockhashValid

# isBlockhashValid

> Returns whether a given Solana blockhash is still valid (has not yet expired).

| | |
|---|---|
| **Method / Endpoint** | `isBlockhashValid` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`isBlockhashValid` reports whether a blockhash is still valid against the cluster.
A Solana blockhash expires after roughly 150 slots (about a minute), after which
any transaction that references it is rejected. Use this method to confirm a
recent blockhash is still usable **before** submitting a transaction, or to decide
whether you need to fetch a fresh one with `getLatestBlockhash` and re-sign.

The answer is wrapped in the standard RPC response envelope, so you also get the
`context.slot` at which it was evaluated. A `value` of `true` means the blockhash
is still valid at that slot; `false` means it has expired (or was never seen) and
you should obtain a new one.

Because validity is slot-dependent, the result is a point-in-time snapshot. Use
the optional `commitment` config to control how finalized that slot must be, and
`minContextSlot` to require that the node has reached at least a given slot before
serving the request.

## Parameters

JSON-RPC `params` is a positional array: `[blockhash, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockhash` | string (base-58) | yes | The blockhash to evaluate, as a base-58 encoded string. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "isBlockhashValid",
    "params": [
      "AaTs4Vs2sJ9bJq9rWvY3sJ6Qf2bC8mNpRtWuYxZ1Hc9",
      { "commitment": "confirmed" }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 348392041,
      "apiVersion": "2.0.18"
    },
    "value": true
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `RpcResponseBool` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the blockhash validity was evaluated. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | boolean | `true` if the blockhash is still valid, `false` if it has expired or is unknown. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `blockhash` is missing, not a string, or not valid base-58; or `config` is malformed. |
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
    method: "isBlockhashValid",
    params: ["AaTs4Vs2sJ9bJq9rWvY3sJ6Qf2bC8mNpRtWuYxZ1Hc9", { commitment: "confirmed" }],
  }),
});

const { result } = await res.json();
console.log(result.value ? "still valid" : "expired — fetch a new blockhash");
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.isBlockhashValid(
  "AaTs4Vs2sJ9bJq9rWvY3sJ6Qf2bC8mNpRtWuYxZ1Hc9",
  { commitment: "confirmed" }
);

console.log(`valid=${value} (slot ${context.slot})`);
```

## Notes

- **Pre-flight check before sending:** the typical flow is `getLatestBlockhash` →
  build and sign the transaction → optionally call `isBlockhashValid` right before
  [`sendTransaction`](./sendTransaction.md). If `value` is `false`, fetch a fresh
  blockhash and re-sign rather than submitting a doomed transaction.
- **Snapshot semantics:** the result is evaluated at `context.slot`; a blockhash
  that is valid now may expire moments later. Re-check if there is significant
  delay between the call and submission.
- **Avoid stale reads:** pass `minContextSlot` when you need a guarantee that the
  answer reflects at least a given slot; the node errors instead of returning a
  result from behind that slot.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** [`getLatestBlockhash`](./getLatestBlockhash.md) to obtain a
  fresh blockhash, and [`getFeeForMessage`](./getFeeForMessage.md) to price a
  message before signing.
