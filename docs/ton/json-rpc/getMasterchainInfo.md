> Live version: https://triport.io/docs/ton/json-rpc/getMasterchainInfo

# getMasterchainInfo

> Returns the current masterchain block, state root, and zero-state reference.

| | |
|---|---|
| **Method / Endpoint** | `getMasterchainInfo` at `POST /rpc/ton` |
| **Type** | TON chain-head read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getMasterchainInfo` calls `liteServer.getMasterchainInfo` and returns the
selected server's current masterchain reference. The result includes the latest
full block ID, its state root hash, and the zero-state block ID.

Use it to obtain a starting block reference for `getBlock`, `getBlockHeader`,
or a nearby `lookupBlock` request. The `last.seqno` value is the selected
liteserver's view of the head; it is not a transaction logical time.

Successful responses pass the TON freshness gate before they are served. This
is a current-head method and does not establish that the same liteserver retains
every block between the returned `init` and `last` references.

## Parameters

JSON-RPC `params` is an empty by-name object.

**Params:** object (`by-name`).

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This method has no parameters; send `params: {}`. |

## Request

```bash
curl https://triport.io/rpc/ton \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getMasterchainInfo","params":{}}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "init": {
      "file_hash": "XplPz01CXAps5qeSWUtxcyBfdAo5zVb1N979KLSKD24=",
      "root_hash": "F6OpKZKqvqeFp6CQmFomXNMfMj2EnaUSOXN+Mh+wVWk=",
      "seqno": 0,
      "shard": "0",
      "workchain": -1
    },
    "last": {
      "file_hash": "fg/ifwcqGbSY5FWQtBYSBmjzbr5MunvIyIQWNBIC1Ds=",
      "root_hash": "HdnpiyOhIr4b0D//bCcUmO86xqAlq/sRHOJZ2IyZ0LU=",
      "seqno": 90094847,
      "shard": "-9223372036854775808",
      "workchain": -1
    },
    "state_root_hash": "Jms+mXEK8TcuWt1gHxEbl1M0kCw+leT2jmaQslUbLCQ="
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Current masterchain information. |
| `result.last` | object | Selected server's latest full masterchain block ID. |
| `result.state_root_hash` | string | State root hash associated with the current reference. |
| `result.init` | object | Masterchain zero-state block ID. |
| `result.last.workchain` | integer | Workchain ID. |
| `result.last.shard` | string | Signed shard ID as decimal text. |
| `result.last.seqno` | integer | Current masterchain sequence number. |
| `result.last.root_hash` | string | Current block root hash. |
| `result.last.file_hash` | string | Current block file hash. |

The JSON is copied without invention from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getMasterchainInfo.json).

## Errors

See [TON errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | A non-empty or positional parameter structure is malformed. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "head", method: "getMasterchainInfo", params: {} }),
});
const { result: masterchain } = await response.json();
```

## Notes

- Use `last` as a full block reference; `init` identifies zero state and does
  not promise that all intervening data is retained.
- This is a polling method because TON WebSocket subscriptions are not
  published. Public HTTP gateways are not used as upstreams.
- Named params and response correlation by `id` also apply inside batches.
- Related methods: [`getBlock`](./getBlock.md),
  [`getBlockHeader`](./getBlockHeader.md), and [`getTime`](./getTime.md).
