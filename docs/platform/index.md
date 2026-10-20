> Live version: https://triport.io/docs/platform

# Platform API

> Cross-network Triport endpoints — chain catalog and live metrics, per-key endpoint discovery, a diagnostics runner, a server-sent events stream of chain status, and the cross-chain wallet identity profile.

| | |
|---|---|
| **Method / Endpoint** | `GET https://triport.io/v1/chains…`, `GET /v1/keys/{id}/endpoints`, `POST /v1/diagnostics/run-method`, `GET /v1/wallet/{address}/identity` |
| **Network** | Any network in the registry |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../authentication.md) |
| **Required scope** | — |
| **Tier / rate limit** | Any tier for catalog/keys/diagnostics; Wallet Identity from Business (`wallet_identity`, 20 rps); see [Rate Limits](../rate-limits-and-tiers.md) |

## What this surface is

These endpoints sit **above** the individual networks: one call tells you which
chains exist and how healthy they are, which endpoints a key can reach, or runs
a diagnostic method against any network. They power the public
[chains dashboard](../guides/chains.md) and are available to every tier.

```bash
curl "https://triport.io/v1/chains" -H "x-token: $TRIPORT_API_KEY"
```

## Endpoint groups

- **Chain catalog** — [list chains](./list-chains.md),
  [get chain](./get-chain.md), [metrics](./get-chain-metrics.md) and
  [metrics series](./get-chain-metrics-series.md).
- **Live events** — [chain events over SSE](./chains-events-stream.md).
- **Key introspection** — [key endpoints](./get-key-endpoints.md).
- **Diagnostics** — [run-method](./run-method.md).
- **Wallet Research** — [live wallet research](./wallet-research.md), period
  volumes, counterparties, bridge/exchange flows, approvals and shared funding
  candidates, with explicit coverage per EVM network.
- **Wallet Identity** — [cross-chain wallet profile](./wallet-identity.md):
  verified on-chain names (ENS, Basenames, Unstoppable, SPACE ID), balance /
  nonce / contract flag on every mounted EVM network plus Tron, deployer
  detection and known-address labels in one call; [batch with filters](./wallet-identity-batch.md)
  for lists of addresses and the shared [filter catalog](./wallet-identity-filters.md).
  Business tier and above.
- **Wallet watch** — [event subscriptions](./wallet-watch.md): deployments,
  bridge deposits/fills, fresh-wallet funding and EIP-7702 delegations on the
  monitored networks, enriched with the profile and delivered by webhook,
  WebSocket (`/ws/wallet-watch`) or REST cursor. Business tier and above.
- **Wallet activity** — [address activity stream](./wallet-activity.md):
  every transaction of the addresses on a watchlist (native and token
  movements, approvals, revert reasons, bridge annotations) as the
  `wallet_activity` event type of Wallet watch, with a portable resume cursor
  and per-network coverage. Business tier and above.

The full endpoint list is below.

9 networks are supported today: Solana, Ethereum, Polygon, BNB Smart Chain, Base, Tron, Robinhood Chain, Stellar, and TON.

## Pages in this section

- [Get wallet funded-by](./wallet-funded-by.md)
