> Live version: https://triport.io/docs/streaming

# Streaming Overview

| | |
|---|---|
| **Method / Endpoint** | gRPC `https://grpc.triport.io` and `wss://triport.io/ws/*` |
| **Network** | Networks with mounted streams |
| **Authentication** | gRPC metadata `x-token: $TRIPORT_API_KEY`; WebSocket `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) or `?api-key=` query param |
| **Required scope** | — (tier-gated per channel/method) |
| **Tier / rate limit** | Per-channel tier floor (see table); rate limiting is RPS-per-tier with burst — there is no daily quota |

## Description

Solana has one connection set, with the same API key on every entry:

| Connection | Address | Tier | Reference |
|---|---|---|---|
| Solana gRPC (Yellowstone) | `https://grpc.triport.io` | Pro | [sol-grpc](./sol-grpc.md) |
| Shred stream | `wss://triport.io/ws/sol-preexec` | Pro | [sol-preexec](./sol-preexec.md) |
| Firehose | `wss://triport.io/ws/sol-stream` | Pro | [sol-stream](./sol-stream.md) |
| WebSocket (Pub/Sub) | `wss://triport.io/ws/sol` | — | [sol-pubsub](./sol-pubsub.md) |
| HTTPS (JSON-RPC) | `https://triport.io/sol` | — | [Solana guide](../sol/index.md) |

- **gRPC (Yellowstone)** is the native `geyser.Geyser` protobuf API for
  backend services with server-side filters; Yellowstone is our gRPC endpoint,
  not a separate one, and it is not a WebSocket. Clients that take
  `host:port` use `grpc.triport.io:443`.
- **Shred stream** pushes transactions reassembled from the leader's shreds
  before the cluster executes them; on Pro it needs an account filter, e.g.
  `wss://triport.io/ws/sol-preexec?accounts=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.
- **Firehose** is one fixed WebSocket feed of every non-vote transaction;
  client filters are not applied. For filters, use gRPC (Yellowstone).
- **WebSocket (Pub/Sub)** is the standard Solana JSON-RPC subscription API
  (`accountSubscribe`, `logsSubscribe`, `slotSubscribe` and the rest).

There are six WebSocket channels. Three speak the standard JSON-RPC pub/sub shape
(`*Subscribe` → ack with a subscription id → server-pushed notifications):
the Solana pub/sub channel ([`/ws/sol`](./sol-pubsub.md)), the Ethereum
channel ([`/ws/eth`](./eth-ws.md)) and the Polygon channel
([`/ws/poly`](./poly-ws.md), which mirrors the Ethereum subscription
types). The Solana Firehose (WebSocket)
([`/ws/sol-stream`](./sol-stream.md)) is a push-only feed: every client
receives the same fixed stream of non-vote transactions as compact JSON frames
(slot, signature, fee) plus a stats frame once per second; client filters are
not applied. For account-change notifications on Solana, use
[`accountSubscribe`](../sol/json-rpc/accountSubscribe.md) on `/ws/sol`.

Per-method and per-channel access is gated by your plan tier. Subscribing to
a method above your tier does not silently fail — the server sends a
`forbidden` error frame and closes the connection with code `4003`, carrying
the `current_tier` / `required_tier` so your client can prompt for an
upgrade.

## Authentication

Every channel accepts the same two auth forms. Bearer is preferred.

**1. Bearer token (preferred).** Send it on the WebSocket upgrade request:

```bash
wscat -c wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

If your client cannot set headers on the upgrade, send the token as the
first WS frame instead:

```json
{ "jsonrpc": "2.0", "method": "auth", "params": ["$TRIPORT_API_KEY"] }
```

**2. API key query param.** Append `?api-key=` to the channel URL:

```bash
wscat -c "wss://triport.io/ws/eth?api-key=$TRIPORT_API_KEY"
```

A connection that authenticates with neither (or an invalid token) is closed
with code `4001`.

## Close codes

All channels share one set of WebSocket close codes. The numeric code travels
on the RFC-6455 close frame itself; the server usually sends a JSON
`WSErrorFrame` immediately before closing so SDKs can classify the failure.

