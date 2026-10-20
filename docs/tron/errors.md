> Live version: https://triport.io/docs/tron/errors

# Tron errors

Execution errors use the JSON-RPC envelope `{jsonrpc,id,error}`. Product rejections for authentication, tier or rate limits are handled before RPC execution and use HTTP `401`, `403` or `429`; see the [shared error reference](../errors.md). Wallet HTTP methods return an HTTP status and JSON body.

- An empty wallet response can indicate a mismatch between hex-41/base58 address encoding and `visible`, rather than an absent method.
- Historical state is not supported for `eth_call`, `eth_getBalance`, `eth_getCode` and `eth_getStorageAt`; use `latest`.
- Split `eth_getLogs` ranges larger than 100 blocks before sending them.
- `429` signals backpressure. Retry after `Retry-After`; do not interpret it as absence of a capability.
