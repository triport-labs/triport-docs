> Live version: https://triport.io/docs/ton/json-rpc/getShards

# getShards

> Returns active shardchain block IDs at a masterchain sequence number.

| | |
|---|---|
| **Method / Endpoint** | `getShards` at `POST /rpc/ton` |
| **Type** | TON shard-topology read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getShards` maps a masterchain sequence number to
`liteServer.getAllShardsInfo` and returns the active shardchain block IDs at
that point. Each item is a complete block ID with workchain, shard, sequence,
root hash, and file hash.

Use it to discover which shardchain blocks correspond to a masterchain block
before fetching their headers or bodies. It differs from `getMasterchainInfo`,
which returns only the current masterchain reference, and from `lookupBlock`,
which resolves one block in a specified workchain and shard.

The masterchain `seqno` is a JSON number. Every returned shard identifier is
rendered as signed decimal text so its 64-bit value remains exact.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `seqno` | integer | yes | Non-negative masterchain block sequence number. |

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getShards","params":{"seqno":90110366}}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "file_hash": "YrlC0dd5FVOXs4d3jtiAFFzQhIe1QZCSDK1cZCDbA3s=",
      "root_hash": "6guHhxp3rbCA1PMIts2rg+lnCD12R5uWPoTPCCihbvk=",
      "seqno": 94497309,
      "shard": "-9223372036854775808",
      "workchain": 0
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | array | Active shardchain block IDs. |
| `result[].workchain` | integer | Workchain ID. |
| `result[].shard` | string | Signed 64-bit shard ID as decimal text. |
| `result[].seqno` | integer | Shardchain block sequence number. |
| `result[].root_hash` | string | Shardchain block root hash. |
| `result[].file_hash` | string | Shardchain block file hash. |

The response is copied from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getShards.json).

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `seqno` is missing, negative, malformed, or passed positionally. |
| `beyond_retention` | Shard state unavailable | The selected liteserver does not retain state at the requested masterchain block. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "shards", method: "getShards", params: { seqno: 90110366 } }),
});
const { result: shards } = await response.json();
```

## Notes

- The input `seqno` identifies a masterchain block; item `seqno` values identify
  shardchain blocks and therefore need not equal it.
- Requests use named params and batch results are matched by `id`.
- No REST gateway or WebSocket shard subscription is published for TON.
- Related methods: [`getMasterchainInfo`](./getMasterchainInfo.md),
  [`getBlockHeader`](./getBlockHeader.md), and [`getBlock`](./getBlock.md).
