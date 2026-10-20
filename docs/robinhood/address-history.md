> Live version: https://triport.io/docs/robinhood/address-history

# Robinhood address history

Triport does not currently publish an indexed address-history endpoint for Robinhood mainnet, chain ID `4663`. There is no published history depth, indexed-through block, pagination contract, or indexer rate limit for this product.

The existing endpoint is `POST https://triport.io/rpc/robinhood`. It provides block, transaction, receipt, log, and best-effort debug reads. These methods provide inputs for an indexer; they do not return a complete list of an address's activity.

| Activity | Available input | Additional work needed for complete history |
|---|---|---|
| Incoming and outgoing ETH | Full transactions and receipts | Index sender/recipient across a verified block range; distinguish failed transactions from completed transfers |
| Internal ETH transfers | `debug_traceTransaction` / block traces with `callTracer` | Index successful value transfers, including ancestor-revert handling; track trace coverage separately |
| ERC-20 transfers | Receipt logs or `eth_getLogs` with Transfer topics | Index both address directions, distinguish ERC-20 from ERC-721 events, and preserve raw integer amounts |
| Contract creations | `receipt.contractAddress` and CREATE/CREATE2 traces | Index top-level and factory-created contracts, including zero-value creations |

For an individual known transaction, a trace request is:

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"debug_traceTransaction","params":["0xbf550a9a5ceab4b61f7e1ef4e792cc7c96eb89d9b1e93fa8945ad71f8b660a01",{"tracer":"callTracer","timeout":"5s"}]}'
```

External [ecosystem explorers](./ecosystem.md) have separate availability and coverage. A successful HTTP response with an empty list does not establish that an address has no history: inspect indexing status. An explorer's latest block must be compared with an independent RPC head; its own `lagBlocks: 0` is insufficient. Public explorer limits do not inherit Triport RPC plan limits.
