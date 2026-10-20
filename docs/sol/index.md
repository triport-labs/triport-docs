> Live version: https://triport.io/docs/sol

# Solana RPC & APIs

One key covers the full Solana JSON-RPC surface, DAS and priority-fee extensions, indexed REST wallet history, and real-time streaming.

**Connect to Solana.** Five connection options, one API key (`x-token: $TRIPORT_API_KEY`; on gRPC as `x-token` metadata, on WebSockets also `?api-key=`):

| Connection | Address | Tier | Reference |
|---|---|---|---|
| HTTPS (JSON-RPC) | `https://triport.io/sol` | — | [Quickstart](./index.md#quickstart) |
| WSS (JSON-RPC Pub/Sub) | `wss://triport.io/ws/sol` | — | [sol-pubsub](../streaming/sol-pubsub.md) |
| Firehose (WebSocket) | `wss://triport.io/ws/sol-stream` | Pro | [sol-stream](../streaming/sol-stream.md) |
| gRPC (Yellowstone) | `https://grpc.triport.io` | Pro | [sol-grpc](../streaming/sol-grpc.md) |
| Shred stream | `wss://triport.io/ws/sol-preexec` | Pro | [sol-preexec](../streaming/sol-preexec.md) |

The firehose is one fixed WebSocket feed of every non-vote transaction, with no filters. For server-side filters use gRPC (Yellowstone) — a native gRPC endpoint, not a WebSocket; clients that take `host:port` use `grpc.triport.io:443`.

The shred stream pushes transactions reassembled from the leader's shreds before the cluster executes them; on Pro it needs an account filter, e.g. `wss://triport.io/ws/sol-preexec?accounts=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/sol` | Solana mainnet | — | `x-token: $TRIPORT_API_KEY` | `solana:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/sol` | Backend path `/rpc` |
| WSS | `wss://triport.io/ws/sol` | Registry path `/ws/sol` |
| REST | Product routes | [REST catalog](./rest/index.md) |
| Stream contract | sol pubsub | [AsyncAPI](https://triport.io/api-specs/streaming/sol-pubsub.asyncapi.yaml) |
| Stream contract | sol stream | [AsyncAPI](https://triport.io/api-specs/streaming/sol-stream.asyncapi.yaml) |

## Quickstart

```bash
curl https://triport.io/sol \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[]}'
```

## What's available

**60 JSON-RPC methods** in the OpenRPC catalog:

- `sol_read_rpc`: 46
- `sol_das`: 6
- `sol_read_rpc_heavy`: 3
- `sol_send_tx`: 2
- `sol_send_bundle`: 1
- `sol_sim_bundle`: 2

Solana-specific features include DAS asset lookup, routed transaction landing, bundles, indexed wallet history, and streams ranging from Pub/Sub and the Firehose to gRPC (Yellowstone) and the shred stream.

## Limits

See [network limits](./limits.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `sol_gpa_snapshot` | — | — | — | 100 RPS sustained · up to 200 burst | unlimited |
| `sol_read_rpc` | 20 RPS sustained · up to 40 burst | 60 RPS sustained · up to 120 burst | 200 RPS sustained · up to 400 burst | 600 RPS sustained · up to 1200 burst | unlimited |
| `sol_read_rpc_heavy` | 2 RPS sustained · up to 4 burst | 5 RPS sustained · up to 10 burst | 20 RPS sustained · up to 40 burst | 80 RPS sustained · up to 160 burst | unlimited |
| `sol_send_bundle` | — | — | 10 RPS sustained · up to 20 burst | 30 RPS sustained · up to 60 burst | unlimited |
| `sol_send_tx` | 5 RPS sustained · up to 10 burst | 10 RPS sustained · up to 20 burst | 50 RPS sustained · up to 100 burst | 150 RPS sustained · up to 300 burst | unlimited |
| `sol_sim_bundle` | — | — | 5 RPS sustained · up to 10 burst | 15 RPS sustained · up to 30 burst | unlimited |

Requests use sustained per-category RPS with a 2x burst and no daily quota. Streaming connections have separate tier gates.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

## Methods

### sol read rpc (46)

- [`getAccountInfo`](./json-rpc/getAccountInfo.md)
- [`getBalance`](./json-rpc/getBalance.md)
- [`getBlock`](./json-rpc/getBlock.md)
- [`getBlockCommitment`](./json-rpc/getBlockCommitment.md)
- [`getBlockHeight`](./json-rpc/getBlockHeight.md)
- [`getBlockProduction`](./json-rpc/getBlockProduction.md)
- [`getBlockTime`](./json-rpc/getBlockTime.md)
- [`getBlocks`](./json-rpc/getBlocks.md)
- [`getClusterNodes`](./json-rpc/getClusterNodes.md)
- [`getEpochInfo`](./json-rpc/getEpochInfo.md)
- [`getEpochSchedule`](./json-rpc/getEpochSchedule.md)
- [`getFeeForMessage`](./json-rpc/getFeeForMessage.md)
- [`getFirstAvailableBlock`](./json-rpc/getFirstAvailableBlock.md)
- [`getGenesisHash`](./json-rpc/getGenesisHash.md)
- [`getHealth`](./json-rpc/getHealth.md)
- [`getIdentity`](./json-rpc/getIdentity.md)
- [`getInflationGovernor`](./json-rpc/getInflationGovernor.md)
- [`getInflationRate`](./json-rpc/getInflationRate.md)
- [`getInflationReward`](./json-rpc/getInflationReward.md)
- [`getLatestBlockhash`](./json-rpc/getLatestBlockhash.md)
- [`getLeaderSchedule`](./json-rpc/getLeaderSchedule.md)
- [`getMaxRetransmitSlot`](./json-rpc/getMaxRetransmitSlot.md)
- [`getMaxShredInsertSlot`](./json-rpc/getMaxShredInsertSlot.md)
- [`getMinimumBalanceForRentExemption`](./json-rpc/getMinimumBalanceForRentExemption.md)
- [`getMultipleAccounts`](./json-rpc/getMultipleAccounts.md)
- [`getPriorityFeeEstimate`](./json-rpc/getPriorityFeeEstimate.md)
- [`getRecentPerformanceSamples`](./json-rpc/getRecentPerformanceSamples.md)
- [`getRecentPrioritizationFees`](./json-rpc/getRecentPrioritizationFees.md)
- [`getSignaturesForAddress`](./json-rpc/getSignaturesForAddress.md)
- [`getSlot`](./json-rpc/getSlot.md)
- [`getSlotLeader`](./json-rpc/getSlotLeader.md)
- [`getSlotLeaders`](./json-rpc/getSlotLeaders.md)
- [`getStakeMinimumDelegation`](./json-rpc/getStakeMinimumDelegation.md)
- [`getSupply`](./json-rpc/getSupply.md)
- [`getTokenAccountBalance`](./json-rpc/getTokenAccountBalance.md)
- [`getTokenAccountsByDelegate`](./json-rpc/getTokenAccountsByDelegate.md)
- [`getTokenAccountsByOwner`](./json-rpc/getTokenAccountsByOwner.md)
- [`getTokenAccountsByOwnerV2`](./json-rpc/getTokenAccountsByOwnerV2.md)
- [`getTokenLargestAccounts`](./json-rpc/getTokenLargestAccounts.md)
- [`getTokenSupply`](./json-rpc/getTokenSupply.md)
- [`getTransaction`](./json-rpc/getTransaction.md)
- [`getTransactionCount`](./json-rpc/getTransactionCount.md)
- [`getVersion`](./json-rpc/getVersion.md)
- [`getVoteAccounts`](./json-rpc/getVoteAccounts.md)
- [`isBlockhashValid`](./json-rpc/isBlockhashValid.md)
- [`minimumLedgerSlot`](./json-rpc/minimumLedgerSlot.md)

### sol das (6)

- [`getAsset`](./json-rpc/getAsset.md)
- [`getAssetProof`](./json-rpc/getAssetProof.md)
- [`getAssetsByGroup`](./json-rpc/getAssetsByGroup.md)
- [`getAssetsByOwner`](./json-rpc/getAssetsByOwner.md)
- [`getTokenAccounts`](./json-rpc/getTokenAccounts.md)
- [`searchAssets`](./json-rpc/searchAssets.md)

### sol read rpc heavy (3)

- [`getProgramAccounts`](./json-rpc/getProgramAccounts.md)
- [`getProgramAccountsV2`](./json-rpc/getProgramAccountsV2.md)
- [`getTransactionsForAddress`](./json-rpc/getTransactionsForAddress.md)

### sol send tx (1)

- [`sendTransaction`](./json-rpc/sendTransaction.md)

### sol send bundle (1)

- [`sendBundle`](./json-rpc/sendBundle.md)

### sol sim bundle (2)

- [`simulateBundle`](./json-rpc/simulateBundle.md)
- [`simulateTransaction`](./json-rpc/simulateTransaction.md)

## Streams

- [sol pubsub](https://triport.io/api-specs/streaming/sol-pubsub.asyncapi.yaml)
- [sol stream](https://triport.io/api-specs/streaming/sol-stream.asyncapi.yaml)

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.sol.call("getSlot", []);
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
- [REST API](./rest/index.md)
- [Streaming overview](../streaming/index.md)

Tutorials on live Solana routes: [watch a wallet over WebSocket](../guides/watch-a-solana-wallet.md), [backfill an address history](../guides/backfill-solana-address-history.md), [filter the pre-execution stream by account](../guides/filter-solana-pre-execution-by-account.md), and [list a wallet's assets and fetch cNFT proofs](../guides/list-solana-wallet-assets-and-cnft-proofs.md).
