> Live version: https://triport.io/docs/robinhood/json-rpc/eth_feeHistory

# eth_feeHistory

> Return fee-market history.

| | |
|---|---|
| **Method / Endpoint** | `eth_feeHistory` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_feeHistory` — return fee-market history. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Base fee and priority-fee percentiles over a window of blocks — the input for a fee strategy rather than a single price. Useful for budgeting; it does not predict ordering, which here is arrival order rather than an auction.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockCount` | Quantity | yes | How many blocks of fee history to return, in hex. |
| `newestBlock` | BlockTag | yes | Newest block of the requested fee-history window. |
| `rewardPercentiles` | array | yes | Ascending percentiles (0–100) for the priority-fee reward buckets. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_feeHistory","params":["0x1","latest",[]]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_feeHistory",
  "params": [
    "0x1",
    "latest",
    []
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "oldestBlock": "0x36273ec",
    "reward": [
      [
        "0x0",
        "0x0"
      ],
      [
        "0x0",
        "0x0"
      ],
      [
        "0x0",
        "0x0"
      ],
      [
        "0x0",
        "0x0"
      ]
    ],
    "baseFeePerGas": [
      "0x128d3cb0",
      "0x1290fda0",
      "0x12983160",
      "0x12b17620",
      "0x12b17620"
    ],
    "gasUsedRatio": [
      1,
      1,
      1,
      1
    ]
  }
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_feeHistory","params":["0x1","latest",[]]}),
});
const payload = await response.json();
```

## Notes

- Percentiles over a window are a budgeting input, not an ordering prediction.
- Ordering here is arrival order, so a fee strategy cannot buy inclusion priority.

## Related

[`eth_blockNumber`](./eth_blockNumber.md) · [`eth_call`](./eth_call.md) · [`eth_chainId`](./eth_chainId.md)

[Limits](../limits.md) · [Errors](../errors.md)
