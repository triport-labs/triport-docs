> Live version: https://triport.io/docs/sol/rest

# Solana REST API

> Triport's product layer for Solana under `https://triport.io/v1/sol/…` — indexed wallet history, token transfers and known-entity identity over plain HTTP, in one call per question.

| | |
|---|---|
| **Method / Endpoint** | `GET`/`POST https://triport.io/v1/sol/…` |
| **Network** | Solana |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../../authentication.md) |
| **Required scope** | — (tier-gated per endpoint) |
| **Tier / rate limit** | Any tier; see [Rate Limits](../../rate-limits-and-tiers.md) |

## What this surface is

Unlike [JSON-RPC](../json-rpc/index.md), which proxies the chain's native
methods verbatim, the REST layer is **built by Triport**: indexed, opinionated
endpoints that answer a product question in one call, such as "what has this
wallet done".

```bash
curl "https://triport.io/v1/sol/wallet/history/vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg" \
  -H "x-token: $TRIPORT_API_KEY"
```

## Endpoint groups

- **Wallet** — [history](./wallet-history.md), plus token transfer legs
  (`/v1/sol/wallet/transfers/{address}`) and known-entity identity
  (`/v1/sol/wallet/identity/{address}`).

Everything else goes through JSON-RPC and streaming: balances and token
holdings via [`getBalance`](../json-rpc/getBalance.md),
[`getTokenAccountsByOwner`](../json-rpc/getTokenAccountsByOwner.md) and
[`getAssetsByOwner`](../json-rpc/getAssetsByOwner.md); sending via
[`sendTransaction`](../json-rpc/sendTransaction.md) and
[`sendBundle`](../json-rpc/sendBundle.md); account-change notifications via
[`accountSubscribe`](../json-rpc/accountSubscribe.md) over
[WebSocket](../../streaming/sol-pubsub.md).

The full endpoint list is below.
