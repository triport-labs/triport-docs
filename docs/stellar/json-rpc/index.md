> Live version: https://triport.io/docs/stellar/json-rpc

# Stellar Soroban JSON-RPC methods

All methods use by-name parameters through `POST /rpc/stellar`. Tier budgets
are defaults inherited from the tier matrix and remain unmeasured.

## Heavy reads

| Method | Summary | Tier / rate limit |
|---|---|---|
| [`getEvents`](./getEvents.md) | Return filtered contract and system events from retained ledgers. | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getTransactions`](./getTransactions.md) | Return cursor-paginated transaction details from retained ledgers. | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Standard reads

| Method | Summary | Tier / rate limit |
|---|---|---|
| [`getFeeStats`](./getFeeStats.md) | Return classic and Soroban inclusion-fee statistics. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getHealth`](./getHealth.md) | Return node health and retention boundaries. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getLatestLedger`](./getLatestLedger.md) | Return the latest ledger known to the selected node. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getLedgerEntries`](./getLedgerEntries.md) | Read current state for XDR ledger keys. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getLedgers`](./getLedgers.md) | Return cursor-paginated retained ledger details. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getNetwork`](./getNetwork.md) | Return the network passphrase and protocol version. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getVersionInfo`](./getVersionInfo.md) | Return RPC and Captive Core build metadata. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`simulateTransaction`](./simulateTransaction.md) | Simulate a transaction without submitting it. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

The measured Soroban retention window is 120,960 ledgers. `getLedgers` and
`getTransactions` accept at most 200 records per page; the measured `getEvents`
exception accepts up to 10,000. Positional-array params are rejected with
`-32602`. This catalog has no write or transaction-submission method.
