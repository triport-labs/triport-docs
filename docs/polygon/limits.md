> Live version: https://triport.io/docs/polygon/limits

# Polygon limits

All numbers below come from `tier-matrix.yaml`. A dash means the category has
no numeric RPS budget at that tier; Enterprise RPS is unlimited.

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---|
| `polygon_read_rpc` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited |
| `polygon_send_tx` | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | unlimited |
| `polygon_trace` | — | — | 3 / 6 | 10 / 20 | unlimited |
| `polygon_txpool` | — | — | 1 / 2 | 2 / 4 | unlimited |
| `polygon_txpool_snapshot_min_interval_sec` | — | — | 5 / 10 | 2 / 4 | unlimited |

`polygon_bor` and streaming/firehose access are feature gates without numeric
RPS rows in the matrix. Sustained RPS has a 2x burst. See
[Rate Limits & Tiers](../rate-limits-and-tiers.md).
