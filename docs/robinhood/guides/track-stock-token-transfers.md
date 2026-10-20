> Live version: https://triport.io/docs/robinhood/guides/track-stock-token-transfers

# Track Stock Token transfers on Robinhood Chain

> Stream ERC-20 Transfer events for tokenized stock contracts on Robinhood Chain over WebSocket, de-duplicate them on the client, handle reorgs, and backfill the gap after a disconnect with `eth_getLogs`.

Tokenized equities on Robinhood Chain are ordinary ERC-20 contracts, so a position moving between wallets appears on-chain as a `Transfer(address,address,uint256)` event. Everything in this guide therefore applies to any ERC-20 on the chain — stock tokens are not a special log type, and there is no separate "stock token" API.

This guide builds a transfer tracker that is correct under the conditions this chain actually gives you: a live subscription that promises neither exactly-once delivery nor ordering, blocks that can be reorganised, and a socket that can drop without leaving a cursor behind.

| | |
|---|---|
| **Live transport** | `wss://triport.io/ws/robinhood` (Basic tier and above) |
| **Backfill transport** | `POST https://triport.io/rpc/robinhood` |
| **Authentication** | `x-token: $TRIPORT_API_KEY`; clients that cannot set headers use the keyed URL form |
| **Required scope** | `robinhood:rpc` |
| **Network** | Robinhood Chain mainnet, chain ID `4663` |

If you have not connected yet, start with the [Quickstart](../quickstart.md).

## 1. The event you are filtering for

A `Transfer` event has three indexed-or-not parts that decide how you filter it:

- `topics[0]` — the event signature hash, identical for every ERC-20.
- `topics[1]` — the sender, left-padded to 32 bytes.
- `topics[2]` — the recipient, left-padded to 32 bytes.
- `data` — the amount, as a single 32-byte word.

The signature hash is `keccak256("Transfer(address,address,uint256)")`:

```text
0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

Rather than trusting a literal copied from a page, derive it in code so a typo cannot silently produce a filter that matches nothing:

```ts
import { toEventSelector } from "viem";

