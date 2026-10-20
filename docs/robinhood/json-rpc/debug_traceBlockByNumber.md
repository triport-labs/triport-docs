> Live version: https://triport.io/docs/robinhood/json-rpc/debug_traceBlockByNumber

# debug_traceBlockByNumber

> Trace every transaction in a block selected by number.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceBlockByNumber` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceBlockByNumber` — trace every transaction in a block selected by number. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

Trace every transaction in a block selected by number — the raw material for an internal-transfer index. It is the heaviest call in the catalog: one request replays a whole block, so budget it per block rather than per address.

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |
| `options` | TraceOptions | yes | Tracer selection and tracer-specific settings, for example `{"tracer":"callTracer"}`. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"debug_traceBlockByNumber","params":["latest",{"tracer":"callTracer"}]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "debug_traceBlockByNumber",
  "params": [
    "latest",
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
      "txHash": "0xb31a60c49156b5f304c4b9ba1ab65a45289b5a78c9f06c1f9e46fdc444ee727b",
      "result": {
        "beforeEVMTransfers": [],
        "afterEVMTransfers": [],
        "from": "0x00000000000000000000000000000000000a4b05",
        "gas": "0x0",
        "gasUsed": "0x0",
        "to": "0x00000000000000000000000000000000000a4b05",
        "input": "0x6bf6a42d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018b96ae000000000000000000000000000000000000000000000000000000000362e3220000000000000000000000000000000000000000000000000000000000000000",
        "calls": [
          {
            "from": "0xfffffffffffffffffffffffffffffffffffffffe",
            "gas": "0x1c9c380",
            "gasUsed": "0x212c",
            "to": "0x0000f90827f1c53a10cb7a02335b175320002935",
            "input": "0x77160dd8d4fb24a0381e371e207cc5731d806a417b8edf19a03861ac84f603ef",
            "calls": [
              {
                "from": "0x0000f90827f1c53a10cb7a02335b175320002935",
                "gas": "0x1c29238",
                "gasUsed": "0x323",
                "to": "0x0000000000000000000000000000000000000064",
                "input": "0xa3b1b31d",
                "output": "0x000000000000000000000000000000000000000000000000000000000362e322",
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"debug_traceBlockByNumber","params":["latest",{"tracer":"callTracer"}]}),
});
const payload = await response.json();
```

## Notes

- Parity-style `trace_*` methods are not in the Robinhood catalog.

## Related

[`debug_traceBlockByHash`](./debug_traceBlockByHash.md) · [`debug_traceCall`](./debug_traceCall.md) · [`debug_traceTransaction`](./debug_traceTransaction.md)

[Debug and trace](../debug.md) · [Limits](../limits.md) · [Errors](../errors.md)
