> Live version: https://triport.io/docs/stellar/errors

# Stellar errors

Authentication, tier and rate-limit failures are described in the [shared error reference](../errors.md).

- Horizon: `410 Gone`, `error=beyond_retention`, `oldest=N` means the requested record is below the retained window.
- Soroban: JSON-RPC `-32602` with `beyond_retention` and `oldest N` describes the corresponding retention boundary.
- HTTP `400` with `limit must not exceed 200`: reduce the page size.
- JSON-RPC `-32601`: the method is absent from the published Soroban catalog. Gate-level `method_unknown` is a separate HTTP rejection.

A retention response describes the available historical window. It is not an internal failure and repeating the same out-of-window request will not recover the missing history.