| Close code | `error` | Meaning |
|---|---|---|
| `4001` | `unauthorized` | Missing or invalid credentials on connect. |
| `4003` | `forbidden` | Tier insufficient for the requested method, or method unknown. Frame carries `current_tier`, `required_tier`, `method`, and an `upgrade_url`. |
| `4029` | `rate_limited` / `stream_limit` | Per-tier limit reached. `rate_limited`: RPS limit exceeded, frame carries `retry_after_sec` and `limit_rps`. `stream_limit`: the key already holds its maximum number of concurrent streams on this channel. On `/ws/sol-preexec` an existing stream may instead be closed with `4029` and the plain reason `superseded_by_new_connection` when a newer stream on the same key replaced it — see [sol-preexec](./sol-preexec.md#concurrent-streams-and-reconnects). |
| `4030` | `trial_expired` | The key's trial or paid subscription has ended (a lapsed subscription also closes with `4030`). Frame carries an `upgrade_url`. |

The error frame mirrors the HTTP error envelope, so the same SDK error
classes apply. See [Errors](../errors.md) for the full envelope and field
reference.

## Channels

| Channel | Endpoint | Network | Tier floor | Status | Detail |
|---|---|---|---|---|---|
| Solana gRPC (Yellowstone) | `https://grpc.triport.io` | Solana | pro | `live` — `GetSlot`, `GetVersion` and a slots `Subscribe` answered on 2026-10-05 | [sol-grpc](./sol-grpc.md) |
| Solana shred stream | `/ws/sol-preexec` | Solana | pro | `mounted` — EU, CA | [sol-preexec](./sol-preexec.md) |
| Solana Firehose | `/ws/sol-stream` | Solana | pro | `mounted` — EU, CA | [sol-stream](./sol-stream.md) |
| Solana WebSocket (Pub/Sub) | `/ws/sol` | Solana | free (per-method: free → pro) | `mounted` — EU, CA | [sol-pubsub](./sol-pubsub.md) |
| Ethereum Pub/Sub | `/ws/eth` | Ethereum | free (per-method: free → pro) | `mounted` — EU, CA | [eth-ws](./eth-ws.md) |
| Polygon Pub/Sub | `/ws/poly` | Polygon | free (per-method: free → pro) | `mounted` — EU, CA | [poly-ws](./poly-ws.md) |
| Wallet watch events (custom) | `/ws/wallet-watch?id=…` | Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain | business | `not_verified` — requires a subscription id | [wallet-watch](../platform/wallet-watch.md) · [AsyncAPI](https://triport.io/api-specs/streaming/wallet-watch.asyncapi.yaml) |

## Base channels

| Channel | Public template | Scope | Minimum tier |
|---|---|---|---|
| JSON-RPC Pub/Sub (`newHeads`) | `{WSSBase}/ws/base/{key}` | `base:ws` | Basic |
| Normalized Flashblocks feed (address filter required) | `{WSSBase}/ws/base-feed/{key}` | `base:feed` | Pro |

The raw Flashblocks firehose is internal infrastructure and is not a client
endpoint. See [Base WS](../base/ws.md) and [Base Flashblocks](../base/flashblocks.md).

**Per-method tiers (networks with mounted WebSocket Pub/Sub).** The connection
opens on `free`, but individual subscriptions unlock at higher tiers:

- **Solana** (`/ws/sol`): `accountSubscribe`, `signatureSubscribe` → free;
  `logsSubscribe`, `programSubscribe`, `slotSubscribe`, `rootSubscribe` →
  basic; `blockSubscribe`, `voteSubscribe`, `slotsUpdatesSubscribe` → pro.
- **Ethereum** (`/ws/eth`) and **Polygon** (`/ws/poly`):
  `newPendingTransactions` → free; `logs` → basic; `newHeads`, `syncing` → pro.

**Solana stream access.** `/ws/sol-stream` is gated by tier (pro and above)
rather than RPS.

**Pre-execution stream access.** `/ws/sol-preexec` uses stream and account-filter limits:
**2** concurrent streams on pro and **4** on business; an account filter of at
most **50** entries on pro and **200** on business; and the filter is
**mandatory on pro**. Business may connect unfiltered. There is no outbound data-volume quota or per-GB traffic charge. A stream holds its slot until it is closed,
so close sockets cleanly — see
[sol-preexec → Concurrent streams and reconnects](./sol-preexec.md#concurrent-streams-and-reconnects).

## Notes

- **Fixed feed on `/ws/sol-stream`.** Unlike the JSON-RPC pub/sub
  channels, the Solana stream takes no subscription: Triport holds one upstream
  Yellowstone subscription for non-vote transactions and pushes every
  transaction to every client as a compact `tx` frame, plus a `stats` frame
  once per second. Client messages are not applied as filters (measured
  2026-09-22). It is a live, at-most-once feed — **no replay/backfill**. See
  [sol-stream](./sol-stream.md) for the frame fields and
  [sol-stream → Source, proto & delivery semantics](./sol-stream.md#source-proto--delivery-semantics).
- **Keepalives.** The Solana stream uses `Ping`/`Pong` frames.
- See [Authentication](../authentication.md) and
  [Rate limits & tiers](../rate-limits-and-tiers.md) for account-wide details.

| Network | Channel | Endpoint | Reference |
|---|---|---|---|
| Solana | gRPC (Yellowstone) | `https://grpc.triport.io` | [sol-grpc](./sol-grpc.md) |
| Solana | Shred stream | `/ws/sol-preexec` | [sol-preexec](./sol-preexec.md) |
| Solana | Firehose | `/ws/sol-stream` | [sol-stream](./sol-stream.md) |
| Solana | WebSocket (Pub/Sub) | `/ws/sol` | [sol-pubsub](./sol-pubsub.md) |
| Ethereum | Pub/Sub | `/ws/eth` | [eth-ws](./eth-ws.md) |
| Polygon | Pub/Sub | `/ws/poly` | [poly-ws](./poly-ws.md) |
| Stellar | Horizon SSE | `/rpc/stellar/horizon/{ledgers|transactions}?cursor=now` | [AsyncAPI](https://triport.io/api-specs/streaming/stellar-sse.asyncapi.yaml) |
| EVM (eth, base, polygon, bsc, robinhood) | Wallet watch events (custom) | `/ws/wallet-watch?id=…` | [wallet-watch](../platform/wallet-watch.md) |
| BNB Smart Chain | Pub/Sub (planned; not mounted) | — | No navigation link |
