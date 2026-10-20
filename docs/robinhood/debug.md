> Live version: https://triport.io/docs/robinhood/debug

# Robinhood debug and trace methods

The catalog publishes four debug methods on `https://triport.io/rpc/robinhood`:

| Method | Use it for |
|---|---|
| [`debug_traceTransaction`](./json-rpc/debug_traceTransaction.md) | Replay one mined transaction and see its call tree, gas and revert data. |
| [`debug_traceCall`](./json-rpc/debug_traceCall.md) | Trace a call that was never sent — the fastest way to read a revert reason before submitting. |
| [`debug_traceBlockByNumber`](./json-rpc/debug_traceBlockByNumber.md) | Trace every transaction in a block selected by number or tag. |
| [`debug_traceBlockByHash`](./json-rpc/debug_traceBlockByHash.md) | The same, for a block selected by hash. |

## Availability: best-effort, no SLA

Parity-style `trace_*` methods (`trace_block`, `trace_call`, `trace_filter`, `trace_transaction`) are **not part of the Robinhood contract**, and `debug_*` is not a drop-in replacement for them: the response shapes and semantics differ. See [RPC behavior](./rpc-behavior.md) for the measurement evidence behind that exclusion.

## Reading a revert reason

`debug_traceCall` takes the same call object as `eth_call` plus a block tag and tracer options, and returns the failure with its revert data instead of a bare error — that is what makes it the practical tool for "why did my transaction revert". Supported block tags here are `latest`, `earliest`, `pending` and hex numbers; `safe` and `finalized` are not part of this contract.

For a mined transaction, `debug_traceTransaction` gives the same picture after the fact. When you only need the outcome and gas, [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md) is cheaper, and [`eth_estimateGas`](./json-rpc/eth_estimateGas.md) is the right tool for sizing gas.

## Internal transfers are data, not a ready index

Traces are the raw material for internal-ETH-transfer history, but Triport does not publish an indexed history: you would build your own index from traces and account for reverted calls yourself. See [address history](./address-history.md) for what exists today.

## Limits

Debug methods bill against the heavy-read category; per-plan request rates and the 4 MiB body ceiling are in [Limits](./limits.md). Deep traces return large payloads — request one block at a time and keep your client timeouts generous.
