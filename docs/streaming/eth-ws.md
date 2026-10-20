> Live version: https://triport.io/docs/streaming/eth-ws

# Ethereum Pub/Sub WebSocket — /ws/eth

> Subscribe over WebSocket to real-time Ethereum events — pending transactions, filtered logs, new block headers, and node sync state — using the standard `eth_subscribe` / `eth_unsubscribe` JSON-RPC shape.

| | |
|---|---|
| **Method / Endpoint** | `wss://triport.io/ws/eth` (channel: `eth_subscribe` / `eth_unsubscribe`) |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` on the upgrade request (`Authorization: Bearer` also accepted), an `auth` frame, or `?api-key=` query |
| **Required scope** | — (gated by subscription type → tier; see below) |
| **Tier / rate limit** | Per subscription type: `newPendingTransactions` free · `logs` basic · `newHeads` / `syncing` pro |

## Description

`/ws/eth` is the Ethereum JSON-RPC Pub/Sub channel. Open a single WebSocket
connection, send an `eth_subscribe` request naming one of four subscription
types, and the server replies with a **hex-encoded subscription id**. From then
on the server pushes `eth_subscription` notification frames carrying that id and
the event payload until you send `eth_unsubscribe` (or the socket closes).

You can hold multiple subscriptions on one connection; each notification frame
identifies its source via `params.subscription`, so match incoming events to the
id you stored at subscribe time.

The four subscription types unlock at different tiers. Attempting to subscribe
to a type above your plan returns a `forbidden` error frame followed by a WS
close `4003` — the frame includes `current_tier`, `required_tier`, and an
`upgrade_url` so you can prompt for an upgrade without a second call.

## Parameters

The `eth_subscribe` request `params` array holds the subscription type in
`params[0]` and an optional, type-specific filter/option object in `params[1]`.

| `params[0]` (type) | Required tier | `params[1]` (optional) | Description |
|---|---|---|---|
| `newPendingTransactions` | free | boolean — see [below](./eth-ws.md#newpendingtransactions) | Mempool firehose — tx hashes, or full transaction objects with `true`. |
| `logs` | basic | [`LogsFilter`](./eth-ws.md#logs) | Filtered log events by address + topics. |
| `newHeads` | pro | — | Every new block header. |
| `syncing` | pro | — | Node sync-state transitions. |

### `newPendingTransactions`

`params[1]` is an optional **boolean**:

| `params[1]` | Notification `result` |
|---|---|
| omitted or `false` | The transaction hash, a string. |
| `true` | The full pending transaction object (`hash`, `from`, `to`, `nonce`, `input`, `value`, gas fields, signature fields; `blockHash`, `blockNumber` and `transactionIndex` are `null`). |

Send the boolean itself: `["newPendingTransactions", true]`. An object such as
`{"includeFullTx": true}` is **not** accepted — the subscribe request gets no
reply at all, neither an id nor an error, so a client waiting for the ack hangs.
This was measured on 2026-09-22 (three connections with the object, two with
`true`). Polygon differs: [`/ws/poly`](./poly-ws.md) returns hashes whatever
`params[1]` is.

### `logs`

`params[1]` is an optional `LogsFilter` object:

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string \| string[] | no | One contract address, or an array of addresses, to match. |
| `topics` | array | no | Up to 4 indexed-topic slots. Each slot is a topic string, an array of strings (OR-match), or `null` (wildcard for that position). |

### `newHeads` / `syncing`

These take no second parameter — `params` is a one-element array.

## Request

Subscribe to the pending-transaction firehose (hash-only, the free default):

```bash
wscat -c "wss://triport.io/ws/eth" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -x '{"jsonrpc":"2.0","id":1,"method":"eth_subscribe","params":["newPendingTransactions"]}'
```

Subscribe to `logs` for a contract with a topic filter:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "eth_subscribe",
  "params": [
    "logs",
    {
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "topics": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
    }
  ]
}
```

Release a subscription when done:

```json
{"jsonrpc":"2.0","id":3,"method":"eth_unsubscribe","params":["0x9cef478923ff08bf67fde6c64013158d"]}
```

## Response

