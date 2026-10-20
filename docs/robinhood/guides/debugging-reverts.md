> Live version: https://triport.io/docs/robinhood/guides/debugging-reverts

# Debugging reverts on Robinhood Chain with debug_traceCall

> Turn "execution reverted" into a reason: trace a call that was never sent, decode the revert payload, pin the right block, and know where `debug_*` stops being reliable on this chain.

`eth_call` tells you that a call reverted. It rarely tells you *why*, and never tells you *where* in a call tree it happened. [`debug_traceCall`](../json-rpc/debug_traceCall.md) traces a call that was never sent and returns the failure together with its revert data and call tree — which is what makes it the practical first tool when a transaction fails for reasons the error string does not explain.

This guide is about using it well, and about its limits here. Read [Debug and trace](../debug.md) for the surface as a whole, and the [Quickstart](../quickstart.md) if you have not connected yet.

| | |
|---|---|
| **Endpoint** | `POST https://triport.io/rpc/robinhood` |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Rate category** | `robinhood_read_rpc_heavy` — see [Limits](../limits.md) |

## 1. Read the availability line before you build on it

- keep a fallback path for when a trace is unavailable or slow;
- never put a debug call on a user-facing critical path;
- treat deep block traces as the most expensive requests you can issue here.

A debugging tool that is occasionally unavailable is still extremely useful. A production feature built on one is not.

## 2. Trace the call you are about to make

`debug_traceCall` takes the same call object as [`eth_call`](../json-rpc/eth_call.md), plus a block tag and a required tracer options object:

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"debug_traceCall","params":[
        {"from":"0xYOUR_SENDER","to":"0xCONTRACT","data":"0xENCODED_CALLDATA"},
        "latest",
        {"tracer":"callTracer"}]}'
```

`callTracer` is the right default: it returns the nested call structure with each frame's `to`, `input`, `gasUsed`, and — on the frame that failed — its `error` and `output`. The *innermost* failing frame is the one that matters; an outer frame usually just propagates the failure.

Include `from`. A call traced without a sender runs as if from the zero address, and any `onlyOwner`-style check will fail for a reason that has nothing to do with your actual problem.

## 3. Decode the revert payload

The failing frame's `output` carries the revert data. Three shapes cover almost everything:

| Prefix | Meaning |
|---|---|
| `0x08c379a0` | `Error(string)` — a `require` with a message; the string is ABI-decodable from the rest |
| `0x4e487b71` | `Panic(uint256)` — a compiler-inserted failure such as arithmetic overflow, division by zero or an out-of-bounds index; the code says which |
| anything else | A custom error; match the four-byte selector against your ABI |
| empty | A bare `revert()` or a failed low-level call — no reason was encoded |

Derive the selectors rather than trusting a literal you copied, so a typo cannot quietly turn a decodable revert into "unknown":

```ts
import { toFunctionSelector, decodeErrorResult } from "viem";

const ERROR_STRING = toFunctionSelector("Error(string)"); // 0x08c379a0
const reason = decodeErrorResult({ abi, data: output });  // custom errors included
```

An empty payload is information too: it means the contract reverted without encoding a reason, so no tool can recover one. Look at the failing frame's position in the tree instead.

## 4. Pin the block, or you are debugging the wrong world

A revert is deterministic for a given block and state. That cuts both ways: reproducing it requires the *same* block, and a trace at `latest` may quietly succeed while the failure you are chasing happened three blocks ago.

Pass an explicit hex block number when reproducing a known failure. Supported tags here are `latest`, `earliest`, `pending` and hex numbers — **`safe` and `finalized` are not part of this contract**, so a helper carried over from another chain will fail rather than silently fall back.

Tracing an old block needs historical *state*, not just the block. State availability has measured floors on this chain, so a trace deep in history can fail for that reason alone — see [Archive depth](../archive.md) before concluding that your call is at fault.

If the call succeeds at `latest` but reverted when you sent it, the cause is usually state that has since changed — a balance, an allowance, a price, a nonce-dependent path — not your calldata.

## 5. After the fact: trace the mined transaction

For a transaction that already landed, [`debug_traceTransaction`](../json-rpc/debug_traceTransaction.md) replays it and returns the same call tree, gas and revert data:

```json
{"jsonrpc":"2.0","id":1,"method":"debug_traceTransaction",
 "params":["0xTX_HASH",{"tracer":"callTracer"}]}
