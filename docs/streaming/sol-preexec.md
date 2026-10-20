> Live version: https://triport.io/docs/streaming/sol-preexec

# Solana Shred Stream (pre-execution) — /ws/sol-preexec

> The Solana **shred stream**: transactions as the validator reconstructs them
> from the leader's shreds — **before** they execute. You see the intent before
> the network sees the result.

| | |
|---|---|
| **Method / Endpoint** | `wss://triport.io/ws/sol-preexec` (WebSocket) |
| **Type** | Triport product (WebSocket) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query param) |
| **Required scope** | `sol.preexec` on the API key (`*` wildcard keys also work) |
| **Tier / rate limit** | **Pro** tier and above. Pro: 2 concurrent streams per key, account filter **required** (up to 50 accounts). Business: 4 streams, filter optional (up to 200 accounts) |

## What This Is

This is Triport's **shred stream** (also called a pre-execution or deshred
feed) — one of the five Solana connection options, next to HTTPS
`https://triport.io/sol`, WSS `wss://triport.io/ws/sol`, the
[Firehose](./sol-stream.md) `wss://triport.io/ws/sol-stream` and
[gRPC (Yellowstone)](./sol-grpc.md) `https://grpc.triport.io` (see the
[Solana guide](../sol/index.md)). Example with an
account filter:

```text
wss://triport.io/ws/sol-preexec?accounts=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

A Solana validator reassembles transactions from the shreds it receives from
the slot leader. That reassembly happens *before* the runtime executes
anything. `/ws/sol-preexec` streams those reassembled transactions: signature,
the full raw transaction, and the addresses resolved from address lookup
tables.

Triport holds one or two upstream subscriptions to validators that expose this
data, de-duplicates by signature across them, filters server-side against your
account list, and fans the result out to you. You pay for one WebSocket instead
of running your own multi-source geyser client.

> **What you do not get, by construction.** These transactions have not
> executed. There is no status, no error, no logs, no inner instructions, no
> pre/post balances and no compute-unit accounting — that information does not
> exist yet at the moment the frame is produced. A transaction in this stream
> **may fail, may be dropped, and the slot itself may be skipped.** Confirm
> outcomes through a normal commitment channel such as
> [`/ws/sol-stream`](./sol-stream.md).

## Where it sits in the slot

A frame is produced when the transaction has been reassembled from shreds,
before the runtime executes it. Commitment-level channels such as
[`/ws/sol-stream`](./sol-stream.md) report the same transaction only after
execution (`processed`) or after a vote round (`confirmed`). This page gives
no timing figures for the difference; if timing matters to you, measure both
channels from your own region.

## Related channels

| | [`/ws/sol-stream`](./sol-stream.md) | **this channel** |
|---|---|---|
| Level | account/tx/slot/block, **after** execution | **transaction-level, before execution** |
| Payload | full update with execution metadata | signature + raw tx + ALT addresses |
| Answers | "what actually executed" | "which transactions are in this slot" |
| Guarantees | executed at your chosen commitment | none |

## Endpoint

```text
wss://triport.io/ws/sol-preexec?accounts=<pubkey>,<pubkey>
```

### Query parameters

| Name | Required | Description |
|---|---|---|
| `accounts` | **yes on Pro** | Comma-separated base58 pubkeys. A frame is delivered when the transaction touches any of them, including ALT-resolved addresses. Pro allows up to 50; Business up to 200. |
| `fmt` | no | `json` (default) or `raw` — see [Frame format](./sol-preexec.md#frame-format). |

The filter is fixed for the lifetime of the connection. There is no in-stream
filter replacement: the upstream subscription is shared across all subscribers,
so a per-client filter swap would either rebuild it on every change or silently
diverge from what you asked for. To change your filter, reconnect.

**Account filtering by plan.** Pro requires an account filter. Business may connect without a filter;
Pro connections without `accounts` are refused with close code `4003`
(`filter_required`).

There is no outbound data-volume quota or per-GB traffic charge.

## Authentication

```bash
wscat -c "wss://triport.io/ws/sol-preexec?accounts=$POOL" \
  -H "Authorization: Bearer $TRIPORT_API_KEY"

