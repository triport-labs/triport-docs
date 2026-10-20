> Live version: https://triport.io/docs/robinhood/pending

# Pending data

`pending` is a snapshot of what the sequencer presents **right now**. It is not a durable stage, public mempool, or finality signal. A pending block or transaction can disappear, be replaced, or move into another block; its hash may be `null` and may later change.

Robinhood does not expose a contracted `txpool_*` surface, and `newPendingTransactions` is not available. The opt-in `robinhood_pendingBlock` subscription is a Triport snapshot stream when enabled; see [WebSocket subscriptions](./ws.md). The [sequencer feed](./feed.md) carries already assembled L2 blocks and must not be treated as a pending pool.

Reconcile by transaction hash against later canonical blocks and apply your own confirmation policy before treating state as final.
