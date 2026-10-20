> Live version: https://triport.io/docs/tron/json-rpc/eth_syncing

# eth_syncing

> Reports whether the selected Tron node exposes active synchronization progress.

| | |
|---|---|
| **Method / Endpoint** | `eth_syncing` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc`: 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_syncing` returns `false` when the selected upstream does not report active
synchronization. The OpenRPC result also permits an implementation-defined
object when a node reports progress.

Use the method as a node-state hint, not as a finality or freshness guarantee.
For a chain height that applications can compare over time, call
[`eth_blockNumber`](./eth_blockNumber.md).

## Parameters

JSON-RPC `params` must be an empty array.

| Name | Type | Required | Description |
|---|---|---|---|
| `params` | array | yes | Empty array; this method accepts no positional parameters. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_syncing","params":[]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": false
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | boolean or object | `false`, or implementation-defined synchronization progress. |

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | An unexpected positional parameter is supplied. |
| `-32601` | Method not found | The method is outside the published catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc` budget is exceeded. |

## Examples

```js
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_syncing", params: [] }),
});
const { result } = await response.json();
```

## Notes

- `false` means the node did not report active synchronization; it does not
  independently prove that the node is at the newest network head.
- Progress-object fields are deliberately not documented because the schema
  leaves them implementation-defined and the captured example is boolean.
- Related: [`getnodeinfo`](../wallet/getnodeinfo.md) exposes native node status.
