> Live version: https://triport.io/docs/robinhood/json-rpc/eth_getLogs

# eth_getLogs

> Return event logs matching a filter.

| | |
|---|---|
| **Method / Endpoint** | `eth_getLogs` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getLogs` — return event logs matching a filter. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Historical events by range and filter: the backbone of transfer monitoring and indexing. Always bound the range and filter by `address` or `topics`. The range ceiling is not one number here — it is limited differently on every channel — and deep ranges may be split or reconstructed from block receipts, which is the slower path.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `filter` | LogFilter | yes | Log filter: `fromBlock`/`toBlock` (or `blockHash`), `address` (string or array) and positional `topics`. Bound the range — ceilings depend on the serving channel. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{"fromBlock":"0x3626dfe","toBlock":"0x3626e62","address":"0x8366a39cc670b4001a1121b8f6a443a643e40951","topics":["0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f"]}]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "eth_getLogs",
  "params": [
    {
      "fromBlock": "0x3626dfe",
      "toBlock": "0x3626e62",
      "address": "0x8366a39cc670b4001a1121b8f6a443a643e40951",
      "topics": [
        "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f"
      ]
    }
  ]
}
```

## Response

A measured response from Robinhood Chain mainnet. Arrays are trimmed to their first element:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "address": "0x8366a39cc670b4001a1121b8f6a443a643e40951",
      "topics": [
        "0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f",
        "0x35516a640781d904463a53f9227ae7d5796283fee217d37487073d5bbd488f03",
        "0x0000000000000000000000008876789976decbfcbbbe364623c63652db8c0904"
      ],
      "data": "0x000000000000000000000000000000000000000000000000000a6a61ae22955cffffffffffffffffffffffffffffffffffffffffffffc1e8989e5fe3019f1e700000000000000000000000000000000000002715ce233d528d272c4931e773200000000000000000000000000000000000000000000006331c062631f592d42e000000000000000000000000000000000000000000000000000000000002cfa30000000000000000000000000000000000000000000000000000000000000000",
      "blockNumber": "0x3626e62",
      "transactionHash": "0x70da5219ff2a572fefdce97e8f85ef3fb0626345bed1536a3c74cbc69fa1c81a",
      "transactionIndex": "0x1",
      "blockHash": "0xcb84da45c88200e699973a40441cfc536c56e77bfe9f59cbafdbaa8623be6a3b",
      "blockTimestamp": "0x6a9e998a",
      "logIndex": "0x0",
      "removed": false
    }
  ]
}
```

## Errors

See [Robinhood errors](../errors.md). Invalid parameters return a JSON-RPC parameter error; authentication and rate-limit failures use the shared client error contract. Unknown failures are returned without an implicit retry.

## Examples

```js
const response = await fetch("https://triport.io/rpc/robinhood", {
  method: "POST",
  headers: { "x-token": process.env.TRIPORT_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{"fromBlock":"0x3626dfe","toBlock":"0x3626e62","address":"0x8366a39cc670b4001a1121b8f6a443a643e40951","topics":["0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f"]}]}),
});
const payload = await response.json();
```

## Notes

- Every upstream channel has a different measured range/result ceiling. Triport may reconstruct deep ranges from block receipts; that path is slower.
- Always bound the range and use `address` or `topics` where possible.
- The block range in the example above is the one the response below it was measured at, so request and response match. It is historical: a range that has fallen out of the served archive window answers `-32005` instead of an empty list, so point a live call at a recent window and see [archive](../archive.md) for the measured floor.

## Related

[`eth_getBlockReceipts`](./eth_getBlockReceipts.md) · [`eth_getProof`](./eth_getProof.md) · [`debug_traceBlockByHash`](./debug_traceBlockByHash.md)

[Archive depth](../archive.md) · [Limits](../limits.md) · [Errors](../errors.md)
