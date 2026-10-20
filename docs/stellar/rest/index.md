> Live version: https://triport.io/docs/stellar/rest

# Stellar Horizon REST methods

All 11 read-only operations use `GET` routes below
`/rpc/stellar/horizon`. Collection responses preserve Horizon HAL links and
cursor pagination.

## Service and chain state

| Operation | Endpoint | Summary | Tier / rate limit |
|---|---|---|---|
| [`stellarHorizonRoot`](./stellarHorizonRoot.md) | `GET /` | Discover Horizon metadata and resource links. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonGetFeeStats`](./stellarHorizonGetFeeStats.md) | `GET /fee_stats` | Read the current Horizon fee snapshot. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonListAssets`](./stellarHorizonListAssets.md) | `GET /assets` | List indexed assets with optional code and issuer filters. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Ledgers and accounts

| Operation | Endpoint | Summary | Tier / rate limit |
|---|---|---|---|
| [`stellarHorizonListLedgers`](./stellarHorizonListLedgers.md) | `GET /ledgers` | Page through retained ledgers. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonGetLedger`](./stellarHorizonGetLedger.md) | `GET /ledgers/{ledger}` | Read one retained ledger. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonGetAccount`](./stellarHorizonGetAccount.md) | `GET /accounts/{account}` | Read latest account state. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonListAccountPayments`](./stellarHorizonListAccountPayments.md) | `GET /accounts/{account}/payments` | Page through payment-like operations for one account. | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonListAccountTransactions`](./stellarHorizonListAccountTransactions.md) | `GET /accounts/{account}/transactions` | Page through transactions involving one account. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Global history

| Operation | Endpoint | Summary | Tier / rate limit |
|---|---|---|---|
| [`stellarHorizonListPayments`](./stellarHorizonListPayments.md) | `GET /payments` | Page through global payment-like operations. | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonListTransactions`](./stellarHorizonListTransactions.md) | `GET /transactions` | Page through global transactions. | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`stellarHorizonListOperations`](./stellarHorizonListOperations.md) | `GET /operations` | Page through global operations. | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
