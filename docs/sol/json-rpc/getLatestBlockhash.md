> Live version: https://triport.io/docs/sol/json-rpc/getLatestBlockhash

# getLatestBlockhash

> Returns the latest blockhash along with the last block height at which it remains valid for signing transactions.

| | |
|---|---|
| **Method / Endpoint** | `getLatestBlockhash` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getLatestBlockhash` returns a recent **blockhash** that you embed into a
transaction message before signing, together with the
`lastValidBlockHeight` — the highest block height at which a transaction built
on that blockhash will still be accepted by the cluster.

This method is a required step in nearly every transaction-building flow. A
Solana transaction must reference a recent blockhash to be valid; the cluster
rejects transactions whose blockhash is too old. Fetch a fresh blockhash
immediately before constructing and signing, then submit the signed
transaction via [`sendTransaction`](./sendTransaction.md).

**The blockhash expires.** Once the cluster's block height climbs past
`lastValidBlockHeight`, the blockhash is no longer accepted and the transaction
can never land. Use `lastValidBlockHeight` to drive confirmation polling and
retry logic: keep re-submitting until the transaction confirms or the current
block height (from [`getBlockHeight`](./getBlockHeight.md)) exceeds the returned
`lastValidBlockHeight`, at which point you should fetch a new blockhash and
rebuild.

## Parameters

JSON-RPC `params` is a positional array: `[config?]`. The single parameter is
an optional configuration object.

| Name | Type | Required | Description |
|---|---|---|---|
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
    "method": "getLatestBlockhash",
    "params": [{ "commitment": "finalized" }]
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
    "value": {
      "blockhash": "EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N",
      "lastValidBlockHeight": 336825587
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `LatestBlockhashResponse` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the blockhash was read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | object | The blockhash payload. |
| `result.value.blockhash` | string (base-58) | A recent blockhash to embed in your transaction message. |
| `result.value.lastValidBlockHeight` | integer | The last block height at which a transaction using this blockhash is still valid. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `config` is malformed, or `commitment` is not one of `processed` / `confirmed` / `finalized`. |
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
    method: "getLatestBlockhash",
    params: [{ commitment: "finalized" }],
  }),
});

const { result } = await res.json();
const { blockhash, lastValidBlockHeight } = result.value;
console.log(`Blockhash ${blockhash} valid until block ${lastValidBlockHeight}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.getLatestBlockhash({
  commitment: "finalized",
});

console.log(
  `Blockhash ${value.blockhash} (slot ${context.slot}) ` +
  `valid until block ${value.lastValidBlockHeight}`
);
```

## Notes

- **Fetch late, sign immediately:** request the blockhash as close as possible
  to signing and submitting. The older the blockhash, the less of its validity
  window remains.
- **Drive retries with `lastValidBlockHeight`:** poll
  [`getBlockHeight`](./getBlockHeight.md) while awaiting confirmation. Once the
  current height passes `lastValidBlockHeight`, the transaction can no longer
  land — fetch a fresh blockhash and rebuild rather than continuing to retry.
- **Commitment matters:** a `finalized` blockhash is the most durable but
  slightly older; `confirmed` or `processed` give you a more recent blockhash at
  the cost of a small chance of referencing a dropped fork. When omitted, the
  node's default commitment applies.
- **Related methods:** pair with [`sendTransaction`](./sendTransaction.md) to
  submit the signed transaction, [`getFeeForMessage`](./getFeeForMessage.md) to
  price a message before signing, and [`getBlockHeight`](./getBlockHeight.md) to
  track expiry.
