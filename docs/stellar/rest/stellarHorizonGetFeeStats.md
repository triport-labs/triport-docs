> Live version: https://triport.io/docs/stellar/rest/stellarHorizonGetFeeStats

# stellarHorizonGetFeeStats

> Get the current Horizon fee snapshot.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/fee_stats` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns current Horizon fee percentiles and the latest ledger used for the snapshot.

Use it to estimate classic Stellar transaction fees. Use Soroban `getFeeStats` for the RPC layer's separate classic and Soroban inclusion-fee distributions.

This is a current snapshot from one measured Horizon operator, not an SLA or a transaction-submission quote.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | This operation defines no path or query parameters. |

## Request

```bash
curl 'https://triport.io/rpc/stellar/horizon/fee_stats' \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

## Response

This schema-shaped example uses placeholders where the contract does not provide a measured value:

```json
{
  "last_ledger": "$last_ledger",
  "last_ledger_base_fee": "$base_fee",
  "fee_charged": {
    "p50": "$fee_p50"
  },
  "max_fee": {
    "p50": "$max_fee_p50"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `last_ledger` | string | Latest ledger used for the snapshot. |
| `last_ledger_base_fee` | string | Base fee for that ledger. |
| `fee_charged` | object | Observed charged-fee percentiles. |
| `max_fee` | object | Declared maximum-fee percentiles when present. |

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
const response = await fetch("https://triport.io/rpc/stellar/horizon/fee_stats", {
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

- Fee values are string encoded.
- The snapshot changes as ledgers close.
- Related: Soroban `getFeeStats` and `simulateTransaction`.
- This product surface is read-only; transaction submission is unavailable.
