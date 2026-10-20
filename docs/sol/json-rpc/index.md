> Live version: https://triport.io/docs/sol/json-rpc

# Solana JSON-RPC

> The full Solana JSON-RPC surface on `POST https://triport.io/sol` — standard chain methods proxied verbatim, plus Triport extensions: DAS asset queries, priority-fee estimates, and bundle submission.

| | |
|---|---|
| **Network** | Solana |
| **Authentication** | `x-token` header (SDK-preferred); see [Authentication](../../authentication.md) |
| **Required scope** | — (tier-gated per method) |
| **Tier / rate limit** | Any tier; see [Rate Limits](../../rate-limits-and-tiers.md) |

## How to call

Every method takes the same envelope — only `method` and `params` change:

```bash
curl https://triport.io/sol \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[]}'
```

Batching (a JSON array of request objects) is supported; each entry is
tier-checked and rate-limited individually.

## Support semantics

Each method page carries a **Type** field:

| Type | Meaning |
|---|---|
| **Native upstream RPC** | Standard Solana RPC (`getBalance`, `getSlot`, …) — routed to an upstream node, result returned unchanged. |
| **Triport extension** | Not part of base Solana RPC — DAS (`getAsset*`, `searchAssets`, `getTokenAccounts`), `getPriorityFeeEstimate`, `sendBundle`, `simulateBundle`. |

Calling a method outside this catalog returns JSON-RPC `-32601`
(`method_unknown`) — see [Errors](../../errors.md).

## Method reference

The pages below are grouped by what they do — accounts, blocks, transactions,
tokens, DAS assets, and network state. Subscription (`*Subscribe`) methods live
on the WebSocket channel — see [Solana Pub/Sub WS](../../streaming/sol-pubsub.md).

## Pages in this section

- [accountSubscribe](./accountSubscribe.md)
- [accountUnsubscribe](./accountUnsubscribe.md)
- [blockSubscribe](./blockSubscribe.md)
- [blockUnsubscribe](./blockUnsubscribe.md)
- [getAccountInfo](./getAccountInfo.md)
- [getAsset](./getAsset.md)
- [getAssetProof](./getAssetProof.md)
- [getAssetsByGroup](./getAssetsByGroup.md)
- [getAssetsByOwner](./getAssetsByOwner.md)
- [getBalance](./getBalance.md)
- [getBlock](./getBlock.md)
- [getBlockCommitment](./getBlockCommitment.md)
- [getBlockHeight](./getBlockHeight.md)
- [getBlockProduction](./getBlockProduction.md)
- [getBlockTime](./getBlockTime.md)
- [getBlocks](./getBlocks.md)
- [getClusterNodes](./getClusterNodes.md)
- [getEpochInfo](./getEpochInfo.md)
- [getEpochSchedule](./getEpochSchedule.md)
- [getFeeForMessage](./getFeeForMessage.md)
- [getFirstAvailableBlock](./getFirstAvailableBlock.md)
- [getGenesisHash](./getGenesisHash.md)
- [getHealth](./getHealth.md)
- [getIdentity](./getIdentity.md)
- [getInflationGovernor](./getInflationGovernor.md)
- [getInflationRate](./getInflationRate.md)
- [getInflationReward](./getInflationReward.md)
- [getLatestBlockhash](./getLatestBlockhash.md)
- [getLeaderSchedule](./getLeaderSchedule.md)
- [getMaxRetransmitSlot](./getMaxRetransmitSlot.md)
- [getMaxShredInsertSlot](./getMaxShredInsertSlot.md)
- [getMinimumBalanceForRentExemption](./getMinimumBalanceForRentExemption.md)
- [getMultipleAccounts](./getMultipleAccounts.md)
- [getPriorityFeeEstimate](./getPriorityFeeEstimate.md)
- [getProgramAccounts](./getProgramAccounts.md)
- [getProgramAccountsV2](./getProgramAccountsV2.md)
- [getRecentPerformanceSamples](./getRecentPerformanceSamples.md)
- [getRecentPrioritizationFees](./getRecentPrioritizationFees.md)
- [getSignaturesForAddress](./getSignaturesForAddress.md)
- [getSlot](./getSlot.md)
- [getSlotLeader](./getSlotLeader.md)
- [getSlotLeaders](./getSlotLeaders.md)
- [getStakeMinimumDelegation](./getStakeMinimumDelegation.md)
- [getSupply](./getSupply.md)
- [getTokenAccountBalance](./getTokenAccountBalance.md)
- [getTokenAccounts](./getTokenAccounts.md)
- [getTokenAccountsByDelegate](./getTokenAccountsByDelegate.md)
- [getTokenAccountsByOwner](./getTokenAccountsByOwner.md)
- [getTokenAccountsByOwnerV2](./getTokenAccountsByOwnerV2.md)
- [getTokenLargestAccounts](./getTokenLargestAccounts.md)
- [getTokenSupply](./getTokenSupply.md)
- [getTransaction](./getTransaction.md)
- [getTransactionCount](./getTransactionCount.md)
- [getTransactionsForAddress](./getTransactionsForAddress.md)
- [getVersion](./getVersion.md)
- [getVoteAccounts](./getVoteAccounts.md)
- [isBlockhashValid](./isBlockhashValid.md)
- [logsSubscribe](./logsSubscribe.md)
- [logsUnsubscribe](./logsUnsubscribe.md)
- [minimumLedgerSlot](./minimumLedgerSlot.md)
- [programSubscribe](./programSubscribe.md)
- [programUnsubscribe](./programUnsubscribe.md)
- [rootSubscribe](./rootSubscribe.md)
- [rootUnsubscribe](./rootUnsubscribe.md)
- [searchAssets](./searchAssets.md)
- [sendBundle](./sendBundle.md)
- [sendTransaction](./sendTransaction.md)
- [signatureSubscribe](./signatureSubscribe.md)
- [signatureUnsubscribe](./signatureUnsubscribe.md)
- [simulateBundle](./simulateBundle.md)
- [simulateTransaction](./simulateTransaction.md)
- [slotSubscribe](./slotSubscribe.md)
- [slotUnsubscribe](./slotUnsubscribe.md)
- [slotsUpdatesSubscribe](./slotsUpdatesSubscribe.md)
- [slotsUpdatesUnsubscribe](./slotsUpdatesUnsubscribe.md)
- [voteSubscribe](./voteSubscribe.md)
- [voteUnsubscribe](./voteUnsubscribe.md)
