> Live version: https://triport.io/docs/platform/wallet-activity

# Wallet activity — address activity stream

> Every transaction that touches an address on your watchlist, as one event
> per (network, transaction, address): who sent what, which tokens and native
> coin moved, whether it reverted and why, and how deep the block was when we
> sent it. The match is on the address taking part, not on the protocol, so a
> new router, claim contract or bridge shows up without any change on our side.
> Delivered through the same Wallet Watch channels: WebSocket, webhook or REST
> cursor.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/wallet/watch` with `events: ["wallet_activity"]`, `POST`/`GET /v1/wallet/watch/{id}/watchlist`, `GET /v1/wallet/watch/{id}/events?cursor=…`, `GET /v1/wallet/watch/coverage`, `WS /ws/wallet-watch?id=…&cursor=…` |
| **Type** | Triport product (REST API + WebSocket + webhook) |
| **Network** | Ethereum (1), Base (8453), BNB Smart Chain (56), Robinhood Chain (4663); Polygon (137) is scanned too, see [Coverage](./wallet-activity.md#coverage-by-network) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`); the key must belong to an account (dashboard key), not a static token |
| **Required scope** | — (tier-gated, see below) |
| **Tier / rate limit** | Business and Enterprise, same as [Wallet Watch](./wallet-watch.md): REST 30 rps (Business) / 150 rps (Enterprise) in the `wallet_identity` category; stream limits in [Limits](./wallet-activity.md#limits) |

> **Availability.** `wallet_activity`, the portable cursor, the watchlist
> endpoints and `/coverage` are on production since 2026-09-29 (re-checked
> 2026-10-09: `/coverage` answers, the watchlist and events routes are mounted).

## Description

`wallet_activity` is an event type of [Wallet Watch](./wallet-watch.md). Add it
to a subscription together with a `watchlist`, and the scanner reports every
transaction in which a watched address takes part:

- the address sent the transaction or was its target (`tx_from`, `tx_to`),
  including zero-value calls such as approve, swap, claim, stake, and failed
  transactions;
- native coin moved in or out, both as the transaction value and, where
  tracing is available, inside the call tree (`native_internal_in/out`);
- ERC-20, ERC-721 and ERC-1155 tokens moved in or out, even when the address
  is neither the sender nor the target of the transaction;
- the address appears in any log, as an indexed topic or as a 32-byte word of
  log data (a claim, a vault deposit, a bridge recipient);
- the address sent a bridge deposit or received a bridge fill.

The scanner already reads every block with all receipts. Level A matching
(transaction fields and logs) needs no extra upstream calls. Only addresses on
some watchlist ever become events, so the stream holds your addresses, not
the whole chain.

**One event per (network, transaction, watched address).** An approve plus a
swap plus an ETH refund in one transaction is one event with three
`movements` and a combined `matched_by`. If two of your addresses take part in
the same transaction, you get two events with the same `tx.hash`; group them
by hash if you need a per-transaction view. A subscription only sees events of
its own watchlist.

**Protocol-agnostic.** Triport does not name actions ("swap", "claim",
"stake") and does not decode protocol calldata. You get `tx.method_id`, the
exact token movements and the raw facts; decoding is up to you.

## Parameters

### Subscription body

`wallet_activity` uses the regular Wallet Watch body
([full field list](./wallet-watch.md#parameters)). Fields that matter here:

| Field | Type | Required | Description |
|---|---|---|---|
| `events` | string[] | yes | Include `wallet_activity`. It can be combined with the other Wallet Watch types. |
| `watchlist` | string[] | **yes** for `wallet_activity` | EVM addresses (`0x` + 40 hex, any case; stored lowercase). An empty watchlist → `400 watchlist_required`. Up to 10 000 (Business) / 100 000 (Enterprise). Change it later with [`/watchlist`](./wallet-activity.md#watchlist-management) without re-creating the subscription. |
| `min_confirmations` | integer | no | Hold each event until the network head is at least N blocks past the event's block. `0` (default) = deliver at scanner depth. Range `0` to the smallest reorg window of the subscription's networks (12 when `eth` is included, else 64). Applies to every event type of the subscription except the system events `reorg_revert` and `gap`, which are never held. See [Ordering](./wallet-activity.md#cursor-and-resume). Until the deployment's database carries this option, a value above `0` is refused with `503 option_unavailable` — never silently ignored. |
| `delivery` | object | yes | `{"type":"ws"}`, `{"type":"webhook","url":"https://…","secret":"…"}` or `{"type":"pull"}`. |
| `filter`, `enrich`, `min_amount_usd` | — | no | Not applied to `wallet_activity` in v1: you chose the addresses. A subscription whose only event type is `wallet_activity` and that has a non-empty `filter` → `400 filter_not_supported`. With mixed types the filter applies to the other types only. |

### Watchlist management

| Endpoint | Body / query | Response |
|---|---|---|
| `POST /v1/wallet/watch/{id}/watchlist` | `{"add": ["0x…"], "remove": ["0x…"]}`; up to 10 000 addresses per call (add + remove together); body ≤ 1 MiB | `200 {"added": n, "removed": n, "total": n}` |
| `GET /v1/wallet/watch/{id}/watchlist` | `?limit=1..5000` (default 1000) `&cursor=<next_cursor>` | `200 {"watchlist": [...], "total": n, "has_more": bool, "next_cursor": "0x…" \| ""}` |

- The change is atomic. Concurrent calls, and a concurrent `PATCH` of the
  subscription, never lose each other's addresses. Duplicates and case are
  normalised. A call that changes nothing writes nothing.
- Pages are ordered by address and stay stable while the list changes;
  `next_cursor` is the last address of the page.
- The resulting list must fit the tier's watchlist limit, and a subscription
  with `wallet_activity` must keep at least one address.

### Stream parameters

| Where | Parameter | Description |
|---|---|---|
| `WS /ws/wallet-watch` | `id` | Subscription id (required, `delivery.type` = `ws`). |
| `WS /ws/wallet-watch`, `GET …/{id}/events` | `cursor` | The `cursor` of the last event you processed. Takes precedence over `after_seq` / `after`. |

## Request

Create a subscription for two addresses on the four client networks, delivered
over WebSocket:

```bash
curl -X POST "https://triport.io/v1/wallet/watch" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "treasury-activity",
    "chains": ["eth", "base", "bsc", "robinhood"],
    "events": ["wallet_activity"],
    "watchlist": [
      "0xf13176ece4ed8d9aa4c335cd4f247458d4863fe4",
      "0x133243d447026345c2b368d7ffe435dbe3c566eb"
    ],
    "delivery": {"type": "ws"}
  }'
```

The same with webhook delivery, released only after 3 more blocks:

```json
{
  "name": "treasury-activity-hook",
  "chains": ["eth", "base", "bsc", "robinhood"],
  "events": ["wallet_activity"],
  "watchlist": ["0xf13176ece4ed8d9aa4c335cd4f247458d4863fe4"],
  "min_confirmations": 3,
  "delivery": {"type": "webhook", "url": "https://example.com/hooks/triport", "secret": "change-me"}
}
```

Then connect: `wss://triport.io/ws/wallet-watch?id=<subscription id>` (add
`&cursor=<last cursor>` when reconnecting).

## Response

`POST /v1/wallet/watch` returns the subscription (`201`); see
[Wallet Watch](./wallet-watch.md#response). `GET /v1/wallet/watch` now also
tells you which limits apply to the key:

```json
{
  "subscriptions": [ … ],
  "total": 1,
  "limits": {"MaxSubscriptions": 5, "MaxChains": 5, "MaxWatchlist": 10000, "WebhookRPS": 10},
  "tier": "business",
  "limits_source": "tier"
}
```

`limits_source` is `tier` (limits of the key's plan), `override` (limits raised
for your account by support) or `default` (no plan on the request context;
Business limits apply).

### The event

A real event from our test fixtures (Ethereum block 26079176): the watched
address swaps a token for ETH through a router. The token leaves in a log
(`erc20_out`), and the ETH comes back only inside the call tree
(`native_internal_in`, found by tracing this matched transaction). `seq` and
`cursor` are assigned at delivery; the values here are illustrative.

```json
{
  "type": "wallet_activity",
  "event_id": "wa_fee93628d4ac385fdd95f122e55d4654",
  "seq": 18234,
  "cursor": "c1.synthetic-opaque-resume-token",
  "chain": "eth",
  "chain_id": 1,
  "block": {
    "number": 26079176,
    "hash": "0x0d5918c5004fd08df5d230156bca545d57967c2956336b153dc991b38a7088ef",
    "timestamp": "2026-09-28T23:15:47Z"
  },
  "tx": {
    "hash": "0x26c296759b03833624a52a933a03733b9f0dc574748dd7c49f66408d5abdceb9",
    "index": 0,
    "from": "0xf13176ece4ed8d9aa4c335cd4f247458d4863fe4",
    "to": "0x7f98c4510ce9434c3ab82be48a4a9899762ed5e4",
    "value": "0",
    "nonce": 17446,
    "type": 2,
    "method_id": "0x39ecce49",
    "gas_used": "316502",
    "effective_gas_price": "32437439794",
    "fee": "10266514569680588"
  },
  "status": "success",
  "error": null,
  "confirmation": {"depth": 1, "reorg_window": 12, "state": "unsafe"},
  "address": "0xf13176ece4ed8d9aa4c335cd4f247458d4863fe4",
  "matched_by": ["tx_from", "native_internal_in", "erc20_out", "log_topic"],
  "movements": [
    {
      "kind": "erc20",
      "direction": "out",
      "token": "0x8cc7587f649613ed69c23b9192236b5bf998bee4",
      "from": "0xf13176ece4ed8d9aa4c335cd4f247458d4863fe4",
      "to": "0x000000000004444c5dc75cb358380d2e3de08a90",
      "amount": "10885706924859198261659815",
      "log_index": 6
    },
    {
      "kind": "native_internal",
      "direction": "in",
      "token": "native",
      "from": "0x7f98c4510ce9434c3ab82be48a4a9899762ed5e4",
      "to": "0xf13176ece4ed8d9aa4c335cd4f247458d4863fe4",
      "amount": "55865764517809644",
      "trace_path": "11"
    }
  ],
  "coverage": {"logs": "full", "internal_native": "matched_tx_only"}
}
```

A reverted transaction (Ethereum block 26078871, revert text from the trace):

```json
{
  "type": "wallet_activity",
  "event_id": "wa_4ef9c4a7808056556f725e7786f6b548",
  "chain": "eth",
  "chain_id": 1,
  "tx": {"hash": "0x242ab2307487d8198529ffcef836448673bded4154a2fd59dd02213eb834b386", "from": "0x023ab8e20a4682d315daef4c91db96bd77934d66", "value": "200000000000000000", "method_id": "0xe21fd0e9", "fee": "400434831477351", "…": "…"},
  "status": "reverted",
  "error": {"message": "Return amount is not enough", "source": "trace"},
  "address": "0x023ab8e20a4682d315daef4c91db96bd77934d66",
  "matched_by": ["tx_from"],
  "movements": [],
  "coverage": {"logs": "full", "internal_native": "matched_tx_only"}
}
```

### Event fields

| Field | Type | Description |
|---|---|---|
| `type` | string | `wallet_activity`. |
| `cursor` | string | Opaque resume position (`c1.…`), bound to this subscription. Pass the last one you processed as `?cursor=`. |
| `chain`, `chain_id` | string, integer | `eth` 1, `base` 8453, `bsc` 56, `robinhood` 4663, `polygon` 137. |
| `block` | object | `number`, `hash`, `timestamp` (block time, UTC). |
| `tx.hash`, `tx.index`, `tx.from`, `tx.nonce`, `tx.type` | — | The outer transaction. |
| `tx.to` | string \| null | `null` for a contract creation. |
| `tx.created_contract` | string | Address of the created contract (creation transactions only). |
| `tx.value` | string | Wei, decimal string. |
| `tx.method_id` | string \| null | First 4 bytes of calldata; `null` without calldata. |
| `tx.gas_used`, `tx.effective_gas_price`, `tx.fee` | string | Wei, decimal strings. `fee` = `gas_used × effective_gas_price` (+ `l1_fee`). Also reported for reverted transactions. |
| `tx.l1_fee` | string | L1 data fee on Base (OP stack); absent elsewhere. |
| `status` | string | Execution result from the receipt: `success`, `reverted`, or `unknown` when the receipt could not be read (then `coverage.logs` is `unavailable`). |
| `error` | object \| null | `null` unless reverted. See [Status, confirmation and error](./wallet-activity.md#status-confirmation-and-error). |
| `confirmation` | object | `depth`, `reorg_window`, `state`. See [Status, confirmation and error](./wallet-activity.md#status-confirmation-and-error). |
| `address` | string | The watched address this event is about (lowercase). |
| `matched_by` | string[] | Why the address matched, in the fixed order of the table below, without duplicates. |
| `movements` | object[] | Value that moved to or from `address` in this transaction. Can be empty (an approve, a failed call). |
| `bridge` | object | Present when the transaction is a known bridge deposit or fill. See [Bridges](./wallet-activity.md#bridges). |
| `coverage` | object | What was checked for this event: `logs` (`full` \| `unavailable`) and `internal_native` (`traced` \| `matched_tx_only` \| `matched_tx_skipped` \| `unavailable`). |
| `logs` | array | Reserved for an opt-in `include=logs`; not emitted yet. |

### `matched_by` vocabulary

| Reason | Meaning |
|---|---|
| `tx_from` | The address sent the transaction. |
| `tx_to` | The address is the transaction's `to`. |
| `contract_created` | The address is the contract created by this transaction, or deployed it (`tx.to` is `null`, `tx.created_contract` is set). |
| `native_in` / `native_out` | Native coin received / sent as the outer transaction's `value`. |
| `native_internal_in` / `native_internal_out` | Native coin received / sent inside the call tree (from a trace; see [Coverage](./wallet-activity.md#coverage-by-network)). |
| `erc20_in` / `erc20_out` | ERC-20 `Transfer` to / from the address. |
| `erc721_in` / `erc721_out` | ERC-721 `Transfer` to / from the address. |
| `erc1155_in` / `erc1155_out` | ERC-1155 `TransferSingle` / `TransferBatch` to / from the address. |
| `approval` | The address is the owner in an ERC-20 `Approval` or an `ApprovalForAll`. |
| `weth_deposit` / `weth_withdrawal` | The address wrapped / unwrapped the network's wrapped native token (WETH9, Base WETH, WBNB, WPOL, Robinhood WETH). |
| `log_topic` | The address is an indexed topic of some other log. |
| `log_data` | The address is a 32-byte word of some log's data (12 zero bytes + 20 address bytes, word-aligned). |
| `bridge_out` | The address is the sender of a known bridge deposit. |
| `bridge_in_recipient` | The address is the recipient of a known bridge fill on this network, even if it is neither `tx.from` nor `tx.to`. |
| `authorization_7702` | Reserved for EIP-7702 authorizations; not emitted yet. |

`log_topic` and `log_data` are added only when a standard reason does not
already explain that log.

### Movements

| Field | Description |
|---|---|
| `kind` | `native` (outer `value`), `native_internal` (inside the call tree), `erc20`, `erc721`, `erc1155`. |
| `direction` | `in`, `out`, or `self` when `from` and `to` are both the watched address (one movement; `matched_by` then has both `_in` and `_out`). |
| `token` | `native` or the token contract address. |
| `from`, `to` | Sender and receiver of this movement. |
| `amount` | Exact amount in the token's smallest unit, decimal string. ERC-721 is `"1"`. No decimals or symbol are attached; use the token contract. |
| `token_id` | ERC-721 / ERC-1155 id, decimal string. One movement per id for batches. |
| `log_index` | The log that produced the movement. |
| `trace_path` | `native_internal` only: position in the call tree, child indexes from the root joined with `.`. `"0"` is the first call of the root, `"1.0.2"` is the third call of the first call of the second root call. |

Wrapping and unwrapping the wrapped native token appear as an `erc20` movement
from or to the zero address. A reverted transaction has no movements, because
nothing moved.

### Status, confirmation and error

`status` tells you whether the transaction executed; `confirmation` tells you
how settled the block was when we sent the event. They are independent: a
`success` event can still be revoked by a reorg, and a `reverted` transaction
is still final on-chain data.

- `confirmation.depth` is the block's depth when the event was sent, counting
  the block itself. At scanner depth it is 1 on Ethereum, 2 on Base, BSC and
  Polygon, and 3 on Robinhood Chain. With `min_confirmations`, it is the depth
  at release.
- `confirmation.reorg_window` is how many recent blocks the scanner watches for
  reorgs: 12 on Ethereum, 64 elsewhere. A reorg inside the window revokes
  events with [`reorg_revert`](./wallet-activity.md#system-events). Deeper reorgs are not detected.
- `confirmation.state` is `unsafe` for every event today. The scanner runs
  0–2 blocks behind head and does not wait for the network's safe or finalized
  label. `safe` and `finalized` are reserved.

`error` on a reverted transaction:

| Case | `error` |
|---|---|
| Traced, readable reason | `{"message": "Return amount is not enough", "source": "trace"}` (from `revertReason`, `Error(string)`, `Panic(uint256)` such as `"panic 0x11: arithmetic overflow/underflow"`, or the frame error such as `"out of gas"`) |
| Traced, custom error | `{"message": null, "source": "trace", "data": "0x97a6f3b9…"}`: raw revert data to decode with the contract ABI |
| Not traced (Base, BSC, Polygon, or tracing skipped) | `{"message": null, "source": "unavailable"}` |

### Bridges

When the transaction is a deposit or fill of a bridge in Triport's bridge
ledger, every `wallet_activity` event of that transaction carries `bridge`:

```json
{
  "bridge": {
    "protocol": "across",
    "direction": "in",
    "src_chain": "eth",
    "dest_chain": "base",
    "recipient": "0x133243d447026345c2b368d7ffe435dbe3c566eb",
    "recipient_differs": true,
    "match_key": "across:23070121299661697374815406206335037817969100169091574962113810036879150190442",
    "link": "protocol_id"
  }
}
```

(From a real Across fill on Base, block 51923932: the recipient is not the
depositor, and the watched recipient matched with
`["erc20_in", "log_data", "bridge_in_recipient"]`.)

- `protocol`: `across`, `stargate`, `debridge`, `relay`, `base_native`,
  `polygon_pos`, `robinhood_native`.
- `recipient_differs`: the recipient is not the depositor.
- `match_key` and `link`. **Links are never inferred.** `match_key` is set only
  when the protocol itself emits an id (Across deposit id, deBridge order id,
  Stargate GUID). Then `link` is `protocol_id`, and the deposit event on the
  source network and the fill event on the destination network carry the
  **same** `match_key`, so you can join them. Without a protocol id (for
  example Relay solver transfers), `match_key` is absent and `link` is `none`.
  Triport does not pair transfers by amount or timing.
- Bridge ledger per network: Ethereum and Base — Across, Stargate, deBridge
  DLN, the OP-stack standard bridges; Ethereum also Polygon PoS and the
  Robinhood L1 gateways. BSC — Across, plus Stargate and deBridge marked
  unconfirmed. Robinhood Chain — only its native L2 gateways, unconfirmed; no
  third-party bridge contracts are listed yet. Relay solver transfers are
  recognised on every network.

### System events

Delivered on the same channel, with `event_id` and `cursor` like any event.

**`gap`**: some events will never be delivered for a block range.

```json
{
  "seq": 18302,
  "event_id": "ev_…",
  "cursor": "c1.…",
  "chain": "bsc",
  "block": 124610180,
  "block_hash": "",
  "tx": "",
  "ts": "2026-09-30T10:00:00Z",
  "type": "gap",
  "from_block": 124609901,
  "to_block": 124610180,
  "reason": "scanner_lag",
  "recoverable": false
}
```

| `reason` | Meaning | Who receives it |
|---|---|---|
| `scanner_lag` | The scanner fell more than `max_lag` blocks behind head (see `/coverage`) and skipped `from_block`…`to_block`. Nothing in that range was checked. | Every subscription on that network. |
| `rate_limited` | Your subscription exceeded its `wallet_activity` events-per-second cap. **Some** of your events in `from_block`…`to_block` were dropped; the rest were delivered. At most one per network per second. | Only that subscription. |

`recoverable: false` means Triport cannot send those events later. If you need
them, read the range from the chain yourself.

**`reorg_revert`**: a reorg removed blocks you may have received events for.

```json
{
  "seq": 18240,
  "event_id": "ev_…",
  "cursor": "c1.…",
  "chain": "eth",
  "block": 26079176,
  "block_hash": "",
  "tx": "",
  "ts": "2026-09-30T10:00:12Z",
  "type": "reorg_revert",
  "reverted": {"from_block": 26079176, "to_block": 26079176},
  "removed_event_ids": ["wa_fee93628d4ac385fdd95f122e55d4654"],
  "removed_seqs": [18234]
}
```

`removed_event_ids` lists only events **this subscription** received from the
reverted blocks (possibly `[]`). Drop them. If the same transaction lands in the
new canonical block, it arrives again with a new `event_id`.

**`cursor_expired`** (WS control frame; REST `410`): see
[Cursor and resume](./wallet-activity.md#cursor-and-resume).

### Cursor and resume

Every delivered event, of every type, carries `event_id` and `cursor`. Store
the `cursor` of the last event you processed and reconnect with it. A cursor
is opaque, at most 4096 characters, and bound to the subscription that issued
it: a cursor of another subscription → `400 cursor_subscription_mismatch`; a
malformed or longer cursor → `400 invalid_cursor`. Both are rejected before
the WebSocket upgrade.

- **Slow consumer:** a WS client that does not read its buffer (1024 frames) is
  closed with code **4029**. Reconnect with your last cursor.

**Ordering.** Events of one network arrive in order. Across the networks of
one subscription the order is not guaranteed: with `min_confirmations` each
(subscription, network) pair has its own hold queue, so an Ethereum event
waiting for confirmations never delays BSC or Base events, and a later BSC
event can arrive before an earlier Ethereum one. Order by `chain` +
`block.number` + `tx.index` if you need a per-network timeline.

`resume` frame:

```json
{"type": "resume", "subscription": "2f6a…", "after_seq": 0, "mode": "seq", "replayed": 17, "buffer_complete": true, "cursor": "c1.…"}
```

`mode` is `none` (no cursor given: live only), `seq` or `blocks`.
`buffer_complete: false` means the replay stopped early; read the rest through
REST with the returned `cursor`.

### Webhook delivery

- 3 attempts with backoff, then the event goes to
  `GET /v1/wallet/watch/{id}/dead-letters`. Re-read it with the REST cursor.

### Coverage by network

| Network | `logs` | `internal_native` | Depth at emit | Reorg window | Notes |
|---|---|---|---|---|---|
| Robinhood Chain | `full` | `matched_tx_only` | 3 | 64 | Same as Ethereum. Full-block tracing is off (it would use the whole trace capacity of the network's providers). |
| Base | `full` | `unavailable` | 2 | 64 | No tracing: internal ETH transfers are not seen, only the outer `value`. |
| BNB Smart Chain | `full` | `unavailable` | 2 | 64 | No tracing: internal BNB transfers are not seen, only the outer `value`. |
| Polygon | `full` | `unavailable` | 2 | 64 | Scanned by the same pipeline, so events do arrive, but Polygon was not part of the validation set. Treat it as best-effort. |

What `internal_native` means, in the event and in `/coverage`:

- `traced`: every block was traced. Internal transfers to or from the address
  are reported even when the address has no other footprint in the
  transaction.
- `matched_tx_only`: only transactions where the address already matched
  through another reason are traced. A swap to ETH, an unwrap, a refund or a
  native claim that you sent is covered. A contract paying native coin to your
  address in a transaction you did not send, and that mentions you in no log,
  is **not** seen.
- `matched_tx_skipped` (per event only): tracing was due but skipped because of
  the tracing budget, a timeout or an upstream refusal. The event is delivered
  without internal legs; revert text is `unavailable`.
- `unavailable`: no tracing on this network.

Example response (abridged):

`scanner.state` is `running`, `starting` or `not_started`; `lag` is how many
blocks the scanner is behind head right now. `limits` is a fixed list of
known limitations with ids.

### Limits

| | Business | Enterprise |
|---|---|---|
| Subscriptions per account | 5 | 50 |
| Networks per subscription | 5 (all monitored) | 30 |
| Watchlist per subscription | 10 000 | 100 000 |
| Addresses per `POST …/watchlist` call | 10 000 | 10 000 |
| Request body (create, `PATCH`, `POST …/watchlist`) | 1 MiB | 1 MiB |
| `wallet_activity` events per second per subscription | 50 | 500 |
| Webhook deliveries per second per subscription | 10 | 10 |
| REST (`wallet_identity` category) | 30 rps | 150 rps |
| Replay window | 72 h | 72 h |

- Over the events-per-second cap, the excess is dropped for that subscription
  only and it receives a `gap` with `reason: "rate_limited"`. The cap is taken
  from your tier when the subscription is written, so after an upgrade it
  applies from the next create, `PATCH` or watchlist call.
- There is also a total cap on watched addresses per deployment. If a create,
  `PATCH` or watchlist call would exceed it, the call fails with
  `503 capacity_exceeded` and changes nothing; while another such change is
  being applied, it can fail with `503 busy` — retry.

### Latency

Events are delivered in near real time, a few blocks after the block is produced.
The delay from `block.timestamp` to delivery mostly depends on:
- the network's block time and block propagation;
- the scanner's confirmation depth (above);
- on Ethereum and Robinhood Chain, the time to trace matched transactions.

`min_confirmations` adds its blocks on top. `GET /v1/wallet/watch/coverage`
shows the live scanner lag per network (`lag`, `processed_block`). Use it to
monitor freshness from your side.

### What is not covered

- **History.** No backfill: an address is watched from the moment it is added.
- **Protocol decoding.** No action names (swap, claim, stake), no USD values,
  no token symbols or decimals. You get `method_id` and exact raw amounts.
- **Internal native transfers without a footprint** on Ethereum and Robinhood
  Chain (see `matched_tx_only`), and **all internal native transfers** on Base,
  BSC and Polygon.
- **Bridges outside the ledger**, and route links without a protocol id.
- **Reorgs deeper than `reorg_window`.**
- **Networks:** Arbitrum, Optimism, Solana and Tron are not part of this
  stream. Polygon is best-effort.
- **Not yet emitted:** `authorization_7702` and the `logs` field.
- **Profile filters and enrichment** do not apply to `wallet_activity`.
- **Intent.** The stream reports every on-chain footprint of a watched address,
  including activity the wallet did not sign. For example, address-poisoning
  spam emits fake `Transfer` logs "from" your address. Only `tx_from` means the
  watched address signed the transaction. Treat token movements where it is
  not `tx.from` as observations, not as the user's own actions.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `watchlist_required` | `wallet_activity` with an empty watchlist (create, `PATCH`, or a watchlist `remove` that would empty it). |
| `400` | `filter_not_supported` | Only `wallet_activity` selected and a non-empty `filter`. |
| `400` | `invalid_min_confirmations` | Outside `0` to the smallest reorg window of the subscription's networks. |
| `400` | `too_many_chains` / `too_many_watchlist` | Over the tier limit. |
| `400` | `invalid_body` / `too_many_addresses` / `conflicting_address` / `invalid_watchlist` | Watchlist call: empty or malformed body, more than 10 000 addresses, the same address in `add` and `remove`, or a bad address. |
| `400` | `invalid_cursor` / `invalid_limit` / `invalid_after` / `invalid_after_seq` | Malformed stream or page parameter; a cursor longer than 4096 characters is `invalid_cursor`. The WebSocket answers these before the upgrade. |
| `400` | `cursor_subscription_mismatch` | The cursor was issued for another subscription. |
| `401` | `account_required` | The key is not backed by an account. |
| `403` | `tier_insufficient` / `subscription_limit` | Tier below Business, or the subscription cap is reached. |
| `404` | `not_found` | No such subscription for this account. |
| `410` | `cursor_expired` | The REST cursor is older than the retained window; body has `oldest_cursor` and `recoverable: false`. |
| `503` | `busy` | Another watched-address change is being applied; retry. |
| `503` | `option_unavailable` | `min_confirmations > 0` on a deployment that does not support it yet (the option is refused, never silently dropped). |
| `405` | `method_not_allowed` | Unsupported method on a `/v1/wallet/watch` path. |

WebSocket close codes: `4410` after `cursor_expired`, `4029` when the client
buffer is full.

All error bodies use the shared envelope (`error`, `message`, `code`). See
[errors.md](../errors.md).

## Examples

### Add and remove addresses

```bash
curl -X POST "https://triport.io/v1/wallet/watch/$SUB_ID/watchlist" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"add": ["0x023ab8e20a4682d315daef4c91db96bd77934d66"], "remove": ["0x133243d447026345c2b368d7ffe435dbe3c566eb"]}'
# {"added":1,"removed":1,"total":2}
```

### Read the whole watchlist

```bash
cursor=""
while :; do
  page=$(curl -s "https://triport.io/v1/wallet/watch/$SUB_ID/watchlist?limit=5000&cursor=$cursor" \
    -H "Authorization: Bearer $TRIPORT_API_KEY")
  echo "$page" | jq -r '.watchlist[]'
  [ "$(echo "$page" | jq -r .has_more)" = "true" ] || break
  cursor=$(echo "$page" | jq -r .next_cursor)
done
```

### Consume the WebSocket with cursor resume and dedupe (Node)

```js
import WebSocket from "ws";

let cursor = loadCursor();          // your persisted last cursor, or ""
const seen = new Set();             // event_ids seen in the last ≥ 5 minutes

function connect() {
  const q = new URLSearchParams({ id: process.env.SUB_ID });
  if (cursor) q.set("cursor", cursor);
  const ws = new WebSocket(`wss://triport.io/ws/wallet-watch?${q}`, {
    headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` },
  });
  ws.on("message", (raw) => {
    const m = JSON.parse(raw);
    if (m.type === "resume") return;                 // m.mode: none | seq | blocks
    if (m.type === "cursor_expired") {               // followed by close 4410
      console.warn("events lost before", m.oldest_cursor);
      cursor = m.oldest_cursor;
      return;
    }
    if (!seen.has(m.event_id)) {
      seen.add(m.event_id);
      if (m.type === "reorg_revert") m.removed_event_ids.forEach(dropEvent);
      else if (m.type === "gap") markUnverified(m.chain, m.from_block, m.to_block, m.reason);
      else handleActivity(m);                        // wallet_activity
    }
    cursor = m.cursor;
    saveCursor(cursor);
  });
  ws.on("close", () => setTimeout(connect, 1000));
}
connect();
```

### Webhook receiver with signature check and dedupe (Node)

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function onWebhook(rawBody, headers, secret, store) {
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const got = headers["x-triport-signature"] ?? "";
  if (got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) return 401;
  const id = headers["x-triport-event-id"];
  if (store.has(id)) return 200;                     // at-least-once: already processed
  store.add(id, JSON.parse(rawBody));
  store.saveCursor(headers["x-triport-cursor"]);
  return 200;
}
```

### Catch up over REST after downtime (Python)

```python
import os, requests

API = f"https://triport.io/v1/wallet/watch/{os.environ['SUB_ID']}/events"
H = {"Authorization": f"Bearer {os.environ['TRIPORT_API_KEY']}"}
cursor, seen = load_cursor(), set()
while True:
    r = requests.get(API, params={"cursor": cursor, "limit": 1000}, headers=H, timeout=30)
    if r.status_code == 410:                 # cursor_expired: the gap cannot be recovered
        cursor = r.json()["oldest_cursor"]
        continue
    page = r.json()
    for ev in page["events"]:
        if ev["event_id"] not in seen:
            seen.add(ev["event_id"])
            handle(ev)
    cursor = page["next_cursor"]
    if not page["has_more"]:
        break
save_cursor(cursor)
```

### Check coverage before relying on internal transfers

```bash
curl -s "https://triport.io/v1/wallet/watch/coverage" -H "Authorization: Bearer $TRIPORT_API_KEY" \
  | jq '.chains[] | {chain, internal_native: .levels.internal_native, lag: .scanner.lag}'
```

## Notes

- **Order** is guaranteed within one network, not across networks.
- **Two addresses, one transaction:** two events with the same `tx.hash`.
- **Amounts are exact** decimal strings in the smallest unit; do not parse
  them as floating point.
- **Related:** [Wallet Watch](./wallet-watch.md) (other event types, delivery
  basics), [AsyncAPI contract](https://triport.io/api-specs/streaming/wallet-watch.asyncapi.yaml),
  [REST contract](https://triport.io/api-specs/product-rest/wallet.yaml),
  [wallet identity](./wallet-identity.md).
