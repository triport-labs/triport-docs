> Live version: https://triport.io/docs/console/auth

# Console API — Auth

> Sign-in and session endpoints behind the Triport console: email and Google OAuth flows, wallet challenge/verify (EVM, Solana), linked wallets (list, link), session lookup (`me`), attribution and logout.

| | |
|---|---|
| **Method / Endpoint** | `https://triport.io/v1/auth/…` |
| **Network** | — (account-level) |
| **Authentication** | Console session — see [session model](./session-model.md) |
| **Required scope** | — |
| **Tier / rate limit** | Account-level; not metered against chain RPS budgets |

## What this section covers

How a console session is created and inspected: start/verify an email sign-in, complete the Google OAuth round-trip, or prove wallet ownership with a signed challenge. An account has at most one linked wallet per chain family (EVM, Solana) — the only wallet allowed to pay in-app invoices; `wallets` lists it and `wallet/link` adds one. Changing or removing a linked wallet is done by support (the self-service `wallet/replace` and the batch endpoints were removed on 2026-09-29 and answer `410 endpoint_removed`). `me` returns the current account; `attribute` binds a referral code to it; `logout` ends the session. The [session model](./session-model.md) page explains cookies, lifetimes and CSRF rules shared by all of these.

The endpoint list is below; every page carries the request/response schema,
error envelope and a runnable example. Part of the [Console API](../index.md).

## Pages in this section

- [POST /v1/auth/attribute](./attribute.md)
- [POST /v1/auth/email/start](./email-start.md)
- [POST /v1/auth/email/verify](./email-verify.md)
- [GET /v1/auth/google/callback](./google-callback.md)
- [GET /v1/auth/google/start](./google-start.md)
- [POST /v1/auth/logout](./logout.md)
- [GET /v1/auth/me](./me.md)
- [POST /v1/auth/wallet/challenge](./wallet-challenge.md)
- [POST /v1/auth/wallet/link](./wallet-link.md)
- [POST /v1/auth/wallet/verify](./wallet-verify.md)
- [GET /v1/auth/wallets](./wallets.md)
