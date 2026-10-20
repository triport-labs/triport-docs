> Live version: https://triport.io/docs/robinhood/limits

# Robinhood limits

The following rows come from the Robinhood entries in `tier-matrix.yaml`. Every numeric value is an **unmeasured** operational default, not measured upstream or Triport capacity. Re-measurement through the Triport path is tracked as `N5-D-rh-C`.

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise | Status |
|---|---:|---:|---:|---:|---|---|
| `robinhood_read_rpc` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited | `unmeasured` |
| `robinhood_read_rpc_heavy` | 15 / 30 | 20 / 40 | 100 / 200 | 250 / 500 | unlimited | `unmeasured` |
| `robinhood_send_tx` | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | unlimited | `unmeasured` |

## JSON-RPC request bodies and batches

`POST /rpc/robinhood` accepts JSON-RPC objects and batch arrays with a total
JSON body size up to **4 MiB (4,194,304 bytes)**, including whitespace. The
same limit applies to all API keys and is independent of requests per second.
Standard JSON-RPC arrays, including a one-element array, support large
`eth_getLogs` wallet-topic filters within this limit.

Every batch element is inspected for method and tier access. Where an RPS
budget applies, a batch of N requests costs N requests. Raising the RPS budget
does not raise the body-size limit. Oversized batches return HTTP 413 with
`error: batch_too_large`; split them into smaller arrays. Method-specific
parameter, response-size, and execution-time limits still apply.

## Streaming access

| Surface | Free | Basic | Pro | Business | Enterprise | Status |
|---|---|---|---|---|---|---|
| `newHeads`, `logs` WebSocket | unavailable | available | available | available | available | tier policy |
| Sequencer feed | unavailable | unavailable | 2 streams | 4 streams | 4 streams | `unmeasured` product limit |

The feed requires the `robinhood:feed` scope. These concurrency limits do not claim upstream capacity. See the shared [Rate Limits and Tiers](../rate-limits-and-tiers.md) reference for rate-limit headers, burst behavior, and product errors.

The warm receive fan is shared inside the process. Adding upstream feed/header sockets does not multiply a client's RPS budget, WebSocket concurrency allowance, message-size ceiling, or replay allocation; client limits remain exactly those shown here.

`eth_getLogs` also has channel-specific range and result ceilings. Triport may split or reconstruct deep ranges from receipts; reconstruction is slower and can still fail when no eligible historical channel exists.

## Where the details live

| Topic | Page |
|---|---|
| Connecting, keys in URLs vs headers, viem/ethers/Hardhat/Foundry | [Quickstart](./quickstart.md) |
| Keyless endpoint: which 18 methods it serves, per-IP limits, CORS | [Public endpoint](./public.md) |
| `newHeads` sourcing, reconnect, close codes | [newHeads subscription](./ws/newHeads.md) |
| Log filters, client-side de-duplication, reorgs, backfill | [logs subscription](./ws/logs.md) |
| Feed cursor, `resume` frame, `bufferComplete` | [Feed resume](./feed/resume.md) |
| Confirmation watermark fields on feed frames | [Feed reconciliation](./feed/reconciliation.md) |
| `debug_*` availability and revert reasons | [Debug and trace](./debug.md) |
| Measured history floors and deep-range behaviour | [Archive depth](./archive.md) |
