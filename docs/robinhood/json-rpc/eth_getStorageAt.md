> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getStorageAt

# eth_getStorageAt

> Return a contract storage slot at a block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getStorageAt` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getStorageAt` — return a contract storage slot at a block. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Read one raw storage slot when no view function exposes it. You compute the slot yourself; layout is not part of this contract, and a proxy contract stores its state under the proxy address rather than the implementation.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | Address | yes | Account or contract address (20-byte hex). |
| `position` | Quantity | yes | Storage slot index in hex. |
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getStorageAt","params":["0x0000000000000000000000000000000000000000","0x1","latest"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getStorageAt",
  "params": [
    "0x0000000000000000000000000000000000000000",
    "0x1",
    "latest"
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getStorageAt","params":["0x0000000000000000000000000000000000000000","0x1","latest"]}),
});
const payload = await response.json();
```

## Notes

- The slot index is yours to compute; storage layout is not part of this contract.
- For a proxy contract the state sits under the proxy address, not the implementation address.

## Related

[`eth_getBalance`](./eth_getBalance.md) · [`eth_getBlockByHash`](./eth_getBlockByHash.md) · [`eth_getBlockByNumber`](./eth_getBlockByNumber.md)

[Archive depth](../archive.md) · [Limits](../limits.md) · [Errors](../errors.md)
