> Live version: https://triport.io/docs/polygon/json-rpc/eth_getCode

# eth_getCode

> Returns the compiled bytecode deployed at a Polygon address, or `0x` if the address is an externally-owned account (EOA) or holds no code.

| | |
|---|---|
| **Method / Endpoint** | `eth_getCode` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 rps · basic — 20 rps · pro — 100 rps · business — 250 rps (with burst) |

## Description

`eth_getCode` returns the bytecode stored at a given address as of a given
block. For a contract account it returns the runtime (deployed) bytecode; for an
externally-owned account, a non-existent address, or a contract that has
self-destructed at the queried block, it returns `0x`.

Use it to tell whether an address is a contract or an EOA, to fingerprint a
deployment, or to confirm that a contract was already deployed at a historical
block. The result is the *runtime* bytecode, not the constructor/creation
bytecode, so it will not match the `data` field of the deployment transaction.

Polygon hosts a large number of proxy contracts — bridged USDC.e and many other
tokens are upgradeable proxies. For those, `eth_getCode` returns the small proxy
shim, not the logic contract. To resolve the implementation behind an
[EIP-1967](https://eips.ethereum.org/EIPS/eip-1967) proxy, pair this call with
[`eth_getStorageAt`](./eth_getStorageAt.md) reading the implementation slot
`0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc`, then call
`eth_getCode` again on the address stored there.

This method is available on the **Free** trial under the `polygon_read_rpc`
category, so any valid key can call it.

## Parameters

Positional params array of exactly two elements.

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `address` | string (20-byte hex, `0x`-prefixed) | yes | The address whose bytecode you want. |
| 1 | `blockTag` | string | yes | Block to read state at: a hex block number (e.g. `0x2A4B1C0`), or one of the tags `latest`, `earliest`, `pending`, `safe`, `finalized`. |

> Historical (`archive`) lookups at an old block number depend on the depth of
> the backing nodes; very deep queries may return data only on higher tiers. For
> "is this a contract right now" checks, use `latest`.

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getCode",
    "params": [
      "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      "latest"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x363d3d373d3d3d363d73abcdef0123456789abcdef0123456789abcdef01235af43d82803e903d91602b57fd5bf3"
}
```

For an EOA, a never-deployed address, or a contract self-destructed by the
queried block, the result is empty bytecode:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | `0x`-prefixed hex of the runtime bytecode at the address, or `0x` when there is no code. |

## Errors

JSON-RPC requests return errors in the standard `error` object with a numeric
`code`, a `message`, and a `data` payload carrying tier/rate-limit context.

| Code | HTTP equiv. | Meaning | When it happens |
|---|---|---|---|
| `401` | 401 | `trial_expired` | The key's trial period has ended. |
| `403` | 403 | `tier_insufficient` | The key's tier is below what the method requires. (`eth_getCode` itself only needs the Free trial.) |
| `429` | 429 | `rate_limited` | You exceeded your tier's RPS + burst budget. See `data.retry_after_sec`. |
| `401` | 401 | `subscription_expired` | The key's paid subscription has lapsed. |
| `401` | 401 | `unauthorized` | Missing, malformed, or invalid API key. |
| `-32601` | 403 | `method_unknown` | The method is not enabled for this key/chain. |

Example rate-limit response — HTTP `429` with a plain body, not a JSON-RPC envelope:

```json
{
  "error": "rate_limited",
  "message": "rate limit exceeded",
  "category": "polygon_read_rpc",
  "current_tier": "free",
  "limit_rps": 15,
  "retry_after_sec": 1,
  "method": "eth_getCode",
  "chain": "polygon"
}
```

See the shared [errors reference](../../errors.md) for the full envelope and the
HTTP ↔ JSON-RPC wire-code mapping.

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getCode",
    params: ["0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", "latest"],
  }),
});

const { result } = await res.json();
const isContract = result !== "0x";
console.log(isContract ? "contract" : "EOA");
```

## Notes

- **EOA vs. contract:** treat any non-`0x` result as a contract. Do not assume a
  fixed length — proxy shims are tens of bytes while large contracts (e.g. Aave
  V3 pools) approach the ~24 KB EIP-170 runtime limit.
- **Proxy detection:** `eth_getCode` alone cannot see through a proxy. Read the
  EIP-1967 implementation slot with [`eth_getStorageAt`](./eth_getStorageAt.md),
  then re-query the resolved address.
- **Payload size:** the response scales with bytecode size. For large contracts
  the body can be several tens of KB — budget for that when polling many
  addresses.
- **Historical reads:** pass a hex block number as `blockTag` to inspect code at
  a past block (useful for confirming a deployment block). Archive depth varies
  by tier.
- **Related methods:** [`eth_getStorageAt`](./eth_getStorageAt.md),
  [`eth_call`](./eth_call.md), [`eth_getBalance`](./eth_getBalance.md).