# or
wscat -c "wss://triport.io/ws/sol-preexec?accounts=$POOL&api-key=$TRIPORT_API_KEY"
```

Close codes: `4001` missing/invalid credentials; `4003` forbidden — carrying
`tier_insufficient` (below Pro), `filter_required` (empty filter on Pro) or
`filter_too_wide` (more accounts than the tier allows); `4029` stream limit —
see [Concurrent streams and reconnects](./sol-preexec.md#concurrent-streams-and-reconnects).
Refusals carry a JSON close reason with an `error` field (`stream_limit`,
`filter_required`, …). See [Close codes](./index.md#close-codes) for the
shared set.

## Concurrent streams and reconnects

Each API key may hold a fixed number of `/ws/sol-preexec` connections at once:
**2 on Pro, 4 on Business**. A connection counts against the limit until the
server has closed it.

When you open a new connection while already at the limit, one of two things
happens — handle both:

| Close on | Code | Reason | What happened |
|---|---|---|---|
| your **oldest** connection | `4029` | `superseded_by_new_connection` | The new connection was accepted; the oldest one on the same key was closed to make room. |
| the **new** connection | `4029` | JSON with `"error":"stream_limit"` | The new connection was refused; your existing connections are untouched. |

A connection that disappears without a WebSocket close (process killed,
network drop) keeps its slot until the server notices it is dead. The server
sends a WebSocket ping at least every 30 seconds and closes a connection that
has not answered within 70 seconds; most WebSocket libraries answer pings
automatically. Practical consequences:

- Close your sockets cleanly on shutdown — a clean close frees the slot at once.
- Do not run more processes per key than your tier allows; a hot standby that
  stays connected uses a slot.
- On `4029`, reconnect with backoff (start around one second) instead of a
  tight loop.

## Frame format

Default (`fmt=json`), one object per transaction:

```json
{
  "signature": "5ggXGeZKdiqtr5zYSSWpvdW7MmB38P1JXwnoy1L3Dod1u2Naw9Xn3hNNpGa9cQNttiqcVPqBfYaaLuDM7SUTQbqB",
  "slot": 436349534,
  "is_vote": false,
  "tx_pb_base64": "CkAB…",
  "account_keys": ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", "…"],
  "pre_exec": true,
  "ts": 1751490000123
}
```

| Field | Type | Meaning |
|---|---|---|
| `signature` | string | base58 transaction signature. |
| `slot` | uint64 | Slot the transaction was reconstructed in. |
| `is_vote` | bool | Vote transaction flag. |
| `tx_pb_base64` | string | The transaction, **protobuf-encoded** — see the warning below. |
| `account_keys` | string[] | Static message keys first, then ALT-resolved writable, then ALT-resolved readonly, in the order instructions index them. |
| `pre_exec` | bool | Always `true`. Present so that code which mixes this stream with executed-transaction feeds cannot confuse the two. |
| `ts` | int64 | Unix milliseconds, Triport server clock, taken when the frame is built for delivery — after the upstream frame was received, de-duplicated and matched against your filter, and before it enters your connection's send buffer. It is not the leader's or the upstream validator's timestamp, and the gap between `ts` and your own receive time includes clock skew between the two machines. |

> **`tx_pb_base64` is not a wire transaction.** It is base64 of the protobuf
> encoding (`solana.storage.ConfirmedBlock.Transaction`), not Solana's canonical
> bincode wire format. You cannot pass it to `sendTransaction` without
> re-encoding. The field is named `tx_pb_base64` rather than `tx_base64`
> specifically so this is impossible to miss.

With `fmt=raw` the server forwards the upstream protobuf message unchanged.
This is cheaper on both sides, but it binds your client to the upstream schema —
prefer JSON unless you have a reason.

## Delivery semantics

- **At-most-once, no replay.** Live stream only; on a drop, reconnect and
  resume from the current moment.
- **De-duplicated by signature** across upstream sources, within a 5-second
  window. Whichever source delivers a transaction first is the one you get;
  later copies are dropped. Treat your consumer as idempotent by signature
  anyway.
- **Multi-source by default.** Individual validators episodically stall for
  seconds. A second source covers the gap without interrupting your stream; you
  do not see the failover.
- **Best-effort per client.** Each connection has a send buffer of 256 frames.
  If you stop reading and it fills, the server drops new frames for you rather
  than blocking other subscribers or queueing. Under backpressure this stream
  is sampled, not queued — read continuously and do heavy work off the socket
  thread.
- **WebSocket only.** The pre-execution stream is offered over WebSocket only.
  A gRPC equivalent (`SubscribeDeshred` through
  [gRPC (Yellowstone)](./sol-grpc.md)) is **not** available; the Yellowstone
  gRPC endpoint serves executed data.

## Example (Node.js)

```js
import WebSocket from "ws";

const pools = ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"];
const ws = new WebSocket(
  `wss://triport.io/ws/sol-preexec?accounts=${pools.join(",")}`,
  { headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` } },
);

ws.on("message", (buf) => {
  const tx = JSON.parse(buf.toString());
  // tx.pre_exec === true: this has NOT executed yet.
  // React on intent, then confirm the outcome elsewhere before treating it as fact.
  console.log(`pre-exec ${tx.signature} slot=${tx.slot}`);
});

ws.on("close", (code, reason) => {
  // 4001 unauthorized · 4003 forbidden (tier / filter)
  // 4029 stream limit: reason "superseded_by_new_connection" (a newer stream on
  // this key replaced this one) or JSON {"error":"stream_limit"} (refused).
  console.error("closed", code, reason.toString());
});

// Free the slot immediately on shutdown instead of waiting for the server to
// time the connection out.
process.on("SIGINT", () => ws.close(1000));
```

## Notes

- **Pro tier.** Gated on the `sol_preexec` tier feature, available from **Pro**
  upward. Business additionally may connect without a filter.
- **Pair with confirmation.** This is an early trigger, not a guarantee. Any
  action taken on it should be reconciled against a commitment channel. The
  [pre-execution tutorial](../guides/filter-solana-pre-execution-by-account.md)
  does this with `signatureSubscribe` on `/ws/sol`.
- See [Streaming overview](./index.md), [Authentication](../authentication.md),
  and [Rate limits & tiers](../rate-limits-and-tiers.md) for account-wide details.
