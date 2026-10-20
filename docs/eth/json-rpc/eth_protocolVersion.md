> Live version: https://triport.io/docs/eth/json-rpc/eth_protocolVersion

# eth_protocolVersion

> Returns the Ethereum wire protocol version the node speaks, as a hex-encoded integer.

| | |
|---|---|
| **Method / Endpoint** | `eth_protocolVersion` (JSON-RPC, `POST /v1/eth`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free · 10 RPS sustained · up to 20 burst (free) / 20 RPS sustained · up to 40 burst (basic) / 100 RPS sustained · up to 200 burst (pro) / 250 RPS sustained · up to 500 burst (business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_protocolVersion` reports the version of the Ethereum **wire (devp2p `eth`)
protocol** the underlying node implements. It is a connectivity- and
capability-probe method: use it to confirm your endpoint is reachable and
authenticated before issuing heavier calls, or to record which protocol
generation served a request.

The result is a string containing a hex-encoded integer (for example `"0x41"`
= 65, the `eth/65` wire protocol). It is **not** the chain ID, the client
version, or the EVM/network version — for those see
[`net_version`](./net_version.md), [`eth_chainId`](./eth_chainId.md), and
[`web3_clientVersion`](./web3_clientVersion.md).

This method takes no parameters and is available on the Free trial.

## Parameters

This method takes no parameters. Pass an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | no | No parameters. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_protocolVersion",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x41"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC version, always `"2.0"`. |
| `id` | number \| string | Echoes the `id` from the request. |
| `result` | string | The wire protocol version as a hex-encoded integer (e.g. `"0x41"` for `eth/65`). |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See
[errors.md](../../errors.md) for the full envelope and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded your tier's request-per-second limit (10/20/100/250 RPS sustained · short burst 20 / 40 / 200 / 500). Back off and retry. |

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
    method: "eth_protocolVersion",
    params: [],
  }),
});

const { result } = await res.json();
console.log("eth wire protocol:", parseInt(result, 16)); // e.g. 65
```

## Notes

- The value is the **devp2p `eth` wire protocol** version, not a human-facing
  client or network identifier. To distinguish chains, use
  [`eth_chainId`](./eth_chainId.md) or [`net_version`](./net_version.md).
- The result is a hex string; convert with `parseInt(result, 16)` (JS) or
  `int(result, 16)` (Python) if you need a number.
- Because it is cheap and parameterless, this method is a good lightweight
  health/auth check for your endpoint and key.
