> Live version: https://triport.io/docs/sol/json-rpc/getSupply

# getSupply

> Returns information about the current supply of SOL, broken down into circulating and non-circulating lamports.

| | |
|---|---|
| **Method / Endpoint** | `getSupply` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getSupply` reports the total supply of SOL on the cluster, split into the
**circulating** and **non-circulating** portions. All amounts are returned in
**lamports** (1 SOL = 1,000,000,000 lamports), so divide each figure by `1e9`
to display a SOL amount.

The supply is reported relative to a particular slot, returned in the `context`
object. Use the optional `commitment` config to control how finalized that slot
must be.

By default the response also includes `nonCirculatingAccounts` — the list of
account public keys whose balances make up the non-circulating supply. This list
can be large; set `excludeNonCirculatingAccountsList: true` to suppress it and
return an empty array, which keeps the response small when you only need the
aggregate totals.

## Parameters

JSON-RPC `params` is a positional array with a single optional element:
`[config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `excludeNonCirculatingAccountsList` | boolean | no | When `true`, omit the `nonCirculatingAccounts` list from the response (returned as an empty array). |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSupply",
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
      "circulating": 433925421890975690,
      "nonCirculating": 152021830384390,
      "nonCirculatingAccounts": [
        "9huDUZfxoJ7wGMTffUE7vh1xePqef7gyrLJu9NApncqA",
        "3epydUMfkrmGCdfd5feoVwsZxbMV1uCkRJj5skYRpFKE"
      ],
      "total": 434077443721360080
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | `SupplyResponse` envelope. |
| `result.context` | object | The context the response was evaluated against. |
| `result.context.slot` | integer | The slot at which the supply was read. |
| `result.context.apiVersion` | string | The node software version that served the request. |
| `result.value` | object | The supply breakdown. |
| `result.value.circulating` | integer | Circulating supply, in lamports. |
| `result.value.nonCirculating` | integer | Non-circulating supply, in lamports. |
| `result.value.nonCirculatingAccounts` | array of string | Public keys of the non-circulating accounts. Empty when `excludeNonCirculatingAccountsList` is `true`. |
| `result.value.total` | integer | Total supply, in lamports (`circulating + nonCirculating`). |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `config` is malformed (e.g. `commitment` is not a known level). |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). An HTTP error, not a JSON-RPC one: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |

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
    method: "getSupply",
    params: [{ commitment: "finalized", excludeNonCirculatingAccountsList: true }],
  }),
});

const { result } = await res.json();
console.log(`Total supply: ${result.value.total / 1e9} SOL`);
console.log(`Circulating: ${result.value.circulating / 1e9} SOL`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const { context, value } = await client.solana.getSupply({
  commitment: "finalized",
  excludeNonCirculatingAccountsList: true,
});

console.log(`Total supply: ${value.total / 1e9} SOL (slot ${context.slot})`);
```

## Notes

- **Lamports, not SOL:** every amount (`circulating`, `nonCirculating`,
  `total`) is an integer count of lamports. Divide by `1e9` for a SOL figure.
- **Trim large payloads:** the `nonCirculatingAccounts` list can contain many
  entries. Pass `excludeNonCirculatingAccountsList: true` when you only need the
  aggregate totals — the field is then returned as an empty array.
- **Commitment defaults:** when `commitment` is omitted, the node's default
  commitment applies. Pass `finalized` for the strongest consistency guarantee.
- **Related methods:** use [`getBalance`](./getBalance.md) to read a single
  account's lamport balance, and [`getEpochInfo`](./getEpochInfo.md) /
  [`getInflationRate`](./getInflationRate.md) for epoch- and inflation-level
  context around supply changes.
