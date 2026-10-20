> Live version: https://triport.io/docs/bsc/errors

# BSC errors

BSC execution errors use the JSON-RPC envelope `{jsonrpc,id,error}`. Authentication, tier and rate-limit rejections are decided before the RPC layer and use HTTP `401`, `403` or `429` with top-level error fields. See the [shared error reference](../errors.md).

- Execution code `-32000` is ambiguous: `header not found` concerns the block, while pruned or unsupported-state messages concern historical state.
- Treat `429` as backpressure and honor `Retry-After`.
- An excessive `eth_getLogs` range or a missing required `address` can be rejected as invalid parameters.
- Methods outside the published catalog are rejected by the gate with HTTP `403` `method_unknown` before execution.
