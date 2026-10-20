> Live version: https://triport.io/docs/sol/json-rpc/simulateBundle

# simulateBundle

> Dry-runs an MEV bundle — an ordered list of Solana transactions — against the
> current chain state without broadcasting any of them.

> **Request shape.** `simulateBundle` takes a single bundle object whose
> transactions go in an **`encodedTransactions`** array (base64). The result
> envelope (`context` / `value`) is an open object — treat any per-transaction
> fields beyond those listed below as additive.

> **Pro tier or higher required.** This method lives in the `sol_sim_bundle`
> category. There is **no free or basic access** — calls on a free or basic key
> are rejected with a tier-insufficient error (see [Errors](./simulateBundle.md#errors)).

| | |
|---|---|
| **Method / Endpoint** | `simulateBundle` (JSON-RPC) |
| **Type** | Triport extension |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_sim_bundle` |
| **Tier / rate limit** | pro+ — 5 / 15 RPS sustained · short burst 10 / 30 (pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`simulateBundle` simulates the execution of an **ordered bundle** of Solana
transactions exactly as they would run if landed back-to-back in a single block,
and returns the per-transaction outcome — without submitting anything to the
network. Use it to validate an MEV / atomic-arbitrage bundle (or any sequence of
dependent transactions) before paying to send it with the bundle-submission
methods.

Because the transactions are simulated **in order against the same working
state**, later transactions in the bundle observe the account changes produced
by earlier ones. This is the key difference from calling `simulateTransaction`
on each transaction independently: a bundle that only succeeds atomically (for
example, a swap that funds a later repay) can be validated as a whole.

This is a **pro-tier-only** method. It is rate-limited under the
`sol_sim_bundle` category at 5 RPS (pro) / 15 RPS (business), with burst
headroom of twice the sustained limit.

## Parameters

JSON-RPC `params` is a positional array with a single bundle object:
`[{ "encodedTransactions": [...] }]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `params[0]` | object | yes | The bundle to simulate (see below). |

### bundle object (`params[0]`)

| Field | Type | Required | Description |
|---|---|---|---|
| `encodedTransactions` | string[] | yes | Ordered list of fully-signed, **base64-encoded** transactions. Simulated in array order against a shared working state, so a later transaction observes the account changes of earlier ones. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "simulateBundle",
    "params": [
      {
        "encodedTransactions": [
          "AfB5q3...base64-tx-1...AA==",
          "Ac91kd...base64-tx-2...AA=="
        ]
      }
    ]
  }'
```

## Response

> The result is an **open object** (`context` / `value`); additional
> per-transaction fields may appear beyond those documented below.

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
      "summary": "succeeded",
      "transactionResults": [
        {
          "err": null,
          "logs": [
            "Program 11111111111111111111111111111111 invoke [1]",
            "Program 11111111111111111111111111111111 success"
          ],
          "unitsConsumed": 450
        },
        {
          "err": null,
          "logs": [
            "Program 11111111111111111111111111111111 invoke [1]",
            "Program 11111111111111111111111111111111 success"
          ],
          "unitsConsumed": 1200
        }
      ]
    }
  }
}
```

### Response fields

> Provisional — fields may be added or renamed before the schema is frozen.

| Field | Type | Description |
|---|---|---|
| `result` | object | Open response envelope (`additionalProperties` allowed). |
| `result.context` | object | The context the bundle was simulated against. |
| `result.context.slot` | integer | The slot at which the bundle was simulated. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | object | The simulation outcome. |
| `result.value.summary` | string \| object | Overall bundle result — succeeds only if every transaction succeeds in order. |
| `result.value.transactionResults` | object[] | Per-transaction results, in bundle order. |
| `result.value.transactionResults[].err` | object \| null | `null` if the transaction simulated successfully, otherwise the transaction error. |
| `result.value.transactionResults[].logs` | string[] | Program log output captured during simulation. |
| `result.value.transactionResults[].unitsConsumed` | integer | Compute units consumed by the transaction. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `params[0]` is missing/malformed, `encodedTransactions` is missing (`"missing field encodedTransactions"`)/empty/not an array, or a transaction is not decodable as base64. |
| `403` | Tier insufficient | The key's tier is below `pro`. An HTTP error with a plain JSON body — there is no JSON-RPC envelope: `{"error":"tier_insufficient", …}` with `current_tier`, `required_tier`, `method`, `category` (`sol_sim_bundle`) and `upgrade_url`, plus an `X-Required-Tier` header. |
| `429` | Rate limited | More than your tier's sustained RPS on `sol_sim_bundle` (5 pro / 15 business). Body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` (and `X-RateLimit-Reset`). |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |

A tier-insufficient response is an HTTP `403` with a plain body — there is no JSON-RPC envelope:

```json
{
  "error": "tier_insufficient",
  "message": "Method 'simulateBundle' requires pro tier or higher",
  "current_tier": "free",
  "required_tier": "pro",
  "method": "simulateBundle",
  "category": "sol_sim_bundle",
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
    method: "simulateBundle",
    params: [{ encodedTransactions: [base64Tx1, base64Tx2] }],
  }),
});

const { result, error } = await res.json();
if (error) throw new Error(`${error.code}: ${error.message}`);

const ok = result.value.transactionResults.every((t) => t.err === null);
console.log(ok ? "bundle simulated clean" : "bundle would revert");
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

// simulateBundle requires a pro-tier (or higher) API key.
const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { value } = await client.solana.simulateBundle(
  { encodedTransactions: [base64Tx1, base64Tx2] }
);

const ok = value.transactionResults.every((t) => t.err === null);
console.log(`bundle ${ok ? "OK" : "would fail"}`);
```

## Notes

- **Encoding:** transactions must be **base64**-encoded strings inside
  `encodedTransactions`. The result `value` envelope is open — new
  per-transaction fields may be added over time.
- **Pro tier only:** `sol_sim_bundle` has no free or basic access — see
  [rate limits and tiers](../../rate-limits-and-tiers.md).
- **Ordering matters:** transactions are simulated in array order against a
  shared state, so a later transaction sees earlier transactions' effects. This
  is what makes it suitable for validating atomic bundles.
- **Dry-run only:** `simulateBundle` never broadcasts. Once a bundle simulates
  cleanly, submit it with the Solana bundle-submission methods.
- **Related methods:** use `simulateTransaction` to dry-run a single transaction
  independently, and `sendTransaction` to broadcast one transaction at a time.
