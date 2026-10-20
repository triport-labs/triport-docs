> Live version: https://triport.io/docs/sol/limits

# Solana limits

All numbers below come from `tier-matrix.yaml`. Enterprise RPS is unlimited.

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `sol_read_rpc` | 20 / 40 | 60 / 120 | 200 / 400 | 600 / 1200 | unlimited |
| `sol_read_rpc_heavy` | 2 / 4 | 5 / 10 | 20 / 40 | 80 / 160 | unlimited |
| `sol_send_tx` | 5 / 10 | 10 / 20 | 50 / 100 | 150 / 300 | unlimited |
| `sol_send_bundle` | — | — | 10 / 20 | 30 / 60 | unlimited |
| `sol_sim_bundle` | — | — | 5 / 10 | 15 / 30 | unlimited |

The matrix also gates `sol_das` and streaming features, but it does not assign
them numeric RPS values. Sustained RPS has a 2x burst. See
[Rate Limits & Tiers](../rate-limits-and-tiers.md).
