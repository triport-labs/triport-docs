> Live version: https://triport.io/docs/robinhood/guides/index-robinhood-chain-activity

# Index Robinhood Chain activity

> Build your own index of Robinhood Chain activity: choose between `eth_getLogs` and the sequencer feed, key events so duplicates collapse, compute continuity yourself, survive reorgs, and checkpoint so a crash costs a replay instead of data.

Triport publishes **no indexed address-history endpoint** for Robinhood mainnet (chain ID `4663`) — no history depth, no indexed-through block, no pagination contract. See [address history availability](../address-history.md) for exactly which activity classes have RPC inputs and what each one still requires. This guide is the other half of that page: **how to build the index those inputs feed.**

Two working programs accompany it, shipped in the examples directory of the `@triport/sdk` TypeScript package. They are unit-tested, and every rule below is pinned by a test in one of them:

| Example | What it demonstrates |
|---|---|
| `robinhood-logs-monitor` | Log identity, reorg undo, checkpointing, `eth_getLogs` backfill with range splitting. |
| `robinhood-feed-consumer` | Frame branching, durable cursor, self-computed continuity, reconcile plan when the replay window falls short. |

## 1. Pick the source deliberately

| Source | Use it when | Limits that decide |
|---|---|---|
| `eth_getLogs` + `eth_getBlockByNumber` | You index a **subset** (one token, one contract, one topic). | Range must be split; historical reads are plan-limited. |
| Sequencer feed (`/ws/robinhood-feed`, Pro) | You index **everything** as it is produced. | Bounded replay window only — 8,192 frames, 64 MiB or five minutes, whichever comes first, and it is lost on restart. |

Neither is a historical API. [RPC behavior](../rpc-behavior.md) separates block history, state, logs, traces and feed replay — read it before assuming one substitutes for another. `sequenceNumber` in the feed **is** the L2 block number, which makes the mapping between the two sources direct.

## 2. Key every record so duplicates collapse

Delivery promises neither exactly-once nor ordering. Key a log on the full tuple `(blockHash, transactionHash, logIndex)`:

- `transactionHash` alone is wrong — one transaction emits many logs;
- `blockNumber` instead of `blockHash` is wrong — after a reorg the replacement sits at the **same height** in a different block, and keying on height silently drops it.

Feed messages key on `sequenceNumber`, which the layer already de-duplicates upstream; your own window still matters after a reconnect.

## 3. Compute continuity yourself

The feed reports `sourceGapsObserved` in its `reconciliation` object. That counter describes what the **hub** saw upstream — it says nothing about what reached **you**. Track the last sequence you processed and compare each arrival to it. A hole is your finding, not the server's announcement.

The same applies to the confirmation watermark: treat `confirmedSequenceNumberMessage` and `latestConfirmedSequence` as upstream-feed confirmation, not as stronger finality than Robinhood itself provides.

## 4. Survive reorgs without losing the undo

A log delivered with `removed: true` carries the **same tuple** as the log it cancels — only the replacement from the new canonical block is a different tuple. Two consequences that a plain "have I seen this key?" set gets wrong:

1. A seen-set drops the cancellation, so the undo never runs and your index keeps a balance it was told to retract.
2. The cancellation can arrive **before** the log it cancels: cancellations are released immediately while ordinary logs may be held briefly to close an index gap. Record a cancelled tuple as a tombstone, never run an undo for work that was never applied, and never apply a tuple that is already tombstoned.

See [`logs`](../ws/logs.md) for the contract wording and [Track Stock Token transfers §3–§4](./track-stock-token-transfers.md) for the subscription walkthrough.

## 5. Checkpoint after the work, never on arrival

Persist the cursor **after** downstream work commits, not when a record arrives. A cursor saved on arrival turns a crash into permanent data loss; a cursor saved late only costs a replay, which de-duplication absorbs. Serialise the writes — a later record must not persist its position before an earlier one.

Store the **highest processed** position, not the last one you happened to see: neither the feed's `messages` array nor log delivery promises internal ordering.

## 6. Recover after downtime

Reconnect to the feed with `?from_sequence=<last fully processed>` and read the `resume` control frame first — it is always the first frame on a resume. When `bufferComplete` is false, the reaction is always "read it yourself", but **the range differs by cause**:

| Why it is false | What to re-read |
|---|---|
| Cursor older than the window | `cursor + 1 … earliestAvailableSequence − 1`; replay delivers the rest. |
| Window empty (`earliest` and `latest` both `0`) — normal after a service restart | `cursor + 1` up to the head you fetch over RPC. The frame cannot tell you where the chain is. |
| Cursor ahead of the window | Nothing. This is a corrupt or foreign cursor; reconciling would hide it. |
| A retained frame could not be decoded | Nothing — the hole is inside the window and its bounds are unknown; per-record continuity catches it. |

For a log subscription there is no cursor at all: the subscription buffers nothing for a disconnected client, so every reconnect needs an `eth_getLogs` backfill with split ranges.

## 7. What this does not give you

- No complete address history — internal transfers need traces, and `debug_*` on this chain is best-effort with no SLA.
- No proof of absence: an empty result from an explorer does not establish that an address has no history. Compare an explorer's latest block with an independent RPC head before trusting it.

## Related

- [Address history availability](../address-history.md) — which activity classes have inputs, and what each still needs.
- [RPC behavior](../rpc-behavior.md) — how block history, state, logs, traces and feed replay differ.
- [Sequencer feed](../feed.md) and [Resume](../feed/resume.md) — the delivery model and the cursor protocol.
- [Consume the sequencer feed](./consume-the-sequencer-feed.md) — the feed walkthrough this guide points at.
- [Limits](../limits.md) — request budgets that apply to every backfill.
