> Live version: https://triport.io/docs/guides

# Product Guides

> Walkthroughs for the Triport console (billing, chain dashboards, referrals) and hands-on tutorials for Solana, Ethereum and Polygon on live routes.

| | |
|---|---|
| **Method / Endpoint** | `n/a — guide hub` |
| **Network** | Any network in the registry |
| **Authentication** | — |
| **Required scope** | — |
| **Tier / rate limit** | — |

## What lives here

Where the [API reference](../overview.md) documents endpoints one by one,
these guides walk through complete tasks:

- [Billing](./billing.md) — plans, invoices, crypto payments, and paying from
  balance.
- [Chains](./chains.md) — the live chain dashboards and what their metrics
  mean.
- [Referral](./referral.md) — referral codes, rewards, and payouts.
- [Stream](./stream.md) — choosing and wiring up the right streaming channel.

For the very first request, start with
[Getting Started](../getting-started.md).

## Tutorials

Hands-on builds against live routes. Each one lists the plan it needs, has
copy-paste code (`curl` plus TypeScript on `fetch` and `ws`), shows real
output and real error bodies, and ends with what it does not do.

| Tutorial | Network | Plan | What you build |
|---|---|---|---|
| [Watch a Solana wallet over WebSocket](./watch-a-solana-wallet.md) | Solana | From the Free trial | `accountSubscribe` as a trigger, a cursor-based catch-up with `getSignaturesForAddress`, and `signatureSubscribe` to wait for finality. |
| [Backfill a Solana address history](./backfill-solana-address-history.md) | Solana | From the Free trial | A resumable history import paced under your `sol_read_rpc` rate, handing over to the live watcher. |
| [Stream pending Ethereum and Polygon transactions](./stream-pending-evm-transactions.md) | Ethereum, Polygon | From the Free trial | A filtered pending-transaction watcher: full objects on Ethereum, hashes plus paced body reads on Polygon. |
| [Filter the Solana pre-execution stream by account](./filter-solana-pre-execution-by-account.md) | Solana | Pro and above | An account-filtered intent feed, paired with `signatureSubscribe` to see which transactions landed. |
| [List a Solana wallet's assets and fetch cNFT proofs](./list-solana-wallet-assets-and-cnft-proofs.md) | Solana | Pro and above for both methods | A DAS walker that survives oversized pages, and proof fetching with a leaf check. |

Network-specific guides live with their network:
[Robinhood Chain guides](../robinhood/guides/index.md) and
[Stellar guides](../stellar/guides/index.md).

- **Solana** (`sol`, chainId 101) — block, TPS, status.
- **Ethereum** (`eth`, chainId 1) — block, TPS, status, and gas.
- **Polygon** (`polygon`, chainId 137) — block, TPS, status, and gas.
- **BNB Smart Chain** (`bsc`, chainId 56) — block, TPS, status, and gas.
- **Base** (`base`, chainId 8453) — block, TPS, status.
- **Tron** (`tron`, chainId 728126428) — block, TPS, status, and gas.
- **Robinhood Chain** (`robinhood`, chainId 4663) — block, TPS, status, and gas.
- **Stellar** (`stellar`, chainId 102) — block, TPS, status.
- **TON** (`ton`, chainId 103) — block, TPS, status.
