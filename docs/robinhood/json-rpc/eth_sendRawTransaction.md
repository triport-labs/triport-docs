> Live version: https://triport.io/docs/robinhood/json-rpc/eth_sendRawTransaction

# eth_sendRawTransaction

> Submit a signed raw transaction.

| | |
|---|---|
| **Method / Endpoint** | `eth_sendRawTransaction` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_send_tx` - 3 / 5 / 30 / 80 RPS sustained · short burst 6 / 10 / 60 / 160 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_sendRawTransaction` — submit a signed raw transaction. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Broadcast a transaction that was signed and serialized on your side — this surface never holds keys and never re-signs anything. Poll `eth_getTransactionReceipt` for the outcome; a returned hash means the request was routed, not that the transaction was included.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `rawTx` | Data | yes | RLP-encoded signed transaction, hex-prefixed. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_sendRawTransaction","params":["0x00"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_sendRawTransaction",
  "params": [
    "0x00"
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32000,
    "message": "typed transaction too short"
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_sendRawTransaction","params":["0x00"]}),
});
const payload = await response.json();
```

## Notes

- Submissions go to the sequencer intake. A malformed or unsigned payload is answered with a JSON-RPC error and is never broadcast.
- A returned hash means the request was routed; the receipt decides inclusion.

## Related

[`eth_sendRawTransactionConditional`](./eth_sendRawTransactionConditional.md)

[Submission](../send.md) · [Conditional transactions](../conditional.md) · [Limits](../limits.md) · [Errors](../errors.md)
