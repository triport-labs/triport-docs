> Live version: https://triport.io/docs/sol/json-rpc/getGenesisHash

# getGenesisHash

> Returns the genesis hash of the Solana cluster as a base-58 string.

| | |
|---|---|
| **Method / Endpoint** | `getGenesisHash` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getGenesisHash` returns the **genesis hash** of the cluster the request was
routed to, encoded as a base-58 string. The genesis hash is a stable, immutable
identifier baked into a cluster at creation — it never changes for the life of
that cluster.

Because each Solana cluster has a distinct genesis hash, this is the canonical
way to confirm *which* cluster your traffic is actually hitting (for example,
distinguishing mainnet from devnet or testnet) before submitting a transaction.
A common pattern is to call it once at client start-up and assert the value
against the network you expect.

The call takes no parameters and returns a single string, making it one of the
cheapest read methods available.

## Parameters

This method takes no parameters. JSON-RPC `params` must be an empty array `[]`
(or omitted).

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This method accepts no parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getGenesisHash",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d"
}
```

The value above (`5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d`) is the genesis
hash of Solana mainnet; devnet and testnet return different hashes.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string (base-58) | The cluster's genesis hash. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
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
    method: "getGenesisHash",
    params: [],
  }),
});

const { result } = await res.json();

const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";
if (result !== MAINNET_GENESIS) {
  throw new Error(`Unexpected cluster: genesis hash ${result}`);
}
console.log(`Genesis hash: ${result}`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const genesisHash = await client.solana.getGenesisHash();

console.log(`Genesis hash: ${genesisHash}`);
```

## Notes

- **Cluster fingerprint:** the genesis hash is constant per cluster, so it is
  safe to cache for the lifetime of your client. There is no need to poll it.
- **Network sanity check:** compare the returned value against the genesis hash
  of the network you intend to use to catch misconfigured endpoints before
  sending funds or transactions.
- **Related methods:** use [`getEpochSchedule`](./getEpochSchedule.md) and
  `getSlot` to inspect the cluster's current progression once you have confirmed
  the cluster identity.
