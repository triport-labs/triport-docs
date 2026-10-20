> Live version: https://triport.io/docs/stellar/json-rpc/getFeeStats

# getFeeStats

> Returns statistics about charged inclusion fees through Stellar Soroban JSON-RPC.

| | |
|---|---|
| **Method / Endpoint** | `getFeeStats` — `POST /rpc/stellar` |
| **Type** | Native upstream Soroban JSON-RPC |
| **Network** | Stellar mainnet |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stellar:rpc` |
| **Tier / rate limit** | `stellar_read_rpc` — 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

Returns recent inclusion-fee distributions separately for classic Stellar and Soroban transactions because they have independent surge pricing.

Use the percentiles and mode to estimate inclusion fees. This method does not simulate resource consumption or submit transactions.

Fee values and transaction counts are strings; ledger counts and `latestLedger` are numbers.

## Parameters

JSON-RPC `params` is a by-name object. Send an empty object (`{}`); this method defines no parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No method parameters. |

## Request

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getFeeStats",
  "params": {}
}'
```

The request body is copied from `_examples/stellar/getFeeStats.json`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "sorobanInclusionFee": {
      "min": "100",
      "max": "100",
      "transactionCount": "1",
      "ledgerCount": 1
    },
    "inclusionFee": {
      "min": "100",
      "max": "100",
      "transactionCount": "1",
      "ledgerCount": 1
    },
    "latestLedger": 64234094
  }
}
```

The response is copied unchanged from the accepted fixture.

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Method result object. |
| `result.inclusionFee` | object | Fee distribution statistics for Stellar (i.e. non-Soroban) transactions. Statistics are normalized per operation. |
| `result.inclusionFee.ledgerCount` | number | How many consecutive ledgers form the distribution |
| `result.inclusionFee.max` | string | Maximum fee |
| `result.inclusionFee.min` | string | Minimum fee |
| `result.inclusionFee.mode` | string | Fee value which occurs the most often |
| `result.inclusionFee.p10` | string | 10th nearest-rank fee percentile |
| `result.inclusionFee.p20` | string | 20th nearest-rank fee percentile |
| `result.inclusionFee.p30` | string | 30th nearest-rank fee percentile |
| `result.inclusionFee.p40` | string | 40th nearest-rank fee percentile |
| `result.inclusionFee.p50` | string | 50th nearest-rank fee percentile |
| `result.inclusionFee.p60` | string | 60th nearest-rank fee percentile |
| `result.inclusionFee.p70` | string | 70th nearest-rank fee percentile |
| `result.inclusionFee.p80` | string | 80th nearest-rank fee percentile |
| `result.inclusionFee.p90` | string | 90th nearest-rank fee percentile. |
| `result.inclusionFee.p95` | string | 95th nearest-rank fee percentile. |
| `result.inclusionFee.p99` | string | 99th nearest-rank fee percentile |
| `result.inclusionFee.transactionCount` | string | How many transactions are part of the distribution |
| `result.latestLedger` | number | The sequence number of the latest ledger known to Stellar RPC at the time it handled the request. |
| `result.sorobanInclusionFee` | object | Inclusion fee distribution statistics for Soroban transactions |
| `result.sorobanInclusionFee.ledgerCount` | number | How many consecutive ledgers form the distribution |
| `result.sorobanInclusionFee.max` | string | Maximum fee |
| `result.sorobanInclusionFee.min` | string | Minimum fee |
| `result.sorobanInclusionFee.mode` | string | Fee value which occurs the most often |
| `result.sorobanInclusionFee.p10` | string | 10th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p20` | string | 20th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p30` | string | 30th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p40` | string | 40th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p50` | string | 50th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p60` | string | 60th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p70` | string | 70th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p80` | string | 80th nearest-rank fee percentile |
| `result.sorobanInclusionFee.p90` | string | 90th nearest-rank fee percentile. |
| `result.sorobanInclusionFee.p95` | string | 95th nearest-rank fee percentile. |
| `result.sorobanInclusionFee.p99` | string | 99th nearest-rank fee percentile |
| `result.sorobanInclusionFee.transactionCount` | string | How many transactions are part of the distribution |

## Errors

Errors use the standard JSON-RPC envelope. See [Stellar errors](../errors.md) and the [shared error reference](../../errors.md).

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | the by-name object or a field has the wrong type; positional-array style params are rejected. |
| `-32601` | Method not found | The method is absent from the published Stellar OpenRPC catalog. |
| `401` | Unauthorized | The API key is missing or invalid. |
| `429` | Rate limited | The `stellar_read_rpc` RPS budget is exceeded. |

## Examples

### JavaScript (fetch)

```js
const request = {
  "jsonrpc": "2.0",
  "id": 1,
  "method": "getFeeStats",
  "params": {}
};
const response = await fetch("https://triport.io/rpc/stellar", {
  method: "POST",
  headers: {
    "x-token": process.env.TRIPORT_API_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(request),
});
const payload = await response.json();
if (!response.ok || payload.error) throw new Error(JSON.stringify(payload.error));
console.log(payload.result);
```

## Notes

- Classic and Soroban distributions are separate objects.
- Do not coerce string-encoded fee values through an unsafe integer type.
- Related: `simulateTransaction` and Horizon `GET /fee_stats`.
- This is a read-only surface. No write or transaction-submission method is published.
