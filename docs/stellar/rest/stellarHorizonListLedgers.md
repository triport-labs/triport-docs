> Live version: https://triport.io/docs/stellar/rest/stellarHorizonListLedgers

# stellarHorizonListLedgers

> List retained Horizon ledgers.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/ledgers` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns a cursor-paginated HAL page of ledgers inside the selected Horizon node's retention window.

Use it for recent ledger-header ingestion or close-time tracking. Use `stellarHorizonGetLedger` when one known sequence is required, or Soroban `getLedgers` when JSON-RPC/XDR is preferred.

The measured Horizon node retained 6,307,191 ledgers. This is a per-operator observation, not a network-wide archive guarantee.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `cursor` | string | no | Opaque Horizon paging token from a returned link. |
| `order` | string | no | Sort direction: `asc` or `desc`. |
| `limit` | integer | no | Maximum page size from 1 through 200; 201 was rejected in measurement. |

## Request

```bash
curl 'https://triport.io/rpc/stellar/horizon/ledgers?limit=1&order=desc' \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

## Response

This response was observed through Triport on September 7, 2026:

```json
{
  "_embedded": {
    "records": [
      {
        "sequence": 64317187,
        "paging_token": "276240214735716352",
        "closed_at": "2026-09-07T14:01:44Z",
        "successful_transaction_count": 317,
        "failed_transaction_count": 24,
        "operation_count": 863
      }
    ]
  },
  "_links": {
    "next": {
      "href": "https://triport.io/rpc/stellar/horizon/ledgers?cursor=276240214735716352&limit=1&order=desc"
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `_links` | object | HAL navigation links; additional link relations may be present. |
| `_links.next.href` | string | URL carrying the cursor for the next page. |
| `_embedded` | object | Container for the returned collection. |
| `_embedded.records` | array | Page of ledger HAL resources. |
| `_embedded.records[].sequence` | integer | Ledger sequence. |
| `_embedded.records[].paging_token` | string | Opaque cursor; keep it as a string. |
| `_embedded.records[].closed_at` | string | Ledger close timestamp. |

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | A query parameter is malformed or `limit` exceeds 200. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `429` | Rate limited | The `stellar_read_rpc` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const response = await fetch("https://triport.io/rpc/stellar/horizon/ledgers?limit=1&order=desc", {
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

- `limit` is at most 200.
- Keep paging tokens as strings to avoid integer precision loss.
- Related: `stellarHorizonGetLedger` and Soroban `getLedgers`.
- This product surface is read-only; transaction submission is unavailable.
