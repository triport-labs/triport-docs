> Live version: https://triport.io/docs/robinhood/errors

# Robinhood errors

Robinhood uses the normal JSON-RPC `{jsonrpc,id,error}` envelope. The table below is the client-facing fallback policy; it intentionally does not expose upstream names or URLs.

| Condition | What it means | Triport behavior | Client action |
|---|---|---|---|
| Execution revert, insufficient funds, invalid transaction, gas or write rejection | The request reached a capable channel and was rejected deterministically. | Returns the sanitized error without failover. | Fix the transaction; do not retry unchanged. |
| Missing block, transaction, or receipt (`null`) | The selected channel does not currently have the object. | Retries once on another eligible channel, then returns `null`. | Treat `null` as absent at this point in time; retry later only if appropriate. |
| Authentication failure (`401`/`403`) | The credential, scope, or tier is insufficient. | Returns a normalized product error; HTML bodies are never forwarded. | Correct the API key, scope, or plan. |
| Rate limit (`429`) | The relevant product or channel budget is exhausted. | Honors `Retry-After`; another healthy channel may be selected only when policy allows it. | Wait for `Retry-After` and retry with backoff. |
| Transport failure, non-JSON response, or `5xx` | The selected channel did not produce a valid service response. | Tries the next healthy capable channel. | Retry only if all eligible channels fail. |
| Unsupported method or JSON-RPC `-32601` | The channel cannot serve that catalogued method, or the requested method is outside the catalog. | Tries another method-capable channel for catalogued methods; otherwise returns `method_unknown`. | Check the [method index](./json-rpc/index.md). |
| Historical state unavailable, missing trie data, or archive required | The selected channel cannot answer at that depth. | Tries another archive-capable channel, then returns the last channel's JSON-RPC code unchanged (`-32000` for missing state or trie data, `-32602` for an archive-gated channel) with a sanitized message, for example `Archive requests are not available on the selected node`. | Move the block forward or handle missing historical state. |
| `eth_getLogs` range/result limit | The query exceeds one channel's measured ceiling. | Uses the planner across eligible channels; may split the query or reconstruct from receipts. | Narrow the range and add `address` or `topics`; expect receipt reconstruction to be slower. |
| Unknown error code or message | No safe retry classification exists. | Delivers a sanitized error without an implicit retry. | Inspect the response and decide explicitly whether retry is safe. |

For shared product errors — `unauthorized`, `trial_expired`, `subscription_expired`, `tier_insufficient`, `method_unknown`, `rate_limited`, `batch_too_large` — see the [common error reference](../errors.md). They are plain HTTP responses decided before the RPC layer, not JSON-RPC codes.

Codes the published contract declares for this network, in addition to the rows above:

| Code | Contract message | Notes |
|---|---|---|
| `-32029` | `rate limit exceeded` | An upstream channel's own limit, distinct from your Triport `429`. |
| `-31001` | `internal error: hedge race response failed heuristic check` | A hedged request whose answer failed the sanity check; retried per policy. |
| `35` | `method is not available on free plan, please upgrade to paid plan` | A plan gate on the serving node, not a Triport tier decision. |
| `-32000` | `typed transaction too short` | Deterministic upstream rejection on submission — fix the payload, do not retry unchanged. |
