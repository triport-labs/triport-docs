> Live version: https://triport.io/docs/ton/json-rpc/getTime

# getTime

> Returns the current Unix time reported by the selected TON liteserver.

| | |
|---|---|
| **Method / Endpoint** | `getTime` at `POST /rpc/ton` |
| **Type** | TON liteserver diagnostic read over ADNL |
| **Network** | TON mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `ton:rpc` |
| **Tier / rate limit** | free+; `ton_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getTime` returns the current time reported by the selected liteserver. The
result is a Unix timestamp in the `now` field and represents that server's
clock at the time of the response.

Use it for liteserver diagnostics or coarse clock comparison. It is not a TON
block position and must not replace masterchain `seqno` or transaction logical
time (`lt`) when ordering chain data.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"getTime","params":{}}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "now": 1788347578
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number or string | Correlates the response with the request. |
| `result` | object | Liteserver time result. |
| `result.now` | integer | Unix timestamp reported by the selected liteserver. |

The response is copied from the
[accepted live fixture](https://triport.io/api-specs/json-rpc/_examples/ton/getTime.json).

## Errors

See [TON errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The parameter structure is malformed or positional. |
| `-32601` | Method not found | The method is outside the published read-only catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `ton_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/ton", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: "clock", method: "getTime", params: {} }),
});
const { result: serverTime } = await response.json();
```

## Notes

- `now` is diagnostic server time, not consensus time, block `seqno`, or
  transaction `lt`.
- Calls use named params. When batched, correlate results by JSON-RPC `id`.
- Poll this method if needed; TON WebSocket subscriptions are not published.
  Public HTTP gateways are not used as upstreams.
- Related methods: [`getVersion`](./getVersion.md) and
  [`getMasterchainInfo`](./getMasterchainInfo.md).
