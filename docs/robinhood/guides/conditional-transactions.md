> Live version: https://triport.io/docs/robinhood/guides/conditional-transactions

# Conditional transactions on Robinhood Chain

> Attach inclusion conditions to a signed transaction with `eth_sendRawTransactionConditional`: the five supported options, a `blockNumberMax` deadline, `knownAccounts` state checks, and the difference between a local `-32602` and a condition that stops holding.

`eth_sendRawTransactionConditional` submits a signed transaction together with conditions under which it should still be included. If the conditions stop holding, the transaction is dropped instead of landing — which is the point: it turns "I hope this is still valid" into something the sequencer can check.

Before using it, be clear about one boundary, because almost every mistake with this method comes from blurring it: **Triport validates the shape of your conditions, but never evaluates them.**

| | |
|---|---|
| **Method / Endpoint** | `eth_sendRawTransactionConditional` at `POST https://triport.io/rpc/robinhood` |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Rate category** | `robinhood_send_tx` — see [Limits](../limits.md) |

New to the endpoint? Start with the [Quickstart](../quickstart.md).

## 1. Who checks what

Two different systems look at your request, and they check different things:

- **Triport** checks the option **names and value shapes** before fanout. An unknown key or a malformed number, address, slot or value is rejected locally, with no network submission and no gas cost.
- **The submission target** evaluates the **conditions themselves**, at submission time.

So a rejection from us means "your options are not well-formed". A transaction that is dropped because a condition no longer holds is a different outcome entirely, and it happens after your request has left us. Section 5 shows how to tell them apart.

## 2. The five options

`params` is positional: the signed raw transaction, then a required `options` object. Only these keys are accepted:

| Option | Meaning |
|---|---|
| `blockNumberMin`, `blockNumberMax` | Inclusive block-number bounds. |
| `timestampMin`, `timestampMax` | Inclusive timestamp bounds. |
| `knownAccounts` | Address-to-state-root, or address-to-storage-slot/value conditions. |

Anything else is an error, not an ignored field. That is a deliberate design: a silently dropped condition would be worse than a rejection, because you would believe you had protection you did not have.

## 3. A deadline with `blockNumberMax`

The simplest useful condition is "do not include this after block N":

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_sendRawTransactionConditional",
  "params": ["0xSIGNED_TRANSACTION", {"blockNumberMax": "0x3600000"}]
}
```

Pick the bound from the current head rather than from a guess: read [`eth_blockNumber`](../json-rpc/eth_blockNumber.md), add the number of blocks your action stays meaningful for, and encode it as a hex quantity. A deadline that is too tight throws away transactions that would have been fine; one that is too loose is not a deadline at all.

Timestamp bounds work the same way and are the better choice when your deadline is genuinely about wall-clock time — an expiring quote, for example — rather than about block height.

## 4. `knownAccounts`: "only if the state is what I saw"

`knownAccounts` expresses the condition that matters most in practice: include this transaction only if the state it was built against has not changed. You can pin either the whole account state root, or specific storage slots and their expected values.

Read the values you intend to pin with [`eth_getStorageAt`](../json-rpc/eth_getStorageAt.md), or take an account proof with [`eth_getProof`](../json-rpc/eth_getProof.md), and build the transaction against exactly those values. If they change before submission, the transaction is dropped rather than executing against state you never simulated.

Pin narrowly. A whole state root changes on every unrelated write to that account, so a transaction pinned to it will be dropped far more often than one pinned to the two slots you actually depend on.

## 5. Two failures that look similar and are not

**Local rejection — malformed options.** Returned by us, before any upstream call:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32602,"message":"invalid conditional options: blockNumberMax: expected hex quantity"}}
```

The message names the exact field and reason. Nothing was submitted and no gas was spent, so this is a bug in your request builder — fix it and resend. There is a dedicated page for it at [`/errors/robinhood/invalid-conditional-options`](https://triport.io/errors/robinhood/invalid-conditional-options).

**Conditions no longer hold.** This is decided at submission time by the target, not by us. Your transaction simply does not land. Detect it the same way you detect any non-inclusion: poll [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md) and, once your deadline block has passed, stop waiting and rebuild.

The practical rule: treat `-32602` as "fix the code", and a missing receipt past `blockNumberMax` as "the world moved on" — the two need completely different responses.

## 6. Batching

A JSON-RPC batch containing this method is **dispatched per item**. One invalid element receives its own `-32602` and does not block the others, so a batch is not all-or-nothing here.

That also means a batch of N conditional submissions costs N against your rate budget, exactly like N separate calls; batching saves round-trips, not rate budget. See [Limits](../limits.md).

## 7. What this is not

This is the section to read twice, because the method invites optimistic assumptions.

- **It is not private orderflow.** Conditional submission is not a guaranteed private-orderflow facility, and this guide makes no such claim.
- **It is not a queue advantage.** Robinhood sequencing is first-come, first-served, and a larger priority fee does not move a transaction forward — conditions do not change that either. See [Fast submission](../send.md).
- **It is not a guarantee of inclusion.** The sequencer decides; the receipt is the only authoritative outcome.
- **It is not evaluated by us.** Repeating it because it is the most common misreading: we validate shapes, the target evaluates conditions.

If your design needs a hard guarantee that a transaction never executes against changed state, the conditional path reduces that risk but does not remove it. Keep the on-chain checks your contract would need anyway.

## 8. Tracking the outcome

Use the same discipline as ordinary submission, described in [Build a wallet backend](./build-a-wallet-backend.md): persist the transaction hash before you send, submit once, and reconcile by hash rather than resending. A returned hash means the request was routed, not that the transaction was included.

Because a conditional transaction can legitimately never land, add one thing to that loop: a stop condition tied to your own bound. When the head passes `blockNumberMax` (or your timestamp bound), mark the attempt closed and decide deliberately whether to rebuild with fresh state — do not poll forever.

## Frequently asked questions

**Does Triport check whether my conditions hold?**
No. We validate the option names and shapes; evaluating the conditions is done at submission time by the target. A `-32602` from us is always about the form of your request.

**Is gas spent on a local rejection?**
No. The request never reaches an upstream, so nothing is spent.

**Can I use a field that is not in the list of five?**
No — it is rejected rather than ignored. That is intentional: silently dropping an unrecognised condition would leave you believing in protection you do not have.

**Does one bad element ruin my batch?**
No. Conditional requests are dispatched per item, so the invalid element gets its own error and the rest proceed.

**My transaction never landed and I got no error. Why?**
The most likely reason is that a condition stopped holding after submission, which is not reported back to you as an error. Check whether your deadline passed, then rebuild against current state.

## Related

- [Conditional submission](../conditional.md) · [Fast submission](../send.md) · [Limits](../limits.md)
- [`eth_sendRawTransactionConditional`](../json-rpc/eth_sendRawTransactionConditional.md) · [`eth_sendRawTransaction`](../json-rpc/eth_sendRawTransaction.md)
- [`eth_blockNumber`](../json-rpc/eth_blockNumber.md) · [`eth_getStorageAt`](../json-rpc/eth_getStorageAt.md) · [`eth_getProof`](../json-rpc/eth_getProof.md) · [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md)
- [Build a wallet backend](./build-a-wallet-backend.md) · [Consume the sequencer feed](./consume-the-sequencer-feed.md)
