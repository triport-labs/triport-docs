> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getTransactionReceipt

# eth_getTransactionReceipt

> Return a transaction receipt by hash.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionReceipt` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionReceipt` — return a transaction receipt by hash. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

The execution outcome of one transaction: status, gas used, logs. A null result means it is not mined yet on the serving channel — another channel may already have it, so poll rather than concluding failure from a single null.

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
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0x0000000000000000000000000000000000000000000000000000000000000000"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getTransactionReceipt",
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
    "contractAddress": null,
    "cumulativeGasUsed": "0x0",
    "effectiveGasPrice": "0x128b5080",
    "from": "0x00000000000000000000000000000000000a4b05",
    "gasUsed": "0x0",
    "gasUsedForL1": "0x0",
    "l1BlockNumber": "0x18b95b7",
    "logs": [],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "status": "0x1",
    "to": "0x00000000000000000000000000000000000a4b05",
    "transactionHash": "0x33d1506ccf25888d6f882aba0c4b0a71898dcebe5623e74c2c371cdfca34c5d2",
    "transactionIndex": "0x0",
    "type": "0x6a"
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["0x0000000000000000000000000000000000000000000000000000000000000000"]}),
});
const payload = await response.json();
```

## Notes

- Null means "not mined on this channel yet"; another channel may already have it.
- The receipt is the only authoritative outcome: a hash returned by a send call is routing, not inclusion.

## Related

[`eth_getTransactionByHash`](./eth_getTransactionByHash.md) · [`eth_getTransactionCount`](./eth_getTransactionCount.md) · [`eth_getBalance`](./eth_getBalance.md)

[Limits](../limits.md) · [Errors](../errors.md)
