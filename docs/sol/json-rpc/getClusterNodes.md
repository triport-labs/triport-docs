> Live version: https://triport.io/docs/sol/json-rpc/getClusterNodes

# getClusterNodes

> Returns information about all the nodes participating in the Solana cluster.

| | |
|---|---|
| **Method / Endpoint** | `getClusterNodes` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getClusterNodes` returns an array describing every node the queried validator
is currently aware of in the gossip network. Each entry exposes the node's
identity public key and the network addresses it advertises for gossip, RPC,
and transaction-processing (TPU) traffic, along with its software version and
feature/shred versions.

Use this method to discover the topology of the cluster — for example, to find
RPC endpoints, to map validator identities to their advertised addresses, or to
audit which software versions are active across the network.

Contact-info fields are populated from what each node chooses to advertise over
gossip. A node that has not shared a particular endpoint (or whose RPC is not
publicly exposed) will report `null` for that field, so consumers must treat
every address field as optional.

## Parameters

This method takes no parameters. JSON-RPC `params` is an empty array (`[]`).

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getClusterNodes",
    "params": []
  }'
```

## Response

### Response fields

`result` is an array of `ClusterNode` objects.

| Field | Type | Description |
|---|---|---|
| `pubkey` | string (base-58) | Node identity public key. |
| `gossip` | string \| null | Gossip network address (`host:port`), or `null` if not advertised. |
| `rpc` | string \| null | JSON-RPC address (`host:port`), or `null` if the node does not expose RPC. |
| `tpu` | string \| null | Transaction-processing unit (TPU) address (`host:port`), or `null` if not advertised. |
| `version` | string \| null | Software version of the node, or `null` if version info is unavailable. |
| `featureSet` | integer \| null | Unique identifier of the node's feature set, or `null` if unavailable. |
| `shredVersion` | integer \| null | Shred version the node has been configured to use. |

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
    method: "getClusterNodes",
    params: [],
  }),
});

const { result } = await res.json();
const rpcNodes = result.filter((node) => node.rpc !== null);
console.log(`${result.length} nodes total, ${rpcNodes.length} expose RPC`);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const nodes = await client.solana.getClusterNodes();

for (const node of nodes) {
  console.log(`${node.pubkey} — ${node.rpc ?? "no RPC"} (v${node.version ?? "?"})`);
}
```

## Notes

- **Null contact info:** any of `gossip`, `rpc`, `tpu`, `version`, and
  `featureSet` may be `null` when a node has not advertised that detail over
  gossip. Always guard against `null` before using an address.
- **RPC discovery:** filter the array on `rpc !== null` to find nodes that
  expose a JSON-RPC endpoint.
- **Network identity:** `shredVersion` and `featureSet` together indicate which
  fork/feature configuration a node is running — useful for spotting nodes that
  are out of sync with the rest of the cluster.
- **Related methods:** pair with [`getSlot`](./getSlot.md) and
  [`getBlockProduction`](./getBlockProduction.md) to correlate node topology
  with cluster progress.
