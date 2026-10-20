> Live version: https://triport.io/docs/eth/errors

# Ethereum errors

Ethereum methods return **upstream** errors in the standard JSON-RPC
`{jsonrpc,id,error}` envelope. Triport's own product errors (auth, tier, rate
limit) are plain HTTP responses decided before the RPC layer — see the
[shared error reference](../errors.md).

Notable method-page behavior:

- `admin_*` and `personal_*` methods are intentionally not part of the product,
  so the gate rejects them with HTTP `403` `method_unknown` before they reach a
  node;
- premium `debug_*`, `trace_*`, bundle, proof, and txpool methods return HTTP
  `403` `tier_insufficient` below their required tier;
- category exhaustion returns HTTP `429` `rate_limited`; honor `Retry-After`
  before retrying;
- EVM execution failures may include a revert reason in the upstream error or
  result. They are distinct from authentication and tier errors.
