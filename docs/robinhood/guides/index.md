> Live version: https://triport.io/docs/robinhood/guides

# Robinhood Chain guides

> Task-based walkthroughs for Robinhood Chain: tracking token transfers, wallet backends, the sequencer feed, conditional submission and debugging reverts — each built on the measured contract, not on assumptions.

The [method pages](../json-rpc/index.md) describe one call at a time. These guides put several of them together into a working task, and are explicit about the parts of the contract that change how you must write the code — de-duplication, reorgs, recovery after a disconnect.

| Guide | What it covers |
|---|---|
| [Track Stock Token transfers](./track-stock-token-transfers.md) | Subscribe to ERC-20 `Transfer` logs over WebSocket, de-duplicate by `(blockHash, transactionHash, logIndex)`, undo on `removed`, and backfill a gap with `eth_getLogs`. |
| [Build a wallet backend](./build-a-wallet-backend.md) | Balances, nonce allocation when the `pending` tag is not a commitment, pricing on a first-come-first-served sequencer, submitting once, and depth-based confirmation without `safe`/`finalized`. |
| [Consume the sequencer feed](./consume-the-sequencer-feed.md) | A durable cursor, resuming with `from_sequence`, reading the `resume` frame, the three causes of `bufferComplete: false`, and reconciling a gap through JSON-RPC. |
| [Conditional transactions](./conditional-transactions.md) | The five inclusion options, a `blockNumberMax` deadline, `knownAccounts` state pinning, and why a local `-32602` and a condition that stops holding need different responses. |
| [Debugging reverts with `debug_traceCall`](./debugging-reverts.md) | Trace a call that was never sent, decode the revert payload by selector, pin the right block, and where `debug_*` stops being reliable — best-effort, no SLA, and not a `trace_*` substitute. |
| [Migrate from a public RPC to Triport](./migrate-from-public-rpc.md) | What changes when you move off a keyless endpoint: authentication, the methods that appear, WebSocket and feed as new surfaces, the limits that start applying, a rollback that needs no redeploy, and how to benchmark honestly. |
| [Index Robinhood Chain activity](./index-robinhood-chain-activity.md) | Choosing between `eth_getLogs` and the sequencer feed, keying records so duplicates collapse, computing continuity yourself, tombstoning reorged records, and checkpointing after the work — with two unit-tested example programs. |

## Before you start

Every guide assumes you already have a key and a working connection. Read the [Quickstart](../quickstart.md) first, and keep [Limits](../limits.md) nearby — request budgets, the 4 MiB body ceiling and batch accounting apply to everything below.
