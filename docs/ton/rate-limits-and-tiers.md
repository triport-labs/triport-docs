> Live version: https://triport.io/docs/ton/rate-limits-and-tiers

# TON rate limits and tiers

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `ton_read_rpc` | 15 | 20 | 100 | 250 | unlimited |
| `ton_read_rpc_heavy` | 15 | 20 | 100 | 250 | unlimited |

Both rows are an **unmeasured** operational Polygon default until a dedicated
capacity test. Heavy covers `getTransactions`, both contract get-methods, block
and shard reads, and every method with optional or historical `seqno`. These
product limits do not claim that a public liteserver has the same capacity.

The shared model is described in the [global tier table](../rate-limits-and-tiers.md).
