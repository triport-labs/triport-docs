> Live version: https://triport.io/docs/stellar/rate-limits-and-tiers

# Stellar rate limits and tiers

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `stellar_read_rpc` | 15 | 20 | 100 | 250 | unlimited |
| `stellar_read_rpc_heavy` | 15 | 20 | 100 | 250 | unlimited |

These are unmeasured product-policy defaults pending a dedicated capacity test. The heavy category includes getEvents, getTransactions, payments, operations and SSE. See [Rate Limits and Tiers](../rate-limits-and-tiers.md). An Enterprise unlimited policy entry means no configured tier cap, not unlimited physical capacity.
