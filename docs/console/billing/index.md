> Live version: https://triport.io/docs/console/billing

# Console API — Billing

> Balance, invoices and payment rails for a Triport account: create and cancel invoices, build in-app transactions, and follow balance/invoice event streams.

| | |
|---|---|
| **Method / Endpoint** | `https://triport.io/v1/billing/…` |
| **Network** | — (account-level) |
| **Authentication** | Console session — see [session model](../auth/session-model.md) |
| **Required scope** | — |
| **Tier / rate limit** | Account-level; not metered against chain RPS budgets |

## What this section covers

Everything the Billing tab does: read the prepaid balance and its ledger, list the crypto rails available for top-ups, create an invoice for a plan, build the in-app transaction that pays it, and cancel an unpaid one. The two SSE streams push balance and invoice state changes so a dashboard can react without polling.

The endpoint list is below; every page carries the request/response schema,
error envelope and a runnable example. Part of the [Console API](../index.md).

## Pages in this section

- [Balance SSE event stream](./balance-events.md)
- [Build in-app transaction](./build-inapp-tx.md)
- [Cancel an invoice](./cancel-invoice.md)
- [Create an invoice](./create-invoice.md)
- [Get balance](./get-balance.md)
- [Get invoice](./get-invoice.md)
- [List payment rails](./get-rails.md)
- [Invoice SSE event stream](./invoice-events.md)
- [List balance ledger entries](./list-balance-entries.md)
- [List invoices](./list-invoices.md)
- [Pay invoice from balance](./pay-from-balance.md)
- [Submit in-app transaction](./submit-inapp-tx.md)
