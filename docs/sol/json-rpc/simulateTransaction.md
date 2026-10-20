> Live version: https://triport.io/docs/sol/json-rpc/simulateTransaction

# simulateTransaction

> Simulates sending a Solana transaction without submitting it to the cluster, returning the would-be execution result, logs, and compute usage.

| | |
|---|---|
| **Method / Endpoint** | `simulateTransaction` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_sim_bundle` |
| **Tier / rate limit** | pro+ — 5 / 15 RPS sustained · short burst 10 / 30 (pro / business). No free or basic access.; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`simulateTransaction` runs a transaction against the current bank state and
returns the result it *would* produce if submitted, without ever broadcasting
it. Use it to pre-flight a transaction: confirm it would succeed, read the
program logs it would emit, measure the compute units it would consume, and
inspect the post-execution state of selected accounts.

This is the right call before `sendTransaction` when you want to surface errors
to the user, estimate a compute-unit budget, or decode a program's return data
without paying fees. Because simulation reflects live bank state, the result is
advisory — a transaction that simulates cleanly can still fail on submission if
state changes in the interim.

By default the transaction's recent blockhash must be valid for simulation to
succeed. Set `replaceRecentBlockhash: true` to have the node substitute the most
recent blockhash before simulating, which lets you simulate a transaction whose
own blockhash has already expired.

> **Tier note:** this method belongs to the `sol_sim_bundle` category and is
> available on **pro and business tiers only**. Free- and basic-tier keys are
> rejected with HTTP `403` `tier_insufficient` (plus an `X-Required-Tier`
> header) before the request reaches the RPC layer — see [Errors](./simulateTransaction.md#errors).

## Parameters

JSON-RPC `params` is a positional array: `[transaction, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `transaction` | string | yes | The transaction, as an encoded string. The encoding must match the `encoding` field of `config`. |
| `config` | object | no | Optional simulation configuration (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `sigVerify` | boolean | no | If `true`, verify the transaction signatures. Mutually exclusive with `replaceRecentBlockhash`. |
| `commitment` | string | no | Commitment level used to evaluate state: `processed`, `confirmed`, or `finalized`. |
| `encoding` | string | no | Encoding of the `transaction` string: `base58` or `base64`. `base64` is recommended. |
| `replaceRecentBlockhash` | boolean | no | If `true`, replace the transaction's recent blockhash with the most recent blockhash before simulating. Mutually exclusive with `sigVerify`. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |
| `innerInstructions` | boolean | no | If `true`, include inner instructions in the response. |
| `accounts` | object | no | Accounts to return post-simulation state for (see below). |

### `config.accounts` object

| Field | Type | Required | Description |
|---|---|---|---|
| `addresses` | string[] | no | Base-58 public keys of the accounts whose state to return after simulation. |
| `encoding` | string | no | Encoding for the returned account data: `base58`, `base64`, `base64+zstd`, or `jsonParsed`. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "simulateTransaction",
    "params": [
      "AVXo5X7UMtwHFeqHfwopBLrCftbS5UfPiDoXNi8gO1rIWlGEC5rRkxStBy3lhqQYQv7vyP+TpMa0jbkjMy0+EgmAAQABAvWdwBfDLBYBh4SaUH8oWeJ/qaJOAcUOiKqGJK8WkRRtoMUNALPP4tVe6oPN9rTpDFC2C3+Vw5ihU3rUW8XF3sUBAAEC",
      {
        "encoding": "base64",
        "replaceRecentBlockhash": true,
        "commitment": "processed"
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
    "context": {
      "slot": 348392041,
      "apiVersion": "2.0.18"
    },
    "value": {
      "err": null,
      "logs": [
        "Program 11111111111111111111111111111111 invoke [1]",
        "Program 11111111111111111111111111111111 success"
      ],
      "accounts": null,
      "unitsConsumed": 150,
      "returnData": null,
      "innerInstructions": []
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `SimulateTransactionResponse` envelope. |
| `result.context` | object | The context the simulation was evaluated against. |
| `result.context.slot` | integer | The slot at which the transaction was simulated. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | object | The simulation result. |
| `result.value.err` | object \| null | `null` if the transaction would succeed; otherwise the error that caused it to fail. |
| `result.value.logs` | string[] | Program log messages emitted during simulation. |
| `result.value.accounts` | array \| null | Post-simulation account states, one per address in `config.accounts.addresses` (in order), or `null` if `accounts` was not requested. |
| `result.value.unitsConsumed` | integer | The number of compute units consumed by the transaction. |
| `result.value.returnData` | object \| null | The most recent return data generated by an instruction, if any. |
| `result.value.returnData.programId` | string (base-58) | The program that generated the return data. |
| `result.value.returnData.data` | array | The return data, as `[data, encoding]`. |
| `result.value.innerInstructions` | array | Inner instructions, present only when `innerInstructions: true` was set. |

Each entry in `result.value.accounts` is an `AccountInfo` object with
`data`, `executable`, `lamports`, `owner`, `rentEpoch`, and `space` fields.

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `transaction` is missing, the encoding does not match `config.encoding`, or `config` is malformed (e.g. both `sigVerify` and `replaceRecentBlockhash` set). |
| `403` | Tier insufficient | Your key's tier is below `pro`: `simulateTransaction` requires pro+ for the `sol_sim_bundle` category. An HTTP error with a plain JSON body — there is no JSON-RPC envelope: `{"error":"tier_insufficient", …}` with `current_tier`, `required_tier`, `method`, `category` and `upgrade_url`, plus an `X-Required-Tier` header. |
| `429` | Rate limited | More than your tier's RPS for `sol_sim_bundle` (5 pro / 15 business). Body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`; honour `Retry-After` (and `X-RateLimit-Reset`). |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |

A failing simulation (e.g. an instruction error) is **not** a JSON-RPC error:
the request returns `200` with `result.value.err` populated and the relevant
`logs`.

## Examples

### JavaScript (fetch)
```js
const tx = "AVXo5X7UMtwHFeqHfwopBLrCftbS5UfPiDoXNi8gO1r..."; // base64-encoded tx

const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "simulateTransaction",
    params: [tx, { encoding: "base64", replaceRecentBlockhash: true }],
  }),
});

const { result } = await res.json();
if (result.value.err) {
  console.error("Simulation failed:", result.value.err, result.value.logs);
} else {
  console.log(`OK — ${result.value.unitsConsumed} compute units consumed`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { value } = await client.solana.simulateTransaction(tx, {
  encoding: "base64",
  replaceRecentBlockhash: true,
  commitment: "processed",
});

if (value.err) {
  throw new Error(`Simulation failed: ${JSON.stringify(value.err)}`);
}
console.log(`Compute units: ${value.unitsConsumed}`);
```

## Notes

- **`sigVerify` vs `replaceRecentBlockhash`:** these are mutually exclusive. Set
  `sigVerify: true` only when you have a fully signed transaction and want the
  signatures checked; use `replaceRecentBlockhash: true` to simulate an unsigned
  or stale-blockhash transaction.
- **Compute budgeting:** read `value.unitsConsumed` to size a
  `ComputeBudget` instruction before submitting the real transaction with
  [`sendTransaction`](./sendTransaction.md).
- **Reading account state:** pass `config.accounts.addresses` to get the
  post-execution `AccountInfo` for specific accounts — useful for verifying the
  effect of a transaction before broadcasting it.
- **Advisory result:** a clean simulation does not guarantee on-chain success;
  state can change between simulation and submission.
- **Related methods:** [`sendTransaction`](./sendTransaction.md) to submit,
  [`getFeeForMessage`](./getFeeForMessage.md) to price a message, and the
  bundle simulation methods for multi-transaction pre-flight.
