> Live version: https://triport.io/docs/eth/rest/beacon-events-sse

# Beacon events SSE stream

> Subscribe to Ethereum consensus-layer (beacon chain) events — new heads, finalized checkpoints, and more — as a live Server-Sent Events stream.

| | |
|---|---|
| **Method / Endpoint** | `GET /rpc/eth-beacon/eth/v1/events` |
| **Type** | Triport product (REST API) |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) (or `?api-key=` for header-less SSE clients) |
| **Required scope** | — |
| **Tier / rate limit** | Max stream duration scales with plan (see [Notes](./beacon-events-sse.md#notes)) |

## Description

This endpoint opens a long-lived [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) (SSE) stream of Ethereum **consensus-layer** (beacon chain) events. Rather than polling the beacon REST API for the latest head or checkpoint, you keep one HTTP connection open and receive events as they happen — for example a `head` event each time the chain advances, or a `finalized_checkpoint` event when finality moves forward.

The stream is served by a dedicated SSE handler, separate from the general beacon REST passthrough router. Internally it fans a single upstream event stream out to all subscribers, so it is the right tool for driving real-time UIs (block tickers, finality indicators) or triggering work when the chain head or finality changes.

Requests are routed to consensus-layer hosts advertising the **beacon-events** capability. If no such host is currently healthy, the request fails — see [Errors](./beacon-events-sse.md#errors).

> **Gotcha:** This is a *streaming* response, not a one-shot JSON body. Your client must read the connection incrementally and keep it open. Standard JSON/`fetch().json()` clients that wait for the body to close will hang. Use an SSE-aware client (`EventSource`, `fetch` with a stream reader, or `sseclient` in Python).

## Parameters

This endpoint follows the standard Ethereum Beacon API `/eth/v1/events` contract.

### Query parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `topics` | string (repeatable) | yes | Event topic(s) to subscribe to. Repeat the parameter to subscribe to several topics in one stream, e.g. `?topics=head&topics=finalized_checkpoint`. Common topics: `head`, `finalized_checkpoint`, `block`, `attestation`, `voluntary_exit`, `chain_reorg`, `contribution_and_proof`. |

## Request

```bash
curl -N https://triport.io/rpc/eth-beacon/eth/v1/events?topics=head&topics=finalized_checkpoint \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Accept: text/event-stream"
```

The `-N` (`--no-buffer`) flag tells curl not to buffer the streamed output, so events print as they arrive.

## Response

The response is an open stream with `Content-Type: text/event-stream`. Each event is delivered as an SSE frame: an `event:` line naming the topic followed by a `data:` line carrying a JSON payload, separated by a blank line.

```text
event: head
data: {"slot":"8765432","block":"0x9a1f...c3","state":"0x77b2...e1","epoch_transition":false,"previous_duty_dependent_root":"0x12ab...","current_duty_dependent_root":"0x34cd...","execution_optimistic":false}

event: finalized_checkpoint
data: {"block":"0x4f8e...a2","state":"0xbe19...d0","epoch":"273919","execution_optimistic":false}
```

### Response fields

The fields depend on the subscribed topic. For the two most common topics:

**`head`**

| Field | Type | Description |
|---|---|---|
| `slot` | string | Slot of the new head block. |
| `block` | string | Root of the new head block. |
| `state` | string | State root associated with the head block. |
| `epoch_transition` | boolean | `true` if this head crosses an epoch boundary. |
| `previous_duty_dependent_root` | string | Dependent root used for the previous epoch's duties. |
| `current_duty_dependent_root` | string | Dependent root used for the current epoch's duties. |
| `execution_optimistic` | boolean | `true` if the node has not yet fully validated the execution payload. |

**`finalized_checkpoint`**

| Field | Type | Description |
|---|---|---|
| `block` | string | Root of the newly finalized block. |
| `state` | string | State root of the newly finalized checkpoint. |
| `epoch` | string | Epoch that was finalized. |
| `execution_optimistic` | boolean | `true` if the execution payload is not yet fully validated. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | Bad Request | The required `topics` query param is missing. |
| `401` | Unauthorized | Missing or invalid API key. |
| `500` | Internal Server Error | The connection does not support streaming (flushing). |
| `502` | Bad Gateway | The upstream consensus-layer connection failed while opening the stream. |
| `503` | Service Unavailable | No consensus-layer host with the **beacon-events** capability is currently available. |

Errors returned before the stream opens use the shared JSON error envelope — see [errors.md](../../errors.md). Once the stream is open, the connection may also be closed by the server or upstream; clients should reconnect.

## Examples

### JavaScript (fetch)

The browser `EventSource` API cannot set an `Authorization` header — for it, pass the key as `?api-key=$TRIPORT_API_KEY` in the URL. To use the Bearer header instead, read the stream manually with `fetch`:

```js
const res = await fetch(
  "https://triport.io/rpc/eth-beacon/eth/v1/events?topics=head&topics=finalized_checkpoint",
  {
    headers: {
      Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
      Accept: "text/event-stream",
    },
  }
);

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });

  let sep;
  while ((sep = buf.indexOf("\n\n")) !== -1) {
    const frame = buf.slice(0, sep);
    buf = buf.slice(sep + 2);

    const event = frame.match(/^event:\s*(.*)$/m)?.[1];
    const data = frame.match(/^data:\s*(.*)$/m)?.[1];
    if (data) console.log(event, JSON.parse(data));
  }
}
```

## Notes

- **Max stream duration scales with plan.** The server holds each stream open for a bounded window, after which it cleanly closes the connection and you should reconnect:

  | Plan | Max duration per stream |
  |---|---|
  | Starter (and Free / unrecognized) | 60 seconds |
  | Growth | 5 minutes |
  | Scale | 1 hour |

  This is a per-connection lifetime cap, not a request rate limit; reconnect when the stream closes to keep receiving events.
- **1:1 passthrough.** Events are streamed straight from a consensus-layer host to your connection with no buffering or de-duplication. Responses set `Cache-Control: no-cache` and disable proxy buffering.
- **One long-lived connection.** Hold the stream open and consume events incrementally; do not poll this endpoint.
- **Subscribe to multiple topics** by repeating `topics` in the query string. Each event frame names its topic in the `event:` line so you can demultiplex client-side.
- **Reconnect on drop.** Networks and upstream hosts cycle; treat a closed stream as normal and reconnect with backoff. You may briefly miss events across a reconnect, so reconcile against the latest head if exact continuity matters.
- For one-off reads of beacon chain state (rather than a live stream), use the general consensus-layer REST passthrough under `/rpc/eth-beacon/` (any other `/rpc/eth-beacon/*` path).
- For execution-layer JSON-RPC, see the [Ethereum RPC transport](./rpc-eth-transport.md) reference.
