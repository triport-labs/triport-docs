> Live version: https://triport.io/docs/platform/get-key-endpoints

# Get key endpoints

> Returns the per-chain URL templates for a single API key so your client can build request URLs locally — the raw key is never echoed back.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/keys/{id}/endpoints` |
| **Type** | Triport product (REST API) |
| **Network** | — (spans every chain the key is provisioned for) |
| **Authentication** | Session cookie (dashboard session) — the key itself is not used to authenticate this call |
| **Required scope** | — (the session must own the key; per-chain rows are scope-filtered) |
| **Tier / rate limit** | Standard platform read limits |

## Description

`GET /v1/keys/{id}/endpoints` lists the connection endpoints that a given API
key can reach, one entry per chain and protocol. Use it when your application
needs to discover, at runtime, which chains a key is good for and what URL to
dial for each — without hard-coding hostnames.

This is a **dashboard endpoint**: it is authenticated with your logged-in
session cookie, not with the key itself. It is intended to be called from the
Triport console (or a first-party integration acting on the user's session),
typically once after sign-in to populate a client-side endpoint map.

**Anti-leak guarantee.** The response **never contains the raw API key.** For
`https` and `wss` endpoints the `url_template` field carries a literal `{key}`
placeholder; your client substitutes its locally held raw key into that
placeholder to form the final URL. For `grpc` endpoints there is no
placeholder at all — the `url` field is a bare `host:port`, and the key is sent
out of band as an `x-token` metadata header on the gRPC connection. Because the
key is only ever held client-side, the same call can be made repeatedly and
safely logged without exposing the secret.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The key ID (the public identifier of the key, not the raw secret) whose endpoints you want to list. |

## Request

```bash
curl https://triport.io/v1/keys/k_8f3c12ab/endpoints \
  -H "Content-Type: application/json" \
  --cookie "$TRIPORT_SESSION"
