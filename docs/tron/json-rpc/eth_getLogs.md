> Live version: https://triport.io/docs/tron/json-rpc/eth_getLogs

# eth_getLogs

> Returns EVM event logs matching a filter over an inclusive block range.

| | |
|---|---|
| **Method / Endpoint** | `eth_getLogs` at `POST /rpc/tron` |
| **Type** | EVM-compatible JSON-RPC log read |
| **Network** | Tron mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `tron:rpc` |
| **Tier / rate limit** | free+; `tron_read_rpc_heavy`: 2 / 5 / 20 / 80 RPS sustained · short burst 4 / 10 / 40 / 160 (free / basic / pro / business; default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getLogs` searches EVM event logs using an address, topics, a block hash, or
an inclusive `fromBlock`/`toBlock` range. The result is an array; an empty array
is a successful query with no matching logs.

One request may span at most **100 blocks**. Split larger scans into adjacent,
non-overlapping windows before sending them. Tron has no WebSocket log or
mempool surface here. TRC20 event-oriented REST access belongs to the separate
wallet/REST layer rather than adding another JSON-RPC method.

## Parameters

JSON-RPC `params` is `[filter]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | object | yes | Log-selection object; unknown properties are rejected. |

### `filter` object

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string or string[] | no | One or more `0x`-prefixed 20-byte EVM addresses. |
| `blockHash` | string | no | A 32-byte `0x`-prefixed hash. |
| `fromBlock` | string | no | Inclusive starting block as an EVM hex quantity. |
| `toBlock` | string | no | Inclusive ending block as an EVM hex quantity. |
| `topics` | array | no | Each position is `null`, one 32-byte topic, or an array of topics. |

## Request

```bash
curl https://triport.io/rpc/tron \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{"fromBlock":"0x51e5e80","toBlock":"0x51e5e80"}]}'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": []
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC protocol version. |
| `id` | number | Correlates the response with the request. |
| `result` | array | Matching log objects; empty when nothing matches. |

Log-object fields are not listed because the OpenRPC schema permits
implementation-defined properties and the captured response contains no log
object from which to document fields.

## Errors

See [Tron errors](../errors.md) for the shared envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | The filter is malformed or the requested range exceeds 100 blocks. |
| `-32601` | Method not found | The method is outside the published catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `tron_read_rpc_heavy` budget is exceeded. |

## Examples

```js
const filter = { fromBlock: "0x51e5e80", toBlock: "0x51e5e80" };
const response = await fetch("https://triport.io/rpc/tron", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getLogs", params: [filter] }),
});
const { result: logs } = await response.json();
```

## Notes

- The maximum inclusive range is 100 blocks; page larger scans client-side.
- `fromBlock` and `toBlock` are hex quantities in this contract.
- No WebSocket or mempool subscription is available for Tron.
