> Live version: https://triport.io/docs/robinhood/json-rpc/eth_gasPrice

# eth_gasPrice

> Return the current gas-price estimate.

| | |
|---|---|
| **Method / Endpoint** | `eth_gasPrice` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_gasPrice` — return the current gas-price estimate. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Legacy single-value gas price estimate. For EIP-1559 fees use `eth_feeHistory` and `eth_maxPriorityFeePerGas`. Keep in mind what the price does and does not buy: sequencing is first-come, first-served, so this value covers cost, not position.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_gasPrice","params":[]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_gasPrice",
  "params": []
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1292d260"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_gasPrice","params":[]}),
});
const payload = await response.json();
```

## Notes

- Legacy single value, kept for compatibility; EIP-1559 callers want `eth_feeHistory`.
- Under FCFS sequencing the price covers cost, not queue position.

## Related

[`eth_getBalance`](./eth_getBalance.md) · [`eth_getBlockByHash`](./eth_getBlockByHash.md) · [`eth_getBlockByNumber`](./eth_getBlockByNumber.md)

[Limits](../limits.md) · [Errors](../errors.md)
