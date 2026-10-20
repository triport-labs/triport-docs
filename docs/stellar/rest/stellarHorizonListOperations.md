> Live version: https://triport.io/docs/stellar/rest/stellarHorizonListOperations

# stellarHorizonListOperations

> List global Horizon operations.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/operations` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns a cursor-paginated HAL page of operations across the retained Horizon dataset.

Use it when all operation types are needed. Use a payments endpoint for only payment-like operations or transactions for transaction-level grouping.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `cursor` | string | no | Opaque Horizon paging token from a returned link. |
| `order` | string | no | Sort direction: `asc` or `desc`. |
| `limit` | integer | no | Maximum page size from 1 through 200; 201 was rejected in measurement. |

## Request

```bash
curl 'https://triport.io/rpc/stellar/horizon/operations?limit=1&order=desc' \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

## Response

This schema-shaped example uses placeholders where the contract does not provide a measured value:

```json
{
  "_links": {
    "next": {
      "href": "$next_page_url"
    },
    "self": {
      "href": "$request_url"
    }
  },
  "_embedded": {
    "records": [
      {
        "_links": {
          "self": {
            "href": "$resource_url"
          }
        },
        "id": "$operation_id",
        "paging_token": "$paging_token"
      }
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `_links` | object | HAL navigation links; additional link relations may be present. |
| `_links.next.href` | string | URL carrying the cursor for the next page. |
| `_embedded` | object | Container for the returned collection. |
| `_embedded.records` | array | Page of operation HAL resources. |

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | A query parameter is malformed or `limit` exceeds 200. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `429` | Rate limited | The `stellar_read_rpc_heavy` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const response = await fetch("https://triport.io/rpc/stellar/horizon/operations?limit=1&order=desc", {
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
- Operation resources may contain additional type-specific fields.
- Related: `stellarHorizonListPayments` and `stellarHorizonListTransactions`.
- This product surface is read-only; transaction submission is unavailable.
