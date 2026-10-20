> Live version: https://triport.io/docs/robinhood/guides/migrate-from-public-rpc

# Migrate from a public RPC to Triport

> Move a Robinhood Chain integration from a keyless public endpoint to Triport: what changes in authentication, which methods you gain, how WebSocket and the sequencer feed are reached, which limits start applying, and how to roll back without a redeploy.

This is a migration for an application that already talks to Robinhood Chain (chain ID `4663`) through a keyless endpoint — Triport's own [public endpoint](../public.md) or another provider's. Nothing about the chain changes: same chain ID, same JSON-RPC 2.0 semantics, same block and receipt shapes. What changes is **access, surface and accounting**.

## 1. What you gain, in one table

| | Keyless public | Triport keyed |
|---|---|---|
| Endpoint | `https://triport.io/rpc/robinhood/public` | `https://triport.io/rpc/robinhood` |
| Methods | 18 light reads | the full published catalog (27) — heavy reads, `debug_*` best-effort, writes |
| WebSocket | none | `wss://triport.io/ws/robinhood` — `newHeads`, `logs` (Basic+, scope `robinhood:rpc`) |
| Sequencer feed | none | `wss://triport.io/ws/robinhood-feed` (Pro+, scope `robinhood:feed`) |
| Authentication | none — a key sent here is ignored and stripped | `x-token` header (or `Authorization: Bearer`) |
| Limits | per-IP, may change without notice | per-plan, published |
| Availability | best-effort, no SLA | plan-dependent |

## 2. Authentication

Send the key as a header — this is the form to use in server-side code:

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

`Authorization: Bearer $TRIPORT_API_KEY` is accepted as well. A **keyed URL** form, `https://triport.io/r/<API_KEY>/robinhood`, exists for wallets and tools that accept only a URL — use it only there, and keep such URLs out of logs, screenshots and bug reports: the URL *is* the credential.

For a library that takes a transport, the change is a header, not a rewrite. See the [Quickstart](../quickstart.md) for viem, ethers, Hardhat and Foundry forms.

## 3. Methods: what appears after the switch

The keyless endpoint serves 18 light reads. After migrating you also get the heavy reads (`eth_getLogs` over wide ranges, `eth_getBlockReceipts`, proofs), the best-effort `debug_*` family, and transaction submission. Two rules survive the migration unchanged and deserve a re-read before you widen usage:

- `debug_*` is **best-effort with no SLA** and is not a `trace_*` substitute — see [RPC behavior](../rpc-behavior.md) and [Debugging reverts](./debugging-reverts.md).
- `safe` and `finalized` block tags are **not part of this contract**; depth-based confirmation is the supported approach.

## 4. WebSocket and the feed are new surfaces, not faster HTTP

`newHeads` and `logs` arrive over `wss://triport.io/ws/robinhood` from Basic. They are a different delivery contract, not a cheaper poll: delivery promises neither exactly-once nor ordering, so client-side de-duplication is mandatory and reorgs arrive as `removed: true`. Start from [logs](../ws/logs.md) and the worked example in [Track Stock Token transfers](./track-stock-token-transfers.md).

The sequencer feed (`wss://triport.io/ws/robinhood-feed`, Pro+) carries assembled L2 blocks with a bounded replay window — 8,192 frames, 64 MiB or five minutes, whichever comes first, lost on process restart. It is an operational buffer, not history; see [Consume the sequencer feed](./consume-the-sequencer-feed.md) and [Feed resume](../feed/resume.md).

If you are migrating in order to build an index, read [Index Robinhood Chain activity](./index-robinhood-chain-activity.md) first — it chooses between the two sources for you.

## 5. Limits start applying

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `robinhood_read_rpc` | 15 | 20 | 100 | 250 | unlimited |
| `robinhood_read_rpc_heavy` | 15 | 20 | 100 | 250 | unlimited |
| `robinhood_send_tx` | 3 | 5 | 30 | 80 | unlimited |

Concurrent feed streams: 2 on Pro, 4 on Business and Enterprise. The per-second figures carry status `unmeasured` — they are the configured policy, not a measured throughput promise. Batch bodies and the 4 MiB ceiling are accounted as described in [Limits](../limits.md).

## 6. Roll back without a redeploy

Make the endpoint a configuration value before you migrate, not after:

```bash
RPC_URL=https://triport.io/rpc/robinhood
RPC_FALLBACK_URL=https://triport.io/rpc/robinhood/public
```

Verify the new path with two calls that cannot be faked by a cached response — `eth_chainId` must return `0x1237`, and `eth_blockNumber` must advance between two calls a few seconds apart. Roll back by pointing `RPC_URL` at the previous endpoint if **either** holds: the chain ID does not match, or a method your application depends on is not in the keyless set (the 18 light reads) — in the second case the rollback is partial by definition and you should keep the keyed endpoint for those calls.

Rolling back does **not** restore WebSocket or feed access: those surfaces do not exist keyless, so any code path that depends on them must degrade to polling rather than fail.

## 7. Benchmarking methodology (RH09)

Triport does not publish a Robinhood benchmark landing, and this guide does not quote comparative latency numbers. If you need to compare providers, measure your own path:

1. **Compare like with like.** A keyless endpoint and a keyed one have different limits and different queueing; measuring one against the other measures the plan, not the network.
2. **Measure the tail, not the average.** The value of a merged receive layer shows up in the share of samples delayed beyond a threshold, not in the mean.
3. **Use an independent head.** An endpoint's own report of its height is not evidence; compare against a second source.
4. **State the window and the sample count** with every number, and keep the raw samples.

## Related

- [Public endpoint](../public.md) — the 18 keyless methods and their per-IP limits.
- [Quickstart](../quickstart.md) — connecting, keys in URLs vs headers, library forms.
- [Limits](../limits.md) — budgets, batch accounting, the body ceiling.
- [RPC behavior](../rpc-behavior.md) — how block history, state, logs, traces and feed replay differ.
