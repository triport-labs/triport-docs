> Live version: https://triport.io/docs/base/errors

# Base JSON-RPC errors

Base uses the shared JSON-RPC `{jsonrpc,id,error}` envelope. This staged error reference does not claim the Base route is currently mounted.

| JSON-RPC code | Meaning | Boundary |
|---:|---|---|
| `-32601` | Method unavailable/not mounted | Canonical response for frozen negative rows; do not reroute to a different network or alias. |

Tier and budget rejections are **not** JSON-RPC errors: the gate decides them before the request reaches the RPC layer and answers with a plain HTTP envelope — `403` `tier_insufficient` (applies to gated methods only after runtime admission exists; minimum tiers come from the enforced matrix) and `429` `rate_limited` (honor `Retry-After`; current numbers are policy, not measured capacity or SLA).

Authentication, expired-key, and transport failures use the [shared error reference](../errors.md). Upstream errors must retain their code and message where no stable normalized contract exists; HTTP 200 with both `result: null` and `error` is an error, not success.

Writes must not be retried automatically after an ambiguous timeout, and no parser response proves inclusion, finality, private delivery, sync semantics, or bundle admission.
