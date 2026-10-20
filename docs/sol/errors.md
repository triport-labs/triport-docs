> Live version: https://triport.io/docs/sol/errors

# Solana errors

Solana methods return **upstream** errors in the standard JSON-RPC
`{jsonrpc,id,error}` envelope. Triport's own product errors (auth, tier, rate
limit) are plain HTTP responses decided before the RPC layer — see the
[shared error reference](../errors.md).

Common Solana-specific cases documented by the method pages are:

- `-32602` for malformed base58 public keys, invalid configs, invalid filters,
  and stale or unknown subscription IDs;
- HTTP `403` `tier_insufficient` when a key cannot use a gated category such as
  `sol_das`; the `X-Required-Tier` header carries the minimum tier;
- HTTP `429` `rate_limited` when category RPS is exceeded; honor `Retry-After`;
- WebSocket application code `4029` when the subscription rate is exceeded.

Do not turn a normal `null` result or an empty account into an error. Individual
method pages document method-specific validation and upstream errors.
