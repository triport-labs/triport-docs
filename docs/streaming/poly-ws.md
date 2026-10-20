> Live version: https://triport.io/docs/streaming/poly-ws

# Polygon Pub/Sub WebSocket — /ws/poly

> Real-time Polygon JSON-RPC pub/sub over WebSocket: subscribe with `eth_subscribe`, receive `eth_subscription` notifications until you `eth_unsubscribe`.

| | |
|---|---|
| **Method / Endpoint** | `wss://triport.io/ws/poly` (WebSocket channel) |
| **Network** | Polygon |
| **Authentication** | `x-token` header on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | — (per-subscription **tier** gating, see below) |
| **Tier / rate limit** | Per-subscription type: `newPendingTransactions` free · `logs` basic · `newHeads` pro · `syncing` pro |

## Description

`/ws/poly` is a JSON-RPC pub/sub WebSocket for Polygon. It uses the standard
`eth_subscribe` / `eth_unsubscribe` wire shape — identical to the
[Ethereum WS channel](./eth-ws.md). You open one WebSocket connection, send an
`eth_subscribe` frame naming one of four subscription types, and the server
replies with a hex **subscription id**. From then on the server pushes
`eth_subscription` notification frames carrying that id plus the event payload,
until you send `eth_unsubscribe` with the id (or the socket closes).

This channel is **eth-base only**. Polygon-specific `bor_subscribe*` methods are
**not yet supported** here — sending one is rejected as an unknown method
(`forbidden`, WS close `4003`). The four supported subscription types are:

| Subscription type | What it pushes | Minimum tier |
|---|---|---|
| `newPendingTransactions` | Mempool transaction hashes (hashes only) | free |
| `logs` | Filtered log events | basic |
| `newHeads` | A header for every new block | pro |
| `syncing` | Node sync-state transitions | pro |

Subscribing below the required tier closes the connection with WS code `4003`
and a [`WSErrorFrame`](../errors.md) whose `error` is `forbidden` (the frame
carries `current_tier` / `required_tier` / `upgrade_url` so you can render an
upgrade prompt without another call).

## Parameters

The client sends a JSON-RPC frame. `eth_subscribe` takes a `params` array of 1–2
items: the subscription type, plus an optional type-specific options object.

### `eth_subscribe` frame

| Field | Type | Required | Description |
|---|---|---|---|
| `jsonrpc` | string | yes | Must be `"2.0"`. |
| `id` | integer \| string | yes | Client request id; echoed in the ack. |
| `method` | string | yes | Must be `"eth_subscribe"`. |
| `params` | array (1–2 items) | yes | `params[0]` = subscription type; `params[1]` = optional filter/options. |

#### `params[0]` — subscription type

One of `newPendingTransactions`, `logs`, `newHeads`, `syncing`.

#### `params[1]` — optional, type-specific

**`logs` filter** (object):

| Field | Type | Required | Description |
|---|---|---|---|
| `address` | string \| string[] | no | One contract address or a list of addresses. |
| `topics` | array | no | Up to 4 indexed-topic slots. Each slot is a string, an array of strings (OR-match), or `null` (wildcard). |

**`newPendingTransactions`** takes no useful second parameter on Polygon:
notifications carry **transaction hashes only**. Full bodies are not served —
a second parameter of `true` or `{"includeFullTx": true}` is accepted and
ignored, and the stream still sends hashes (measured 2026-09-22). Fetch the
transactions you care about with
[`eth_getTransactionByHash`](../polygon/json-rpc/eth_getTransactionByHash.md);
the [pending-transactions tutorial](../guides/stream-pending-evm-transactions.md)
shows the pattern. (Ethereum's [`/ws/eth`](./eth-ws.md) does return full
objects with `true`.)

### `eth_unsubscribe` frame

| Field | Type | Required | Description |
|---|---|---|---|
| `jsonrpc` | string | yes | Must be `"2.0"`. |
| `id` | integer \| string | yes | Client request id. |
| `method` | string | yes | Must be `"eth_unsubscribe"`. |
| `params` | array (exactly 1) | yes | `params[0]` = the hex subscription id returned by the subscribe ack. |

## Request

