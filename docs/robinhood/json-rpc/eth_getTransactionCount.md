> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getTransactionCount

# eth_getTransactionCount

> Return an account nonce at a block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionCount` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionCount` — return an account nonce at a block. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

The account nonce, which is what you need before signing a transaction. At the `pending` tag the value reflects a right-now view, not a commitment. Because sequencing here is first-come, first-served, a nonce you read and immediately use is the normal path — there is no fee auction to lose.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | Address | yes | Account or contract address (20-byte hex). |
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionCount","params":["0x0000000000000000000000000000000000000000","latest"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getTransactionCount",
  "params": [
    "0x0000000000000000000000000000000000000000",
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getTransactionCount","params":["0x0000000000000000000000000000000000000000","latest"]}),
});
const payload = await response.json();
```

## Notes

- At `pending` the count includes transactions not yet mined, so it is a right-now view rather than a commitment.
- Sequencing is FCFS, so a nonce read and used immediately is the normal path; there is no fee auction to lose it to.

## Related

[`eth_getTransactionByHash`](./eth_getTransactionByHash.md) · [`eth_getTransactionReceipt`](./eth_getTransactionReceipt.md) · [`eth_getBalance`](./eth_getBalance.md)

[Limits](../limits.md) · [Errors](../errors.md)
