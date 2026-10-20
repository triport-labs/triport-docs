> Live version: https://triport.io/docs/robinhood/json-rpc/debug_traceCall

# debug_traceCall

> Trace a read-only EVM call.

| | |
|---|---|
| **Method / Endpoint** | `debug_traceCall` at `POST /rpc/robinhood` |
| **Type** | Robinhood Chain JSON-RPC |
| **Network** | Robinhood Chain mainnet (chain ID 4663) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `robinhood:rpc` |
| **Tier / rate limit** | `robinhood_read_rpc_heavy` - 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (free / basic / pro / business) (default, unmeasured); enterprise unlimited; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`debug_traceCall` — trace a read-only EVM call. The published signature and response shape come from the measured Robinhood OpenRPC contract (chain ID 4663).

## Parameters

JSON-RPC `params` is a positional array.

| Name | Type | Required | Description |
|---|---|---|---|
| `call` | Call | yes | Call object: `to` plus optional `from`, `data`, `value`, `gas` and fee fields. |
| `block` | BlockTag | yes | Block number in hex, or a tag: `latest`, `earliest`, `pending`. `safe` and `finalized` are not part of this contract. |
| `options` | TraceOptions | yes | Tracer selection and tracer-specific settings, for example `{"tracer":"callTracer"}`. |

## Request

`POST https://triport.io/rpc/robinhood`

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"debug_traceCall","params":[{"to":"0x0000000000000000000000000000000000000000","data":"0x"},"latest",{"tracer":"callTracer"}]}'
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "debug_traceCall",
  "params": [
    {
      "to": "0x0000000000000000000000000000000000000000",
      "data": "0x"
    },
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
  "result": {
    "beforeEVMTransfers": [
      {
        "purpose": "feePayment",
        "from": "0x0000000000000000000000000000000000000000",
        "to": null,
        "value": "0x0"
      }
    ],
    "afterEVMTransfers": [
      {
        "purpose": "gasRefund",
        "from": null,
        "to": "0x0000000000000000000000000000000000000000",
        "value": "0x0"
      },
      {
        "purpose": "feeCollection",
        "from": null,
        "to": "0x5a2B80a9b7effc06129bD5462D77BC20A8A59BE7",
        "value": "0x61c9f36800"
      },
      {
        "purpose": "feeCollection",
        "from": null,
        "to": "0xbC5C3a7Adecf54D34169fd90dbD1B7d3142DF067",
        "value": "0x8de8ccce480"
      },
      {
        "purpose": "feeCollection",
        "from": null,
        "to": "0xa4B00000000000000000000000000000000000F6",
        "value": "0x0"
      }
    ],
    "from": "0x0000000000000000000000000000000000000000",
    "gas": "0x2faf080",
    "gasUsed": "0x5208",
    "to": "0x0000000000000000000000000000000000000000",
    "input": "0x",
    "value": "0x0",
    "type": "CALL"
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
  body: JSON.stringify({"jsonrpc":"2.0","id":1,"method":"debug_traceCall","params":[{"to":"0x0000000000000000000000000000000000000000","data":"0x"},"latest",{"tracer":"callTracer"}]}),
});
const payload = await response.json();
```

## Notes

- Parity-style `trace_*` methods are not in the Robinhood catalog.

## Related

[`debug_traceBlockByHash`](./debug_traceBlockByHash.md) · [`debug_traceBlockByNumber`](./debug_traceBlockByNumber.md) · [`debug_traceTransaction`](./debug_traceTransaction.md)

[Debug and trace](../debug.md) · [Limits](../limits.md) · [Errors](../errors.md)
