> Live version: https://triport.io/docs/sol/json-rpc/getStakeMinimumDelegation

# getStakeMinimumDelegation

> Returns the minimum number of lamports required to delegate a Solana stake account.

| | |
|---|---|
| **Method / Endpoint** | `getStakeMinimumDelegation` (JSON-RPC, `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business), `sol_read_rpc` category; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getStakeMinimumDelegation` returns the smallest amount of stake, in lamports,
that a stake account is allowed to delegate to a validator. Delegating less than
this threshold is rejected by the runtime, so you should query it before
building a `StakeProgram.delegate` instruction and size the delegation at or
above the returned value.

The minimum is a cluster-wide parameter that changes only with a feature
activation, so the result is effectively constant on a given cluster and is safe
to cache. Use it together with the rent-exempt reserve when deciding how much to
fund a new stake account: a stake account must hold at least the rent-exempt
minimum plus the delegation minimum to be both rent-exempt and delegatable.

Unlike `getMinimumBalanceForRentExemption`, this method returns an
`RpcResponseU64` object — the lamports value lives under `value`, wrapped in the
standard `context` envelope that reports the slot the result was evaluated at.

## Parameters

JSON-RPC `params` is a positional array with a single optional element:
`[config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Commitment configuration (see below). Omit for default commitment. |

### `config` object (`CommitmentConfig`)

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot at which the request should be evaluated. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getStakeMinimumDelegation",
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
    "value": 1000000000
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `RpcResponseU64` — context envelope plus the lamports value. |
| `result.context` | object | Metadata about when the result was produced. |
| `result.context.slot` | integer | Slot at which the value was evaluated. |
| `result.context.apiVersion` | string | Node software version that served the request. |
| `result.value` | integer | Minimum lamports required to delegate a stake account. |

## Errors

Errors use the standard JSON-RPC envelope. See [errors.md](../../errors.md) for
the full envelope and the complete code table.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `config` is malformed, or `commitment` is not one of `processed` / `confirmed` / `finalized`. |
| `429` | Rate limit exceeded | More than your tier's `sol_read_rpc` RPS (20 / 60 / 200 / 600); honor `Retry-After`. A plain HTTP error rejected before the RPC layer, not a JSON-RPC envelope. |
| `-32601` | Method not found | The method name is misspelled or not recognised on this chain. |

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
    method: "getStakeMinimumDelegation",
    params: [{ commitment: "finalized" }],
  }),
});

const { result } = await res.json();
console.log(`Minimum delegation: ${result.value} lamports`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const { context, value } = await client.solana.getStakeMinimumDelegation({
  commitment: "finalized",
});

console.log(value);         // 1000000000
console.log(context.slot);  // 348392041
```

## Notes

- The lamports value is under `result.value`, not the top-level `result` — this
  differs from [getMinimumBalanceForRentExemption](./getMinimumBalanceForRentExemption.md),
  which returns a bare integer.
- The minimum delegation is a cluster-wide constant that changes only on a
  feature activation, so it is safe to cache rather than calling on every
  delegation build.
- A stake account must be funded with the rent-exempt reserve *in addition to*
  the delegation minimum. Pair this with
  [getMinimumBalanceForRentExemption](./getMinimumBalanceForRentExemption.md) to
  compute total funding, and with [getBalance](./getBalance.md) to check an
  existing stake account's lamports.
