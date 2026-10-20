> Live version: https://triport.io/docs/platform/wallet-watch

# Wallet watch — event subscriptions

> Subscribe to what wallets do across the EVM networks Triport monitors:
> contract and smart-wallet deployments, bridge deposits and fills, funding
> of fresh wallets, EIP-7702 delegations — every participant enriched with
> the cross-chain identity profile and matched against your filter, delivered
> by webhook, WebSocket or a REST cursor. For every transaction of the
> addresses on your watchlist, use the [`wallet_activity`](./wallet-activity.md)
> event type.

| | |
|---|---|
| **Method / Endpoint** | `POST`/`GET`/`PATCH`/`DELETE /v1/wallet/watch[/{id}]`, `GET /v1/wallet/watch/{id}/events`, `WS /ws/wallet-watch?id=…` |
| **Type** | Triport product (REST API + WebSocket) |
| **Network** | Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain (Tron is not monitored) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) — the key must belong to an account (dashboard key), not a static token |
| **Required scope** | — (tier-gated, see below) |
| **Tier / rate limit** | Business — 30 rps (`wallet_identity`), 5 subscriptions × 5 networks, watchlist ≤ 10 000, webhook 10 rps; Enterprise — 150 rps, 50 subscriptions × 30 networks, watchlist ≤ 100 000 |

## Description

Event types:

| Type | Trigger | Participants |
|---|---|---|
| `contract_deploy` | `to == null` transaction that left `contractAddress` in the receipt | `from` (deployer), `contract` |
| `smart_wallet_deploy` | `AccountDeployed` from EntryPoint v0.6/0.7/0.8, `ProxyCreation` from Safe ProxyFactory 1.3.0/1.4.1, Coinbase Smart Wallet factory calls | `from`, `to` (new wallet), `factory`, `kind` |
| `bridge_out` | Across `FundsDeposited`, Stargate v2 `OFTSent`, deBridge `CreatedOrder`, Polygon PoS `LockedERC20`, Base/Robinhood L1 deposit initiations, transfers *to* a Relay solver | `from`, `to` (bridge), `recipient` (+ `differs_from_sender`), `bridge.match_key` |
| `bridge_in` | Across `FilledRelay`, Stargate `OFTReceived`, deBridge `FulfilledOrder`, Base L2 `DepositFinalized`, Robinhood L2 gateway, Polygon `ExitedERC20`, transfers *from* a solver | `from`, `to`, `recipient`, `bridge.match_key` |
| `fresh_funding` | Native value or ERC-20 `Transfer` to an address with nonce 0, no code and zero balance before the block | `from`, `to` (fresh wallet), `amount` |
| `delegation_set` | EIP-7702 type-4 transaction | `from`, `delegate` |
| `wallet_activity` | Any transaction in which a watchlist address takes part (sender/target, native and token movements, approvals, the address in a log, bridges). Own payload shape; see [Wallet activity](./wallet-activity.md) | `address` (the watched address), `movements[]` |
| `reorg_revert` | Chain reorganisation removed previously delivered blocks | `reverted.from_block`…`to_block`, `removed_event_ids` of this subscription (always delivered) |
| `gap` | Events of a block range will never be delivered (`reason: scanner_lag` or `rate_limited`, `recoverable: false`) | `from_block`…`to_block` (always delivered) |

Enrichment runs through the same profile cache as the identity endpoint
and is capped per network; when the cap is hit the event is delivered with
`enrich: "skipped"` to subscriptions without profile predicates and dropped
for subscriptions whose filter needs the profile.

## Parameters

### Request body (`POST`, `PATCH` partial)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Up to 128 characters. |
| `events` | string[] | yes | Any of the seven selectable event types above (`reorg_revert` and `gap` are always delivered). |
| `filter` | object | no | [Filter](./wallet-identity-filters.md); `fresh_wallet` is allowed here. Evaluated per participant — the event matches if any participant passes. |
| `enrich` | string[] | no | Profile groups attached to participants: `names,balances,activity,labels,deployer`. |
| `watchlist` | string[] | no (yes for `wallet_activity`) | Only events where a participant (from / to / recipient / deployed contract) is in the list. Required and non-empty with `wallet_activity`. Max 10 000 (Business); change it with `POST /v1/wallet/watch/{id}/watchlist`. |
| `min_amount_usd` | number | no | Bridge events only; needs a known USD price (stablecoins always priced). |
| `delivery` | object | yes | `{"type":"webhook","url":"https://…","secret":"…"}`, `{"type":"ws"}` or `{"type":"pull"}`. |
| `enabled` | boolean | no | Default `true`; `false` pauses matching. |
| `min_confirmations` | integer | no | Hold events until the head is N blocks past the event's block (default 0); held per network, so order is kept within a network only. See [Wallet activity](./wallet-activity.md#parameters). |

### Delivery

