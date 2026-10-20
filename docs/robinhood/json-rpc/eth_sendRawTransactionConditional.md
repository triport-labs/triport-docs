> Live version: https://triport.io/docs/robinhood/json-rpc/eth_sendRawTransactionConditional

# eth_sendRawTransactionConditional

> Submit a signed transaction with sequencer inclusion conditions.

| | |
|---|---|
| **Method / Endpoint** | `eth_sendRawTransactionConditional` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_send_tx` - 3 / 5 / 30 / 80 RPS sustained · short burst 6 / 10 / 60 / 160 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_sendRawTransactionConditional` — submit a signed transaction with sequencer inclusion conditions. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Attach inclusion conditions — block-number and timestamp bounds plus expected account state — so the transaction is dropped instead of included once they stop holding. The proxy checks only the option names and shapes; it never evaluates the conditions themselves, and the sequencer decides.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `rawTx` | Data | yes | RLP-encoded signed transaction, hex-prefixed. |
| `options` | ConditionalOptions | yes | Inclusion conditions: `blockNumberMin`, `blockNumberMax`, `timestampMin`, `timestampMax`, `knownAccounts`. Validated locally; Triport does not evaluate them. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"eth_sendRawTransactionConditional","params":["0x00",{}]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "eth_sendRawTransactionConditional",
  "params": [
    "0x00",
    {}
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32000,
    "message": "typed transaction too short"
  }
}
```

## Errors

Unknown or malformed conditional fields are rejected locally with JSON-RPC `-32602` and the exact message `invalid conditional options: <field>: <reason>`. No upstream request or gas is spent for that rejection. Authentication and rate-limit failures use the shared client error contract.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":2,"method":"eth_sendRawTransactionConditional","params":["0x00",{}]}),
});
const payload = await response.json();
```

## Notes

- This method is routed only to the sequencer intake and gateway classes. A returned hash means the request was routed, not that the transaction was included: the sequencer decides inclusion.
- The proxy validates only `blockNumberMin`, `blockNumberMax`, `timestampMin`, `timestampMax`, and `knownAccounts`; it does not evaluate those conditions. A JSON-RPC batch containing this method is dispatched per item.
- See [conditional submission](../conditional.md) before using it.

## Related

[`eth_sendRawTransaction`](./eth_sendRawTransaction.md)

[Submission](../send.md) · [Conditional transactions](../conditional.md) · [Limits](../limits.md) · [Errors](../errors.md)
