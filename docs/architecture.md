> Live version: https://triport.io/docs/architecture

# Architecture & trust model

> How a request actually flows through Triport — from your client, through the edge and routing layer, to an upstream node and back — and an honest account of what Triport operates versus what it routes to.

| | |
|---|---|
| **Type** | Triport platform overview |
| **Network** | Any network in the registry |
| **Authentication** | n/a — conceptual reference |

## What Triport is

Triport is a **multi-chain RPC gateway**: a single authenticated endpoint
(`https://triport.io`) that authenticates your key, enforces your tier's
rate limits, routes each call to a healthy upstream node for the target chain,
and returns the upstream result **unchanged**.

It is deliberately *not* presented as a sole-owned global validator network.
Triport operates its own edge and routing infrastructure and a pool of Solana
RPC hosts, and routes to a curated set of upstream nodes — some Triport-operated,
some vetted infrastructure partners — chosen per chain and per method by health.
Calling it a gateway/aggregation layer is the accurate description.

## What each layer does

| Layer | Responsibility | Notes |
|---|---|---|
| **Router** | Select chain and a healthy upstream | Routing is per-chain and, for some chains, per-method (e.g. heavy reads, trace, mempool may use different upstreams than standard reads). |
| **Upstream pool** | Serve the actual chain RPC | A mix of Triport-operated hosts and infrastructure partners. Unhealthy hosts are removed from rotation by continuous health checks; the pool is refreshed periodically. |
| **Response** | Return the upstream result | Triport does not rewrite successful results — what the node returns is what you get. Triport adds rate-limit headers and standardized error envelopes (see [Errors](./errors.md)). |

## What is and isn't guaranteed

- **Result fidelity.** Successful upstream results are passed through unchanged.
- **Auth isolation.** Your API key is validated at the edge and never forwarded
  to upstream nodes or echoed in responses.
- **Health-based routing.** Upstream selection prefers healthy hosts;
  failed hosts are taken out of rotation.
- **Honest scope.** Triport advertises exactly the networks and limitations in the generated registry table below.
  Crypto **payments** additionally settle over BSC and Tron — that is a
  payment-rail set, not an RPC chain set (see [Billing](./guides/billing.md)).
- **Not claimed.** Triport does not claim to own every node it routes to, nor a
  full independent validator/archive network across all chains. Where archive or
  specialty capability is served by a partner, it is still delivered behind the
  single Triport endpoint and SLA.

## Streaming

WebSocket and gRPC streaming (Solana pubsub, Solana gRPC (Yellowstone), the
Solana shred stream, EVM mempool feeds) ride the same auth and routing model but hold a persistent connection to
an upstream stream source. See the [Streaming](./streaming/index.md) section for
the per-surface details (proto versions, filters, and delivery semantics).

## Related

- [Overview](./overview.md) · [Getting started](./getting-started.md)
- [Authentication](./authentication.md) · [Rate limits & tiers](./rate-limits-and-tiers.md)
- [Errors](./errors.md) · [Streaming](./streaming/index.md)

| ID | Network | Required scope | Errors |
|---|---|---|---|
| `sol` | Solana | `solana:rpc` | [Errors](./sol/errors.md) |
| `eth` | Ethereum | `eth:rpc` | [Errors](./eth/errors.md) |
| `polygon` | Polygon | `polygon:rpc` | [Errors](./polygon/errors.md) |
| `bsc` | BNB Smart Chain | `bsc:rpc` | [Errors](./bsc/errors.md) |
| `base` | Base | `base:rpc` | [Errors](./base/errors.md) |
| `tron` | Tron | `tron:rpc` | [Errors](./tron/errors.md) |
| `robinhood` | Robinhood Chain | `robinhood:rpc` | [Errors](./robinhood/errors.md) |
| `stellar` | Stellar | `stellar:rpc` | [Errors](./stellar/errors.md) |
| `ton` | TON | `ton:rpc` | [Errors](./ton/errors.md) |
