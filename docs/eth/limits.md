> Live version: https://triport.io/docs/eth/limits

# Ethereum limits

All numbers below come from `tier-matrix.yaml`. A dash means the category has
no numeric RPS budget at that tier; Enterprise RPS is unlimited.

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `eth_read_rpc` | 10 / 20 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `eth_send_tx` | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | unlimited |
| `eth_debug` | — | — | 5 / 10 | 15 / 30 | unlimited |
| `eth_getproof` | — | — | 5 / 10 | 15 / 30 | unlimited |
| `eth_mempool_live` | — | 100 | 800 | 1130 | unlimited |
| `eth_peergraph` | — | — | — | 20 / 40 | unlimited |
| `eth_send_bundle` | — | — | 5 / 10 | 15 / 30 | unlimited |
| `eth_trace` | — | — | 5 / 10 | 15 / 30 | unlimited |
| `eth_txpool` | — | — | 1 / 2 | 2 / 4 | unlimited |
| `eth_txpool_snapshot_min_interval_sec` | — | — | 5 / 10 | 2 / 4 | unlimited |
| `eth_validator_registry` | — | — | — | 50 / 100 | unlimited |

Sustained RPS has a 2x burst. See [Rate Limits & Tiers](../rate-limits-and-tiers.md).
