> Live version: https://triport.io/docs/sol/json-rpc/accountSubscribe

# accountSubscribe

> Subscribes to a single Solana account by public key and streams a notification every time that account's lamports or data change.

| | |
|---|---|
| **Method / Endpoint** | `accountSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | free+ — per-method tier gating on `/ws/sol` |

## Description

`accountSubscribe` registers a live watch on one account, identified by its
base-58 public key. Whenever the runtime commits a change to that account —
its lamport balance moves, its data bytes are rewritten, or its owner changes —
the server pushes an `accountNotification` frame over the same WebSocket
connection. Between changes the stream is silent, so a quiet account costs
nothing beyond the open subscription.

The optional config object mirrors `getAccountInfo`: `commitment` decides how
settled a change must be before you hear about it (`processed` for lowest
latency, `confirmed` — the default — for the usual balance of speed and
safety, `finalized` when rollbacks are unacceptable), and `encoding` controls
the shape of `value.data` (`base58`, `base64`, `base64+zstd`, or `jsonParsed`
for well-known programs such as SPL Token). The notification payload is the
same `context`/`value` envelope `getAccountInfo` returns, so parsing code can
be shared between the polling and streaming paths.

Typical uses: tracking a hot wallet's SOL balance without polling, watching a
token account for incoming deposits, following a program-derived address (PDA)
that a program mutates, or reacting to an oracle price account the moment it
updates. One WebSocket connection can carry many account subscriptions side by
side — route incoming frames by `params.subscription`.

Two lifecycle rules catch people out. First, a subscription lives only as long
as the WebSocket session: if the socket drops and you reconnect, you must send
`accountSubscribe` again — subscription ids are not portable across
connections. Second, notifications fire once per committed change of state,
not once per transaction: several writes landing in one slot can collapse into
a single notification carrying the final state. Stop the stream with
[`accountUnsubscribe`](./accountUnsubscribe.md), passing the integer id from
the subscribe ack.

## Parameters

Positional params array: `[pubkey, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `pubkey` | string (base-58) | yes | Public key of the account to watch. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | `processed`, `confirmed` (default), or `finalized`. |
| `encoding` | string | no | Account data encoding: `base58`, `base64`, `base64+zstd`, or `jsonParsed`. |

## Request

WebSocket endpoints can't be driven with `curl`; use a WebSocket client such as
`websocat`, then write the subscribe frame to stdin:

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"accountSubscribe","params":["SysvarC1ock11111111111111111111111111111111",{"commitment":"finalized","encoding":"jsonParsed"}]}
```

## Response

The subscribe ack carries the subscription id in `result`:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 23784 }
```

Each subsequent change is pushed as an `accountNotification`:

```json
{
  "jsonrpc": "2.0",
  "method": "accountNotification",
  "params": {
    "subscription": 23784,
    "result": {
      "context": { "slot": 348392041 },
      "value": {
        "lamports": 10000000000,
        "owner": "11111111111111111111111111111111",
        "data": ["", "base64"],
        "executable": false,
        "rentEpoch": 361,
        "space": 0
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `accountUnsubscribe`. |
| `params.subscription` | integer | Id of the subscription that produced this notification. |
| `params.result.context.slot` | integer | Slot at which the change was observed. |
| `params.result.value` | object | Account state — same shape as `getAccountInfo`'s `value`. |

## Errors

Application errors arrive as a final `WSError` frame before the socket closes
with a canonical close code — see the shared [errors reference](../../errors.md).

| Code | Meaning | When it happens |
|---|---|---|
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |
| `-32602` | Invalid params | `pubkey` is not valid base-58, or `config` is malformed. |

## Notes

- **Session-scoped:** subscriptions do not survive a reconnect. On `close`,
  reopen the socket and resubscribe; expect a new subscription id.
- **Coalesced updates:** multiple writes within one slot can surface as a
  single notification with the final account state.
- **Non-existent accounts:** subscribing to an account that does not exist yet
  is valid — the first notification arrives when the account is created.
- **Related methods:** [`accountUnsubscribe`](./accountUnsubscribe.md) to stop
  the stream, [`programSubscribe`](./programSubscribe.md) to watch every
  account owned by a program, and `getAccountInfo` for one-shot reads.
- **Tutorial:** [watch a Solana wallet over WebSocket](../../guides/watch-a-solana-wallet.md)
  uses this subscription as a trigger for a cursor-based catch-up.
