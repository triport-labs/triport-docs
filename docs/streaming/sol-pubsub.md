> Live version: https://triport.io/docs/streaming/sol-pubsub

# Solana Pub/Sub WebSocket — /ws/sol

> A single WebSocket endpoint for Solana JSON-RPC Pub/Sub: subscribe to account, signature, log, program, slot, root, block, vote, and slot-update events and receive server-pushed notifications in real time.

| | |
|---|---|
| **Method / Endpoint** | `wss://triport.io/ws/sol` (WebSocket channel) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | `sol.pubsub` |
| **Tier / rate limit** | Per-method tier gating — `free` / `basic` / `pro` (see [Parameters](./sol-pubsub.md#parameters)) |

## Description

`/ws/sol` is one WebSocket connection that multiplexes all nine Solana JSON-RPC
Pub/Sub method families. Every frame is a JSON-RPC 2.0 message; the `method`
field disambiguates a subscribe request, an unsubscribe request, and a
server-pushed notification.

The lifecycle is: open the socket, send a `*Subscribe` request, and the server
replies with a **SubscribeAck** carrying an integer `result` — the
**subscription id**. From then on the server pushes `*Notification` frames whose
`params.subscription` matches that id, until you send the matching
`*Unsubscribe` (or the socket closes). Keep the subscription id — it is the only
handle you have to stop a stream.

Each method family carries a minimum tier requirement. `accountSubscribe` and
`signatureSubscribe` are available on the **Free** trial; `logsSubscribe`,
`programSubscribe`, `slotSubscribe`, and `rootSubscribe` require **basic**; and
`blockSubscribe`, `voteSubscribe`, and `slotsUpdatesSubscribe` require **pro**.
Subscribing to a method above your tier closes the connection with WS close code
`4003` (`forbidden`) — see [Errors](./sol-pubsub.md#errors).

## Parameters

A subscribe frame is a JSON-RPC 2.0 request: `{jsonrpc, id, method, params}`.

| Name | Type | Required | Description |
|---|---|---|---|
| `jsonrpc` | string | yes | Must be `"2.0"`. |
| `id` | integer \| string | yes | Client-chosen request id; echoed back on the ack. |
| `method` | string | yes | One of the nine subscribe methods (see the table below). |
| `params` | array | yes | Positional params array — shape depends on the method. For `accountSubscribe` / `programSubscribe` it is `[<base58 pubkey>, <SolSubscribeParams>?]`; for slot/root-style methods it is usually empty. |

### Subscribe methods and tier requirements

| Method | Required tier | Subscribes to |
|---|---|---|
| `accountSubscribe` | `free` | Changes to a single account, by base-58 pubkey. |
| `signatureSubscribe` | `free` | Confirmation status of a single transaction signature. |
| `logsSubscribe` | `basic` | Transaction logs (all, or filtered by mentioned account). |
| `programSubscribe` | `basic` | Changes to accounts owned by a program. |
| `slotSubscribe` | `basic` | Each new processed slot. |
| `rootSubscribe` | `basic` | Each new root the node sets. |
| `blockSubscribe` | `pro` | Full block notifications. |
| `voteSubscribe` | `pro` | New vote transactions observed by the node. |
| `slotsUpdatesSubscribe` | `pro` | Fine-grained per-slot update events. |

### `SolSubscribeParams` (config object)

Passed as the last element of `params` on methods that accept a config object
(e.g. `accountSubscribe`, `programSubscribe`).

| Field | Type | Required | Description |
|---|---|---|---|
| `commitment` | string | no | One of `processed`, `confirmed`, `finalized`. Defaults to `confirmed`. |
| `encoding` | string | no | Account data encoding: `base58`, `base64`, `base64+zstd`, or `jsonParsed`. |

### Unsubscribe

An unsubscribe frame mirrors the subscribe envelope. `method` is the matching
`*Unsubscribe` name and `params` is an array containing the subscription id
returned by the ack.

```json
{ "jsonrpc": "2.0", "id": 2, "method": "accountUnsubscribe", "params": [24040] }
```

The server replies with `{"jsonrpc":"2.0","id":2,"result":true}`.

## Request

WebSocket endpoints can't be driven with `curl`; use a WebSocket client such as
[`websocat`](https://github.com/vi/websocat). Open the socket with the bearer
header, then write a subscribe frame to stdin:

```bash
websocat wss://triport.io/ws/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
# then send:
{"jsonrpc":"2.0","id":1,"method":"accountSubscribe","params":["SysvarC1ock11111111111111111111111111111111",{"commitment":"finalized","encoding":"jsonParsed"}]}
```

Three authentication forms are accepted:

- **Upgrade header** — `Authorization: Bearer $TRIPORT_API_KEY` (shown above).
- **Auth frame** — send `{"jsonrpc":"2.0","method":"auth","params":["$TRIPORT_API_KEY"]}` as the first frame.
- **Query param** — `wss://triport.io/ws/sol?api-key=$TRIPORT_API_KEY` (legacy-friendly).

## Response

The first server frame is the **SubscribeAck**, whose `result` is the
subscription id:

```json
{ "jsonrpc": "2.0", "id": 1, "result": 24040 }
```

Subsequent frames are server-pushed `*Notification` envelopes. An
`accountNotification` looks like:

```json
{
  "jsonrpc": "2.0",
  "method": "accountNotification",
  "params": {
    "subscription": 24040,
    "result": {
      "context": { "slot": 348392041 },
      "value": {
        "lamports": 10000000000,
        "owner": "11111111111111111111111111111111",
        "data": ["", "base64"],
        "executable": false,
        "rentEpoch": 361
      }
    }
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` (on ack) | integer | The subscription id. Pass it to the matching `*Unsubscribe`. |
| `method` (on notification) | string | The notification method, e.g. `accountNotification`. |
| `params.subscription` | integer | The subscription id this notification belongs to. |
| `params.result` | object | The event payload — shape is per-method (account state, signature status, log batch, slot info, etc.). |

## Errors

Application errors are delivered as a final `WSError` frame immediately before
the socket closes with one of the canonical WebSocket close codes. The frame
mirrors the HTTP error envelope so SDKs can reuse the same error classes — see
the shared [errors reference](../errors.md) for the full envelope.

| Code | Meaning | When it happens |
|---|---|---|
| `4001` | `unauthorized` | Missing or invalid API key on the upgrade / auth frame. |
| `4003` | `forbidden` | Subscribing to a method above your tier (`tier_insufficient`) or an unknown method (`method_unknown`). The frame carries `current_tier`, `required_tier`, `method`, and an `upgrade_url`. |
| `4029` | `rate_limited` | Subscribe rate exceeded for your tier; the frame carries `retry_after_sec` and `limit_rps`. |
| `4030` | `trial_expired` | The account's trial has ended; the frame carries an `upgrade_url`. |

Example `WSError` frame sent before a `4003` close:

```json
{
  "error": "forbidden",
  "message": "method requires a higher tier",
  "current_tier": "free",
  "required_tier": "pro",
  "method": "blockSubscribe",
  "category": "sol_ws_pubsub",
  "upgrade_url": "https://triport.io/billing/upgrade?tier=pro"
}
```

## Examples

### JavaScript (fetch)

The browser `WebSocket` API can't set custom headers, so authenticate with the
`?api-key=` query form:

```js
const ws = new WebSocket(
  `wss://triport.io/ws/sol?api-key=${process.env.TRIPORT_API_KEY}`
);

const subs = new Map(); // subscription id -> label

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "accountSubscribe",
    params: [
      "SysvarC1ock11111111111111111111111111111111",
      { commitment: "finalized", encoding: "jsonParsed" },
    ],
  }));
});

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id === 1 && typeof msg.result === "number") {
    subs.set(msg.result, "clock-account");
    console.log("subscribed, id =", msg.result);
  } else if (msg.method === "accountNotification") {
    console.log("account changed at slot", msg.params.result.context.slot);
  }
});
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });
const sol = client.solana.ws(); // opens wss://triport.io/ws/sol