```

> The session cookie is set by the Triport console at sign-in. When calling
> from the browser, the cookie is sent automatically (`credentials: "include"`)
> and you do not pass it explicitly.

## Response

Empty fields (`url_template`, `url`, `note`) are omitted from the JSON rather
than sent as empty strings.

```json
{
  "key_id": "k_8f3c12ab",
  "endpoints": [
    {
      "chain_id": "sol",
      "protocol": "https",
      "url_template": "https://triport.io/r/{key}/sol",
      "status": "enabled"
    },
    {
      "chain_id": "sol",
      "protocol": "wss",
      "url_template": "wss://triport.io/ws/r/{key}/sol",
      "status": "enabled"
    },
    {
      "chain_id": "sol",
      "protocol": "grpc",
      "url": "grpc.triport.io:443",
      "note": "bearer-auth via x-token grpc metadata; key NOT in URL",
      "status": "enabled"
    },
    {
      "chain_id": "eth",
      "protocol": "https",
      "status": "scope_missing"
    },
    {
      "chain_id": "polygon",
      "protocol": "https",
      "status": "revoked"
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `key_id` | string | The public key ID this list belongs to (echoes the `id` path parameter). |
| `endpoints` | array&lt;KeyEndpoint&gt; | One entry per chain/protocol the key is provisioned for. |

#### KeyEndpoint object

| Field | Type | Description |
|---|---|---|
| `chain_id` | string | The chain this endpoint serves — the same stable id used across the catalogue (e.g. `sol`, `eth`, `polygon`). |
| `protocol` | string | Transport protocol: `https`, `wss`, or `grpc`. |
| `url_template` | string? | For `enabled` `https` / `wss` rows: the URL with a literal `{key}` placeholder that your client replaces with its locally held raw key. Omitted for `grpc` and for non-enabled rows. **Never contains the raw key.** |
| `url` | string? | For `enabled` `grpc` rows only: the bare `host:port` to dial. Omitted otherwise. The key is **not** carried in this field — send it as the `x-token` gRPC metadata header. |
| `note` | string? | Human-readable hint about this endpoint (e.g. how to pass the key over gRPC). Omitted when empty. |
| `status` | string | Endpoint availability: `enabled`, `scope_missing`, or `revoked` (closed set). See [Endpoint status](./get-key-endpoints.md#endpoint-status). |

#### Endpoint status

| Value | Meaning | What the client should do |
|---|---|---|
| `enabled` | The key holds the chain's required scope and may use this endpoint. | Build the URL (substitute `{key}` for https/wss, or dial `url` with the `x-token` header for grpc) and connect. |
| `scope_missing` | The chain is recognized but the key lacks its `required_scope`. The row is still listed (URL fields are omitted) so the UI cannot accidentally render a working URL. | Do not call. Surface an upgrade/scope hint to the user. |
| `revoked` | The key has been revoked; **every** row in the response carries this status. | Stop using the key and **evict the raw key from any local cache** so it is never substituted into a `url_template` again. |

## Errors

Errors use the platform envelope — a JSON body of the shape `{ "error": "<tag>" }`.
When the body is not JSON, clients fall back to an `http_<status>` tag.

| HTTP status | When it happens |
|---|---|
| `401` | No valid session cookie (not signed in, or the session expired). |
| `404` | No such key for this session. **This is opaque by design** — a key that does not exist and a key owned by another user both return `404`, so a caller cannot probe for key ids belonging to other users. |

There is no `403`: a key you do not own is reported as `404`, not "forbidden".
See [errors.md](../errors.md) for the full error envelope shape.

## Examples

### JavaScript (fetch)

```js
// Called from the console — the session cookie is sent automatically.
const res = await fetch(
  `https://triport.io/v1/keys/${keyId}/endpoints`,
  { credentials: "include" }
);
if (!res.ok) throw new Error(`endpoints lookup failed: ${res.status}`);

const { key_id, endpoints } = await res.json();

// rawKey is held only on the client and never came from this response.
function resolveUrl(ep, rawKey) {
  if (ep.status === "revoked") {
    cache.evict(key_id); // drop the local raw-key cache
    throw new Error(`key ${key_id} revoked on ${ep.chain_id}`);
  }
  if (ep.status === "scope_missing") {
    throw new Error(`missing scope for ${ep.chain_id}: ${ep.note}`);
  }
  if (ep.protocol === "grpc") {
    // Dial ep.url and attach the key as x-token metadata, not in the URL.
    return { target: ep.url, metadata: { "x-token": rawKey } };
  }
  return ep.url_template.replace("{key}", rawKey);
}
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportConsole } from "@triport/sdk";

const console = new TriportConsole(); // uses the active browser session

const { keyId, endpoints } = await console.keys.endpoints("k_8f3c12ab");

for (const ep of endpoints) {
  if (ep.status === "revoked") {
    console.keys.evictCachedSecret(keyId); // clear the local raw-key cache
    continue;
  }
  if (ep.status !== "enabled") continue;

  const url =
    ep.protocol === "grpc"
      ? ep.url // dial with x-token metadata
      : ep.urlTemplate.replace("{key}", myRawKey);
}
```

### Python (`triport-sdk`)

```python
from triport import Console

console = Console()  # authenticates with the dashboard session

result = console.keys.endpoints("k_8f3c12ab")

for ep in result["endpoints"]:
    if ep["status"] == "revoked":
        console.keys.evict_cached_secret(result["key_id"])  # drop cached secret
        continue
    if ep["status"] != "enabled":
        continue

    if ep["protocol"] == "grpc":
        target = ep["url"]            # dial with x-token metadata header
    else:
        url = ep["url_template"].replace("{key}", my_raw_key)
```

## Notes

- **Substitution happens client-side, always.** Treat `url_template` as a
  template, not a URL. Replacing `{key}` is your responsibility; the platform
  deliberately omits the secret so the response is safe to cache and log.
- **gRPC auth differs.** gRPC endpoints expose only `host:port` in `url`. The
  key travels as the `x-token` metadata header on the connection — never as part
  of the URL or in a `url_template`.
- **React to `revoked` immediately.** A `revoked` status is the signal to purge
  the raw key from local storage / in-memory caches so it can never be folded
  into a future request.
- **Filtering.** Endpoints with `status: "scope_missing"` are still listed so
  you can show the user what the key *could* reach after a scope change; filter
  on `status === "enabled"` before connecting.
- **Stable ordering.** Rows follow the catalogue's chain order, and within a
  chain follow that chain's declared protocol order, so the list renders
  consistently between calls.
- **Do not persist the resolved URL.** Because the raw key is substituted only
  in memory, treat resolved URLs as ephemeral. The console re-fetches templates
  rather than caching substituted URLs to disk, and polls roughly once a minute
  so a revoke performed elsewhere is reflected promptly.
- **Related:** [`GET /v1/chains`](./list-chains.md) and
  [`GET /v1/chains/{id}`](./get-chain.md) describe the chains a `chain_id`
  refers to.
