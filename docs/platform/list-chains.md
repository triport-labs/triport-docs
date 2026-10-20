> Live version: https://triport.io/docs/platform/list-chains

# List chains

> Return the Triport network catalogue — every chain the platform supports, with its identity, protocol surfaces, required scope, and UI presentation hints.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/chains` |
| **Type** | Triport product (REST API) |
| **Network** | Any network in the registry |
| **Authentication** | Optional session cookie (`credentials: include`) |
| **Required scope** | — (none to call; results are scope-filtered when a session is present) |
| **Tier / rate limit** | — (discovery endpoint; not metered per tier) |

## Description

The endpoint serves two modes depending on whether a valid session cookie is
present on the request:

- **Anonymous** (no cookie, or an invalid/expired one) → the **full active
  registry**, in registration order. This is effectively public catalogue
  data, so it is safe to call unauthenticated for a "browse all chains" view.
- **Authenticated** (valid session cookie) → the registry **filtered to the
  union of scopes** across the user's active API keys. A descriptor is
  included only if its `required_scope` is held by the session. A session with
  a wildcard (`*`) scope receives the full list; a session with **no** scopes
  receives an empty list (`{"chains": []}`) — "we know who you are, you just
  have no access yet."

Descriptors are immutable for the lifetime of a build. Runtime data such as
status, latency, and block height is **not** part of this response — fetch it
from [`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md) or subscribe to the
[`GET /v1/chains/events`](./chains-events-stream.md) SSE stream.

## Parameters

This endpoint takes no path, query, or body parameters. The only input that
changes the response is the optional session cookie, which the browser sends
automatically when the request is made with credentials included.

| Name | Type | Required | Description |
|---|---|---|---|
| (session cookie) | cookie | no | When present and valid, narrows the result to chains the session has scope for. Absent → full registry. |

## Request

```bash
# Anonymous — full active registry
curl https://triport.io/v1/chains \
  -H "Content-Type: application/json"
```

```bash
# Authenticated — scope-filtered to your session's keys
curl https://triport.io/v1/chains \
  -H "Content-Type: application/json" \
  --cookie "triport_session=$TRIPORT_SESSION"
```

## Response

> The example is trimmed to three entries. A real anonymous response returns
> the full runtime registry in
> registration order.

### Response fields

The top-level envelope is always `{ "chains": ChainDescriptor[] }`. The array
is never `null` — an empty result is `{"chains": []}`.

| Field | Type | Description |
|---|---|---|
| `chains` | `ChainDescriptor[]` | The catalogue, filtered by session scope when authenticated. |

Each `ChainDescriptor`:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable chain identifier used in all other chain paths (e.g. `eth`, `polygon`, `sol`, `sol-devnet`). |
| `name` | `string` | Human-readable chain name (e.g. `Ethereum`, `BNB Smart Chain`). |
| `chain_id` | `number` | EIP-155 chain id where applicable (eth=1, polygon=137). Non-EVM mainnets use synthetic values (sol=101, sol-devnet=103); Bitcoin uses `-1` to mean "no EIP-155 chain id exists". |
| `net` | `string` | Network: `mainnet`, `testnet`, or `devnet`. |
| `kind` | `string` | VM family: `evm`, `l2`, or `non-evm`. The UI uses this to decide which metric fields are meaningful. |
| `symbol` | `string` | Native asset symbol (e.g. `ETH`, `POL`, `SOL`, `BTC`). |
| `protocols` | `Protocol[]` | Access surfaces available for the chain (see below). |
| `required_scope` | `string` | The scope a key must hold to use the chain (e.g. `eth:rpc`, `solana:rpc`). Drives the scope-filtered list for authenticated sessions. |
| `ui` | `UIMeta` | Presentation hints (see below). |

`Protocol`:

| Field | Type | Description |
|---|---|---|
| `kind` | `string` | Protocol surface: `https`, `wss`, or `grpc`. |
| `path` | `string` | Internal backend path for the surface. Clients never use this directly — build a usable URL from [`GET /v1/keys/{id}/endpoints`](../console/keys/key-endpoints.md). |
| `note` | `string` *(optional)* | Free-text caveat (e.g. Bitcoin's `"Bitcoin Core JSON-RPC (not EVM)"`). |

`UIMeta`:

| Field | Type | Description |
|---|---|---|
| `color` | `string` | Primary accent colour (hex). |
| `glow` | `string` | Glow/shadow colour (rgba). |
| `logo_bg` | `string` | CSS gradient string for the logo background. |
| `initials` | `string` | Short glyph rendered when no logo image is shown. |

## Errors

The endpoint returns a flat `{"error": "<code>"}` envelope (this differs from
the JSON-RPC error object used by the RPC methods).

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `method_not_allowed` | 405 | Wrong HTTP method | A non-`GET` request was made to `/v1/chains`. |
| `internal` | 500 | Server error | Session-scope resolution failed against the auth backend. |

A valid request always returns `200` — even when the scope-filtered list is
empty (`{"chains": []}`). See the shared [Errors](../errors.md) page for the
full error envelope and conventions.

## Examples

### JavaScript (fetch)
```js
// Anonymous or session-aware: include credentials so the browser attaches
// the session cookie when the user is signed in.
const res = await fetch("https://triport.io/v1/chains", {
  credentials: "include",
});
if (!res.ok) throw new Error(`http_${res.status}`);

const { chains } = await res.json();
for (const c of chains) {
  console.log(`${c.name} (${c.id}) — scope: ${c.required_scope}`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

// Returns the bare ChainDescriptor[] — the { chains } envelope is unwrapped.
const chains = await client.chains.list();

const evm = chains.filter((c) => c.kind === "evm" || c.kind === "l2");
console.log(`${evm.length} EVM-compatible chains available`);
```

## Notes

- **Anonymous vs. authenticated.** The same URL returns different results based
  on the session cookie. There is no query parameter to force one mode — drop
  the cookie to browse the full catalogue, send it to get the scope-filtered
  subset.
- **Descriptors are static.** The list does not carry health/status. For a
  chain's live status, latency, and block height use
  [`GET /v1/chains/{id}/metrics`](./get-chain-metrics.md), and for live updates
  subscribe to [`GET /v1/chains/events`](./chains-events-stream.md).
- **`scope_missing` is a UI concept, not a field here.** Chains whose
  `required_scope` no key holds simply never appear in an authenticated list;
  the UI reconciles the anonymous full list against the authenticated subset to
  render them as "scope missing" rather than hiding them.
- **Building a callable URL.** The `protocols[].path` values are internal
  backend paths. To get a ready-to-use endpoint URL for a chain, call
  [`GET /v1/keys/{id}/endpoints`](../console/keys/key-endpoints.md), which returns per-key URL
  templates (and never the raw key in the body).
- **Single descriptor.** To fetch one chain plus its latest metrics in a single
  call, use [`GET /v1/chains/{id}`](./get-chain.md).

9 networks are supported today: Solana, Ethereum, Polygon, BNB Smart Chain, Base, Tron, Robinhood Chain, Stellar, and TON.
