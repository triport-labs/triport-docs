> Live version: https://triport.io/docs/robinhood/json-rpc/debug_traceBlockByHash

# debug_traceBlockByHash

> Trace every transaction in a block selected by hash.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceBlockByHash` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceBlockByHash` — trace every transaction in a block selected by hash. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

The same whole-block trace for a block selected by hash. Prefer it while backfilling across a range you have already pinned by hash: numbers can be re-pointed by a reorg mid-backfill, hashes cannot.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `blockHash` | Hash | yes | 32-byte block hash. |
| `options` | TraceOptions | yes | Tracer selection and tracer-specific settings, for example `{"tracer":"callTracer"}`. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"debug_traceBlockByHash","params":["0x0000000000000000000000000000000000000000000000000000000000000000",{"tracer":"callTracer"}]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "debug_traceBlockByHash",
  "params": [
    "0x0000000000000000000000000000000000000000000000000000000000000000",
    {
      "tracer": "callTracer"
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
      "txHash": "0xcd3943ea74e88d6a3be58a9f50d580137b74f6bbae8d66eb85734b43e60eb7b3",
      "result": {
        "beforeEVMTransfers": [],
        "afterEVMTransfers": [],
        "from": "0x00000000000000000000000000000000000a4b05",
        "gas": "0x0",
        "gasUsed": "0x0",
        "to": "0x00000000000000000000000000000000000a4b05",
        "input": "0x6bf6a42d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018b96ae000000000000000000000000000000000000000000000000000000000362e3230000000000000000000000000000000000000000000000000000000000000000",
        "calls": [
          {
            "from": "0xfffffffffffffffffffffffffffffffffffffffe",
            "gas": "0x1c9c380",
            "gasUsed": "0x212c",
            "to": "0x0000f90827f1c53a10cb7a02335b175320002935",
            "input": "0xf905b15972b3b3c0de8cadb10de41b5a3a0e0f8ef37f076b19968e1aad23ea9f",
            "calls": [
              {
                "from": "0x0000f90827f1c53a10cb7a02335b175320002935",
                "gas": "0x1c29238",
                "gasUsed": "0x323",
                "to": "0x0000000000000000000000000000000000000064",
                "input": "0xa3b1b31d",
                "output": "0x000000000000000000000000000000000000000000000000000000000362e323",
                "type": "STATICCALL"
              }
            ],
            "value": "0x0",
            "type": "CALL"
          }
        ],
        "value": "0x0",
        "type": "CALL"
      }
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"debug_traceBlockByHash","params":["0x0000000000000000000000000000000000000000000000000000000000000000",{"tracer":"callTracer"}]}),
});
const payload = await response.json();
```

## Notes

- Parity-style `trace_*` methods are not in the Robinhood catalog.

## Related

[`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) · [`debug_traceCall`](./debug_traceCall.md) · [`debug_traceTransaction`](./debug_traceTransaction.md)

[Debug and trace](../debug.md) · [Limits](../limits.md) · [Errors](../errors.md)
