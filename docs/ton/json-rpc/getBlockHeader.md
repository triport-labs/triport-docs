> Live version: https://triport.io/docs/ton/json-rpc/getBlockHeader

# getBlockHeader

> Returns block metadata and proof material without fetching the block body.

| | |
|---|---|
| **Method / Endpoint** | `getBlockHeader` at `POST /rpc/ton` |
| **Type** | TON block-header read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlockHeader` reads metadata and proof material for a specific block. The
block is addressed by workchain, shard, and sequence number, with optional root
and file hashes when the caller already has a full cryptographic block ID.

Use this method to verify or inspect a block reference without transferring the
serialized body returned by `getBlock`. If only a partial position or time is
known, resolve the full ID with `lookupBlock` first.

Like other historical block reads, this call is limited by the selected
liteserver's measured retention window. An old block that is outside that
window produces a retention error rather than an empty object.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `workchain` | integer | yes | Signed 32-bit workchain ID. |
| `shard` | string | yes | Signed 64-bit shard ID encoded as decimal text. |
| `seqno` | integer | yes | Non-negative block sequence number. |
| `root_hash` | string | no | Optional root hash accepted as base64, base64url, or hexadecimal text. |
| `file_hash` | string | no | Optional file hash accepted as base64, base64url, or hexadecimal text. |

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlockHeader",
    "params": {
      "file_hash": "f4s603388wwG3M7/vozPM0+udP9hT8Mfve2o/Q7/NsI=",
      "root_hash": "U8NZycgekJt9e0jZWlsjf1vuKKZbbZYEe3zkVh19a8w=",
      "seqno": 90110366,
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
    "id": {
      "file_hash": "f4s603388wwG3M7/vozPM0+udP9hT8Mfve2o/Q7/NsI=",
      "root_hash": "U8NZycgekJt9e0jZWlsjf1vuKKZbbZYEe3zkVh19a8w=",
      "seqno": 90110366,
      "shard": "-9223372036854775808",
      "workchain": -1
    },
    "proof": "te6ccgEBAQEAAgAAAA=="
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Header and proof result. |
| `result.id` | object | Full block ID. |
| `result.id.workchain` | integer | Workchain ID. |
| `result.id.shard` | string | Signed shard ID as decimal text. |
| `result.id.seqno` | integer | Block sequence number. |
| `result.id.root_hash` | string | Block root hash. |
| `result.id.file_hash` | string | Serialized block file hash. |
| `result.proof` | string | Proof material returned by the liteserver. |

The JSON is copied from the [accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getBlockHeader.json).
The fixture sanitizer replaces proof bytes, so the displayed `proof` value is
evidence of the response shape only.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | Required coordinates are missing, a coordinate is malformed, or `params` is positional. |
| `beyond_retention` | Header unavailable | The requested block falls below the selected liteserver's retained window. |
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
    id: "header",
    method: "getBlockHeader",
    params: { workchain: -1, shard: "-9223372036854775808", seqno: 90110366 },
  }),
});
const { result } = await response.json();
```

## Notes

- The response may contain implementation-defined metadata in addition to the
  schema's required `id` field.
- TON has no published REST gateway or WebSocket header subscription here.
- Related methods: [`getBlock`](./getBlock.md),
  [`lookupBlock`](./lookupBlock.md), and [`getMasterchainInfo`](./getMasterchainInfo.md).
