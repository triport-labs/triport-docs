> Live version: https://triport.io/docs/console

# Console API

> The API behind the Triport dashboard — sign-in and sessions, API-key management, billing and invoices, and the referral program — for automating anything you can do in the console UI.

| | |
|---|---|
| **Method / Endpoint** | `https://triport.io/v1/…` (per endpoint) |
| **Network** | — (account-level) |
| **Authentication** | Console session / account credentials — see [session model](./auth/session-model.md) |
| **Required scope** | — |
| **Tier / rate limit** | Account-level; not metered against chain RPS budgets |

## What this surface is

Everything the Triport console does goes through this API, so you can script
it: create and rotate keys from CI, pull invoices into accounting, or wire
referral stats into your own dashboards. It is **account-level** — distinct
from the chain data planes (`/sol`, `/eth`, `/polygon`), which use API keys.

## Endpoint groups

- **Auth** — email and wallet sign-in flows, sessions,
  [session model](./auth/session-model.md), `me`.
- **Keys** — create, list, rotate, revoke; per-key
  [endpoints](./keys/key-endpoints.md) and [usage](./keys/usage.md).
- **Billing** — balance, invoices, in-app transactions, rails, event streams.
- **Referrals** — codes, invitees, rewards, payouts, and admin operations.

The full endpoint list is below.

## Pages in this section

- [Console API — Auth](./auth/index.md)
- [Console API — Billing](./billing/index.md)
- [Console API — Keys](./keys/index.md)
- [Console API — Referrals](./referrals/index.md)
