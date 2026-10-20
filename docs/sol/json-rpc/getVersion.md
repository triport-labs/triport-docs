> Live version: https://triport.io/docs/sol/json-rpc/getVersion

# getVersion

> Returns the version of the Solana software running on the node serving your request.

| | |
|---|---|
| **Method / Endpoint** | `getVersion` (JSON-RPC, `POST /` Solana endpoint) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — 20 rps (free) · 60 rps (basic) · 200 rps (pro) · 600 rps (business) |

## Description

`getVersion` reports the Solana software running on the node that handled your
request. It takes no parameters and returns a small object with two fields: the
human-readable `solana-core` release string and the numeric `feature-set`
identifier that the node currently advertises.

Use it to confirm which cluster build is behind your endpoint — for example, to
verify that a feature you depend on has shipped, or to log the node version
alongside diagnostics when a response looks unexpected. Because it is cheap and
parameter-free, it also doubles as a lightweight check that your endpoint and
API key are wired up correctly.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. `params` must be `[]`. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getVersion",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "solana-core": "1.18.22",
    "feature-set": 3469865029
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | The `Version` object. |
| `result.solana-core` | string | The Solana core release running on the node (e.g. `1.18.22`). |
| `result.feature-set` | integer (`u32`) | Identifier of the runtime feature set the node currently advertises. |

## Errors

`getVersion` uses the standard JSON-RPC error envelope. See [errors](../../errors.md)
for the full structure.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` token. |
| `429` | Rate limited | You exceeded your tier's RPS for `sol_read_rpc`. |

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
    method: "getVersion",
    params: [],
  }),
});

const { result } = await res.json();
console.log("solana-core:", result["solana-core"]); // 1.18.22
console.log("feature-set:", result["feature-set"]); // 3469865029
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const version = await client.solana.getVersion();
console.log("solana-core:", version["solana-core"]);
console.log("feature-set:", version["feature-set"]);
```

## Notes

- **Parameter-free.** `getVersion` carries no params and returns a small fixed
  object, so — like [`getSlot`](./getSlot.md) and [`getHealth`](./getHealth.md) —
  it is a convenient connectivity and key-validity probe.
- **`feature-set` vs `solana-core`.** The version string tracks the release; the
  `feature-set` integer tracks which runtime features are active. Use
  `feature-set` when you must know exactly which features a node has enabled.
- **Per-node value.** The version reflects the specific backend that served your
  request; behind a load-balanced endpoint, successive calls can be served by
  nodes on slightly different builds during a cluster upgrade.
- **Related methods:** [`getHealth`](./getHealth.md),
  [`getIdentity`](./getIdentity.md), and [`getGenesisHash`](./getGenesisHash.md)
  for other node/cluster-identity reads.
