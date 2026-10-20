> Live version: https://triport.io/docs/robinhood/json-rpc/eth_blockNumber

# eth_blockNumber

> Return the latest block number.

| | |
|---|---|
| **Method / Endpoint** | `eth_blockNumber` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_blockNumber` — return the latest block number. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Use it as a cheap liveness and freshness check, and as the upper bound before reading a range. It says nothing about how far history reaches back — for that, see the measured archive floor in [archive](../archive.md), which is a floor per channel rather than a network-wide guarantee.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | Send an empty positional array. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_blockNumber",
  "params": []
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x3626e6a"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}),
});
const payload = await response.json();
```

## Notes

- The head is the serving channel’s head. Two calls in a row can land on different channels and return different numbers without either being wrong.
- It bounds a range from above, never from below: history depth is a separate, measured property (see [archive](../archive.md)).

## Related

[`eth_call`](./eth_call.md) · [`eth_chainId`](./eth_chainId.md) · [`eth_estimateGas`](./eth_estimateGas.md)

[Limits](../limits.md) · [Errors](../errors.md)
