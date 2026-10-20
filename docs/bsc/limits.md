> Live version: https://triport.io/docs/bsc/limits

# BSC limits

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `bsc_read_rpc` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `bsc_read_rpc_heavy` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |

These are unmeasured product-policy defaults, not a BSC load-test result or a throughput SLA. Logs, archive-state reads and large receipt queries use the heavy category. See [Rate Limits and Tiers](../rate-limits-and-tiers.md) for bursts and response headers. An Enterprise unlimited policy entry means no configured tier cap; it does not mean unlimited physical capacity.
