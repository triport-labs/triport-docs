> Live version: https://triport.io/docs/robinhood/send

# Fast submission

Robinhood sequencing is first-come, first-served (FCFS). A larger priority fee does not move a transaction forward in the sequencer queue. Keep submission connections warm and prepare/sign before the critical path.

Triport keeps active HTTP targets warm with probes and maintains a dedicated warm WebSocket submission target. Ordinary raw submission is an earliest-success fan across eligible paths. Conditional requests use only conditional-capable paths and are always dispatched per item; clients use `POST /rpc/robinhood` and do not configure upstream hosts.

For batches, every conditional-containing target batch is split into independent single-item transport requests. An invalid conditional element receives its own response and does not suppress unrelated elements.

Use the generated [`eth_sendRawTransaction` reference](./json-rpc/eth_sendRawTransaction.md) for ordinary submission and [`eth_sendRawTransactionConditional`](./conditional.md) for conditional submission. Submit once and reconcile by transaction hash; retry transport failures explicitly, but do not retry deterministic validation or transaction rejections.