const sub = await sol.accountSubscribe(
  "SysvarC1ock11111111111111111111111111111111",
  { commitment: "finalized", encoding: "jsonParsed" }
);

sub.on("notification", (n) => {
  console.log("account changed at slot", n.context.slot);
});

// later
await sub.unsubscribe();
```

## Notes

- **Hold onto the subscription id.** The ack's `result` is the only handle for
  unsubscribing; route notifications by `params.subscription` when you have
  several active subscriptions on one socket.
- **Multiple subscriptions, one socket.** A single `/ws/sol` connection can
  carry many subscriptions across different method families — open one socket per
  client, not one per subscription.
- **Tier gating is per method.** A `free` connection can run `accountSubscribe`
  and `signatureSubscribe` indefinitely, but a `blockSubscribe` on the same
  socket triggers a `4003` close. Check `required_tier` in the error frame to
  build an upgrade prompt without a second API call.
- **Commitment trade-off.** `processed` arrives first but may be rolled
  back; `finalized` is the strongest guarantee. The default is `confirmed`.
- **Related channels:** the other Solana connection options are the
  [Firehose (WebSocket)](./sol-stream.md) at `wss://triport.io/ws/sol-stream`,
  [gRPC (Yellowstone)](./sol-grpc.md) at `https://grpc.triport.io` and the
  [shred stream](./sol-preexec.md) at `wss://triport.io/ws/sol-preexec` (all
  Pro). The streaming overview lists every channel:
  [Streaming overview](./index.md).
