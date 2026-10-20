> Live version: https://triport.io/docs/tron/limits

# Tron limits

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `tron_read_rpc` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `tron_read_rpc_heavy` | 2 / 4 | 5 / 10 | 20 / 40 | 80 / 160 | unlimited |

The eth_getLogs method and heavy wallet calls use tron_read_rpc_heavy; other published reads use tron_read_rpc. One eth_getLogs request covers at most **100 blocks**. See [Rate Limits and Tiers](../rate-limits-and-tiers.md) for bursts and response headers. An Enterprise unlimited policy entry means no configured tier cap, not unlimited physical capacity.
