> Live version: https://triport.io/docs/polygon/rest

# Polygon REST API

> Triport's REST surface for Polygon: the Heimdall consensus-layer proxy for checkpoints, spans, validator sets and chain status over plain HTTP. Everything else on Polygon is served over JSON-RPC and WebSocket.

| | |
|---|---|
| **Method / Endpoint** | `GET https://triport.io/rpc/polygon-heimdall/…` |
| **Network** | Polygon (PoS) |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../../authentication.md) |
| **Required scope** | — (tier-gated per endpoint) |
| **Tier / rate limit** | Any tier; see [Rate Limits](../../rate-limits-and-tiers.md) |

## What this surface is

Unlike [JSON-RPC](../json-rpc/index.md), which proxies the chain's native
methods verbatim, the REST layer is **built by Triport**: indexed, opinionated
endpoints that answer product questions in one call.

## Endpoint groups

- **Heimdall** — the [Heimdall consensus-layer proxy](./heimdall-proxy.md):
  checkpoints, Bor spans, validator sets and chain status.

Everything else on Polygon goes through the standard interfaces:
balances and sending via [JSON-RPC](../json-rpc/index.md)
([`eth_getBalance`](../json-rpc/eth_getBalance.md),
[`eth_sendRawTransaction`](../json-rpc/eth_sendRawTransaction.md)), tracing
via [`trace_call`](../json-rpc/trace_call.md), live blocks, logs and
pending transactions via [WebSocket](../../streaming/poly-ws.md), and wallet
history via the cross-chain [Wallet Research](../../platform/wallet-research.md)
endpoint.

The full endpoint list is below.
