> Live version: https://triport.io/docs/sol/json-rpc/slotsUpdatesSubscribe

# slotsUpdatesSubscribe

> Subscribes to fine-grained slot lifecycle events — shreds received, bank created, frozen, dead, optimistically confirmed, rooted — for every slot the node observes.

| | |
|---|---|
| **Method / Endpoint** | `slotsUpdatesSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | pro+ — per-method tier gating on `/ws/sol` |

## Description

Where [`slotSubscribe`](./slotSubscribe.md) emits one frame per processed
slot, `slotsUpdatesSubscribe` opens the hood: it streams a
`slotsUpdatesNotification` for **every stage** of a slot's life as the node
sees it. The `type` field names the stage — `firstShredReceived` (the first
piece of the leader's block arrived over the network), `createdBank`
(execution began), `completed` (all shreds received), `frozen` (the bank hash
was computed; a `stats` object reports transaction counts), `dead` (the slot
was abandoned — a skipped or failed block), `optimisticConfirmation` (a
supermajority of stake voted on it), and `root` (finalized). Each event
carries the `slot`, a nanosecond-scale `timestamp` from the node's clock, and
for `createdBank` the `parent` slot.

It takes no parameters, and it is a firehose: expect several events per slot,
i.e. ten-plus frames per second sustained. The audience is correspondingly
specialized — latency engineering and cluster observability rather than
application logic. Use it to measure block-propagation timing
(`firstShredReceived` → `completed` deltas), to detect skipped slots and
leader failures in real time via `dead` events, to trade on
`optimisticConfirmation` (which lands well before full finality), or to build
per-slot pipelines that need to distinguish "replayed" from "confirmed" from
"rooted" states precisely.

Handle it defensively. The method is flagged **unstable** in stock Solana:
event names and semantics can change between releases, and not every RPC
setup exposes it — Triport serves it on `/ws/sol`, but code written against
it is less portable than the stable families. Events describe the *serving
node's* pipeline, so timings differ between nodes, and during forks you will
see updates for slots that later die. There is no replay: a reconnect loses
the intervening events and you must resubscribe (session-scoped, as always).
If all you need is "a new slot happened" or "finality advanced", the far
cheaper `slotSubscribe` / [`rootSubscribe`](./rootSubscribe.md) are the right
tools. Stop the stream with
[`slotsUpdatesUnsubscribe`](./slotsUpdatesUnsubscribe.md).

## Parameters

None — `params` is an empty array (or omitted).

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"slotsUpdatesSubscribe"}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 9932 }
```

A stream of per-stage events follows, several per slot:

```json
{
  "jsonrpc": "2.0",
  "method": "slotsUpdatesNotification",
  "params": {
    "subscription": 9932,
    "result": {
      "slot": 348392112,
      "timestamp": 1755500001756,
      "type": "optimisticConfirmation"
    }
  }
}
```

A `frozen` event additionally carries execution stats:

```json
{
  "jsonrpc": "2.0",
  "method": "slotsUpdatesNotification",
  "params": {
    "subscription": 9932,
    "result": {
      "slot": 348392112,
      "timestamp": 1755500001514,
      "type": "frozen",
      "stats": {
        "numTransactionEntries": 448,
        "numSuccessfulTransactions": 1230,
        "numFailedTransactions": 41,
        "maxTransactionsPerEntry": 12
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `slotsUpdatesUnsubscribe`. |
| `params.result.slot` | integer | The slot the event refers to. |
| `params.result.timestamp` | integer | Node-local Unix timestamp (milliseconds) of the event. |
| `params.result.type` | string | `firstShredReceived`, `completed`, `createdBank`, `frozen`, `dead`, `optimisticConfirmation`, or `root`. |
| `params.result.parent` | integer | Parent slot — present on `createdBank`. |
| `params.result.stats` | object | Transaction-count stats — present on `frozen`. |
| `params.result.err` | string | Reason the slot died — present on `dead`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `4003` | `forbidden` | Your tier is below `pro` (`tier_insufficient`). |
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **Firehose:** several events per slot, 10+ frames/sec — consume off the
  socket quickly or you will build backpressure.
- **Unstable API:** event set and shapes may shift between Solana releases;
  gate on `type` values you know and ignore unknown ones.
- **Node-local view:** timestamps and ordering reflect the serving node, not
  a cluster-wide truth; `dead` slots are normal fork noise.
- **Related methods:**
  [`slotsUpdatesUnsubscribe`](./slotsUpdatesUnsubscribe.md),
  [`slotSubscribe`](./slotSubscribe.md) (one event per slot),
  [`rootSubscribe`](./rootSubscribe.md) (finality only).
