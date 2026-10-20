> Live version: https://triport.io/docs/ton/json-rpc/getBlock

# getBlock

> Returns the serialized body of a TON block identified by its full block ID.

| | |
|---|---|
| **Method / Endpoint** | `getBlock` at `POST /rpc/ton` |
| **Type** | TON block-body read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc_heavy`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getBlock` fetches a serialized block body from a liteserver. The required
`workchain`, `shard`, and `seqno` identify the block position; optional root and
file hashes can supply the cryptographic identity already obtained from a
lookup or masterchain response.

The result contains the resolved block ID and base64-encoded serialized block
data. Use `getBlockHeader` when metadata and proof material are sufficient and
the block body is unnecessary. Use `lookupBlock` first when the full block ID
must be resolved from a sequence number, logical time, or Unix time.

Historical availability is a per-liteserver property. Archive routing is
best-effort and does not turn the pool into a continuous full-history service.

## Parameters

JSON-RPC `params` is a by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| `workchain` | integer | yes | Signed 32-bit workchain ID. |
| `shard` | string | yes | Signed 64-bit shard ID encoded as decimal text. |
| `seqno` | integer | yes | Non-negative block sequence number. |
| `root_hash` | string | no | Root hash in a base64, base64url, or hexadecimal form accepted by the facade. |
| `file_hash` | string | no | File hash in a base64, base64url, or hexadecimal form accepted by the facade. |

`shard` stays a string because its signed 64-bit range cannot be represented
exactly by every JSON number implementation.

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getBlock",
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
    "data": "te6ccgEBAQEAAgAAAA==",
    "id": {
      "file_hash": "f4s603388wwG3M7/vozPM0+udP9hT8Mfve2o/Q7/NsI=",
      "root_hash": "U8NZycgekJt9e0jZWlsjf1vuKKZbbZYEe3zkVh19a8w=",
      "seqno": 90110366,
      "shard": "-9223372036854775808",
      "workchain": -1
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Serialized block result. |
| `result.data` | string | Base64-encoded serialized block data. |
| `result.id` | object | Full cryptographic block ID. |
| `result.id.workchain` | integer | Workchain ID. |
| `result.id.shard` | string | Signed shard ID as decimal text. |
| `result.id.seqno` | integer | Block sequence number. |
| `result.id.root_hash` | string | Block root hash. |
| `result.id.file_hash` | string | Serialized block file hash. |

The JSON is copied from the [accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getBlock.json).
The fixture sanitizer replaces block-data BoC bytes, so the short `data` value
demonstrates the field shape and encoding, not a reusable block body.

## Errors

See [TON errors](../errors.md) for the shared envelope and retention handling.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | A required block coordinate is absent or malformed, or a supplied hash is invalid. |
| `beyond_retention` | Block unavailable | The selected liteserver does not retain the requested block. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const block = { workchain: -1, shard: "-9223372036854775808", seqno: 90110366 };
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "block-body", method: "getBlock", params: block }),
});
const { result } = await response.json();
```

## Notes

- Named parameters are required, and batched responses must be correlated by
  `id` rather than array position.
- No REST gateway, write method, or WebSocket block subscription is published
  for TON.
- Related methods: [`getBlockHeader`](./getBlockHeader.md),
  [`lookupBlock`](./lookupBlock.md), and [`getShards`](./getShards.md).
