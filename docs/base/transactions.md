> Live version: https://triport.io/docs/base/transactions

# Base transaction submission

> Availability: `unknown` · Minimum tier: `free`

> Submit a signed Base mainnet transaction with `eth_sendRawTransaction`. Minimum tier: Free.

Base mainnet is chain ID `8453`. Send to `POST https://triport.io/rpc/base` (scope `base:rpc`) with your key in `x-token`, or to `https://triport.io/r/{key}/rpc/base`.

Sign on your side and send the serialized bytes with [`eth_sendRawTransaction`](./json-rpc/eth_sendRawTransaction.md). The result is the transaction hash; a returned hash means the request was routed, and [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md) decides inclusion. A malformed or unsigned payload is answered with JSON-RPC `-32602` and is never broadcast.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_sendRawTransaction",
  "params": ["0x02f8…signed transaction bytes…"]
}
```

Do not auto-retry an ambiguous write timeout with a re-signed transaction: resend the same bytes, so a retry cannot become a second transaction on the same nonce. Base Sepolia (`84532`) is a separate network.

Contract source: [`base.openrpc.json`](https://triport.io/api-specs/json-rpc/base.openrpc.json).
