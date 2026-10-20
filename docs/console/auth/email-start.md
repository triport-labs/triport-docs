> Live version: https://triport.io/docs/console/auth/email-start

# POST /v1/auth/email/start

> Begins email one-time-password (OTP) login by sending a 6-digit code to the supplied address and returning a `request_id` to use in the verify step.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/auth/email/start` |
| **Type** | Triport Console API |
| **Network** | — |
| **Authentication** | None (public console endpoint) |
| **Required scope** | — |
| **Tier / rate limit** | 5 requests per email address per hour |

## Description

`POST /v1/auth/email/start` is the first step of the email OTP login flow for
the Triport console. It takes an email address, generates a 6-digit one-time
code, emails it to that address, and returns an opaque `request_id` that ties
the subsequent verify call back to this attempt.

The code is valid for **10 minutes**. To complete login, pass the returned
`request_id` together with the code the user received to
[`POST /v1/auth/email/verify`](./email-verify.md), which is what actually
creates the session.

This endpoint does **not** require authentication and does **not** issue a
session by itself — it only triggers code delivery. The email is normalized
(trimmed and lower-cased) before validation and rate-limiting, so
`User@Example.com ` and `user@example.com` count as the same address.

A successful response only confirms that a code was generated and dispatched;
it never reveals whether the address belongs to an existing account.

## Parameters

### Request body

| Name | Type | Required | Description |
|---|---|---|---|
| `email` | string | yes | The email address to send the login code to. Normalized (trimmed + lower-cased) and validated server-side. |

The request body is limited to 4 KB.

## Request

```bash
curl https://triport.io/v1/auth/email/start \
  -H "Content-Type: application/json" \
  -d '{"email": "dev@example.com"}'
```

## Response

`200 OK`

```json
{
  "request_id": "9f1c2b3a-4d5e-6f70-8a9b-0c1d2e3f4a5b"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `request_id` | string (UUID) | Identifier for this OTP attempt. Pass it to `POST /v1/auth/email/verify` along with the code to finish login. |

## Errors

Errors use the shared error envelope (`{ "error": "<code>" }`). See
[errors.md](../../errors.md) for the full envelope.

| Code | HTTP | Meaning | When it happens |
|---|---|---|---|
| `invalid_json` | 400 | Malformed request body | Body is not valid JSON or exceeds 4 KB. |
| `invalid_email` | 400 | Email failed validation | `email` is missing, empty, or not a valid address. |
| `rate_limited` | 429 | Too many requests | More than 5 codes requested for the same email within the last hour. |
| `internal` | 500 | Server error | Code could not be generated, persisted, or delivered. |

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/v1/auth/email/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "dev@example.com" }),
});

if (!res.ok) {
  const { error } = await res.json();
  throw new Error(`email start failed: ${error}`);
}

const { request_id } = await res.json();
// Keep request_id; pass it to /v1/auth/email/verify with the user's code.
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient();

const { requestId } = await client.auth.emailStart({ email: "dev@example.com" });
// Then: await client.auth.emailVerify({ requestId, code });
```

## Notes

- This call starts the flow but never establishes a session. Always follow it
  with [`POST /v1/auth/email/verify`](./email-verify.md) to obtain the
  `nl_session` cookie.
- Codes expire 10 minutes after they are issued. If a user waits too long,
  call `start` again to issue a fresh code.
- The rate limit is **5 requests per email per hour**. There is no daily quota.
- Other console login flows: [Google OAuth](./google-start.md) and
  [wallet challenge/verify](./wallet-challenge.md). For an overview of the
  cookie-session model, see the [auth overview](../../overview.md).
