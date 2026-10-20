> Live version: https://triport.io/docs/robinhood/rpc-behavior

# Robinhood RPC behavior and measurements

This page describes exclusions from the Triport contract and the limits of the measured Robinhood surface. An exclusion does not establish absence throughout the network.

- `txpool_*` is not part of the Triport contract: `txpool_content` had 1/11 `OK` hosts in the original EU matrix, below the threshold of at least 2 hosts from that measurement point. The separate local addendum had 2/11 `OK` hosts; it does not replace the original EU evidence. A direct read in diagnostic N5-D-rh-D returned HTTP 200 with `{"pending":{},"queued":{}}`. This proves that the method answered, not that a useful mempool is exposed. `txpool_status` and `txpool_inspect` have 0 confirmed `OK` hosts in both matrices. The live [feed](./feed.md) is the nearest analogue, not a drop-in mempool API.
- `eth_syncing` is disabled on some channels. Even where it returns, do not treat its result as a trustworthy view of pool health; compare heads and freshness.
- `eth_getLogs` is limited differently on every channel. Deep ranges may be assembled from block receipts, and that reconstruction is slower than direct log retrieval.
- Archive depth is measured, not “full archive.” The earliest measured state floor is block `55,782,445`; another archive-capable channel begins at block `56,772,445` (direct-channel measurement, September 2026).
- Feed history is not available: the [feed](./feed.md) is not a historical API. It keeps a bounded in-memory replay window (at most 8,192 frames, 64 MiB, or five minutes), and a client can resume inside it with `?from_sequence=`; the `resume.bufferComplete` flag says whether the window still covers the cursor. The window is lost on process restart; older ranges must be reconciled through RPC or your own store.
- L2 blob transaction type `0x03` was not observed in 13,652 feed transactions across three independent windows. L1 blobs are the rollup's data-availability layer, not evidence of L2 blob transactions, so this guide makes no L2 blob-support claim. Unrecognized future types are preserved instead of rejected.
- Public testnet chain ID `46630` exists with public RPC, feed, and [explorer](https://explorer.testnet.chain.robinhood.com/), but Triport does not proxy it.
- Pinax, Envio, Goldsky, and SQD indexing surfaces remain behind future gates (`D7`) and are not Triport products in this guide.
- Lighter private channels are not part of Triport's public contract.

Measured capacity figures are evidence rather than product claims:

- `250–260 RPS` for one channel — direct-channel prototype measurement, September 2026; the Triport path is unmeasured pending `N5-D-rh-C`.
- `~1,500 RPS` for a six-channel pool — estimate from direct-channel measurements (`6 × 250`), September 2026; the Triport path is unmeasured pending `N5-D-rh-C`.
- `361 heads/s` — direct-channel prototype measurement, September 2026; the Triport path is unmeasured pending `N5-D-rh-C`.
- `73.8 tx/s` — direct-channel prototype measurement, September 2026; the Triport path is unmeasured pending `N5-D-rh-C`.

The transaction submission catalog includes both [`eth_sendRawTransaction`](./json-rpc/eth_sendRawTransaction.md) and [`eth_sendRawTransactionConditional`](./json-rpc/eth_sendRawTransactionConditional.md). A returned hash means the request was routed; the receipt decides inclusion.

Evidence distinguishes three cases: **absent on all measured hosts** requires every observation to be `MISSING`; **below the contract threshold** allows successful replies without enough qualifying hosts; **unmeasured without a key** is `NEEDS_KEY`, not `MISSING`. Neither txpool nor parity trace has evidence of absence throughout the network. `ERROR`, `FLAPPING`, and unknown observations also do not prove absence.

The original EU matrix and the separate local addendum — both internal diagnostics — record different measurement points on September 7, 2026. Counts below come from their EU and local JSON exports; every cell counts distinct hosts. Other means an error, flapping, or unknown outcome.

| Method | Point | OK | MISSING | NEEDS_KEY | Other | Total |
|---|---|---:|---:|---:|---:|---:|
| `trace_block` | EU | 0 | 5 | 4 | 2 | 11 |
| `trace_call` | EU | 0 | 4 | 4 | 3 | 11 |
| `trace_filter` | EU | 0 | 5 | 4 | 2 | 11 |
| `trace_transaction` | EU | 0 | 5 | 4 | 2 | 11 |
| `txpool_content` | EU | 1 | 5 | 3 | 2 | 11 |
| `txpool_inspect` | EU | 0 | 6 | 2 | 3 | 11 |
| `txpool_status` | EU | 0 | 6 | 2 | 3 | 11 |
| `trace_block` | local | 0 | 4 | 5 | 2 | 11 |
| `trace_call` | local | 0 | 4 | 5 | 2 | 11 |
| `trace_filter` | local | 0 | 4 | 5 | 2 | 11 |
| `trace_transaction` | local | 0 | 4 | 5 | 2 | 11 |
| `txpool_content` | local | 2 | 3 | 4 | 2 | 11 |
| `txpool_inspect` | local | 0 | 5 | 3 | 3 | 11 |
| `txpool_status` | local | 0 | 5 | 3 | 3 | 11 |