WebSocket endpoints are not curl-friendly; use a WS client such as
[`websocat`](https://github.com/vi/websocat) or `wscat`. Authenticate on the
upgrade request with a Bearer header:

```bash
# open the connection (Bearer header on the upgrade)
websocat -H "Authorization: Bearer $TRIPORT_API_KEY" \
  wss://triport.io/ws/poly
```

Then send a subscribe frame (e.g. `newHeads`):

```json
{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newHeads"]}
```

Subscribe to `logs` for a single contract:

```json
{"jsonrpc":"2.0","id":2,"method":"eth_subscribe","params":["logs",{"address":"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]}]}
```

If you cannot set headers, authenticate with the query parameter
(`wss://triport.io/ws/poly?api-key=$TRIPORT_API_KEY`) or send an auth
frame as your first message:

```json
{"jsonrpc":"2.0","method":"auth","params":["$TRIPORT_API_KEY"]}
```

## Response

The subscribe ack returns the hex subscription id:

```json
{"jsonrpc":"2.0","id":1,"result":"0x9cef478923ff08bf67fde6c64013158d"}
```

Subsequent `newHeads` notifications:

```json
{
  "jsonrpc": "2.0",
  "method": "eth_subscription",
  "params": {
    "subscription": "0x9cef478923ff08bf67fde6c64013158d",
    "result": {
      "number": "0x3b2f1a0",
      "hash": "0x8a1f...c2",
      "parentHash": "0x77be...01",
      "nonce": "0x0000000000000000",
      "sha3Uncles": "0x1dcc...47",
      "logsBloom": "0x0000...00",
      "transactionsRoot": "0xab32...9f",
      "stateRoot": "0xdd91...0c",
      "receiptsRoot": "0x56aa...e1",
      "miner": "0x0000000000000000000000000000000000000000",
      "difficulty": "0x1",
      "extraData": "0xd682...00",
      "gasLimit": "0x1c9c380",
      "gasUsed": "0x8f2c11",
      "timestamp": "0x66 4f 0a",
      "baseFeePerGas": "0x4a817c800"
    }
  }
}
```

A `newPendingTransactions` notification carries a tx hash string (the only mode Polygon serves):

```json
{
  "jsonrpc": "2.0",
  "method": "eth_subscription",
  "params": {
    "subscription": "0x1f2e3d4c5b6a79880123456789abcdef",
    "result": "0x3a7b...e9"
  }
}
```

### Response fields

#### Subscribe ack

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | integer \| string | Echoes the request `id`. |
| `result` | string | Hex-encoded subscription id — keep it for `eth_unsubscribe`. |

#### Notification envelope (`eth_subscription`)

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `method` | string | Always `"eth_subscription"`. |
| `params.subscription` | string | The hex subscription id this frame belongs to. |
| `params.result` | varies | Payload, shaped by the subscription type (see below). |

#### `params.result` by subscription type

| Type | `result` shape |
|---|---|
| `newHeads` | Block header object — `number`, `hash`, `parentHash`, `nonce`, `sha3Uncles`, `logsBloom`, `transactionsRoot`, `stateRoot`, `receiptsRoot`, `miner`, `difficulty`, `extraData`, `gasLimit`, `gasUsed`, `timestamp`, `baseFeePerGas` (nullable). All hex strings. |
| `logs` | Log object — `address`, `topics[]`, `data`, `blockNumber`, `transactionHash`, `transactionIndex`, `blockHash`, `logIndex`, `removed` (bool). |
| `newPendingTransactions` | Tx-hash string. Full transaction objects are not served on Polygon. |
| `syncing` | `false` when fully synced, otherwise an object `{ syncing, status: { startingBlock, currentBlock, highestBlock } }`. |

## Errors

Before closing the connection, the server may send a `WSErrorFrame` whose
`error` field names the reason, then closes with the matching WS close code.

| Close code | `error` | When it happens |
|---|---|---|
| `4001` | `unauthorized` | Missing/invalid credentials on the upgrade (no Bearer / `api-key` / auth frame). |
| `4003` | `forbidden` | Subscription type requires a higher tier, or an unknown/unsupported method (e.g. a `bor_subscribe*` call — not yet supported here). |
| `4029` | `rate_limited` | Per-tier RPS exceeded; `retry_after_sec` / `limit_rps` indicate when to retry. |
| `4030` | `trial_expired` | Trial period has ended; `upgrade_url` points at checkout. |

Example forbidden frame (subscribing to `newHeads` with a Free-trial key):

```json
{
  "error": "forbidden",
  "message": "subscription 'newHeads' requires tier 'pro'",
  "current_tier": "free",
  "required_tier": "pro",
  "method": "newHeads",
  "category": "polygon_ws_pubsub",
  "upgrade_url": "https://triport.io/upgrade?tier=pro"
}
```

See the shared [errors reference](../errors.md) for the full `WSErrorFrame`
envelope and all fields.

## Examples

### JavaScript (fetch / browser WebSocket)

```js
const ws = new WebSocket(
  `wss://triport.io/ws/poly?api-key=${TRIPORT_API_KEY}`
);

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_subscribe",
    params: ["newHeads"],
  }));
});

let subId;
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id === 1) {
    subId = msg.result;              // hex subscription id
    return;
  }
  if (msg.method === "eth_subscription") {
    console.log("new head", msg.params.result.number);
  }
});

// later: ws.send(JSON.stringify({
//   jsonrpc: "2.0", id: 2, method: "eth_unsubscribe", params: [subId],
// }));
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY! });

const sub = await client.polygon.ws.subscribe("newHeads");
sub.on("data", (head) => {
  console.log("new head", head.number);
});

// later
await sub.unsubscribe();
```

## Notes

- **Wire shape is identical to Ethereum.** This channel mirrors
  [`/ws/eth`](./eth-ws.md) exactly — same `eth_subscribe` / `eth_unsubscribe`
  methods, same four subscription types, same `eth_subscription` notification
  envelope and tier gating. Code written for one channel works on the other by
  swapping the path.
- **`bor_subscribe*` is not yet supported.** The spec marks `/ws/poly` as
  eth-base only; Polygon's Bor-specific subscriptions are not served on this
  channel, and calling one returns `forbidden` (close `4003`).
- **One id per subscription.** A single connection can hold multiple
  subscriptions; track each returned `result` id so you can `eth_unsubscribe`
  selectively.
- **Disconnect releases everything.** Closing the socket cancels all of its
  subscriptions — no explicit unsubscribe is needed on teardown.
- **Authentication options.** Prefer the `Authorization: Bearer` header on the
  upgrade request. Browser WebSocket clients that cannot set headers may use
  `?api-key=` or a first-frame `auth` message instead.
- **Repeated block numbers:** `newHeads` can emit two headers at one height
  during a reorg — see [why newHeads repeats a block number](https://triport.io/learn/newheads-reorg-duplicate-blocks).
