> Live version: https://triport.io/docs/polygon/json-rpc/web3_clientVersion

# web3_clientVersion

> Returns the version string of the client software backing the Polygon node, as a single string.

| | |
|---|---|
| **Method / Endpoint** | `web3_clientVersion` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`web3_clientVersion` returns a free-form string identifying the client
implementation and version serving the request. On Polygon mainnet
(chainId `0x89` / `137`) the network is secured by Bor, Polygon's fork of
Geth, so the value typically begins with `bor/v...`. Depending on which backend
serves a given request you may instead see a `Geth/v...` or `erigon/v...`
string — the format is the client's own, not a Triport-defined schema.

Use this method as a cheap liveness ping or to record which client family is
answering. Because the string reveals the client type and version, it can be
used to **fingerprint the backend**; treat any client/version details as
informational and do not branch critical logic on the exact string, since the
serving node can change between requests.

This method takes no parameters and is available on every tier starting at
free.

## Parameters

This method takes no parameters.

| Name | Type | Required | Description |
|---|---|---|---|
| — | — | — | Pass an empty array `[]` as `params`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "web3_clientVersion",
    "params": []
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "bor/v1.5.7-stable/linux-amd64/go1.22.4"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The backing client's self-reported version string. On Polygon this is usually a `bor/v...` value (Bor, Polygon's Geth fork); a `Geth/v...` string indicates a standard Geth/Erigon backend. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | Your tier is below the minimum required for this method's category. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry. |
| `401` | `subscription_expired` | The paid subscription tied to the key has lapsed. |
| `401` | `unauthorized` | The API key is missing, malformed, or invalid. |
| HTTP `403` | `method_unknown` | The method is not recognized or not enabled for this chain/key. |

Errors are returned in the standard JSON-RPC envelope. See the shared
[errors reference](../../errors.md) for the full error object shape and handling
guidance.

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
    method: "web3_clientVersion",
    params: [],
  }),
});

const { result } = await res.json();
console.log(result);                       // "bor/v1.5.7-stable/linux-amd64/go1.22.4"
console.log(result.startsWith("bor/"));    // true on a Bor backend
```

## Notes

* The string format is defined by the client, not by Triport. Parse it
  defensively (e.g. split on `/`) and never assume a fixed shape.
* The value can differ between requests if more than one backend serves your
  traffic, so it is not a stable identifier — cache it only for short-lived,
  informational use.
* Related utility and network-state methods on Polygon:
  [`web3_sha3`](./web3_sha3.md) (server-side keccak256),
  [`net_version`](./net_version.md) (network ID as a decimal string), and
  [`eth_chainId`](./eth_chainId.md) (chain ID as a hex quantity).
