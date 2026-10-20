> Live version: https://triport.io/docs/sol/json-rpc/getBalance

# getBalance

> Returns the lamport balance of the account of the provided Solana public key.

| | |
|---|---|
| **Method / Endpoint** | `getBalance` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBalance` returns the balance, in **lamports**, of the account identified by
a base-58 public key. One lamport is `0.000000001` SOL (1 SOL = 1,000,000,000
lamports), so divide the returned `value` by `1e9` to display a SOL amount.

The balance is reported relative to a particular slot, returned in the
`context` object. Use the optional `commitment` config to control how finalized
that slot must be, and `minContextSlot` to require that the node has reached at
least a given slot before serving the request.

This is the canonical way to read a wallet or program-owned account's native
SOL balance. To read SPL token balances instead, use the token-account methods
rather than `getBalance`.

## Parameters

JSON-RPC `params` is a positional array: `[pubkey, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `pubkey` | string (base-58) | yes | The account public key to query. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
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
    "method": "getBalance",
    "params": ["So11111111111111111111111111111111111111112"]
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
    "value": 10000000000
  }
}
```

The example above queries the Wrapped-SOL mint and returns `10000000000`
lamports (10 SOL).

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `RpcResponseU64` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the balance was read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | integer | The account balance in lamports. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `pubkey` is missing, not a valid base-58 string, or `config` is malformed. |
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
    method: "getBalance",
    params: ["So11111111111111111111111111111111111111112"],
  }),
});

const { result } = await res.json();
console.log(`Balance: ${result.value / 1e9} SOL (slot ${result.context.slot})`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.getBalance(
  "So11111111111111111111111111111111111111112",
  { commitment: "finalized" }
);

console.log(`Balance: ${value / 1e9} SOL (slot ${context.slot})`);
```

## Notes

- **Lamports, not SOL:** `value` is always an integer count of lamports.
  Divide by `1e9` for a SOL figure.
- **Non-existent accounts:** an account that has never been funded returns
  `value: 0`.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** use `getMultipleAccounts` / `getAccountInfo` to read full
  account data alongside the balance, and `getSlot` to inspect the current slot
  the cluster has reached.
- **Two calls disagree?** See
  [why Solana RPC results differ between calls](https://triport.io/learn/solana-rpc-inconsistent-results)
  for commitment levels, `context.slot` and `minContextSlot`, and the
  [commitment level](https://triport.io/learn/glossary/commitment-level) glossary entry.
