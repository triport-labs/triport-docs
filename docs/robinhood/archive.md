> Live version: https://triport.io/docs/robinhood/archive

# Robinhood archive depth

> How far back Robinhood Chain state and logs can be read through Triport: measured floors rather than a "full archive" claim, and what to do when a range is too deep.

Archive depth here is **measured, not promised**. The earliest measured state floor is block `55,782,445`; another archive-capable channel begins at block `56,772,445` (direct-channel measurement, September 2026). Those are observations from specific channels at a specific time, not a contract that every historical block is readable.

## What this means in practice

- A state read (`eth_getBalance`, `eth_call`, `eth_getStorageAt`, [`eth_getProof`](./json-rpc/eth_getProof.md)) at a block below the floor of the serving channel fails rather than returning a silently wrong answer.
- Depth can differ between channels, so a range that worked once is not guaranteed to work later. Treat a depth failure as an expected condition and retry with a shallower block, a narrower range, or your own stored data.
- A full state archive from block zero is **not confirmed** for this network — do not design on that assumption.

## Deep log ranges

`eth_getLogs` range and result ceilings depend on the serving channel. Triport may split a deep range or reconstruct it from block receipts; reconstruction is slower and can still fail when no eligible historical channel exists. Split wide ranges yourself, retry the failed slice, and treat a timeout as "narrow the range", not "no data". See [`eth_getLogs`](./json-rpc/eth_getLogs.md) and [Limits](./limits.md).

## Do not trust `eth_syncing` for depth

[`eth_syncing`](./json-rpc/eth_syncing.md) is disabled on some channels, and where it answers, its result is not a trustworthy view of pool health or history coverage. Compare heads and data freshness instead of relying on it.

## Building your own history

Blocks, receipts and logs are readable, and [debug traces](./debug.md) add internal-call detail on a best-effort basis — that is enough to build an index, but it is not a ready-made history API. Triport does not publish an indexed address history for Robinhood Chain; see [address history](./address-history.md). The [sequencer feed](./feed.md) is a live stream with a short operational replay window, not a source of historical replay.
