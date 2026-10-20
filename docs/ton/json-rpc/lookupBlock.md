> Live version: https://triport.io/docs/ton/json-rpc/lookupBlock

# lookupBlock

> Resolves one TON block by sequence number, logical time, or Unix time.

| | |
|---|---|
| **Method / Endpoint** | `lookupBlock` at `POST /rpc/ton` |
| **Type** | TON block-index lookup over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`lookupBlock` finds a block within a specified workchain and shard. Select the
target by exactly one of block sequence number, logical time, or Unix time. The
result is the complete cryptographic block ID.

Use it when a caller has a position or time but still needs `root_hash` and
`file_hash` before calling `getBlock` or `getBlockHeader`. It differs from
`getMasterchainInfo`, which returns only the current masterchain reference.

Historical resolution follows the selected liteserver's retention window. A
missing old block is surfaced as a retention boundary rather than a fabricated
empty result.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `workchain` | integer | yes | Signed 32-bit workchain ID. |
| `shard` | string | yes | Signed 64-bit shard ID encoded as decimal text. |
| `seqno` | integer | conditional | Non-negative block sequence number selector. |
| `lt` | string | conditional | Unsigned logical-time selector encoded as decimal text. |
| `unixtime` | integer | conditional | Non-negative Unix-time selector. |

Provide exactly one of `seqno`, `lt`, or `unixtime`.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "lookupBlock",
    "params": {
      "seqno": 90094747,
      "shard": "-9223372036854775808",
      "workchain": -1
    }
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "file_hash": "ljhAYAuYhdHFu7Y6elswSJIWyA7TT2pQqJFeLxsP0CM=",
    "root_hash": "DUslab1h6OJAIomy3egBOoh+oIKdIsHrOwCAQPMYiyU=",
    "seqno": 90094747,
    "shard": "-9223372036854775808",
    "workchain": -1
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Full cryptographic block ID. |
| `result.workchain` | integer | Workchain ID. |
| `result.shard` | string | Signed shard ID as decimal text. |
| `result.seqno` | integer | Resolved block sequence number. |
| `result.root_hash` | string | Resolved block root hash. |
| `result.file_hash` | string | Resolved serialized-block file hash. |

The response is copied from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/lookupBlock.json).

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Coordinates are malformed, or zero or multiple selectors are supplied. |
| `beyond_retention` | Block unavailable | The selected liteserver does not retain the requested historical block. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "lookup",
    method: "lookupBlock",
    params: { workchain: -1, shard: "-9223372036854775808", seqno: 90094747 },
  }),
});
const { result: blockId } = await response.json();
```

## Notes

- Selector exclusivity is part of the method contract: send exactly one of
  `seqno`, `lt`, and `unixtime`.
- Named params and batch response correlation by `id` are required.
- No REST gateway or WebSocket block subscription is published for TON.
- Related methods: [`getBlock`](./getBlock.md),
  [`getBlockHeader`](./getBlockHeader.md), and
  [`getMasterchainInfo`](./getMasterchainInfo.md).
