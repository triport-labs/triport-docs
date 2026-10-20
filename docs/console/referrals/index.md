> Live version: https://triport.io/docs/console/referrals

# Console API — Referrals

> Referral program endpoints: codes, invitees, rewards, payouts and the admin operations behind the affiliate cabinet.

| | |
|---|---|
| **Method / Endpoint** | `https://triport.io/v1/referrals/…` |
| **Network** | — (account-level) |
| **Authentication** | Console session — see [session model](../auth/session-model.md) |
| **Required scope** | — |
| **Tier / rate limit** | Account-level; not metered against chain RPS budgets |

## What this section covers

The affiliate cabinet as an API: read or set a referral code, list invitees and the rewards they generated, request a payout and follow its status, apply referral credit to an invoice. Admin-scoped endpoints let operators review and execute payouts.

The endpoint list is below; every page carries the request/response schema,
error envelope and a runnable example. Part of the [Console API](../index.md).

## Pages in this section

- [DELETE /v1/referrals/code — Remove custom referral slug](./delete-code.md)
- [GET /v1/referrals/invitees — List referred users](./get-invitees.md)
- [GET /v1/referrals/me — Referral overview](./get-me.md)
- [GET /v1/referrals/payouts — List payout requests](./get-payouts.md)
- [GET /v1/referrals/rewards — List referral rewards](./get-rewards.md)
- [POST /v1/auth/attribute — Attribute signup to a referral code](./post-auth-attribute.md)
- [POST /v1/referrals/code — Set custom referral slug](./post-code.md)
- [POST /v1/referrals/payouts — Request a referral payout](./post-payouts.md)
- [POST /v1/referrals/spend-on-invoice — Apply referral credit to an invoice](./post-spend-on-invoice.md)
