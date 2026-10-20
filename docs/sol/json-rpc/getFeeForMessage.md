> Live version: https://triport.io/docs/sol/json-rpc/getFeeForMessage

# getFeeForMessage

> Returns the fee, in lamports, that the network will charge to process a particular Solana message.

| | |
|---|---|
| **Method / Endpoint** | `getFeeForMessage` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getFeeForMessage` quotes the fee, in **lamports**, that the cluster will charge
to land a given transaction message. You pass a compiled, base-64-encoded
message (the transaction *without* its signatures), and the node computes the
fee against a recent fee schedule and the blockhash embedded in the message.

Use this to show users an estimated cost before they sign and submit a
transaction. The fee depends on the message contents (number of signatures,
any compute-budget instructions) and on the network's current fee state, so
quote it close to submission time rather than caching it.

The blockhash inside the message must still be valid. If it has expired, the
node cannot price the message and `value` comes back `null` — re-fetch a recent
blockhash, rebuild the message, and call again.

## Parameters

JSON-RPC `params` is a positional array: `[message, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `message` | string (base-64) | yes | A compiled transaction message, base-64 encoded. This is the message bytes only — not a signed, wire-format transaction. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level used to select the fee schedule: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getFeeForMessage",
    "params": [
      "AQABAgIAAAAMAAAAAAAAAA==",
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
    "value": 5000
  }
}
```

When the message's blockhash has expired, `value` is `null`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "context": {
      "slot": 348392041,
      "apiVersion": "2.0.18"
    },
    "value": null
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `RpcResponseU64` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the fee was computed. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | integer \| null | The fee in lamports, or `null` if the message's blockhash has expired. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `message` is missing, not valid base-64, not a decodable compiled message, or `config` is malformed. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |

A successful call whose message blockhash has expired is **not** an error — it
returns `result.value: null`. Always null-check `value` before using it.

## Examples

### JavaScript (fetch)
```js
const message = "AQABAgIAAAAMAAAAAAAAAA=="; // base-64 compiled message

const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getFeeForMessage",
    params: [message, { commitment: "confirmed" }],
  }),
});

const { result } = await res.json();
if (result.value === null) {
  console.warn("Blockhash expired — rebuild the message with a fresh blockhash.");
} else {
  console.log(`Fee: ${result.value} lamports (${result.value / 1e9} SOL)`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const message = "AQABAgIAAAAMAAAAAAAAAA=="; // base-64 compiled message

const { context, value } = await client.solana.getFeeForMessage(message, {
  commitment: "confirmed",
});

if (value === null) {
  throw new Error("Message blockhash expired; fetch a fresh blockhash and retry.");
}
console.log(`Fee: ${value} lamports (slot ${context.slot})`);
```

## Notes

- **Message, not transaction:** the input is a compiled message (base-64), not a
  fully signed wire-format transaction. Encode the message bytes your signing
  library produces before sending it.
- **`null` means expired blockhash:** a `null` `value` is the documented signal
  that the blockhash baked into the message is no longer recent enough to price.
  Re-fetch a recent blockhash, rebuild the message, and call again.
- **Lamports, not SOL:** `value` is an integer count of lamports. Divide by
  `1e9` to display a SOL figure.
- **Quote late:** fees can change with network conditions; request the quote
  just before signing rather than caching it.
- **Related methods:** pair with `getLatestBlockhash` to obtain a fresh
  blockhash for the message, and `sendTransaction` to submit the signed
  transaction once the fee is acceptable.
