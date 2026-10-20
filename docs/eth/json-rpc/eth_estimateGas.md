> Live version: https://triport.io/docs/eth/json-rpc/eth_estimateGas

# eth_estimateGas

> Estimates the amount of gas a transaction will consume, without broadcasting it to the network.

| | |
|---|---|
| **Method / Endpoint** | `eth_estimateGas` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic 20 · pro 100 · business 250; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_estimateGas` runs a transaction against the current state and returns a
hex-encoded estimate of the gas it would consume, **without** submitting the
transaction or changing any state. Use it to set the `gas` limit before signing
and sending a transaction with `eth_sendRawTransaction`, or to check whether a
call would revert.

The estimate is an upper bound derived from a binary search over a simulated
execution; it is **not** guaranteed to equal the gas the transaction actually
uses once mined. State can change between the estimate and inclusion (storage
slots, balances, nonces), and some contracts branch on `gasleft()`, so the real
gas used may be lower — and in rare cases a transaction that estimated cleanly
can still revert. A common practice is to add a small safety margin (for
example 10–20%) on top of the returned value when setting the transaction's gas
limit.

If the simulated execution reverts, the call returns an error rather than a gas
value; the revert reason, when available, is surfaced in the error data.

## Parameters

Positional params array: `[transaction, blockTag?]`.

### `transaction` (object, required)

| Name | Type | Required | Description |
|---|---|---|---|
| `from` | string (20-byte hex address) | no | Address the transaction is sent from. |
| `to` | string (20-byte hex address) | no | Target address; omit for contract-creation estimates. |
| `data` | string (hex) | no | Encoded call data / contract bytecode. |
| `value` | string (hex quantity) | no | Value sent with the transaction, in wei. |
| `gas` | string (hex quantity) | no | Gas cap for the simulation; bounds the estimate search. |
| `gasPrice` | string (hex quantity) | no | Legacy gas price, in wei. |

### `blockTag` (optional)

| Name | Type | Required | Description |
|---|---|---|---|
| `blockTag` | string | no | Block to estimate against: a block number in hex, or `latest`, `pending`, `earliest`, `safe`, or `finalized`. Defaults to `latest`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_estimateGas",
    "params": [
      {
        "from": "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
        "to": "0xd46e8dd67c5d32be8058bb8eb970870f07244567",
        "value": "0x9184e72a"
      }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x5208"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string (hex quantity) | Estimated gas the transaction would consume. `0x5208` is `21000`, the cost of a plain value transfer. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | Requests exceeded the tier's RPS limit (10 RPS sustained · up to 20 burst on free). Retry after backing off. |

Errors follow the shared JSON-RPC error envelope — see
[Errors](../../errors.md) for the full structure and handling guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_estimateGas",
    params: [
      {
        from: "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
        to: "0xd46e8dd67c5d32be8058bb8eb970870f07244567",
        value: "0x9184e72a",
      },
    ],
  }),
});

const { result } = await res.json();
const gas = parseInt(result, 16); // 21000
```

## Notes

- The returned value is hex-encoded — decode with `parseInt(result, 16)` (JS) or
  `int(result, 16)` (Python) before use.
- Add a safety margin (≈10–20%) when applying the estimate as a transaction's
  `gas` limit; the actual gas used at inclusion time can differ from the
  estimate.
- A reverting simulation returns an error, not a gas figure — use this to detect
  calls that would fail before paying to broadcast them.
- Related methods: `eth_call` (read-only simulation returning result data),
  `eth_gasPrice` and `eth_feeHistory` (current pricing), and
  `eth_sendRawTransaction` (broadcast a signed transaction).
- **Estimate higher than `gasUsed`?** See
  [why eth_estimateGas is higher than gas used](https://triport.io/learn/eth-estimategas-vs-gas-used).
