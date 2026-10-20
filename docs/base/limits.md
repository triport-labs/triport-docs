> Live version: https://triport.io/docs/base/limits

# Base limits and enforced rate policy

All values below are generated from the enforced tier matrix and the final OpenRPC budget annotations. They are not measured upstream capacity, a provider contract, or an SLA. Enterprise uses finite Base overrides; it is not physically unlimited.

Values are **sustained RPS / short burst capacity**. The included **2× burst buffer** absorbs brief traffic spikes at no extra cost and refills at the sustained rate. There is no quota on the number of bursts. Size ongoing traffic to sustained RPS; unlimited categories have no numeric burst ceiling. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

|---|---:|---:|---:|---:|---:|
| `base_read_rpc` | 10 / 20 | 20 / 40 | 100 / 200 | 250 / 500 | 250 / 500 |
| `base_send_tx` | 3 / 6 | 5 / 10 | 30 / 60 | 80 / 160 | 80 / 160 |
| `base_read_rpc_heavy` | — | — | 2 / 4 | 5 / 10 | 5 / 10 + provider ceiling |
| `base_simulate` | — | — | 2 / 4 | 5 / 10 | 5 / 10 + schema/provider gate |
| `base_aa` | — | — | on request; no numeric RPS | on request; no numeric RPS | on request; provider-gated |
| `base_send_bundle` | — | — | beta/on request; no numeric client RPS | beta/on request; no numeric client RPS | on request; provider-gated |
| `base_send_private` | — | — | beta/on request; no numeric client RPS | beta/on request; no numeric client RPS | on request; provider-gated |

The conservative shared Blink adapter start is one request per 30 seconds with burst 1 across its provider group. This is an engineering safety bound, not a known provider limit or a customer allowance. `key_required` remains in force.

## Parameter limits

Each [method page](./json-rpc/index.md) reproduces its complete OpenRPC parameter schema and lists every frozen `minimum`, `maximum`, `minItems`, `maxItems`, `pattern`, or `enum` constraint. If no numeric bound is present, the page says `unknown`; implementations must not invent an unlimited limit.

Notable frozen boundaries:

- `eth_sendBundle.txs` has `minItems: 2`; no maximum is established. Old case labels mentioning 50/100/500 do not prove a 500-item limit or unlimited bundles.
- State/log methods with a bounded current profile use `base_read_rpc`; historical state, large ranges, or overrides are Pro/`base_read_rpc_heavy`, availability unknown, and a null provider limit denies the request.
- Historical block retrieval does not prove archive state. No archive-state depth or range SLA is frozen.
- Block selectors are method-specific and must be preserved. Never rewrite `pending`, `safe`, or `finalized` to `latest`.

See [Base errors](./errors.md) for tier/rate error handling.
