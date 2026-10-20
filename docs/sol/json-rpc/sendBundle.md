> Live version: https://triport.io/docs/sol/json-rpc/sendBundle

# sendBundle

> Submits an ordered MEV bundle — a list of Solana transactions — to be landed
> atomically, all-or-nothing, in a single block.

> **Scaffold method.** `sendBundle` is published as a scaffold in the current
> spec. Its full parameter and result schemas are **deferred to spec
> `api.2.2`/`2.3`/`2.4`** and are not yet final. The method name, tier, and rate
> limits below are stable; the request/response **shapes shown here are the
> intended contract and may change** before the wire schema is frozen. Pin your
> integration to a published schema version once one is available.

> **Pro tier or higher required.** This method lives in the `sol_send_bundle`
> category. There is **no free or basic access** — calls on a free or basic key
> are rejected with a tier-insufficient error (see [Errors](./sendBundle.md#errors)).

| | |
|---|---|
| **Method / Endpoint** | `sendBundle` (JSON-RPC) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_send_bundle` |
| **Tier / rate limit** | pro+ — 10 / 30 RPS sustained · short burst 20 / 60 (pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`sendBundle` submits an **ordered bundle** of fully-signed Solana transactions
to be executed back-to-back, atomically, within a single block. Either every
transaction in the bundle lands in the given order, or none of them do — there
is no partial execution. This is the submission counterpart to
[`simulateBundle`](./simulateBundle.md), which dry-runs the same bundle without
broadcasting it.

Because the bundle lands atomically and in order, later transactions can safely
depend on the state changes produced by earlier ones (for example, a swap that
funds a later repay). Use it for MEV / atomic-arbitrage strategies and any
sequence of dependent transactions that must not be interleaved with other
traffic.

This is a **pro-tier-only** method, rate-limited separately under the
`sol_send_bundle` category at 10 RPS (pro) / 30 RPS (business), with burst
headroom of twice the sustained limit. Always
[`simulateBundle`](./simulateBundle.md) first: a bundle that would revert is
rejected at submission, and you still consume your send budget.

## Parameters

JSON-RPC `params` is a positional array whose **first element is the
transaction array itself**: `[[tx1, tx2, ...], config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `params[0]` | string[] | yes | Ordered list of fully-signed, **base64-encoded** transactions. Landed in array order, atomically. |
| `params[1]` | object | no | Optional submission config, e.g. `{ "encoding": "base64" }`. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "sendBundle",
    "params": [
      [
        "AfB5q3...base64-tx-1...AA==",
        "Ac91kd...base64-tx-2...AA=="
      ],
      { "encoding": "base64" }
    ]
  }'
```

## Response

> The result is an **open object**; additional fields may appear.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "bundleId": "b1f3c4a29e7d4b8e9c0a5f6d7e8b1c2d3a4f5e6b7c8d9e0a1b2c3d4e5f6a7b8c",
    "signatures": [
      "4eEzpJ29YBE7iz6Lw5eVNqYpJEMRDM6kF1pPyDmwbDgTynxJgF6Th9oV66XSh1jKvxhqZpKjJqLBu7nGzrjnVqWv",
      "5kQ8w3RdB2pYxV7mLn1cH9fZtA6sJ4eU0oN2bM3iD8gXrYpQ7vK1aT5wE9hC2sLu4nB6mF3jR8dP0xS1yG7qW2z"
    ]
  }
}
```

### Response fields

> Provisional — fields may be added or renamed before the schema is frozen.

| Field | Type | Description |
|---|---|---|
| `result` | object | Open response envelope (`additionalProperties` allowed). |
| `result.bundleId` | string | Opaque identifier for the accepted bundle. Use it to track landing status. |
| `result.signatures` | string[] | Per-transaction signatures, base-58 encoded, in bundle order. |

A response confirms that the bundle was **accepted for inclusion**, not that it
has landed. Poll `getSignatureStatuses` or fetch a
transaction with [`getTransaction`](./getTransaction.md) to confirm the bundle
landed on-chain.

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `params[0]` is missing/empty (`"bundle has no transactions"`), not an array, or a transaction is not decodable under the chosen `encoding`. |
| `403` | Tier insufficient | The key's tier is below `pro`. An HTTP error with a plain JSON body — there is no JSON-RPC envelope: `{"error":"tier_insufficient", …}` with `current_tier`, `required_tier`, `method`, `category` (`sol_send_bundle`) and `upgrade_url`, plus an `X-Required-Tier` header. |
| `429` | Rate limited | More than your tier's sustained RPS on `sol_send_bundle` (10 pro / 30 business). Body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` (and `X-RateLimit-Reset`). |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |

A tier-insufficient response is an HTTP `403` with a plain body — there is no JSON-RPC envelope:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'sendBundle' requires pro tier or higher",
  "current_tier": "free",
  "required_tier": "pro",
  "method": "sendBundle",
  "category": "sol_send_bundle",
  "upgrade_url": "https://triport.io/upgrade/pro"
}
```

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
    method: "sendBundle",
    params: [
      [base64Tx1, base64Tx2],
      { encoding: "base64" },
    ],
  }),
});

const { result, error } = await res.json();
if (error) throw new Error(`${error.code}: ${error.message}`);

console.log("bundle accepted:", result.bundleId);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

// sendBundle requires a pro-tier (or higher) API key.
const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { bundleId, signatures } = await client.solana.sendBundle(
  [base64Tx1, base64Tx2],
  { encoding: "base64" }
);

console.log("submitted bundle:", bundleId, signatures);
```

## Notes

- **Encoding:** transactions are **base64**-encoded strings passed directly as
  the `params[0]` array. The result envelope is open — new fields may be added.
- **Pro tier only:** `sol_send_bundle` has no free or basic access — see
  [rate limits and tiers](../../rate-limits-and-tiers.md).
- **Atomic and ordered:** the whole bundle lands together in array order or not
  at all — there is no partial inclusion.
- **Simulate first:** dry-run with [`simulateBundle`](./simulateBundle.md) before
  submitting; it shares the bundle model and catches reverts without spending
  your send budget.
- **Acceptance ≠ landing:** a successful response means the bundle was accepted,
  not confirmed. Poll `getSignatureStatuses` or
  [`getTransaction`](./getTransaction.md) to verify it landed.
- **Single transactions:** to broadcast one transaction at a time, use
  [`sendTransaction`](./sendTransaction.md) instead.
