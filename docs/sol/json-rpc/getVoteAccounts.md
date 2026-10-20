> Live version: https://triport.io/docs/sol/json-rpc/getVoteAccounts

# getVoteAccounts

> Returns the account info and associated stake for all the voting accounts in the current bank on Solana.

| | |
|---|---|
| **Method / Endpoint** | `getVoteAccounts` (JSON-RPC, `POST /` Solana endpoint) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | — |
| **Tier / rate limit** | free+ — 20 rps (free) · 60 rps (basic) · 200 rps (pro) · 600 rps (business) |

## Description

`getVoteAccounts` returns every voting account known to the current bank,
split into two arrays: `current` (validators that are actively voting) and
`delinquent` (validators that have stopped voting recently enough to still be
tracked). Each entry carries the validator's vote and node identities, its
activated stake, commission, and the slot of its most recent vote. Use it to
build validator dashboards, compute stake distribution, or detect validators
that have fallen behind the cluster.

This is a read method in the `sol_read_rpc` category (available from the Free
trial up), so it shares the same per-tier RPS budget with the rest of the
Solana read surface. Because the
unfiltered response can be sizeable, prefer `votePubkey` filtering when you can.

## Parameters

A single optional positional parameter: a `config` object.

| Name | Type | Required | Description |
|---|---|---|---|
| `config` | object | no | Configuration object (see fields below). Omit it entirely to use defaults and return the full validator set. |

### `config` fields

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. Defaults to `finalized`. |
| `votePubkey` | string | no | Base-58 encoded validator vote account address. When set, only this validator is returned. |
| `keepUnstakedDelinquents` | boolean | no | If `true`, delinquent validators that currently have no active stake are kept in the response. Default behavior omits them. |
| `delinquentSlotDistance` | integer | no | Number of slots behind the tip after which a validator is classified as delinquent. Overriding this is rarely needed; the cluster default is used when omitted. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getVoteAccounts",
    "params": []
  }'
```

Scoped to a single validator:

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getVoteAccounts",
    "params": [{ "votePubkey": "3ZT3iqr1HZpRZj8Sj7XK6X4Gd9G3F5gN6yJ9eX1mabc" }]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "current": [
      {
        "votePubkey": "3ZT3iqr1HZpRZj8Sj7XK6X4Gd9G3F5gN6yJ9eX1mabc",
        "nodePubkey": "B97CCUvBUYZqbHi94BZcQ9DkQ9Q1Hk6h2sJ3qX8wxyz",
        "activatedStake": 42817359201044,
        "epochVoteAccount": true,
        "commission": 7,
        "lastVote": 348392040,
        "epochCredits": [
          [610, 145820341, 145523109],
          [611, 146119872, 145820341]
        ],
        "rootSlot": 348392008
      }
    ],
    "delinquent": [
      {
        "votePubkey": "9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM2def",
        "nodePubkey": "C2vYpQ8WjLpD7rT6kqZ1nF4Hh2eS5gP9bU7xW3mghij",
        "activatedStake": 1980553201,
        "epochVoteAccount": true,
        "commission": 10,
        "lastVote": 348375512,
        "epochCredits": [
          [610, 145210034, 145001920]
        ],
        "rootSlot": 348375480
      }
    ]
  }
}
```

### Response fields

The `result` is a `VoteAccountsResponse` object.

| Field | Type | Description |
|---|---|---|
| `current` | `VoteAccount[]` | Validators that are actively voting. |
| `delinquent` | `VoteAccount[]` | Validators whose last vote lags the tip by more than `delinquentSlotDistance`. |

Each entry in `current` / `delinquent` is a `VoteAccount`:

| Field | Type | Description |
|---|---|---|
| `votePubkey` | string | Base-58 encoded vote account address of the validator. |
| `nodePubkey` | string | Base-58 encoded identity (node) public key of the validator. |
| `activatedStake` | integer | Stake, in lamports, delegated to this vote account and active in this epoch. |
| `epochVoteAccount` | boolean | Whether the vote account is staked for this epoch. |
| `commission` | integer | Percentage (0–100) of rewards owed to the validator. |
| `lastVote` | integer (`u64`) | Most recent slot this validator has voted on. |
| `epochCredits` | array | History of earned credits, as `[epoch, credits, previousCredits]` tuples. |
| `rootSlot` | integer (`u64`) | Current root slot for this vote account. |

## Errors

`getVoteAccounts` uses the standard JSON-RPC error envelope. See
[errors](../../errors.md) for the full structure.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `commitment` is not one of `processed` / `confirmed` / `finalized`, `votePubkey` is not a valid base-58 address, or `config` is malformed. |
| `429` | Rate limited | You exceeded your tier's RPS for `sol_read_rpc`. An HTTP error, not a JSON-RPC one: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` token. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getVoteAccounts",
    params: [{ votePubkey: "3ZT3iqr1HZpRZj8Sj7XK6X4Gd9G3F5gN6yJ9eX1mabc" }],
  }),
});

const { result } = await res.json();
console.log("active validators:", result.current.length);
console.log("delinquent validators:", result.delinquent.length);
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const { current, delinquent } = await client.solana.getVoteAccounts({
  votePubkey: "3ZT3iqr1HZpRZj8Sj7XK6X4Gd9G3F5gN6yJ9eX1mabc",
  commitment: "confirmed",
});

console.log("stake:", current[0]?.activatedStake);
console.log("delinquent count:", delinquent.length);
```

## Notes

- **Filter with `votePubkey`.** The unfiltered response covers the entire
  validator set and can be large. If you only track specific operators, pass
  `votePubkey` to keep the response small and the call cheap.
- **`current` vs `delinquent`.** A validator is delinquent when its `lastVote`
  lags the cluster tip by more than `delinquentSlotDistance`. Tune that field
  only if you have a specific staleness threshold in mind.
- **Stake is in lamports.** `activatedStake` is denominated in lamports
  (1 SOL = 1,000,000,000 lamports); divide accordingly before display.
- **Related methods:** [`getClusterNodes`](./getClusterNodes.md) (gossip view of
  nodes), [`getLeaderSchedule`](./getLeaderSchedule.md), and
  [`getEpochInfo`](./getEpochInfo.md) for the epoch context behind
  `epochCredits`.
