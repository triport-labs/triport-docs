> Live version: https://triport.io/docs/stellar/rest/stellarHorizonRoot

# stellarHorizonRoot

> Get Horizon root metadata and resource links.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns Horizon service metadata and HAL links to the available resource collections.

Use it for discovery and compatibility diagnostics. It does not report Soroban RPC health; use the JSON-RPC `getHealth` method for that layer.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This operation defines no path or query parameters. |

## Request

```bash
curl 'https://triport.io/rpc/stellar/horizon' \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

## Response

This schema-shaped example uses placeholders where the contract does not provide a measured value:

```json
{
  "horizon_version": "$horizon_version",
  "core_version": "$core_version",
  "history_latest_ledger": 64317187,
  "_links": {
    "ledgers": {
      "href": "$ledgers_url"
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `horizon_version` | string | Horizon software version. |
| `core_version` | string | Connected Stellar Core version. |
| `history_latest_ledger` | integer | Latest ledger ingested by Horizon. |
| `_links` | object | HAL links to resource collections. |

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `429` | Rate limited | The `stellar_read_rpc` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const response = await fetch("https://triport.io/rpc/stellar/horizon", {
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

- HAL links are passed through as returned by Horizon.
- The root is metadata, not a transaction-submission endpoint.
- Related: `stellarHorizonGetFeeStats` and Soroban `getHealth`.
- This product surface is read-only; transaction submission is unavailable.