**Subscribe acknowledgement** — `result` is the hex subscription id to keep:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x9cef478923ff08bf67fde6c64013158d"
}
```

**Notification** (`newPendingTransactions`, hash mode):

```json
{
  "jsonrpc": "2.0",
  "method": "eth_subscription",
  "params": {
    "subscription": "0x9cef478923ff08bf67fde6c64013158d",
    "result": "0x68e63ee5b6f7e2b2e9e1cf0d2f5cda0c4f3a9b1d7e8c6a5b4c3d2e1f0a9b8c7d"
  }
}
```

**Notification** (`newHeads`):

```json
{
  "jsonrpc": "2.0",
  "method": "eth_subscription",
  "params": {
    "subscription": "0x1a2b3c4d5e6f70819a0b1c2d3e4f5061",
    "result": {
      "number": "0x12a4f8b",
      "hash": "0x4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c",
      "parentHash": "0x9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f",
      "nonce": "0x0000000000000000",
      "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
      "logsBloom": "0x00000000000000000000000000000000",
      "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
      "stateRoot": "0xdeadbeef00000000000000000000000000000000000000000000000000000000",
      "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
      "miner": "0x95222290dd7278aa3ddd389cc1e1d165cc4bafe5",
      "difficulty": "0x0",
      "extraData": "0x6265617665726275696c642e6f7267",
      "gasLimit": "0x1c9c380",
      "gasUsed": "0x10a3b2f",
      "timestamp": "0x66f4c3a8",
      "baseFeePerGas": "0x53724e1a"
    }
  }
}
```

**Notification** (`syncing`, `false` once fully synced):

```json
{
  "jsonrpc": "2.0",
  "method": "eth_subscription",
  "params": {
    "subscription": "0x7f6e5d4c3b2a19080716253443526170",
    "result": false
  }
}
```

### Response fields

**Acknowledgement**

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | integer \| string | Echoes the request `id`. |
| `result` | string | Hex-encoded subscription id — pass to `eth_unsubscribe` and match against incoming `params.subscription`. |

**Notification envelope** (every `eth_subscription` frame)

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `method` | string | Always `eth_subscription`. |
| `params.subscription` | string | The hex subscription id this event belongs to. |
| `params.result` | varies | The event payload — shape depends on the subscription type (below). |

**`params.result` by subscription type**

| Type | `result` shape |
|---|---|
| `newPendingTransactions` | Tx hash string, or the full transaction object when subscribed with `params[1]` = `true`. |
| `logs` | An `EthLog` object: `address`, `topics[]`, `data`, `blockNumber`, `transactionHash`, `transactionIndex`, `blockHash`, `logIndex`, `removed`. |
| `newHeads` | An `EthBlockHeader` object: `number`, `hash`, `parentHash`, `nonce`, `sha3Uncles`, `logsBloom`, `transactionsRoot`, `stateRoot`, `receiptsRoot`, `miner`, `difficulty`, `extraData`, `gasLimit`, `gasUsed`, `timestamp`, `baseFeePerGas` (nullable). |
| `syncing` | `false` when fully synced, otherwise an object with `syncing` and a `status` of `{ startingBlock, currentBlock, highestBlock }`. |

## Errors

The server may send an application-level error frame immediately before closing
the socket with one of the canonical close codes.

| Close code | `error` | When it happens |
|---|---|---|
| `4001` | `unauthorized` | Missing or invalid credentials on the upgrade / `auth` frame. |
| `4003` | `forbidden` | Subscription type requires a higher tier, or the method is unknown. Frame carries `current_tier`, `required_tier`, `method`, and `upgrade_url`. |
| `4029` | `rate_limited` | Per-tier RPS exceeded. Frame carries `retry_after_sec` and `limit_rps`. |
| `4030` | `trial_expired` | Trial period has ended; frame carries `upgrade_url`. |

Example error frame (sent just before a `4003` close):

```json
{
  "error": "forbidden",
  "message": "subscription type 'newHeads' requires the pro tier",
  "current_tier": "basic",
  "required_tier": "pro",
  "method": "newHeads",
  "category": "eth_ws_pubsub",
  "upgrade_url": "https://triport.io/upgrade?tier=pro"
}
```

See [errors.md](../errors.md) for the full error envelope and shared close-code
reference.

## Examples

### JavaScript (fetch)

WebSockets are not opened with `fetch`; use the browser/Node `WebSocket` API:

```js
const ws = new WebSocket("wss://triport.io/ws/eth", {
  headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` },
});

const subs = new Map(); // subscription id -> type

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_subscribe",
    params: ["newHeads"],
  }));
});

ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id === 1 && msg.result) {
    subs.set(msg.result, "newHeads"); // store the hex id
  } else if (msg.method === "eth_subscription") {
    console.log("block", msg.params.result.number, "from", msg.params.subscription);
  }
});
```

### TypeScript SDK (`@triport/sdk`)

```ts
import { TriportWS } from "@triport/sdk";

const ws = new TriportWS({ apiKey: process.env.TRIPORT_API_KEY! });
const eth = await ws.eth.connect();

// logs for USDT Transfer events
const sub = await eth.subscribe("logs", {
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"],
});

sub.on("data", (log) => console.log(log.transactionHash, log.data));

// later
await eth.unsubscribe(sub.id);
```

## Notes

- **One id per subscription.** Store the hex `result` from each acknowledgement;
  it is the only way to correlate notifications (`params.subscription`) and to
  `eth_unsubscribe` later.
- **`logs` topic slots.** `topics` accepts up to four positions. Use `null` in a
  slot to wildcard it, or an array of strings to OR-match several values in that
  position.
- **`newPendingTransactions` volume.** Hash-only mode (the default) is far
  lighter than full objects (`params[1]` = `true`); enable full bodies only
  when you actually need the decoded transaction. The
  [pending-transactions tutorial](../guides/stream-pending-evm-transactions.md)
  covers both modes and fetching bodies on Polygon.
- **Tier gating is per subscription type**, not per connection — a free key can
  open `newPendingTransactions` but will be closed with `4003` if it tries
  `newHeads`.
- **Polygon** exposes the same four subscription types on
  [`/ws/poly`](./poly-ws.md). Solana pub/sub lives at
  [`/ws/sol`](./sol-pubsub.md). See the [streaming overview](./index.md) for all
  channels.
- **Reconnects:** subscriptions end with their connection and events are not
  replayed — see [why a WebSocket subscription goes silent](https://triport.io/learn/websocket-subscription-reconnect)
  for resubscribe-and-backfill handling.