```

Reach for the cheaper tool when it answers your question: [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md) already tells you whether the transaction succeeded (`status: "0x1"`) or reverted (`"0x0"`) and what gas it used. Trace only when you need the reason or the call path. For sizing gas, [`eth_estimateGas`](../json-rpc/eth_estimateGas.md) is the right method — and note that it reverts for the same reasons the call does, which itself is a useful early signal.

Whole blocks can be traced with [`debug_traceBlockByNumber`](../json-rpc/debug_traceBlockByNumber.md) and [`debug_traceBlockByHash`](../json-rpc/debug_traceBlockByHash.md). Request **one block at a time**, keep client timeouts generous, and remember the 4 MiB response and body limits described in [Limits](../limits.md).

## 6. What `debug_*` is not

Parity-style `trace_*` methods (`trace_block`, `trace_call`, `trace_filter`, `trace_transaction`) are **not part of the Robinhood contract**, and `debug_*` is **not a drop-in replacement**: the response shapes and semantics differ, so tooling written against `trace_*` will not work by swapping the method name. The measurement evidence behind that exclusion is in [RPC behavior](../rpc-behavior.md).

Traces are also raw material, not a finished index. They are where internal-ETH-transfer history comes from, but no indexed history is published here — you would build and maintain that index yourself, including deciding what to do with reverted calls. See [address history](../address-history.md) for what exists today.

## 7. A workflow that converges

1. Reproduce with `debug_traceCall` at the **same block** as the failure, with the real `from`.
2. Walk to the innermost failing frame in the `callTracer` output.
3. Decode its `output` by selector; an empty payload means no reason was encoded.
4. If it now succeeds at `latest`, the answer is changed state, not your calldata.
5. Only then change the transaction — and remember that an unchanged retry of a deterministic revert returns the same result, so retrying is never the fix.

The matching error page is [`/errors/evm/execution-reverted`](https://triport.io/errors/evm/execution-reverted), which covers the same failure from the client side.

## Frequently asked questions

**Why does `debug_traceCall` show a reason when `eth_call` did not?**
Because it returns the failure together with its revert data and the call tree, instead of a bare error. The reason was always in the payload; the trace is what surfaces it along with where it happened.

**My trace returns an empty revert payload. What now?**
The contract reverted without encoding a reason — a bare `revert()` or a failed low-level call. No tool can recover a string that was never produced. Use the failing frame's position and inputs instead.

**Can I use `trace_block` instead?**
No. Parity-style `trace_*` is not in this catalog, and `debug_*` is not a drop-in substitute — the shapes and semantics differ.

**The call reverts at an old block but works now. Which is right?**
Both — a revert is deterministic for the block and state it ran against. If you need the historical answer, pin the block and check that historical state is available at that depth.

## Related

- [Debug and trace](../debug.md) · [RPC behavior](../rpc-behavior.md) · [Archive depth](../archive.md) · [Limits](../limits.md)
- [`debug_traceCall`](../json-rpc/debug_traceCall.md) · [`debug_traceTransaction`](../json-rpc/debug_traceTransaction.md) · [`debug_traceBlockByNumber`](../json-rpc/debug_traceBlockByNumber.md) · [`debug_traceBlockByHash`](../json-rpc/debug_traceBlockByHash.md)
- [`eth_call`](../json-rpc/eth_call.md) · [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md) · [`eth_estimateGas`](../json-rpc/eth_estimateGas.md)
- [Build a wallet backend](./build-a-wallet-backend.md) · [Conditional transactions](./conditional-transactions.md)
