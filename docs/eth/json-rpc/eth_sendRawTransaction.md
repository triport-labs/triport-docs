> Live version: https://triport.io/docs/eth/json-rpc/eth_sendRawTransaction

# eth_sendRawTransaction

> Broadcasts a signed, RLP-encoded transaction to the Ethereum network and returns its transaction hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_sendRawTransaction` (JSON-RPC, `POST /eth`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free 3 RPS sustained · up to 6 burst · basic 5 RPS sustained · up to 10 burst · pro 30 RPS sustained · up to 60 burst · business 80 RPS sustained · up to 160 burst (category `eth_send_tx`); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_sendRawTransaction` submits an **already-signed** transaction to the network
for inclusion in a block. You sign the transaction locally with your private key,
RLP-encode it, hex-encode the result, and pass that single hex string as the only
parameter. Triport never sees or holds your key — only the signed payload.

On success the method returns the transaction hash immediately. This hash is
returned as soon as the transaction is accepted into the mempool; it does **not**
mean the transaction has been mined. Poll
[`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) with the returned
hash to confirm inclusion and read the final status.

This is the only state-changing method in the `eth` read namespace, and it sits
in its own `eth_send_tx` rate-limit category with **markedly lower limits than
read methods** (3 RPS on free vs. 10+ RPS for reads). Budget your send rate
accordingly and back off on HTTP `429`. The method is available from the Free trial
upward — no paid tier is required to broadcast transactions.

## Parameters

A single positional parameter:

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `signedTransactionData` | string (`0x`-prefixed hex) | yes | The signed transaction, RLP-encoded and hex-encoded. Produced by your signing library (e.g. `ethers`, `web3.py`, `viem`). Supports legacy and typed (EIP-1559 / EIP-2930) transactions. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_sendRawTransaction",
    "params": [
      "0xf86b808504a817c80082520894742d35cc6634c0532925a3b844bc9e7595f06b8b880de0b6b3a76400008025a0aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899a012345678901234567890123456789012345678901234567890123456789012"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string (`0x`-prefixed hex) | The 32-byte transaction hash. Use it with [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) to track confirmation. |

## Errors

Errors arrive in the standard JSON-RPC `error` object, with extra fields under
`error.data`. See [Errors](../../errors.md) for both response shapes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The free 7-day trial has ended. Upgrade to a paid tier to keep broadcasting. A plain HTTP error, not a JSON-RPC one. |
| `429` | `rate_limited` | Sustained sends exceeded your tier's `eth_send_tx` RPS. A plain HTTP error: honour `Retry-After` / the body's `retry_after_sec`. Limits are low here: 3 RPS sustained · up to 6 burst free, 5 basic, 30 pro, 80 business. |
| `-32000` | execution error (passthrough) | The network rejected the transaction — e.g. nonce too low, insufficient funds, gas price too low, or `already known`. The `message` carries the node's reason. Fix the transaction and re-sign. |

### rate_limited (HTTP `429`)

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 3 requests/s for eth_send_tx. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "eth_send_tx",
  "limit_rps": 3,
  "burst_capacity": 6,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

`burst_capacity` is always `2 × limit_rps`. The response also carries
`Retry-After` and `X-RateLimit-*` headers — see [Errors](../../errors.md#response-headers).

## Examples

### JavaScript (fetch)
```js
const signedTx = "0xf86b808504a817c8..."; // produced by your signer

const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_sendRawTransaction",
    params: [signedTx],
  }),
});

const body = await res.json();
if (!res.ok) {
  // Product errors are plain HTTP: `error` is a string code, fields at top level.
  if (body.error === "rate_limited") {
    const wait = Number(res.headers.get("Retry-After") ?? body.retry_after_sec);
    await new Promise((r) => setTimeout(r, wait * 1000)); // then retry
  } else {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
} else if (body.error) {
  throw new Error(body.error.message); // JSON-RPC error from the node, e.g. nonce too low
} else {
  console.log("tx hash:", body.result);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { Triport, RateLimitedError } from "@triport/sdk";

const client = new Triport({ token: process.env.TRIPORT_API_KEY! });

const signedTx = "0xf86b808504a817c8..."; // produced by your signer

try {
  const txHash = await client.eth.sendRawTransaction(signedTx);
  console.log("tx hash:", txHash);
} catch (err) {
  if (err instanceof RateLimitedError) {
    await new Promise((r) => setTimeout(r, err.retryAfterSec * 1000)); // then retry
  } else {
    throw err;
  }
}
```

## Notes

* **The hash is not confirmation.** A returned hash means *accepted into the
  mempool*, not *mined*. Poll
  [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) until a receipt
  appears, then check its `status` field.
* **Idempotent re-broadcast.** Re-submitting the same signed transaction usually
  yields the same hash; the network may return an `already known` execution error
  (`-32000`), which is harmless.
* **Sign locally.** Build and sign with a client library
  (`ethers`, `viem`, `web3.py`); only the resulting hex string is sent here.
* **Low send budget.** The `eth_send_tx` category caps sends well below read
  methods. For high-throughput or MEV use cases, see
  the [private RPC forwarder](../rest/mev-private-rpc.md) (`eth_sendBundle` is not served on this endpoint).
* See also: [Errors](../../errors.md) · [Rate limits](../../rate-limits-and-tiers.md) ·
  [Authentication](../../authentication.md).
