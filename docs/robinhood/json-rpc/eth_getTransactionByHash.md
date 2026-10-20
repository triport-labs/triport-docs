> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getTransactionByHash

# eth_getTransactionByHash

> Return a transaction by hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionByHash` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionByHash` — return a transaction by hash. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Look up a known transaction. A null result means the node does not know it — not that it was rejected, and not that it was dropped. Right after sending, treat null as "no answer yet" and poll.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `transactionHash` | Hash | yes | 32-byte transaction hash. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionByHash","params":["0x0000000000000000000000000000000000000000000000000000000000000000"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getTransactionByHash",
  "params": [
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "blockHash": "0x16250ba41b4f026eced057ca70be950e90485ab8a43ec57786e4afafd2b8e6fb",
    "blockNumber": "0x3626e6a",
    "from": "0x00000000000000000000000000000000000a4b05",
    "gas": "0x0",
    "gasPrice": "0x0",
    "hash": "0x33d1506ccf25888d6f882aba0c4b0a71898dcebe5623e74c2c371cdfca34c5d2",
    "input": "0x6bf6a42d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018b95b70000000000000000000000000000000000000000000000000000000003626e6a0000000000000000000000000000000000000000000000000000000000000000",
    "nonce": "0x0",
    "to": "0x00000000000000000000000000000000000a4b05",
    "transactionIndex": "0x0",
    "value": "0x0",
    "type": "0x6a",
    "chainId": "0x1237",
    "v": "0x0",
    "r": "0x0",
    "s": "0x0"
  }
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getTransactionByHash","params":["0x0000000000000000000000000000000000000000000000000000000000000000"]}),
});
const payload = await response.json();
```

## Notes

- A null answer means the serving channel does not know the hash — not that it was rejected.
- A transaction you just sent may not be visible on every channel yet, so poll rather than concluding from one null.

## Related

[`eth_getTransactionCount`](./eth_getTransactionCount.md) · [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) · [`eth_getBalance`](./eth_getBalance.md)

[Limits](../limits.md) · [Errors](../errors.md)
