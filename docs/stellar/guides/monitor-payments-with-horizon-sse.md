> Live version: https://triport.io/docs/stellar/guides/monitor-payments-with-horizon-sse

# Monitor Stellar payments with Horizon and SSE

> Watch for incoming payments in near real time: why you subscribe to transactions rather than payments, how to close the gap after a reconnect with paging tokens, and why the edge of the retention window is an error rather than an empty page.

Payment monitoring on Stellar looks like a streaming problem and is actually a streaming *trigger* plus a paged read. Getting that split right is the whole job — everything else in this guide follows from it.

| | |
|---|---|
| **Stream** | `GET https://triport.io/rpc/stellar/horizon/{ledgers\|transactions}?cursor=now` |
| **Reads** | `GET https://triport.io/rpc/stellar/horizon/...` — see the [REST catalog](../rest/index.md) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (also `Authorization: Bearer`, or `?api-key=`) |
| **Required scope** | `stellar:rpc` |
| **Direction** | Read-only — no submission route is published on this surface |

## 1. You cannot subscribe to payments

The SSE surface mounts exactly two channels: **ledgers** and **transactions**. There is no payments channel, so "stream me this account's payments" is not something you can ask for directly.

That is not a limitation to work around with a bigger filter — it is the shape of the surface, and the correct design follows from it:

1. **Subscribe** to the transactions channel as a trigger that something happened.
2. **Read** the payments you care about over Horizon REST, from your stored cursor forward.
3. **Advance** your cursor only after your own work is committed.

The stream tells you *when* to look. REST tells you *what* happened. A design that tries to reconstruct payments purely from stream frames will be wrong at the first reconnect.

## 2. Connect

```bash
curl -N \
  -H "Accept: text/event-stream" \
  -H "x-token: $TRIPORT_API_KEY" \
  "https://triport.io/rpc/stellar/horizon/transactions?cursor=now"
```

`cursor` is required and must be the constant `now`. A missing cursor, a different value, or an unknown channel returns `400` — so a stream that will not start is a configuration error, not a quiet network problem.

Each `data:` frame carries one Horizon HAL resource, **not** a JSON-RPC envelope. Transaction frames carry `_links`, `id`, `paging_token`, `hash`, `ledger` and `successful`; `created_at` is optional in the contract. Ledger frames carry `sequence` and `closed_at` among others. Full field tables are in the [Horizon SSE reference](../streams/sse.md).

Two fields matter more than the rest:

- **`paging_token`** — the opaque cursor that lets REST continue exactly where you stopped.
- **`successful`** — a transaction can be included in the ledger and still have failed. Never credit a payment without checking it.

## 3. The cursor is what makes this reliable

`cursor=now` means the stream begins when you connect. It is not historical replay, and the published route does not promise replay from an older paging token. So a reconnect always creates a gap, and the only thing that closes it is a cursor you stored yourself.

Store the `paging_token` of the last payment you have **fully processed** — after your downstream work commits, never when the frame arrives:

```ts
await creditAccount(payment);          // commit your work first
await saveCursor(payment.paging_token); // only then advance
```

Reversing those two lines turns a crash into permanent loss. In the other order, a crash costs you a replay, and replays are harmless because payment `id` values let you de-duplicate.

## 4. Read the payments

On each trigger — and once at startup — page forward from your stored cursor:

```bash
curl "https://triport.io/rpc/stellar/horizon/accounts/$STELLAR_ACCOUNT/payments?cursor=$SAVED&order=asc&limit=200" \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

Use `order=asc` when you are catching up: ascending order means the last record you process is also the newest cursor to save, so the loop is naturally resumable. `limit` is at most **200** — a larger value is rejected with `400`, which was confirmed in measurement — and you continue by following the URL in `_links.next.href` rather than constructing the next page yourself.

Records arrive under `_embedded.records`, each with its own `id` and `paging_token`. If you do not need an account filter, the global [`/payments`](../rest/stellarHorizonListPayments.md) collection works the same way; for transaction-level records use [`/accounts/{account}/transactions`](../rest/stellarHorizonListAccountTransactions.md).

The per-account payments route is on the [`stellar_read_rpc_heavy`](../rate-limits-and-tiers.md) budget, so catching up over a long gap is the most expensive thing this design does. Page with `limit=200` rather than many small pages.

## 5. Reconnects are normal — plan the gap in

The stream can be interrupted, and no delivery SLA is provided. Treat reconnect-plus-backfill as the ordinary path, not the incident path:

1. Reconnect with `cursor=now` (the only accepted value).
2. Immediately page payments from your stored cursor up to the present.
3. Resume trigger-driven reads.

Because step 2 runs on every reconnect, your catch-up code is exercised constantly instead of rotting until the day you need it.

## 6. The window edge is an error, not an empty page

```text
HTTP 410 Gone   error=beyond_retention   oldest=N
```

This distinction decides whether your accounting is right. An empty page would let your code conclude "nothing happened in that range", which is the one wrong conclusion available here. Read `oldest` from the response, clamp your query to it, and serve anything older from your own store. Retrying the same historical request will not move the boundary — it is the measured retention of the node that answered, not a failure.

Soroban reports the same class of boundary as `-32602` with `beyond_retention`. Both are covered on the [`beyond_retention` error page](https://triport.io/errors/stellar/beyond-retention) and in [Stellar errors](../errors.md).

## 7. What this design does not give you

- **No payments stream.** Only ledgers and transactions are mounted; payments are always a read.
- **No replay.** `cursor=now` is the only accepted stream cursor; history is REST plus your own store.
- **No submission.** This surface is read-only; nothing here broadcasts a transaction.
- **No finality shortcut.** `successful: true` means the transaction succeeded, not that your business rules are satisfied. Apply your own confirmation policy.

## Frequently asked questions

**Why subscribe to transactions instead of ledgers?**
Both work as triggers. Transactions fire more precisely and carry `successful` and `paging_token` directly; ledgers are coarser and useful when you would rather poll once per close than once per transaction.

**Can I get payments that happened while I was disconnected?**
Yes, but through REST, not the stream: page `/accounts/{account}/payments` from your stored `paging_token`. The stream itself always starts at `now`.

**I reconnected and saw the same payment twice. Is that a bug?**
No — an overlapping backfill is expected and safe. De-duplicate on the payment `id` before acting.

**What does `410 beyond_retention` mean for my range?**
That the node no longer keeps that history, not that the range was empty. Clamp to the `oldest` value in the response and read older data from your own index.

**Why is my stream returning 400?**
Almost always `cursor`: it must be present and exactly `now`. An unknown channel name produces the same status.

## Related

- [Horizon SSE reference](../streams/sse.md) · [REST catalog](../rest/index.md) · [Stellar overview](../index.md)
- [`/accounts/{account}/payments`](../rest/stellarHorizonListAccountPayments.md) · [`/payments`](../rest/stellarHorizonListPayments.md) · [`/accounts/{account}/transactions`](../rest/stellarHorizonListAccountTransactions.md) · [`/accounts/{account}`](../rest/stellarHorizonGetAccount.md)
- [Stellar errors](../errors.md) · [Rate limits and tiers](../rate-limits-and-tiers.md)
