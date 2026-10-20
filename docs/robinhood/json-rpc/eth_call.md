> Live version: https://triport.io/docs/robinhood/json-rpc/eth_call

# eth_call

> Execute a read-only EVM call.

| | |
|---|---|
| **Method / Endpoint** | `eth_call` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_call` — execute a read-only EVM call. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Execute a read-only call against a chosen block — balances, allowances, view functions, simulations. Nothing is persisted and no gas is spent. To read a revert reason before submitting anything, `debug_traceCall` is usually faster than reasoning from the error alone.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `call` | Call | yes | Call object: `to` plus optional `from`, `data`, `value`, `gas` and fee fields. |
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x0000000000000000000000000000000000000000","data":"0x"},"latest"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_call",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "data": "0x"
    },
    "latest"
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x0000000000000000000000000000000000000000","data":"0x"},"latest"]}),
});
const payload = await response.json();
```

## Notes

- Nothing is persisted and no gas is spent; `from` is optional and only matters when the contract reads `msg.sender`.
- For a revert reason, `debug_traceCall` shows the call tree — subject to the best-effort `debug_*` caveat.

## Related

[`eth_chainId`](./eth_chainId.md) · [`eth_blockNumber`](./eth_blockNumber.md) · [`eth_estimateGas`](./eth_estimateGas.md)

[Limits](../limits.md) · [Errors](../errors.md)
