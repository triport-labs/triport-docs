> Live version: https://triport.io/docs/polygon/errors

# Polygon errors

Polygon methods return **upstream** errors in the standard JSON-RPC
`{jsonrpc,id,error}` envelope. Triport's own product errors (auth, tier, rate
limit) are plain HTTP responses decided before the RPC layer — see the
[shared error reference](../errors.md).

Notable method-page behavior:

- `bor_*`, trace, and txpool methods can return HTTP `403` `tier_insufficient`
  when their feature or tier gate is not enabled;
- HTTP `429` `rate_limited` means the category budget and burst were exhausted;
  honor `Retry-After` and retry with backoff;
- malformed calls, block selectors, tracer configs, and Polygon-native params
  return `-32602`;
- an unknown or orphaned block hash can validly return `result: null`; handle it
  separately from the error envelope.
