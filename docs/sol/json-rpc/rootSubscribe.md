> Live version: https://triport.io/docs/sol/json-rpc/rootSubscribe

# rootSubscribe

> Subscribes to root changes and streams a notification each time the node sets a new root — the finalized watermark of the chain.

| | |
|---|---|
| **Method / Endpoint** | `rootSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`rootSubscribe` streams the advance of the node's **root** — the highest slot
that has been finalized by supermajority vote and can never be rolled back.
It takes no parameters; each `rootNotification` carries a single integer, the
new root slot. Where [`slotSubscribe`](./slotSubscribe.md) follows the
*processed* tip of the chain (fast, but on a fork that can still switch),
`rootSubscribe` follows the *finalized* trailing edge, typically a few dozen
slots — around 15–30 seconds — behind that tip.

This is the stream to build on when irreversibility is the trigger. Typical
consumers: exchange and payment backends that credit a deposit only once the
slot containing it is at or below the root; indexers that keep a reorg-safe
cursor and only persist data up to the rooted slot; bridges and settlement
systems that release an action when a Solana event becomes final; and
snapshot or ETL jobs that use root advancement as a safe high-water mark. The
pattern is always the same — record the slot your event landed in, then wait
for a `rootNotification` whose value is greater than or equal to it.

Expectations to calibrate: notifications are frequent (roots advance nearly
every slot on a healthy cluster) but the value can jump by several slots at a
time, so treat the stream as "root is now ≥ N", not as a per-slot tick.
The root is the serving node's local view; different nodes root at slightly
different moments, though never in a contradictory order. A stalled root
stream while slot notifications keep flowing is a meaningful cluster-health
signal (finality is lagging). And like every Pub/Sub subscription it lives
only within the current WebSocket session — resubscribe after a reconnect,
and use `getSlot` with `finalized` commitment to re-baseline. Stop the stream
with [`rootUnsubscribe`](./rootUnsubscribe.md).

## Parameters

None — `params` is an empty array (or omitted).

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"rootSubscribe"}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 1804 }
```

Each new root is pushed as a `rootNotification` whose `result` is the slot
number itself:

```json
{
  "jsonrpc": "2.0",
  "method": "rootNotification",
  "params": {
    "subscription": 1804,
    "result": 348392008
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `rootUnsubscribe`. |
| `params.result` | integer | The new root slot (finalized watermark). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `4003` | `forbidden` | Your tier is below `basic` (`tier_insufficient`). |
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **Root = finalized:** anything at or below the rooted slot is irreversible;
  this is the strongest signal the chain offers.
- **Values can jump:** treat each notification as a monotonic watermark, not
  a per-slot tick.
- **Scalar payload:** unlike most families, `params.result` is a bare
  integer, not a `context`/`value` envelope.
- **Related methods:** [`rootUnsubscribe`](./rootUnsubscribe.md),
  [`slotSubscribe`](./slotSubscribe.md) (processed tip),
  [`signatureSubscribe`](./signatureSubscribe.md) with `finalized` commitment
  (finality of one transaction).
