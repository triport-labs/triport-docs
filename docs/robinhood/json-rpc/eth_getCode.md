> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getCode

# eth_getCode

> Return account bytecode at a block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getCode` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getCode` — return account bytecode at a block. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Distinguish a contract from an EOA and detect a deployment at a given block. Empty bytecode means no contract at that block, not that it never existed — and a historical block below the measured archive floor is not served at all, which is a different answer from "no code".

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | Address | yes | Account or contract address (20-byte hex). |
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0x0000000000000000000000000000000000000000","latest"]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getCode",
  "params": [
    "0x0000000000000000000000000000000000000000",
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
  "result": "0xfe"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0x0000000000000000000000000000000000000000","latest"]}),
});
const payload = await response.json();
```

## Notes

- Empty bytecode answers "no contract at that block", which is not the same as "never existed".
- Below the measured archive floor the block is not served at all — a different outcome from an empty result.

## Related

[`eth_getBalance`](./eth_getBalance.md) · [`eth_getBlockByHash`](./eth_getBlockByHash.md) · [`eth_getBlockByNumber`](./eth_getBlockByNumber.md)

[Limits](../limits.md) · [Errors](../errors.md)
