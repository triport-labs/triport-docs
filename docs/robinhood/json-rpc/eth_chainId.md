> Live version: https://triport.io/docs/robinhood/json-rpc/eth_chainId

# eth_chainId

> Return the chain identifier.

| | |
|---|---|
| **Method / Endpoint** | `eth_chainId` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_chainId` — return the chain identifier. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Call it once after wiring a client to prove you are on chain 4663; wallets reject a network whose chain ID disagrees with their configuration. Do not confuse it with the public testnet, chain ID `46630`: that network exists with its own RPC and explorer, but Triport does not proxy it.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_chainId",
  "params": []
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1237"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}),
});
const payload = await response.json();
```

## Notes

- The value is fixed at `0x1237` (4663) and is the cheapest wiring check there is.
- Triport does not proxy the public testnet (chain ID `46630`), so this method never answers with it.

## Related

[`eth_call`](./eth_call.md) · [`eth_blockNumber`](./eth_blockNumber.md) · [`eth_estimateGas`](./eth_estimateGas.md)

[Limits](../limits.md) · [Errors](../errors.md)
