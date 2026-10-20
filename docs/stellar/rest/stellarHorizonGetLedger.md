> Live version: https://triport.io/docs/stellar/rest/stellarHorizonGetLedger

# stellarHorizonGetLedger

> Get one retained Horizon ledger.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/ledgers/{ledger}` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns one ledger identified by sequence number or ledger hash when it remains inside the selected node's window.

Use it for a known ledger. Use `stellarHorizonListLedgers` to discover or paginate sequences.

The measured Horizon node retained 6,307,191 ledgers. Deeper reads return `410 Gone`; there is no history-archive fallback.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `ledger` | string | yes | Ledger sequence number or hash in the path. |

## Request

```bash
curl "https://triport.io/rpc/stellar/horizon/ledgers/$LEDGER" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

## Response

This schema-shaped example uses placeholders where the contract does not provide a measured value:

```json
{
  "_links": {
    "self": {
      "href": "$ledger_url"
    }
  },
  "id": "$ledger_hash",
  "paging_token": "$paging_token",
  "sequence": 64317187,
  "closed_at": "2026-09-07T14:01:44Z"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `_links` | object | HAL links for this ledger. |
| `id` | string | Ledger resource identifier. |
| `paging_token` | string | Opaque paging token. |
| `sequence` | integer | Ledger sequence. |
| `closed_at` | string | Ledger close timestamp. |

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `404` | Not found | A requested account or resource does not exist. |
| `429` | Rate limited | The `stellar_read_rpc` RPS budget is exceeded. |
| `410` | Gone | The requested ledger is older than the selected node's current retention window. |

## Examples

### JavaScript (fetch)

```js
const ledger = process.env.LEDGER;
const response = await fetch(`https://triport.io/rpc/stellar/horizon/ledgers/${ledger}`, {
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Accept": "application/hal+json",
  },
});
if (!response.ok) throw new Error(`Horizon returned ${response.status}`);
const payload = await response.json();
console.log(payload);
```

## Notes

- Retention is per selected node and may change as ledgers close.
- A `410` response is a measured boundary, not an internal failure.
- Related: `stellarHorizonListLedgers` and Stellar errors.
- This product surface is read-only; transaction submission is unavailable.
