> Live version: https://triport.io/docs/console/keys

# Console API — Keys

> API-key lifecycle for a Triport account: create, list, rotate and revoke keys, read per-key endpoints and usage.

| | |
|---|---|
| **Method / Endpoint** | `https://triport.io/v1/keys/…` |
| **Network** | — (account-level) |
| **Authentication** | Console session — see [session model](../auth/session-model.md) |
| **Required scope** | — |
| **Tier / rate limit** | Account-level; not metered against chain RPS budgets |

## What this section covers

Automate what the API Keys tab does by hand: mint a key from CI, list existing ones, rotate a compromised key without downtime, or revoke it. Each key exposes its chain [endpoints](./key-endpoints.md) and a [usage](./usage.md) breakdown by method and day, so quota dashboards can be built on top.

The endpoint list is below; every page carries the request/response schema,
error envelope and a runnable example. Part of the [Console API](../index.md).

## Pages in this section

- [Create an API key](./create-key.md)
- [List API keys](./list-keys.md)
- [Revoke an API key](./revoke-key.md)
- [Rotate an API key](./rotate-key.md)
