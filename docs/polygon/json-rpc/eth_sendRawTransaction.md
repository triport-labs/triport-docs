> Live version: https://triport.io/docs/polygon/json-rpc/eth_sendRawTransaction

# eth_sendRawTransaction

> Broadcasts a signed, RLP-encoded transaction to the Polygon mempool and returns its transaction hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_sendRawTransaction` (JSON-RPC, `POST /polygon/rpc`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_send_tx` |
| **Tier / rate limit** | Free trial (7 days) and up — free 3 rps · basic 5 rps · pro 30 rps · business 80 rps (category `polygon_send_tx`) |

## Description

`eth_sendRawTransaction` submits an **already-signed** transaction to Polygon
mainnet for inclusion in a block. You sign the transaction locally with your
private key, RLP-encode it, hex-encode the result, and pass that single
`0x`-prefixed hex string as the only parameter. Triport never sees or holds
your key — only the signed payload.

On success the method returns the transaction hash immediately. The hash is
returned as soon as the transaction is accepted into the mempool; it does
**not** mean the transaction has been mined. Polygon's Bor consensus produces
blocks roughly every ~2 seconds, so poll
[`eth_getTransactionReceipt`](./eth_getTransactionByBlockHashAndIndex.md) — or
the transaction-by-hash lookups — with the returned hash to confirm inclusion
and read the final status.

This is the only state-changing method on the Polygon `eth` surface, and it
sits in its own `polygon_send_tx` rate-limit category with **markedly lower
limits than read methods** (3 rps on free vs. 15 rps for reads). Budget your
send rate accordingly and back off on HTTP `429`. The method is available from the
Free trial upward — no paid tier is required to broadcast transactions.

**Gotchas**

* **Use Polygon's chain ID.** The transaction must be signed with EIP-155
  replay protection using chain ID `0x89` (137). A transaction signed for
  another chain (e.g. Ethereum mainnet, `0x1`) is rejected with
  `-32000 invalid sender` before it ever reaches the mempool, because the
  recovered signer does not match.
* **Replay protection is mandatory.** Without EIP-155 binding to `0x89`, a
  Polygon transaction could also be valid on other EVM chains — a replay-attack
  vector. Always sign with the correct chain ID.
* **Idempotent re-broadcast.** Re-submitting the same signed transaction (same
  hash) is safe. Depending on the upstream node it returns either the same hash
  again or `-32000 already known`. Treat **both** outcomes as success.

## Parameters

