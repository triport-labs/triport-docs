> Live version: https://triport.io/docs/robinhood/guides/build-a-wallet-backend

# Build a wallet backend for Robinhood Chain

> Read native and token balances, allocate nonces safely when the `pending` tag is not a commitment, price and submit a signed transaction on an FCFS sequencer, and track the outcome by receipt without `safe` or `finalized` tags.

A wallet backend does four things: it shows balances, it builds and signs transactions, it gets them onto the chain, and it tells the user what happened. On Robinhood Chain three of those four behave differently from a typical EVM deployment, and a backend written on EVM reflexes will look correct in testing and drift in production.

This guide is about those differences. The connection itself is in the [Quickstart](../quickstart.md).

| | |
|---|---|
| **Endpoint** | `POST https://triport.io/rpc/robinhood` |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Network** | Robinhood Chain mainnet, chain ID `4663`, gas paid in ETH |

## 1. Where the keys live

This surface never holds keys and never re-signs anything. Your backend signs locally and sends the serialized result with [`eth_sendRawTransaction`](../json-rpc/eth_sendRawTransaction.md). Everything below assumes that split: signing is yours, transport is ours.

## 2. Balances

Native ETH balance comes from [`eth_getBalance`](../json-rpc/eth_getBalance.md). Token balances are a contract read — `balanceOf(address)` through [`eth_call`](../json-rpc/eth_call.md):

```ts
const data = `0x70a08231${account.slice(2).padStart(64, "0")}`;
const hex = await rpc("eth_call", [{ to: token, data }, "latest"]);
const raw = BigInt(hex);
```

Read `decimals()` and `symbol()` once per token and cache them; they do not change, and re-reading them on every refresh spends request budget for nothing. Never display `raw` unscaled — that is how one share becomes a billion.

Pin the block tag deliberately. `latest`, `earliest` and `pending` are part of this contract; **`safe` and `finalized` are not**. If your code carries a shared "read at finalized" helper from another chain, it will fail here, and that is the good outcome — the bad one is silently falling back to `latest` while your UI claims finality.

## 3. Allocate nonces yourself

This is the section that matters most, and the one where standard EVM advice is wrong here.

The usual recipe is "read the nonce at the `pending` tag and use it". On this chain that is not a reliable reservation:

- At the `pending` tag the value reflects a **right-now view, not a commitment** — see [`eth_getTransactionCount`](../json-rpc/eth_getTransactionCount.md).
- `pending` is a snapshot of what the sequencer presents at that instant. It can disappear, be replaced, or move into another block, and it is not a durable stage. In the dated measurement snapshots, no operator exposed pending ahead of latest from either point of presence — see [Pending data](../pending.md).
- Reads are served by a selected healthy channel, and adjacent calls are **not pinned to one upstream snapshot**. Two consecutive reads can therefore come from different views.

Put together: a read-modify-write loop that asks the network for the next nonce before every send has a race in it, and a second worker for the same address will eventually pick the same number.

Treat the chain as the source of truth for *initialisation and repair*, and your own store as the source of truth for *allocation*:

```ts
// One writer per address. Persist `next` in the same transaction as the job.
async function reserveNonce(address: string): Promise<number> {
  return db.tx(async (t) => {
    let row = await t.get(address);
    if (!row) {
      const onchain = Number(BigInt(await rpc("eth_getTransactionCount", [address, "latest"])));
      row = { next: onchain };
    }
    const nonce = row.next;
    await t.put(address, { next: nonce + 1 });
    return nonce;
  });
}
```

Resynchronise from `latest` — not `pending` — when you start up, when a send fails with a nonce error, or when a gap has not cleared for a while. `latest` is a committed view; `pending` is not, so rebuilding your counter from it can bake a transient reading into durable state.

Serialise per address. Two workers sharing one address need one queue between them, not two nonce readers.

## 4. Price the transaction — and know what pricing does not buy

Robinhood sequencing is **first-come, first-served**. A larger priority fee does **not** move a transaction forward in the sequencer queue ([Fast submission](../send.md)). If you carry over the instinct that raising the fee wins races, you will pay more for nothing and still lose to whoever submitted earlier.

What fees still do: they must be high enough for the transaction to be accepted and to stay valid. So price sanely, then spend your engineering effort on being early — sign ahead of the critical path and keep the work between "decide" and "submit" small.

