> Live version: https://triport.io/docs/console/keys/key-endpoints

# Get key endpoints

> Return the per-chain connection endpoints a given API key can use, as a URL template the caller fills in client-side with the raw key.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/keys/{id}/endpoints` |
| **Type** | Triport Console API |
| **Network** | — (returns rows for every chain the key is scoped for) |
| **Authentication** | Session cookie (Console session) |
| **Required scope** | — (no scope; ownership of the key is enforced instead) |
| **Tier / rate limit** | Console API, standard session rate limit |

## Description

This is a **Console** endpoint: it powers the "Endpoints" panel in the dashboard
and is authenticated with your logged-in session cookie, not with an API key in
the `Authorization` header. It returns the list of connection endpoints a single
key is entitled to, one row per `(chain_id, protocol)` pair.

The platform **never returns a URL with the raw key embedded in it**. For
`https` and `wss` rows the response carries a `url_template` containing a literal
`{key}` placeholder; the caller substitutes the raw key locally to build the
final connection URL. The raw key value is only ever shown once — at key
creation — so the client is expected to have cached it from that response. This
keeps the secret out of every URL the API serves.

Rows are returned for **every** chain the key could reach, even ones it currently
cannot use, so the UI can show the full catalogue with per-chain status. A row's
`status` tells you whether the endpoint is usable (`enabled`), present but
blocked because the key lacks the required scope (`scope_missing`), or dead
because the key was revoked (`revoked`). When a key is revoked, every row comes
back `revoked` with empty URL fields — the client should evict any cached raw key
on seeing this.

The key id is looked up scoped to the calling user. A key that does not exist and
a key that belongs to someone else are deliberately **indistinguishable** — both
return `404 not_found` — so the endpoint cannot be used to probe for valid key
ids.

## Parameters

### Path parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | The key id (the opaque key identifier, not the raw secret or its 8-char prefix). |

This endpoint takes no query parameters or request body.

## Request

```bash
# Console session endpoint — authenticated by the session cookie, not an API key.
curl https://triport.io/v1/keys/key_8f2a91c0/endpoints \
  -H "Accept: application/json" \
  --cookie "triport_session=$TRIPORT_SESSION"
```

## Response

```json
{
  "key_id": "key_8f2a91c0",
  "endpoints": [
    {
      "chain_id": "eth",
      "protocol": "https",
      "url_template": "https://triport.io/r/{key}/eth",
      "status": "enabled"
    },
    {
      "chain_id": "eth",
      "protocol": "wss",
      "url_template": "wss://triport.io/ws/r/{key}/eth",
      "status": "enabled"
    },
    {
      "chain_id": "sol",
      "protocol": "https",
      "url_template": "https://triport.io/r/{key}/sol",
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
      "chain_id": "polygon",
      "protocol": "https",
      "status": "scope_missing"
    }
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `key_id` | string | Echoes the key id from the path. |
| `endpoints` | array | One `KeyEndpoint` object per `(chain_id, protocol)` pair, in a stable catalogue order. May be empty. |
| `endpoints[].chain_id` | string | Chain identifier, e.g. `eth`, `sol`, `polygon`. |
| `endpoints[].protocol` | string | One of `https`, `wss`, or `grpc`. |
| `endpoints[].url_template` | string (optional) | For `https`/`wss` `enabled` rows: connection URL containing a literal `{key}` placeholder. Absent on `grpc` rows and on non-`enabled` rows. |
| `endpoints[].url` | string (optional) | For `grpc` rows only: the bare `host:port` to dial. gRPC never carries the key in the URL. |
| `endpoints[].note` | string (optional) | Human-readable hint, e.g. how `grpc` clients pass the key. |
| `endpoints[].status` | string | `enabled`, `scope_missing`, or `revoked` (see below). |

### Status values

| `status` | Meaning |
|---|---|
| `enabled` | The key may use this endpoint. URL fields are populated. |
| `scope_missing` | The chain is listed but the key lacks the scope required to use it; URL fields are empty so no usable URL can be rendered. |
| `revoked` | The key was revoked. Every row is `revoked` with empty URL fields; evict any cached raw key. |

## Resolving the connection URL

For `https` and `wss` rows, replace the literal `{key}` in `url_template` with
the raw key you cached at creation time. Never request the raw key from this API —
it is not returned here.

```js
const finalUrl = endpoint.url_template.replace('{key}', rawKey);
// https://triport.io/r/<rawKey>/eth
```

For `grpc` rows, dial `url` directly and pass the key via the `x-token` gRPC
metadata header — the key is never placed in the URL.

## Errors

| Code | Error | When it happens |
|---|---|---|
| `401` | `unauthenticated` | No valid session cookie. The key id is never confirmed or denied before authentication. |
| `404` | `not_found` | The key does not exist, or it belongs to another user, or the path shape is invalid. These are intentionally indistinguishable. |
| `405` | `method_not_allowed` | A method other than `GET` was used. |
| `500` | `internal` | Backend lookup failure. |
| `503` | `endpoints_disabled` | The endpoints service is not currently wired up. |

See the shared [errors guide](../../errors.md) for the full error envelope.

## Examples

### JavaScript (fetch)
```js
async function getKeyEndpoints(keyId) {
  const res = await fetch(
    `https://triport.io/v1/keys/${encodeURIComponent(keyId)}/endpoints`,
    { credentials: 'include' }, // send the session cookie
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `http_${res.status}`);
  }
  return res.json(); // { key_id, endpoints: [...] }
}

// Build a usable URL from a row + the raw key cached at creation time.
function resolveKeyUrl(template, rawKey) {
  if (!template || !rawKey) return null;
  return template.includes('{key}') ? template.replace('{key}', rawKey) : template;
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportConsole } from '@triport/sdk';

const console = new TriportConsole(); // uses the browser session cookie

const { endpoints } = await console.keys.endpoints('key_8f2a91c0');

const enabled = endpoints.filter((e) => e.status === 'enabled');
for (const e of enabled) {
  if (e.protocol === 'grpc') {
    console.log(`${e.chain_id} grpc → ${e.url}`);
  } else {
    console.log(`${e.chain_id} ${e.protocol} → ${e.url_template}`);
  }
}
```

### Python (`triport-sdk`)
```python
from triport import ConsoleClient

client = ConsoleClient(session_cookie=TRIPORT_SESSION)

resp = client.keys.endpoints("key_8f2a91c0")
for ep in resp["endpoints"]:
    if ep["status"] != "enabled":
        continue
    if ep["protocol"] == "grpc":
        print(ep["chain_id"], "grpc", ep["url"])
    else:
        print(ep["chain_id"], ep["protocol"], ep["url_template"])
```

## Notes

* This is a read-only Console endpoint. To create, list, rotate, or revoke keys,
  see the [keys reference](../../streaming/index.md). The raw key value is returned **only**
  by key creation; every other endpoint returns at most an 8-character prefix.
* `scope_missing` rows are shown deliberately so the UI can advertise chains a
  key could be upgraded to use — they are not an error.
* On a `revoked` response, drop any locally cached raw key and stop using every
  resolved URL derived from this key.
* Endpoint rows are returned in a stable catalogue order, so the UI ordering does
  not shift between calls.