A single positional parameter:

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `signedTransactionData` | string (`0x`-prefixed hex) | yes | The signed transaction, RLP-encoded and hex-encoded. Produced by your signing library (e.g. `ethers`, `web3.py`, `viem`). Must carry an EIP-155 signature over chain ID `0x89` (137). Supports legacy and typed (EIP-1559 / EIP-2930) transactions. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_sendRawTransaction",
    "params": [
      "0xf86c098504a817c80082520894742d35cc6634c0532925a3b844bc9e7595f06b8b880de0b6b3a7640000801ba0aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899a0112233445566778899aabbccddeeff00112233445566778899aabbccddeeff0011"
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
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | string (`0x`-prefixed hex) | The 32-byte transaction hash. Use it to poll for the receipt and confirm inclusion. |

## Errors

On failure the response carries an `error` object instead of `result`, with
extra context under `error.data`. See the shared
[errors reference](../../errors.md) for the full envelope and the canonical
meaning of each platform code.

| Code | Meaning | When it happens |
|---|---|---|
| `-32000` | execution error (passthrough) | The network rejected the transaction — e.g. `invalid sender` (wrong chain ID / bad signature), nonce too low, insufficient funds, gas price too low, or `already known`. The `message` carries the node's reason. `already known` on a re-broadcast is harmless. |
| `401` | `trial_expired` | The free-trial period for this key has ended (HTTP 401). Upgrade to a paid tier to keep broadcasting. |
| `403` | `tier_insufficient` | The key's tier is below what the method requires. `eth_sendRawTransaction` is available from the Free trial up, so this appears only if the key's scopes are restricted. Carries `data.required_tier` / `data.upgrade_url`. |
| `429` | `rate_limited` | Sustained sends exceeded your tier's `polygon_send_tx` rps (HTTP 429). Honour `Retry-After` / `error.data.retry_after_sec`. Limits are low here: 3 rps free, 5 basic, 30 pro, 80 business. |
| `401` | `subscription_expired` | A previously active paid subscription has lapsed; renew to restore access. |
| `401` | `unauthorized` | Missing, invalid, or revoked API key. |
| HTTP `403` | `method_unknown` | The method name is misspelled or not part of the Polygon product. Carries `data.chain` and `data.method`. |

### rate_limited (HTTP `429`)

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your free plan allows 3 requests/s for polygon_send_tx. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "free",
  "category": "polygon_send_tx",
  "limit_rps": 3,
  "burst_capacity": 6,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

`burst_capacity` is always `2 × limit_rps`. The response also carries
`Retry-After` and `X-RateLimit-*` headers — see
[Errors](../../errors.md#response-headers). Rate limiting is enforced
per-second per tier with burst headroom; there is no daily quota.

## Examples

### JavaScript (fetch)

```js
const signedTx = "0xf86c098504a817c8..."; // signed for chainId 0x89, produced by your signer

const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
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
if (body.error) {
  if (body.error === "rate_limited") {
    const wait = Number(res.headers.get("Retry-After") ?? body.error.data.retry_after_sec);
    await new Promise((r) => setTimeout(r, wait * 1000)); // then retry
  } else if (/already known/i.test(body.error.message)) {
    console.log("already broadcast — safe to ignore");
  } else {
    throw new Error(body.error.message); // e.g. invalid sender, nonce too low
  }
} else {
  console.log("tx hash:", body.result);
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { Triport, RateLimitedError } from "@triport/sdk";
import { Wallet, Transaction } from "ethers";

const triport = new Triport({ apiKey: process.env.TRIPORT_API_KEY! });

// Sign locally for Polygon (chainId 137 / 0x89)
const wallet = new Wallet(process.env.PRIVATE_KEY!);
const signedTx = await wallet.signTransaction({
  chainId: 137,
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f06b8b",
  value: 10n ** 18n,
  nonce: 9,
  gasLimit: 21000,
  gasPrice: 20_000_000_000n,
});

try {
  const txHash = await triport.polygon.rpc("eth_sendRawTransaction", [signedTx]);
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
  mempool*, not *mined*. Poll for the transaction receipt until one appears, then
  check its `status` field. Polygon's ~2-second block time means confirmation is
  usually quick, but reorgs near the chain head are possible — wait for a few
  confirmations before treating a transfer as final.
* **Sign for chain ID `0x89`.** Building and signing for the wrong chain ID is
  the most common cause of `-32000 invalid sender`. Set `chainId: 137` in your
  signer.
* **Idempotent re-broadcast.** Re-submitting the same signed transaction usually
  yields the same hash; some nodes return an `already known` execution error
  (`-32000`) instead, which is harmless.
* **Public mempool exposure.** Transactions broadcast here enter the public
  pending pool and are visible to other participants before inclusion, which
  exposes them to front-running. For latency-sensitive or MEV-sensitive sends,
  account for this when setting gas and slippage.
* **Low send budget.** The `polygon_send_tx` category caps sends well below read
  methods (3 rps free). For sustained high-throughput sending, upgrade to a tier
  with a higher `polygon_send_tx` rps limit.
* **Related:** simulate a call first with [`eth_call`](./eth_call.md), size gas
  with [`eth_estimateGas`](./eth_estimateGas.md), read fee data with
  [`eth_gasPrice`](./eth_gasPrice.md) / [`eth_feeHistory`](./eth_feeHistory.md).
  See also [Errors](../../errors.md) ·
  [Rate limits](../../rate-limits-and-tiers.md) ·
  [Authentication](../../authentication.md).