Estimate gas with [`eth_estimateGas`](../json-rpc/eth_estimateGas.md) and add a margin; read the fee environment with [`eth_maxPriorityFeePerGas`](../json-rpc/eth_maxPriorityFeePerGas.md) or [`eth_feeHistory`](../json-rpc/eth_feeHistory.md). Remember the balance check is against `value + gasLimit × maxFeePerGas` — the worst case, not the fee you expect to pay — so a wallet that is "just barely" funded gets rejected before broadcast.

Gas is paid in ETH, and getting ETH onto the chain is a bridge operation that Triport does not run; see [Getting ETH for gas](../gas.md).

## 5. Submit once

```ts
const hash = await rpc("eth_sendRawTransaction", [signed]);
```

Three rules follow from the contract:

**A returned hash means the request was routed, not that the transaction was included.** Treat the hash as a tracking handle and let the receipt decide the outcome.

**Do not re-sign on retry.** Retry the *same bytes* if the transport failed, so a duplicate cannot become a second distinct transaction on the same nonce.

**Retry transport failures, not answers.** A connection reset is worth retrying. A deterministic rejection is not: the same bytes produce the same answer, and retrying only burns budget. In particular:

- `nonce too low` — that nonce is used; resynchronise and rebuild.
- `already known` — the node already holds this exact transaction. Nothing failed; stop sending and start waiting.
- `insufficient funds for gas * price + value` — arithmetic, not luck. Fund the sender or lower the cap.

Each of those has a page with the full handling under [`/errors/evm/`](https://triport.io/errors/evm/nonce-too-low).

## 6. Track the outcome

Poll [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md) for the hash you kept. A `null` result means "not yet", not "failed". A receipt with `status: "0x0"` means the transaction was included and reverted — it cost gas, and it is final in the sense that resending the same bytes will not help.

Because there are no `safe` or `finalized` tags here, your confirmation policy has to be **depth-based**: record the receipt's `blockNumber`, compare it against the head from [`eth_blockNumber`](../json-rpc/eth_blockNumber.md), and treat the transaction as settled only after the number of blocks your product requires. Reconcile by transaction hash against later canonical blocks rather than trusting a single read.

Persist the hash **before** the first submission. If your process dies between sending and recording, the only way to find out what happened is to have written the hash down first.

## 7. What this chain does not give you

- **No mempool to watch.** `txpool_*` is not part of the contract and `newPendingTransactions` is not available, so you cannot observe your own transaction "in flight". The nearest live source is the assembled-block [sequencer feed](../feed.md), which carries blocks, not a pending pool.
- **No pending pool as a reservation system.** See section 3.
- **No finality tag.** See section 6.
- **No acceptance guarantee.** Fast delivery to the sequencer is what is measured; whether the network accepts a given transaction depends on validity, nonce, gas and conditions.

## Frequently asked questions

**Can I just use the `pending` nonce like on other chains?**
You can read it, but do not treat it as a reservation. The page for the method says the `pending` value is a right-now view and not a commitment, and pending was not observed ahead of latest in the dated snapshots. Allocate from your own counter and resync from `latest`.

**Will paying a higher priority fee get my transaction in sooner?**
No. Sequencing is first-come, first-served, so the fee does not buy queue position. Being early does.

**I got a hash back — is the transaction on chain?**
Not necessarily. The hash says the request was routed. Poll the receipt, then apply a depth-based confirmation policy.

**Two workers keep colliding on the same nonce. What is the fix?**
One writer per address. Put a queue in front of the address and allocate nonces inside the same database transaction that records the job, as in section 3.

**Should I resend if I see `already known`?**
No. The node already has that exact transaction and the first copy is pending. Wait on the receipt for the hash you already have.

## Related

- [Fast submission](../send.md) · [Pending data](../pending.md) · [Getting ETH for gas](../gas.md)
- [`eth_getBalance`](../json-rpc/eth_getBalance.md) · [`eth_call`](../json-rpc/eth_call.md) · [`eth_getTransactionCount`](../json-rpc/eth_getTransactionCount.md)
- [`eth_sendRawTransaction`](../json-rpc/eth_sendRawTransaction.md) · [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md) · [`eth_estimateGas`](../json-rpc/eth_estimateGas.md)
- [Track Stock Token transfers](./track-stock-token-transfers.md) · [Limits](../limits.md)