- **ws** — `wss://triport.io/ws/wallet-watch?id=<subscription>&cursor=<cursor>`
  (or the deprecated `&after_seq=<n>`); stored events after the cursor are
  replayed, then a `{"type":"resume", …, "buffer_complete": true|false}`
  frame, then live frames. See [cursor and resume](./wallet-activity.md#cursor-and-resume)
  and the
  [AsyncAPI contract](https://triport.io/api-specs/streaming/wallet-watch.asyncapi.yaml).
- **pull** — nothing is pushed; read
  `GET /v1/wallet/watch/{id}/events?cursor=<cursor>&limit=100` (or the
  deprecated `after=<seq>`). The cursor works for every delivery type.

## Request

```bash
curl -X POST "https://triport.io/v1/wallet/watch" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bridges-in-named",
    "chains": ["eth", "base", "robinhood"],
    "events": ["bridge_in", "bridge_out", "contract_deploy"],
    "filter": {"all": [{"has_name": true}, {"balance_any": {"gte": "0.1"}}]},
    "enrich": ["names", "balances"],
    "min_amount_usd": 1000,
    "delivery": {
      "type": "webhook",
      "url": "https://example.com/hooks/triport",
      "secret": "change-me"
    }
  }'
```

## Response

```json
{
  "id": "2f6a1c0e-9d3b-4c1e-8f0a-7b2d5e6c9a11",
  "name": "bridges-in-named",
  "chains": [
    "eth",
    "base",
    "robinhood"
  ],
  "events": [
    "bridge_in",
    "bridge_out",
    "contract_deploy"
  ],
  "filter": {
    "all": [
      {
        "has_name": true
      },
      {
        "balance_any": {
          "gte": "0.1"
        }
      }
    ]
  },
  "enrich": [
    "names",
    "balances"
  ],
  "min_amount_usd": 1000,
  "delivery": {
    "type": "webhook",
    "url": "https://example.com/hooks/triport",
    "secret": "***"
  },
  "enabled": true,
  "created_at": "2026-09-15T00:10:22Z",
  "updated_at": "2026-09-15T00:10:22Z"
}
```

An event as delivered (webhook body, WS frame, or `events[]` item of the cursor):

### Response fields

| Field | Type | Description |
|---|---|---|
| `id` | uuid | Subscription id — the `?id=` of the WebSocket and the path segment of the cursor. |
| `delivery.secret` | string | Always masked (`***`) in responses. |
| `cursor` (event) | string | Opaque resume position; pass as `?cursor=`. |
| `bridge.match_key` (event) | string | Pair `bridge_out` with the `bridge_in` on the destination network (`across:<depositId>`, `stargate:<guid>`, `debridge:<orderId>`, `robinhood_native:<sequence>`); absent where the protocol has no shared id. |
| `recipient.differs_from_sender` (event) | boolean | The bridge recipient is not the depositor. |
| `enrich` (event) | string | `done` or `skipped` (enrichment cap reached). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `invalid_body` / `invalid_name` / `invalid_chains` / `unknown_chain` / `too_many_chains` / `invalid_events` / `unknown_event` / `invalid_filter` / `invalid_enrich` / `invalid_watchlist` / `too_many_watchlist` / `invalid_min_amount_usd` / `invalid_delivery` / `invalid_after` / `invalid_limit` / `watchlist_required` / `filter_not_supported` / `invalid_min_confirmations` / `invalid_cursor` / `cursor_subscription_mismatch` | Validation failed; the message names the field. Webhook URLs must be `https://`. |
| `401` | `account_required` | The API key is a static token without an account; create a key in the dashboard. |
| `403` | `tier_insufficient` / `subscription_limit` | Tier below Business, or the per-tier subscription cap is reached. |
| `404` | `not_found` | No such subscription for this account. |
| `410` | `cursor_expired` | The cursor is older than the retained window; the body has `oldest_cursor` and `recoverable: false`. |
| `429` | `rate_limited` | `wallet_identity` sustained RPS exceeded. |

All error bodies use the shared envelope (`error`, `message`, `request_id`).
See [errors.md](../errors.md) for the full envelope and per-code fields.

## Examples

### Verify a webhook signature (Node)
```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function verify(rawBody, header, secret) {
  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  return header?.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}
```

### Consume the WebSocket with resume (Node)
```js
import WebSocket from "ws";

let last = Number(process.env.LAST_SEQ ?? 0);
function connect() {
  const ws = new WebSocket(`wss://triport.io/ws/wallet-watch?id=${SUB_ID}&after_seq=${last}`, {
    headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` },
  });
  ws.on("message", (raw) => {
    const m = JSON.parse(raw);
    if (m.type === "resume") { if (!m.buffer_complete) console.warn("gap before", m.after_seq); return; }
    last = m.seq;
    if (m.type === "reorg_revert") { /* drop state for blocks in m.reverted */ return; }
    handle(m);
  });
  ws.on("close", () => setTimeout(connect, 1000));
}
connect();
```

### Poll with the REST cursor (Python)
```python
import os, time, requests

API = f"https://triport.io/v1/wallet/watch/{os.environ['SUB_ID']}/events"
H = {"Authorization": f"Bearer {os.environ['TRIPORT_API_KEY']}"}
after = 0
while True:
    page = requests.get(API, params={"after": after, "limit": 200}, headers=H, timeout=30).json()
    for ev in page["events"]:
        print(ev["seq"], ev["chain"], ev["type"], ev.get("from", {}).get("address"))
    after = page["next_after"]
    if not page["has_more"]:
        time.sleep(5)
```

### Fresh wallets funded by a bridge on Robinhood Chain
```json
{
  "name": "rh-fresh-from-bridges",
  "chains": ["robinhood"],
  "events": ["fresh_funding", "bridge_in"],
  "filter": {"any": [{"fresh_wallet": true}, {"has_label": ["bridge", "solver"]}]},
  "enrich": ["names", "labels"],
  "delivery": {"type": "ws"}
}
```

## Notes

- **Reorgs:** the scanner keeps a hash window (12 blocks on Ethereum, 64 on
  the L2s and BNB Smart Chain); on a mismatch it deletes the affected events
  and delivers `reorg_revert` before re-scanning the canonical blocks.
- **USD floors:** `min_amount_usd` applies only when the amount is priced —
  stablecoins are always priced at 1 USD; native coins need a rate, so a
  floor on unpriced tokens never matches.
- **Related:** [wallet activity](./wallet-activity.md),
  [profile](./wallet-identity.md),
  [batch](./wallet-identity-batch.md),
  [filters](./wallet-identity-filters.md),
  [streaming overview](../streaming/index.md).
