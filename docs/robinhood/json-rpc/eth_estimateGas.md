> Live version: https://triport.io/docs/robinhood/json-rpc/eth_estimateGas

# eth_estimateGas

> Estimate gas for an EVM call.

| | |
|---|---|
| **Method / Endpoint** | `eth_estimateGas` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_estimateGas` — estimate gas for an EVM call. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Size the gas limit for a call before signing. It is an estimate against current state, not a guarantee for inclusion later: the same call can estimate differently one block on, and an estimate that succeeds does not promise the transaction will be accepted.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `call` | Call | yes | Call object: `to` plus optional `from`, `data`, `value`, `gas` and fee fields. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_estimateGas","params":[{"to":"0x0000000000000000000000000000000000000000","data":"0x"}]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_estimateGas",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "data": "0x"
    }
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x5208"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_estimateGas","params":[{"to":"0x0000000000000000000000000000000000000000","data":"0x"}]}),
});
const payload = await response.json();
```

## Notes

- An estimate against current state; the same call can estimate differently one block later.
- A successful estimate does not promise acceptance: the receipt decides the outcome.

## Related

[`eth_blockNumber`](./eth_blockNumber.md) · [`eth_call`](./eth_call.md) · [`eth_chainId`](./eth_chainId.md)

[Limits](../limits.md) · [Errors](../errors.md)
