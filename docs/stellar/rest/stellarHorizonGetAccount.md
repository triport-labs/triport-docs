> Live version: https://triport.io/docs/stellar/rest/stellarHorizonGetAccount

# stellarHorizonGetAccount

> Get current Horizon account state.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/stellar/horizon/accounts/{account}` |
| **Type** | Horizon REST proxy (HAL JSON) |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns the latest account balances, sequence, signers, sponsorship data, and HAL links for one Stellar account.

Use it for current account state. It is not a historical snapshot API; account history is available through the account-scoped payment and transaction collections.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `account` | string | yes | Stellar account ID in the path. |

## Request

```bash
curl "https://triport.io/rpc/stellar/horizon/accounts/$STELLAR_ACCOUNT" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: application/hal+json"
```

## Response

This schema-shaped example uses placeholders where the contract does not provide a measured value:

```json
{
  "_links": {
    "self": {
      "href": "$account_url"
    }
  },
  "account_id": "$stellar_account",
  "sequence": "$account_sequence",
  "balances": []
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `_links` | object | HAL links related to the account. |
| `account_id` | string | Canonical account ID. |
| `sequence` | string | Current account sequence. |
| `balances` | array | Current native and trustline balances. |

## Errors

See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Status | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | The API key is missing or invalid. |
| `403` | Forbidden | The key lacks the required scope or tier. |
| `404` | Not found | A requested account or resource does not exist. |
| `429` | Rate limited | The `stellar_read_rpc` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const account = process.env.STELLAR_ACCOUNT;
const response = await fetch(`https://triport.io/rpc/stellar/horizon/accounts/${account}`, {
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

- Account state is latest-only.
- A missing account returns `404`, not an empty synthetic account.
- Related: `stellarHorizonListAccountPayments` and `stellarHorizonListAccountTransactions`.
- This product surface is read-only; transaction submission is unavailable.
- The account's `sequence` decides the next transaction's sequence number; see [how Stellar sequence numbers work](https://triport.io/learn/stellar-sequence-numbers).
