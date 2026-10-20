> Live version: https://triport.io/docs/polygon/json-rpc/eth_estimateGas

# eth_estimateGas

> Estimates how much gas a transaction would consume on Polygon, without broadcasting it to the network.

| | |
|---|---|
| **Method / Endpoint** | `eth_estimateGas` (JSON-RPC, `POST /polygon/rpc`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free 15 rps · basic 20 rps · pro 100 rps · business 250 rps |

## Description

`eth_estimateGas` generates and returns an estimate of how much gas is necessary
to allow a transaction to complete. The transaction is **not** added to the
blockchain — the node simulates execution against the chosen block state and
returns the gas amount the EVM would charge.

Use it to set the `gas` (gas limit) field before signing and submitting a
transaction with [`eth_sendRawTransaction`](./eth_sendRawTransaction.md), and to
sanity-check that a contract call will not revert before you pay for it. If the
call would revert, the estimate fails with a transaction-rejected error rather
than returning a number.

**Polygon gotcha — congestion variance.** On Polygon, gas estimates can move
sharply during periods of high contention (for example, large NFT mint events),
so a value estimated a few seconds before submission may no longer be enough by
the time the transaction lands. Automated senders and bots should add a **20–50%
buffer** on top of the returned estimate to avoid `out of gas` failures. Note
this method runs full EVM execution and is heavier than a plain read, so it is
throttled harder than light read methods.

## Parameters

Positional params array: `[transaction, blockTag?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `transaction` | object | yes | Transaction call object (see fields below). |
| `blockTag` | string | no | Block number (hex) or a tag: `latest`, `earliest`, `pending`. Defaults to `latest`. |

### `transaction` object fields

| Field | Type | Required | Description |
|---|---|---|---|
| `from` | string | no | Sender address (20 bytes, hex). |
| `to` | string | no | Recipient address (20 bytes, hex). |
| `gas` | string | no | Gas limit (hex). |
| `gasPrice` | string | no | Gas price in wei (hex). |
| `value` | string | no | Value in wei (hex). |
| `data` | string | no | Call data / contract input (hex). |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_estimateGas",
    "params": [
      {
        "to": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        "data": "0xa9059cbb0000000000000000000000001234567890123456789012345678901234567890000000000000000000000000000000000000000000000000016345785d8a0000"
      }
    ]
  }'
```

The example estimates gas for an ERC-20 `transfer` call (selector `0xa9059cbb`)
to WETH on Polygon.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0xcb28"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Estimated gas as a hex-encoded quantity. `0xcb28` = 52008 gas. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32001` | Resource not found | The referenced block or state is unavailable on the backing node. |
| `-32002` | Resource unavailable | The node could not service the request (temporary backend condition). |
| `-32003` | Transaction rejected | The simulated transaction reverts or is otherwise invalid (e.g. insufficient balance, failing contract call). |
| `-32004` | Method not supported | The method is not enabled for this transaction or context. |
| `-32005` | Limit exceeded | The backing node refused the request as too large (the standard `Limit exceeded` code). This is **not** your Triport rate limit: a per-tier rate limit is a plain HTTP `429` decided before the RPC layer — see the [errors reference](../../errors.md). |
| `-32601` | Method not found | The method name is misspelled or not available on this network. |

See [errors.md](../../errors.md) for the full JSON-RPC error envelope and
retry guidance.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/polygon", {
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
        to: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        data: "0xa9059cbb00000000000000000000000012345678901234567890123456789012345678900000000000000000000000000000000000000000000000000016345785d8a0000",
      },
    ],
  }),
});

const { result } = await res.json();
const estimate = parseInt(result, 16);
const gasLimit = Math.ceil(estimate * 1.3); // +30% buffer for Polygon congestion
console.log({ estimate, gasLimit });
```

## Notes

- **Always buffer.** During congestion (NFT mints, popular launches), apply a
  20–50% buffer over the returned estimate before setting your transaction's gas
  limit.
- **Reverts surface as errors.** If the call would revert, you get a `-32003`
  Transaction rejected error rather than a gas value — treat a failed estimate
  as a signal not to submit.
- **`blockTag` affects results.** Estimating against `pending` reflects queued
  state; `latest` reflects the most recent confirmed block. Omit it to default
  to `latest`.
- **Related methods:** [`eth_call`](./eth_call.md) (read-only simulation without
  gas accounting), [`eth_gasPrice`](./eth_gasPrice.md) (current gas price),
  [`eth_sendRawTransaction`](./eth_sendRawTransaction.md) (broadcast a signed
  transaction).
