> Live version: https://triport.io/docs/sol/json-rpc/programSubscribe

# programSubscribe

> Subscribes to a program by id and streams a notification whenever any account owned by that program changes, with optional size and byte-match filters.

| | |
|---|---|
| **Method / Endpoint** | `programSubscribe` (JSON-RPC Pub/Sub over `wss://triport.io/ws/sol`) |
| **Type** | Native upstream RPC (WebSocket Pub/Sub) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | basic+ — per-method tier gating on `/ws/sol` |

## Description

`programSubscribe` is the streaming counterpart of `getProgramAccounts`: you
name a program id, and the server pushes a `programNotification` every time
the lamports or data of **any account owned by that program** change. Each
notification identifies the changed account by `pubkey` and carries its full
new state in `account` — the same shape `getAccountInfo` returns — so you can
maintain a live mirror of a program's account set without rescanning it.

Because popular programs own millions of accounts, the config object's
`filters` array is what makes this method practical. Two filter kinds can be
combined (an account must match **all** of them): `dataSize` keeps only
accounts whose data is exactly N bytes (e.g. `165` for SPL token accounts),
and `memcmp` keeps accounts whose bytes at a given `offset` equal a base-58
`bytes` needle — the standard trick for matching a specific field, such as a
token account's owner at offset 32 or a mint at offset 0. `commitment` and
`encoding` behave as in `accountSubscribe`; `jsonParsed` is worth requesting
for well-known programs so notifications arrive pre-decoded.

Real-world uses: tracking every token account of a wallet (token program +
`memcmp` on the owner field), watching a DEX program's pool accounts for
reserve changes, following an on-chain order book, or monitoring a lending
protocol's obligation accounts for liquidation thresholds. It also fires when
new accounts are *created* under the program, which makes it a natural
new-market or new-mint detector.

Gotchas: an unfiltered subscription on a busy program can flood a connection —
always start from the tightest `dataSize`/`memcmp` combination you can.
Filters are fixed at subscribe time; to change them, open a new subscription
and drop the old one with [`programUnsubscribe`](./programUnsubscribe.md).
And the stream is session-scoped: a reconnect requires resubscribing, with a
`getProgramAccounts` snapshot to re-sync state you may have missed.

## Parameters

Positional params array: `[programId, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `programId` | string (base-58) | yes | Public key of the owning program whose accounts to watch. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | `processed`, `confirmed` (default), or `finalized`. |
| `encoding` | string | no | Account data encoding: `base58`, `base64`, `base64+zstd`, or `jsonParsed`. |
| `filters` | array | no | Up to a handful of filter objects; an account must match all of them. |

### `filters` entries

| Filter | Shape | Description |
|---|---|---|
| `dataSize` | `{ "dataSize": <integer> }` | Match accounts whose data length is exactly this many bytes. |
| `memcmp` | `{ "memcmp": { "offset": <integer>, "bytes": "<base-58>" } }` | Match accounts whose bytes at `offset` equal the decoded `bytes`. |

## Request

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send (all 165-byte SPL token accounts owned by one wallet):
{"jsonrpc":"2.0","id":1,"method":"programSubscribe","params":["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",{"commitment":"confirmed","encoding":"jsonParsed","filters":[{"dataSize":165},{"memcmp":{"offset":32,"bytes":"9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"}}]}]}
```

## Response

Subscribe ack:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 60214 }
```

Each matching account change is pushed as a `programNotification`:

```json
{
  "jsonrpc": "2.0",
  "method": "programNotification",
  "params": {
    "subscription": 60214,
    "result": {
      "context": { "slot": 348392077 },
      "value": {
        "pubkey": "H4vnBqifaSACnKa7acsxstsY1iV1bvJNxsCY7enrd1hq",
        "account": {
          "lamports": 2039280,
          "owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
          "data": ["dGVzdCBkYXRh", "base64"],
          "executable": false,
          "rentEpoch": 361,
          "space": 165
        }
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | Subscription id — pass it to `programUnsubscribe`. |
| `params.result.context.slot` | integer | Slot at which the change was observed. |
| `params.result.value.pubkey` | string | The changed account's public key (base-58). |
| `params.result.value.account` | object | New account state — same shape as `getAccountInfo`'s `value`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `programId` not valid base-58, or a malformed `filters` entry. |
| `4003` | `forbidden` | Your tier is below `basic` (`tier_insufficient`). |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier. |

## Notes

- **Filter aggressively:** unfiltered subscriptions on high-traffic programs
  produce enormous volume; `dataSize` + `memcmp` is the standard combination.
- **Creations count as changes:** brand-new accounts under the program emit a
  notification, which makes this a new-account detector.
- **Filters are immutable per subscription** — subscribe anew to change them,
  then unsubscribe the old id.
- **Related methods:** [`programUnsubscribe`](./programUnsubscribe.md),
  [`accountSubscribe`](./accountSubscribe.md) (a single known account),
  `getProgramAccounts` (snapshot to pair with the stream).
