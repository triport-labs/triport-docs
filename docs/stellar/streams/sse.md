> Live version: https://triport.io/docs/stellar/streams/sse

# Horizon SSE

> Receive newly ingested Stellar ledgers or transactions as Horizon HAL JSON.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/{ledgers|transactions}?cursor=now` |
| **Type** | Server-Sent Events (Horizon REST stream) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

The mounted SSE surface exposes two channels: newly closed ledgers and newly
ingested transactions. Each `data:` frame contains the original Horizon HAL
resource described by the AsyncAPI contract.

Use SSE for live processing without polling a collection. It is
not historical replay: both channels require `cursor=now` and begin after the
connection starts.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | Path segment: `ledgers` or `transactions`. |
| `cursor` | string | yes | Must be the constant `now` on this published stream surface. |

## Request

```bash
curl -N \
  -H "Accept: text/event-stream" \
  -H "x-token: $TRIPORT_API_KEY" \
  "https://triport.io/rpc/stellar/horizon/ledgers?cursor=now"
```

## Response

Each event is an SSE `data` field whose value is JSON:

```text
data: {"_links":{"self":{"href":"$ledger_url"}},"id":"$ledger_id","paging_token":"$paging_token","sequence":64317187,"closed_at":"2026-09-07T14:01:44Z"}
```

### Ledger payload fields

| Field | Type | Description |
|---|---|---|
| `_links` | object | HAL links, including the resource's self link. |
| `id` | string | Ledger resource identifier. |
| `paging_token` | string | Opaque Horizon paging token. |
| `hash` | string | Ledger hash when present. |
| `sequence` | integer | Ledger sequence. |
| `closed_at` | string | Ledger close timestamp. |

Transaction frames require `_links`, `id`, `paging_token`, `hash`, `ledger`,
and `successful`; `created_at` is optional in the AsyncAPI schema.

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | `cursor` is missing or is not `now`, or the channel is invalid. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `429` | Rate limited | The `stellar_read_rpc_heavy` budget is exceeded. |
| connection closed | Stream interrupted | The client must reconnect; no delivery SLA is provided. |

## Examples

Subscribe to newly ingested transactions:

```bash
curl -N \
  -H "Accept: text/event-stream" \
  -H "x-token: $TRIPORT_API_KEY" \
  "https://triport.io/rpc/stellar/horizon/transactions?cursor=now"
```

## Notes

- Store any application checkpoint before reconnecting; the published route
  does not promise replay from an older paging token.
- A `data:` field contains one HAL resource, not a JSON-RPC envelope.
- Only the ledger and transaction channels in the AsyncAPI contract are mounted.
- This is read-only delivery; no write or transaction-submit channel exists.
