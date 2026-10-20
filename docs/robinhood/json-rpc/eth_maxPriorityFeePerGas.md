> Live version: https://triport.io/docs/robinhood/json-rpc/eth_maxPriorityFeePerGas

# eth_maxPriorityFeePerGas

> Return a priority-fee estimate.

| | |
|---|---|
| **Method / Endpoint** | `eth_maxPriorityFeePerGas` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_maxPriorityFeePerGas` — return a priority-fee estimate. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

A priority-fee estimate. Robinhood sequencing is first-come, first-served: a larger priority fee does not move a transaction forward in the queue. Pay it for compatibility with wallets and tooling that expect the field, not to buy position.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_maxPriorityFeePerGas","params":[]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_maxPriorityFeePerGas",
  "params": []
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_maxPriorityFeePerGas","params":[]}),
});
const payload = await response.json();
```

## Notes

- Robinhood sequencing is FCFS. A larger priority fee does not move a transaction forward in the sequencer queue.

## Related

[`eth_blockNumber`](./eth_blockNumber.md) · [`eth_call`](./eth_call.md) · [`eth_chainId`](./eth_chainId.md)

[Limits](../limits.md) · [Errors](../errors.md)
