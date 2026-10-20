> Live version: https://triport.io/docs/base/ws

# Base JSON-RPC WebSocket

> Availability: `unknown` · Minimum tier: `basic`

> Base JSON-RPC Pub/Sub over WebSocket: `newHeads` on `/ws/base`. Minimum tier: Basic.

The public keyed endpoint is `{WSSBase}/ws/base/{key}`, normalized to `/ws/base` with scope `base:ws`, and it is reachable from Basic with an ordinary Triport key.

`newHeads` is the topic served on `/ws/base`. For contract events, poll [`eth_getLogs`](./json-rpc/eth_getLogs.md) or use the [Flashblocks feed](./flashblocks.md) with an address filter.

Missing, expired, revoked, or wrong-scope credentials must be rejected before upstream dial; revocation terminates active fanout.

## Topics

| Topic | Minimum tier |
|---|---|
| `newHeads` | Basic |

## Subscribe envelope

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_subscribe",
  "params": ["newHeads"]
}
```

Notifications use `{"jsonrpc":"2.0","method":"eth_subscription","params":{"subscription":"…","result":…}}`.

See the [Base WS AsyncAPI](https://triport.io/api-specs/streaming/base-ws.asyncapi.yaml) and the [normalized Flashblocks guide](./flashblocks.md).
