> Live version: https://triport.io/docs/stellar/rest/stellarHorizonListAccountPayments

# stellarHorizonListAccountPayments

> List payment-like operations for one account.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/accounts/{account}/payments` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc_heavy` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns a cursor-paginated HAL page of payment-like operations involving one account.

Use it for account-specific payment ingestion. Use the global payments endpoint when no account filter is needed, or the account transaction endpoint for transaction-level records.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `account` | string | yes | Stellar account ID in the path. |
| `cursor` | string | no | Opaque Horizon paging token from a returned link. |
| `order` | string | no | Sort direction: `asc` or `desc`. |
| `limit` | integer | no | Maximum page size from 1 through 200; 201 was rejected in measurement. |

## Request

```bash
curl "https://triport.io/rpc/stellar/horizon/accounts/$STELLAR_ACCOUNT/payments?limit=1&order=desc" \
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
        "id": "$payment_id",
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
| `_embedded.records` | array | Page of payment-like operation HAL resources. |

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `400` | Bad request | A query parameter is malformed or `limit` exceeds 200. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `404` | Not found | A requested account or resource does not exist. |
| `429` | Rate limited | The `stellar_read_rpc_heavy` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const account = process.env.STELLAR_ACCOUNT;
const response = await fetch(`https://triport.io/rpc/stellar/horizon/accounts/${account}/payments?limit=1&order=desc`, {
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
- Continue from the cursor in `_links.next.href`.
- Related: `stellarHorizonListPayments` and `stellarHorizonListAccountTransactions`.
- This product surface is read-only; transaction submission is unavailable.
- Empty `_embedded.records`? See [why a Stellar Horizon page has no records](https://triport.io/learn/stellar-horizon-empty-page) for cursor, order and limit behavior.
