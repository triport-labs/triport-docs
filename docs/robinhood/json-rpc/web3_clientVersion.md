> Live version: https://triport.io/docs/robinhood/json-rpc/web3_clientVersion

# web3_clientVersion

> Return the selected node client version.

| | |
|---|---|
| **Method / Endpoint** | `web3_clientVersion` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`web3_clientVersion` — return the selected node client version. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Public version string of the selected node. Treat it as informational: the answer describes one channel, not the pool, and two consecutive calls may land on different channels and report different strings without anything being wrong.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | Send an empty positional array. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"web3_clientVersion","params":[]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "web3_clientVersion",
  "params": []
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "nitro/v3599aca-modified/linux-amd64/go1.25.14"
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"web3_clientVersion","params":[]}),
});
const payload = await response.json();
```

## Notes

- Describes one channel out of the pool, so the string can differ between two adjacent calls.
- Treat it as informational only: client version is not a capability declaration.

## Related

[`eth_blockNumber`](./eth_blockNumber.md) · [`eth_call`](./eth_call.md) · [`eth_chainId`](./eth_chainId.md)

[Limits](../limits.md) · [Errors](../errors.md)
