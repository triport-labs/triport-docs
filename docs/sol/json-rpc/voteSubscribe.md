> Live version: https://triport.io/docs/sol/json-rpc/voteSubscribe

# voteSubscribe

> Subscribes to vote transactions and streams every new vote the node observes in gossip, before the votes land in blocks.

| | |
|---|---|
| **Method / Endpoint** | `voteSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | pro+ — per-method tier gating on `/ws/sol` |

## Description

`voteSubscribe` streams the raw consensus traffic of the cluster: every vote
transaction the serving node observes, pushed as a `voteNotification` the
moment it is seen in gossip — which can be *before* the vote is packed into a
block. Each notification identifies the voting validator (`votePubkey`), the
`slots` the vote covers, the bank `hash` being voted on, the vote
transaction's `signature`, and a `timestamp` when the validator attached one.

It takes no parameters and cannot be filtered server-side: you receive the
votes of every validator, which on mainnet means a sustained torrent of
frames (votes are the majority of all Solana transactions). Plan to filter
client-side by `votePubkey` and to consume the socket quickly.

The audience is consensus-layer tooling rather than typical dapps: validator
operators watching their own identity to confirm it is voting (and alerting
within seconds when it stops); staking platforms and monitoring services
computing real-time participation or delinquency ahead of what
`getVoteAccounts` polling can show; researchers measuring vote latency and
fork choice; and systems that estimate optimistic confirmation
themselves by accumulating voted stake per slot instead of waiting for the
node's own `optimisticConfirmation` signal.

## Parameters

None — `params` is an empty array (or omitted).

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"voteSubscribe"}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 88110 }
```

Votes stream continuously as `voteNotification` frames:

```json
{
  "jsonrpc": "2.0",
  "method": "voteNotification",
  "params": {
    "subscription": 88110,
    "result": {
      "votePubkey": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      "slots": [348392110, 348392111],
      "hash": "8Rshv2oMkPu5E4opXTRyuyBeZBqQ4S477VG26wUTFxUM",
      "timestamp": 1755500002,
      "signature": "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW"
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `voteUnsubscribe`. |
| `params.result.votePubkey` | string | Vote account of the validator that cast the vote (base-58). |
| `params.result.slots` | array of integer | The slots this vote covers. |
| `params.result.hash` | string | Bank hash being voted on (base-58). |
| `params.result.timestamp` | integer \| null | Unix timestamp attached by the validator, if any. |
| `params.result.signature` | string | Signature of the vote transaction. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `4003` | `forbidden` | Your tier is below `pro` (`tier_insufficient`; the frame carries `required_tier` and `upgrade_url`). |
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **Unstable + flag-gated upstream:** stock Solana nodes expose this only
  with the vote-subscription flag enabled; expect the shape to evolve.
- **No server-side filter:** you get all validators' votes — filter by
  `votePubkey` client-side.
- **Gossip-level data:** duplicates, reordering, and votes on dying forks are
  normal; aggregate before drawing conclusions.
- **Related methods:** [`voteUnsubscribe`](./voteUnsubscribe.md),
  `getVoteAccounts` (polled aggregate view),
  [`slotsUpdatesSubscribe`](./slotsUpdatesSubscribe.md)
  (`optimisticConfirmation` events derived from these votes).
