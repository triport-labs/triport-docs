> Live version: https://triport.io/docs/streaming/sol-stream

# Solana Firehose (WebSocket) — /ws/sol-stream

> The Solana Firehose: one WebSocket, `wss://triport.io/ws/sol-stream`, that pushes a fixed feed of Solana non-vote transactions as compact JSON frames — slot, signature and fee — plus a once-per-second stats frame. The server applies no per-client filter.

| | |
|---|---|
| **Method / Endpoint** | `wss://triport.io/ws/sol-stream` |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on upgrade (`Authorization: Bearer` also accepted), or `?api-key=` query param |
| **Required scope** | — (gated by tier, not scope) |
| **Tier / rate limit** | pro tier minimum (tier-matrix category `sol_yellowstone`); **not** RPS-limited |

## Description

This is the Solana Firehose (WebSocket): every non-vote transaction, one fixed
feed, no filters. If you need filters, use
[gRPC (Yellowstone)](./sol-grpc.md) at `https://grpc.triport.io` — a native
gRPC endpoint with server-side filters, not a WebSocket.

`/ws/sol-stream` is a push-only fan-out. Triport holds **one** upstream
Yellowstone subscription for non-vote transactions and forwards every
transaction it receives to every connected client, in the same compact frame
format. There is no subscribe step and no filter: all clients receive the same
feed.

Measured 2026-09-22: a client that sent a `SubscribeRequest` for `slots` was
answered with a transaction frame (`"t":"tx"`), not a slot update. The server
reads client messages only to notice that the connection closed; their content
is ignored.

Use this channel when you want the whole non-vote transaction flow as a
signal — for example, to count or sample activity, or to trigger your own
reads. To follow specific accounts, programs or slots, use the JSON-RPC
pub/sub channel [`/ws/sol`](./sol-pubsub.md) (`accountSubscribe`,
`logsSubscribe`, `slotSubscribe`, …) or [gRPC (Yellowstone)](./sol-grpc.md)
at `https://grpc.triport.io`, where the filter you send is applied.

## Source, proto & delivery semantics

| Property | Value |
|---|---|
| Upstream | One Yellowstone Geyser subscription on Triport-operated Solana hosts, requesting transactions with `vote: false` and `failed: false`; the hub can switch between configured sources |
| Client filters | **Not applied.** Client messages are read only to detect a close; a message larger than 1 KiB closes the connection |
| Frames | `tx` (one per transaction) and `stats` (once per second) — see [Response](./sol-stream.md#response) |
| Commitment | Not selectable by the client |
| Delivery | **At-most-once push — no replay or backfill** of transactions produced before you connected |
| Backpressure | Each client has a bounded buffer; when it is full, frames for that client are **dropped**, not queued (the hub-wide drop share is in the `stats` frame) |
| Keepalive | The server sends a WebSocket ping every 30 s; standard clients answer with a pong automatically |

There is no cursor or historical replay on this channel. To fill a gap, fetch
the missed range over JSON-RPC (e.g. [`getBlock`](../sol/json-rpc/getBlock.md) /
[`getSignaturesForAddress`](../sol/json-rpc/getSignaturesForAddress.md)).

## Parameters

There are no subscription parameters. The only inputs are the API key
(header or `?api-key=`) on the upgrade request.

## Request

Open the connection; frames start arriving without any message from you.
The example uses [`websocat`](https://github.com/vi/websocat):

```bash
websocat -H="Authorization: Bearer $TRIPORT_API_KEY" \
  wss://triport.io/ws/sol-stream
```

Static-key alternative (no header), using the query form:

```bash
websocat "wss://triport.io/ws/sol-stream?api-key=$TRIPORT_API_KEY"
```

## Response

Every frame is a JSON object with a `t` field naming its kind.

A transaction frame:

```json
{ "t": "tx", "l": 449495511, "s": "3zc9xQTnBwpa...GRo", "f": 5000, "urps": 0, "brps": 0, "drop": 0, "cc": 0 }
```

A stats frame (once per second; the values here are illustrative):

```json
{ "t": "stats", "urps": 3120, "brps": 3118, "drop": 0.1, "cc": 42 }
```

### Response fields

| Field | Frame | Type | Description |
|---|---|---|---|
| `t` | all | `string` | `tx` or `stats`. |
| `l` | `tx` | `integer` | Slot of the transaction. |
| `s` | `tx` | `string` | Transaction signature, base58. |
| `f` | `tx` | `integer` | Fee in lamports; omitted when zero or unknown. |
| `e` | `tx` | `boolean` | Present and `true` only for a failed transaction; omitted otherwise. |
| `urps` | `stats` | `number` | Transactions received from upstream in the last second. On `tx` frames it is always `0`. |
| `brps` | `stats` | `number` | Frames broadcast in the last second. On `tx` frames it is always `0`. |
| `drop` | `stats` | `number` | Share of frames dropped for slow clients in the last second, percent. On `tx` frames it is always `0`. |
| `cc` | `stats` | `integer` | Clients connected to the hub. On `tx` frames it is always `0`. |

A `tx` frame carries no instructions, accounts, logs or balances. Read the full
transaction with [`getTransaction`](../sol/json-rpc/getTransaction.md) when you
need it.

## Keepalive

Nothing to send. The server pings every 30 seconds and extends the read
deadline on each pong; WebSocket libraries answer pings automatically.

## Errors

| When | What you get |
|---|---|
| No key or an unknown key | HTTP `401` on the upgrade request; no WebSocket is opened. |
| Key below pro | The upgrade succeeds, then one text frame with the error envelope and a close with code `4003`. |
| Trial or subscription expired | The upgrade succeeds, then an error frame and a close with code `4030`. |

Example frame before a `4003` close:

```json
{
  "error": "tier_insufficient",
  "message": "…",
  "current_tier": "free",
  "required_tier": "pro",
  "method": "/ws/sol-stream",
  "category": "sol_yellowstone",
  "upgrade_url": "…"
}
```

See the shared [errors page](../errors.md) for the full `WSErrorFrame` envelope
and SDK error-class mapping.

## Examples

### JavaScript (`ws`)

```js
import WebSocket from "ws";

const ws = new WebSocket("wss://triport.io/ws/sol-stream", {
  headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` },
});

ws.on("message", (raw) => {
  const f = JSON.parse(raw);
  if (f.t === "tx") console.log("tx", f.s, "@ slot", f.l, "fee", f.f ?? 0);
  else if (f.t === "stats") console.log("upstream tx/s", f.urps, "dropped %", f.drop);
});
```

## Notes

- **One feed for everyone.** The server does not apply per-client filters on
  this channel; filter on your side, or use [`/ws/sol`](./sol-pubsub.md) or
  [Yellowstone gRPC](./sol-grpc.md) when the filter must run server-side.
- **Not RPS-limited.** The channel is gated by tier (pro and above); there is
  no per-message RPS bucket and no daily quota.
- **Pick the right channel.** For Ethereum/Polygon streams see
  [`/ws/eth`](./eth-ws.md) and [`/ws/poly`](./poly-ws.md). For account-change
  notifications, use [`accountSubscribe`](../sol/json-rpc/accountSubscribe.md) on `/ws/sol`.
