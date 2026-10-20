> Live version: https://triport.io/docs/stellar/guides

# Stellar guides

> Task-based walkthroughs for Stellar on Triport: building on the Horizon REST and SSE surfaces as they actually behave, including retention boundaries and the parts that have no stream.

The [REST catalog](../rest/index.md) and the [Horizon SSE reference](../streams/sse.md) describe each surface on its own. These guides put them together into a working task and are explicit about the constraints that change how the code must be written — which channels exist, what a reconnect costs, and where the retained window ends.

| Guide | What it covers |
|---|---|
| [Monitor payments with Horizon and SSE](./monitor-payments-with-horizon-sse.md) | Subscribing to transactions as a trigger, paging payments from a stored `paging_token`, closing the gap after a reconnect, and reading `410 beyond_retention` as a boundary rather than an empty page. |
