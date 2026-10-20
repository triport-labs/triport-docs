> Live version: https://triport.io/docs/platform/wallet-research

# Research an EVM wallet

> Read transactions, volumes, counterparties, bridge flows, approvals and shared
> funding candidates across EVM networks, with configurable history depth.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/wallet/{address}/research` |
| **Network** | Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain |
| **Authentication** | `x-token` or `Authorization: Bearer` |
| **Tier** | Business or Enterprise; `wallet_identity` and underlying network read budgets |

## How it works

Research brings together wallet transactions, volumes and connections across
networks. Address labels identify known entities; token permissions provide
additional context for wallet activity.

EVM RPC does not provide a universal address-history method. Each request scans
a bounded, contiguous block window per network, newest first. Select a period
or `depth=genesis`, then follow `next_cursor` for older blocks. Long history can
require many requests. Archive availability and read budgets still apply.

**Counts and volumes describe the current scanned window, not the whole requested
period or cumulative history of earlier responses.** An empty window does not
mean the wallet has no older activity. Always inspect coverage.

## Parameters

| Name | Meaning |
|---|---|
| `address` | EVM address: `0x` plus 40 hexadecimal characters. |
| `chains` | Comma-separated `eth,base,polygon,bsc,robinhood`; default all five. |
| `from`, `to` | RFC3339 inclusive start / exclusive end. Default: last 30 days. |
| `depth` | `genesis` sets the earliest date; cannot be combined with `from`. |
| `scan_blocks` | Blocks per network per request, 1–128; default 16. Server configuration may reduce the maximum. |
| `cursor` | Continuation; preserve the previous address, networks, returned dates and scan size. |
| `limit`, `offset` | Event pagination within the same window: limit 1–100, offset 0–10000. |
| `sort` | `time` or `amount`; amount order groups by asset before sorting raw amounts. |

```bash
curl 'https://triport.io/v1/wallet/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/research?chains=eth,base&depth=genesis&scan_blocks=16' \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

## Response and continuation

`source` identifies the result source. Responses include address, effective dates,
generation time, pagination and `chains`.

- `scan_cursor` replays the same block window when changing `limit`/`offset`.
- `next_cursor` moves to older windows or retries failed networks. Reset offset
  to 0 and use the returned `from`/`to` rather than relative defaults.
- Cursors pin a chain anchor. A changed anchor returns `reorg_restart_required`.
  Missing blocks or incomplete receipts never advance a cursor.
- Completed networks return `status: complete`, with no new window. When
  `next_cursor` is absent, traversal is finished. Results are not accumulated
  or stored server-side; earlier windows must be retained by the caller if needed.

| Chain field | Meaning |
|---|---|
| `status` | `partial`, `ok`, `complete` or `error`; HTTP 200 may contain network errors. |
| `coverage` | Actual scanned blocks/timestamps/hash. `history_from_genesis` means this window reaches block 1. `history_incomplete_before: N` (present when the window does not reach genesis) means blocks before N are not in this response. `first_observed_tx` and `cluster.funding` are then the first in this window, not the first funding ever. Follow `next_cursor` to scan older blocks. |
| `first_observed_tx`, `last_observed_tx` | First and last matching TX in this window. |
| `observed_age_days`, `activity_status` | Age of observed activity; unscanned activity is unknown. An empty scan is not evidence of dormancy. |
| `transactions`, `failed_transactions`, `unknown_status_transactions` | Unique TX counts in the window and period, including failures and legacy receipts without status. |
| `volumes` | Successful external native/ERC20 transfers per asset, with decimal-string `in_raw`/`out_raw`. |
| `activity` | Transactions, transfers and approvals; multiple events do not inflate TX counts. |
| `counterparties` | Top 20 by unique TX count in this window, with labels. |
| `flows` | Protocol-decoded bridge flows and outgoing transfers to labelled exchanges. |
| `approvals`, `approval_block` | Permissions discovered in the window, checked at the anchored block. |
| `cluster` | Shared first observed direct native funder within the window, up to 100 candidates. |

`has_more`, `volumes_has_more`, `flows_has_more`, `approvals_has_more` describe
list pagination inside this window, independent of the older-window `next_cursor`.
`counterparties_has_more` and `cluster.has_more` describe capped lists.

## Interpretation

- First observed TX is not a wallet creation date or guaranteed lifetime first TX.
  Genesis traversal establishes history only after relevant windows are read.
- Reads use a 64-block confirmation offset. `period_complete` does not claim
  unscanned blocks and refers only to supported event types.
- Internal native transfers, NFT transfers, Permit2 and off-chain approvals are
  excluded. Legacy Ethereum value movements without receipt status are excluded
  from volumes. Failed/self-transfers and fees do not inflate volume.
- Amounts use raw token units. Assets are not added together; no USD total is inferred.
- Approval discovery is window-limited. `unverified` with a null amount means
  verification was unavailable, not revoked. ERC721 checks current ownership.
- Solver-only transfers are not confirmed bridges. An exchange deposit label
  does not prove customer account credit.
- Shared funding is a heuristic, not ownership. Known service sources are
  excluded; the source need not be the lifetime first funder.

## Errors

| Result | Meaning |
|---|---|
| `400 invalid_query` / `invalid_cursor` | Invalid query or mismatched continuation. |
| `401` / `403` | Authentication required or insufficient tier. |
| `429 rate_limited` | Tier budget or four-request research limit; respect Retry-After. |
| `503 research_unavailable` | Live research or its RPC client is unavailable. |
| Chain data unavailable | Historical data is temporarily unavailable; retry the same range. |
| Chain `reorg_restart_required` | Restart because the anchored chain changed. |

See [Wallet Identity](./wallet-identity.md), [Wallet funded-by](./wallet-funded-by.md)
and [Wallet Watch](./wallet-watch.md).
