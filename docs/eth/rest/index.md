> Live version: https://triport.io/docs/eth/rest

# Ethereum REST API

> Triport's product layer for Ethereum over plain HTTP: consensus-layer beacon access (REST proxy and live event stream) and the MEV builder and private-transaction routes, with notes on the JSON-RPC transport.

| | |
|---|---|
| **Method / Endpoint** | Beacon: `https://triport.io/rpc/eth-beacon/…`; MEV: `POST https://triport.io/rpc/eth-private/{forwarder_id}`, `POST https://triport.io/rpc/eth-builder/…` |
| **Network** | Ethereum |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../../authentication.md) |
| **Required scope** | — (tier-gated per endpoint) |
| **Tier / rate limit** | Any tier; see [Rate Limits](../../rate-limits-and-tiers.md) |

## What this surface is

Unlike [JSON-RPC](../json-rpc/index.md), which proxies the chain's native
methods verbatim, the REST layer is **built by Triport**: indexed, opinionated
endpoints that answer product questions in one call.

## Endpoint groups

- **Beacon** — consensus-layer REST proxy (incl. blob sidecars) and live
  event stream (SSE).
- **MEV** — builder RPC and the private-transaction forwarder. Bundles
  (`eth_sendBundle`, `mev_sendBundle`) are sent through the
  [private RPC forwarder](./mev-private-rpc.md), not the shared JSON-RPC endpoint.
- **Transport** — how the JSON-RPC transport routes reads and writes.

For wallet balances, history and token activity, use JSON-RPC
([`eth_getBalance`](../json-rpc/eth_getBalance.md)) or the cross-chain
[Wallet Research](../../platform/wallet-research.md) endpoint. For pending
transactions, subscribe to `newPendingTransactions` over
[WebSocket](../../streaming/eth-ws.md). To send a signed transaction, use
[`eth_sendRawTransaction`](../json-rpc/eth_sendRawTransaction.md).

The full endpoint list is below.

## Pages in this section

- [Beacon events SSE stream](./beacon-events-sse.md)
- [Beacon API reverse proxy (CL path router)](./beacon-proxy.md)
- [Block-builder direct RPC](./mev-builder-rpc.md)
- [Ethereum JSON-RPC transport (POST /rpc/eth)](./rpc-eth-transport.md)
