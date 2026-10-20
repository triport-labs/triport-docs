> Live version: https://triport.io/docs/base

# Base API reference

Base mainnet (chain ID `8453`) JSON-RPC: `POST https://triport.io/rpc/base` with your key in `x-token` (or `https://triport.io/r/{key}/rpc/base` with the key in the path), scope `base:rpc`. WebSocket `newHeads` is on `wss://triport.io/ws/base`, and the Flashblocks feed is on `wss://triport.io/ws/base-feed` (Pro, address filter required).

Minimum tiers and rate values come from the enforced tier matrix. They are product policy, not measured capacity or a provider SLA.

## Reference

- [JSON-RPC methods](./json-rpc/index.md) — generated set of all 61 catalog methods.
- [Limits and enforced rate policy](./limits.md).
- [Errors](./errors.md).

Base Sepolia (chain ID `84532`) is a separate network and is not described as Base mainnet by this reference. Cross-network fallback is prohibited.

## Pages in this section

- [Base Flashblocks feed](./flashblocks.md)
- [Base transaction submission](./transactions.md)
- [Base JSON-RPC WebSocket](./ws.md)