const TRANSFER_TOPIC = toEventSelector("Transfer(address,address,uint256)");
```

A filter that matches nothing is the failure mode to design against here: it looks exactly like a quiet market. Deriving the topic, and asserting it against a known transfer from the [explorer](../ecosystem.md), turns a silent bug into a startup check.

Collect the token contract addresses you care about and pass them as the `address` field. Filtering by address server-side is much cheaper than receiving every log on the chain and discarding most of it.

## 2. Subscribe

```json
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["logs",{"address":["0x…token1","0x…token2"],"topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]}]}
```

`address` accepts a single string or an array. `topics` is positional: supplying only `topics[0]` matches every sender and recipient. To watch one wallet's incoming transfers, pass `null` at position 1 and the padded address at position 2:

```ts
const topics = [TRANSFER_TOPIC, null, `0x000000000000000000000000${wallet.slice(2)}`];
```

An invalid filter is rejected outright instead of producing an empty stream:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32602,"message":"invalid filter"}}
```

Treat that error as fatal at startup: it means your filter is malformed, not that there is no activity. Notifications then arrive in the standard `eth_subscription` envelope, each carrying `address`, `topics`, `data`, `blockNumber`, `blockHash`, `transactionHash`, `logIndex` and `removed`. The full filter reference is on the [logs subscription](../ws/logs.md) page.

## 3. De-duplicate — this step is not optional

**Do not assume a log arrives exactly once, or in `logIndex` order.** Delivery is assembled from upstream channels, and a reconnect replays nothing but can repeat a block you have already seen. The only safe identity for a log is the tuple:

```ts
const key = (log) => `${log.blockHash}:${log.transactionHash}:${log.logIndex}`;
```

Track the **state** of each tuple — applied or undone — rather than merely whether you have seen the key. A reorg cancellation carries the *same* tuple as the log it cancels, so a plain "have I seen this key?" check placed before the `removed` branch swallows the cancellation and your undo never runs. Keep that state in a bounded structure — the last few thousand tuples, or a table with a unique index — and order your own work by `blockNumber`, then `logIndex`, rather than by arrival time:

```ts
const state = new Map(); // tuple -> "applied" | "undone"; bound it in production

function onLog(log) {
  const id = key(log);
  const known = state.get(id);

  if (log.removed) {
    // Record the cancellation even when nothing was applied yet: it can
    // overtake the log it cancels (see section 4).
    state.set(id, "undone");
    if (known === "applied") undo(log); // only undo what you really applied
    return;
  }

  if (known) return;                    // duplicate delivery, or already cancelled
  state.set(id, "applied");
  apply(log);
}
```

Using `transactionHash` alone is wrong — one transaction can emit many transfers. Using `blockNumber` instead of `blockHash` is also wrong, and section 4 explains why.

## 4. Reorgs and `removed`

A log delivered with `removed: true` belongs to a block that is no longer canonical. Undo whatever you did for that tuple: subtract the balance change, retract the notification, mark the row void.

A cancellation can arrive **before** the log it cancels. Cancellations are released as soon as they are observed, while an ordinary log may still be held behind a gap in the `logIndex` sequence, so the two can swap places on the wire. That is why section 3 records a cancelled tuple even when nothing was applied, and never applies a tuple whose cancellation it has already seen: otherwise the late original lands after the undo and stays applied forever, which is the same silent loss in the opposite order.

Because `blockHash` is part of the key, the replacement log from the new canonical block is a *different* tuple and flows through your normal path without being mistaken for a duplicate. That is precisely why the key uses `blockHash` and not `blockNumber` — two different blocks can carry the same height.

If your product cannot tolerate retractions, do not act on a transfer the moment you see it. Hold it until a few blocks have been built on top, then apply it. You are trading latency for a lower chance of showing a number you have to take back.

## 5. Backfill after a disconnect

A subscription buffers nothing for a disconnected client and has no cursor, so reconnecting does not resume anything. The recovery pattern is: persist the last **fully processed** block number, reconnect, resubscribe, then fetch the gap over HTTP with the same filter:

```ts
const logs = await rpc("eth_getLogs", [{
  fromBlock: toHex(lastProcessed + 1),
  toBlock: toHex(currentHead),
  address: tokens,
  topics: [TRANSFER_TOPIC],
}]);
```

Feed those logs through the same `onLog` — the de-duplication from section 3 is what makes an overlapping backfill safe, so err on the side of re-reading a block you may already have.

Two practical constraints. Range and result ceilings depend on the serving channel, so do not assume one call covers an arbitrary gap: split the range and retry rather than treating an error or timeout as "no events". Deep ranges may be reconstructed from block receipts, which is slower and can fail when no eligible historical channel exists. See [`eth_getLogs`](../json-rpc/eth_getLogs.md) and [Limits](../limits.md).

Persist the cursor **after** your downstream work commits, not when the log arrives. A cursor saved too early turns a crash into permanent data loss; a cursor saved late only costs you a replay, which de-duplication absorbs.

## 6. Decode the transfer

Addresses in `topics` are 32-byte left-padded; the amount is the `data` word. Amounts are integers in the token's own base units, so you need `decimals()` to display them:

```ts
const from = `0x${log.topics[1].slice(26)}`;
const to = `0x${log.topics[2].slice(26)}`;
const amount = BigInt(log.data);
```

Read `decimals()` and `symbol()` once per contract with [`eth_call`](../json-rpc/eth_call.md) and cache them — they do not change, and re-reading them per event wastes your request budget. Never render `amount` without scaling it by `decimals`: that is how a transfer of one share gets displayed as a billion.

If you also need the transaction context — the sender that paid for the call, the gas used, the rest of the receipt — fetch it with [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md), or pull a whole block's worth at once with [`eth_getBlockReceipts`](../json-rpc/eth_getBlockReceipts.md) instead of one call per transaction.

## 7. Keep the socket healthy

Delivery is live and the server-side queue per client is bounded. If your handler blocks — synchronous database writes, an HTTP call per event — the queue fills and the connection is closed with `1013 client_backpressure`. Enqueue locally and process asynchronously so the socket is always drained.

Handle the close codes explicitly: `4001` means no usable key reached the handshake, `4003` means the key lacks `robinhood:rpc`, and `1013` means either your client fell behind or no upstream was eligible. On any reconnect, resubscribe **and** run the section 5 backfill — a reconnect without a backfill is a silent hole in your data.

## 8. What this design does not give you

- **No pre-inclusion view.** `newPendingTransactions` is not available and `txpool_*` methods are not part of the Robinhood contract, so there is no mempool to watch. The earliest source of transaction data is the assembled-block [sequencer feed](../feed.md).
- **No replay.** The subscription has no cursor; `eth_getLogs` is the recovery path, not a stream rewind.
- **No ordering promise.** Sort by `blockNumber` then `logIndex` yourself.
- **No balance snapshot.** Transfer events tell you what moved, not what an account holds. For a current balance, call `balanceOf` through `eth_call`; for historical state, read the measured floors on [Archive depth](../archive.md) before assuming an old block is answerable.

## Frequently asked questions

**Do I need a separate subscription per token contract?**
No. `address` accepts an array, and one subscription with several addresses is cheaper than several subscriptions. Split across connections only when your filter becomes large enough to be unwieldy.

**Why did I receive the same transfer twice?**
Because delivery is not exactly-once. A reconnect, or a block re-delivered from another upstream channel, can repeat logs you already have. That is expected and is exactly what the tuple key in section 3 absorbs.

**My stream is silent — is the endpoint broken?**
Check the filter before the endpoint. A wrong `topics[0]`, or an address with the wrong case-insensitive value, matches nothing and looks identical to an idle market. Verify by fetching a known past transfer with `eth_getLogs` using the same filter.

**Can I get transfers for every token at once?**
Omit `address` and you will match every contract on the chain, which is a much larger stream and usually the wrong tool. Prefer an explicit address list, and use `eth_getLogs` over a bounded range for exploratory queries.

**Does a batch of JSON-RPC calls count as one request?**
No. Every element is inspected separately and a batch of N requests costs N against your budget; batching saves round-trips, not rate limit. See [Limits](../limits.md).

## Related

- [logs subscription](../ws/logs.md) — the full filter, de-duplication and reorg reference
- [`eth_getLogs`](../json-rpc/eth_getLogs.md) · [`eth_call`](../json-rpc/eth_call.md) · [`eth_getBlockReceipts`](../json-rpc/eth_getBlockReceipts.md)
- [`eth_getTransactionReceipt`](../json-rpc/eth_getTransactionReceipt.md) · [`eth_getBlockByNumber`](../json-rpc/eth_getBlockByNumber.md)
- [WebSocket subscriptions](../ws.md) · [Limits](../limits.md) · [Archive depth](../archive.md)
