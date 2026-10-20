> Live version: https://triport.io/docs/polygon/json-rpc/eth_chainId

# eth_chainId

> Returns the Polygon network's EIP-155 chain ID as a hex string — `0x89` (137) on mainnet.

| | |
|---|---|
| **Method / Endpoint** | `eth_chainId` (JSON-RPC, `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` (tier-gated; no additional scope) |
| **Tier / rate limit** | Free · 15 rps · basic 20 · pro 100 · business 250 (per-tier RPS with burst; no daily cap) |

## Description

`eth_chainId` returns the chain ID of the connected network as a hex-encoded
integer. On Polygon mainnet this is the constant `0x89` (137 decimal). It is the
cheapest possible call against the Polygon RPC surface — one request resolves to
a single immutable constant — which makes it a common liveness ping.

Its primary purpose is **EIP-155 replay protection**: the chain ID is mixed into
the transaction signature so that a transaction signed for Polygon cannot be
replayed on another EVM chain. Wallets and signing libraries call it once before
constructing a transaction. Because the value never changes for a given network,
clients should fetch it once per connection and **cache it indefinitely
(TTL = ∞)**.

This method belongs to the free `polygon_read_rpc` category, so it is available
on every tier starting at Free. It takes no parameters. If you are targeting
the **Polygon Amoy testnet** instead of mainnet, the returned value is `0x13882`
(80002 decimal).

> Note: `net_version` returns the same chain identity as a **decimal string**
> (`"137"`) rather than a hex quantity. Prefer `eth_chainId` for EIP-155 and
> modern signing flows; `net_version` exists mainly for legacy Web3.js (< 4.x)
> chain detection.

## Parameters

This method takes no parameters. Pass an empty `params` array.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | No parameters. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_chainId",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x89"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | JSON-RPC version, always `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | string | Chain ID as a hex quantity. `0x89` (137) on Polygon mainnet; `0x13882` (80002) on Amoy testnet. |

## Errors

Errors follow the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full `error.data` shape
(`current_tier`, `required_tier`, `limit_rps`, `retry_after_sec`, `upgrade_url`,
…).

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The trial period for the API key has ended; upgrade to a paid tier. |
| `403` | `tier_insufficient` | Your tier is below the method's required tier. (Not applicable here — `eth_chainId` is Free — but returned by premium namespaces such as `bor_*`/`trace_*`.) |
| `429` | `rate_limited` | You exceeded your tier's RPS limit (15 rps on Free). Honor `retry_after_sec` and retry with backoff. |
| `401` | `subscription_expired` | The subscription tied to the API key is no longer active. |
| `401` | `unauthorized` | Missing or invalid `Authorization` header, or the key lacks the `polygon_read_rpc` category. |
| HTTP `403` | `method_unknown` | The method name is not recognized for this chain/route. |

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
    method: "eth_chainId",
    params: [],
  }),
});

const { result } = await res.json();
const chainId = parseInt(result, 16); // 137
console.log(`Connected to Polygon chain ${chainId}`);
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({
  apiKey: process.env.TRIPORT_API_KEY!,
  network: "polygon",
});

const chainId = await client.rpc<string>("eth_chainId");
console.log(parseInt(chainId, 16)); // 137
```

## Notes

- **Cache aggressively.** The chain ID is immutable per network — fetch it once
  per connection and reuse it. There is no need to re-poll.
- **Mainnet vs testnet.** `0x89` = Polygon mainnet (137); `0x13882` = Polygon
  Amoy testnet (80002). Always confirm you are signing for the chain you intend.
- **EIP-155.** Pass the decoded integer (`137`) as the `chainId` field when
  constructing and signing transactions to enable cross-chain replay protection.
- **Related methods:** [`net_version`](./net_version.md) (same identity, decimal
  string), [`eth_blockNumber`](./eth_blockNumber.md) (chain liveness/tip),
  [`web3_clientVersion`](./web3_clientVersion.md) (node client string).
