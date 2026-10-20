> Live version: https://triport.io/docs/sol/json-rpc/getIdentity

# getIdentity

> Returns the identity public key of the node currently serving your request.

| | |
|---|---|
| **Method / Endpoint** | `getIdentity` (JSON-RPC over `POST https://triport.io/sol`) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getIdentity` returns the identity public key for the node that handled the
request. It takes no parameters and is one of the cheapest read methods on the
Solana surface, which makes it useful as a connectivity / auth smoke-test: a
successful response confirms your key is valid and the endpoint is reachable.

Because requests are load-balanced across a pool of upstream nodes, the
`identity` value you receive may differ from one call to the next. Treat it as
the identity of *whichever* node served this particular request, not as a stable
identifier for your connection.

## Parameters

This method takes no parameters. Send an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getIdentity",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "identity": "2r1F4iWqVcb8M1DbAjQuFpebkQHY9hcVU4WuW2DJBppN"
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | object | Wrapper object for the result. |
| `result.identity` | string (Pubkey) | Base-58 encoded public key (32–44 chars) of the node serving the request. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). |
| `-32600` | Invalid Request | Malformed JSON-RPC envelope (e.g. missing `jsonrpc`/`method`). |

See the shared [errors reference](../../errors.md) for the full error envelope
and retry guidance.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getIdentity",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result.identity);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const { identity } = await client.sol.getIdentity();
console.log(identity);
```

## Notes

- The returned `identity` reflects the node that served this request and is not
  guaranteed to be stable across calls.
- For broader node and cluster information, see
  [`getClusterNodes`](./getClusterNodes.md), and for liveness checks see
  [`getHealth`](./getHealth.md).
- Rate limiting is per-second by tier with burst allowance; there is no daily
  quota. See [rate limits and tiers](../../rate-limits-and-tiers.md).
