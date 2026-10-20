> Live version: https://triport.io/docs/streaming/sol-grpc

# Solana gRPC (Yellowstone)

> Production access to Triport's Solana gRPC (Yellowstone) endpoint, `https://grpc.triport.io`, for backend services that need slots, accounts, transactions, blocks, and entries over a native gRPC stream.

| | |
|---|---|
| **Method / Endpoint** | gRPC `https://grpc.triport.io` (`grpc.triport.io:443` in host:port form) |
| **Network** | Solana |
| **Authentication** | gRPC metadata `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `stream.grpc.solana` on the API key (`*` wildcard keys also work) |
| **Tier / rate limit** | Pro and above; Business includes expanded stream capacity |

## What This Is

Triport exposes Solana's Yellowstone-compatible `geyser.Geyser` service for
backend applications that need a native gRPC stream. This is the production API
surface behind the Stream dashboard: the dashboard is only for visibility and
diagnostics, while your application should connect directly to the gRPC
endpoint.

Use this when you already have a Yellowstone gRPC client, indexer, trading bot,
or data pipeline and want to subscribe to Solana updates with server-side
filters.

Triport's gRPC endpoint *is* Yellowstone gRPC: there is one address,
`https://grpc.triport.io`, not a separate Yellowstone host. gRPC (Yellowstone)
is not a WebSocket and not the firehose: it is a native gRPC (HTTP/2, protobuf)
endpoint with server-side filters.

It is one of the five Solana connection options, in this order (see the
[Solana guide](../sol/index.md)):

| Connection | Address | Tier |
|---|---|---|
| HTTPS (JSON-RPC) | `https://triport.io/sol` | — |
| WSS (JSON-RPC Pub/Sub) | `wss://triport.io/ws/sol` | — |
| [Firehose (WebSocket)](./sol-stream.md) | `wss://triport.io/ws/sol-stream` | Pro |
| gRPC (Yellowstone) | `https://grpc.triport.io` | Pro |
| [Shred stream](./sol-preexec.md) | `wss://triport.io/ws/sol-preexec` | Pro |

If you want every non-vote transaction as JSON over a WebSocket with no
filters, use the [Solana Firehose](./sol-stream.md) instead. For the dashboard
view, see [Stream](../guides/stream.md).

## Endpoint

Production gRPC endpoint (URL form, used by Rust and TypeScript Yellowstone
clients):

```text
https://grpc.triport.io
```

`host:port` form, for tools and clients that take a dial target without a
scheme (grpcurl, Go, Python `grpc`):

```text
grpc.triport.io:443
```

The legacy target `triport.io:443` still works, but new integrations should
use `grpc.triport.io`.

Send your API key as gRPC metadata:

```text
x-token: $TRIPORT_API_KEY
```

`Authorization: Bearer $TRIPORT_API_KEY` is accepted by most Triport HTTP
surfaces, but native gRPC clients should prefer `x-token`.

Keys issued through the console show the public scope name
`stream.grpc.solana`. Internally this maps to the Solana Yellowstone
entitlement. Wildcard keys (`*`) also have access.

## Service

Triport supports the standard Yellowstone Geyser service:

| RPC | Use |
|---|---|
| `geyser.Geyser/GetVersion` | Connectivity and auth smoke test |
| `geyser.Geyser/Subscribe` | Streaming slots, accounts, transactions, transaction status, blocks, block metadata, and entries |

The request and update shapes are the standard Yellowstone `SubscribeRequest`
and `SubscribeUpdate` protobuf messages. If your client already works with a
Yellowstone endpoint, the production change is normally just the target host and
the auth metadata.

## Quick Check

Use `grpcurl` only if your local environment has the Yellowstone proto
descriptors available. Many public gRPC servers do not expose reflection, so a
reflection-based `grpcurl list` can fail even when `Subscribe` works.

```bash
grpcurl \
  -H "x-token: $TRIPORT_API_KEY" \
  grpc.triport.io:443 \
  geyser.Geyser/GetVersion
```

Expected result:

```json
{
  "version": "1.0"
}
```

If your tool requires URL form, use `https://grpc.triport.io`.

A reflection-only check with a valid key may show only the service descriptors
that are intentionally published:

```bash
grpcurl \
  -H "x-token: $TRIPORT_API_KEY" \
  grpc.triport.io:443 \
  list
```

Expected reflection output:

```text
grpc.health.v1.Health
grpc.reflection.v1.ServerReflection
```

Production Yellowstone clients such as geyserbench, generated Go/TypeScript
stubs, or `yellowstone-grpc-client` do not require reflection; they already know
the `geyser.Geyser/Subscribe` protobuf contract.

## Go

```go
package main

import (
	"context"
	"crypto/tls"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
)

func dialTriport(ctx context.Context, apiKey string) (*grpc.ClientConn, context.Context, error) {
	cc, err := grpc.NewClient(
		"grpc.triport.io:443",
		grpc.WithTransportCredentials(credentials.NewTLS(&tls.Config{})),
		grpc.WithDefaultCallOptions(grpc.MaxCallRecvMsgSize(64*1024*1024)),
	)
	if err != nil {
		return nil, nil, err
	}

	ctx = metadata.AppendToOutgoingContext(ctx, "x-token", apiKey)
	return cc, ctx, nil
}

// Then use your generated Yellowstone client:
//   client := geyser.NewGeyserClient(cc)
//   stream, err := client.Subscribe(ctx)
//   err = stream.Send(&geyser.SubscribeRequest{...})
//   update, err := stream.Recv()
```

## TypeScript / Node.js

```ts
import * as grpc from "@grpc/grpc-js";

// @grpc/grpc-js dials host:port; Yellowstone TS clients take "https://grpc.triport.io".
const target = "grpc.triport.io:443";

const meta = new grpc.Metadata();
meta.set("x-token", process.env.TRIPORT_API_KEY!);

const channel = new grpc.Client(
  target,
  grpc.credentials.createSsl(),
  { "grpc.max_receive_message_length": 64 * 1024 * 1024 },
);

// Use the generated Yellowstone Geyser stub from your chosen proto package:
// const stream = geyserClient.Subscribe(meta);
// stream.write({ slots: { slots: {} }, commitment: "CONFIRMED" });
```

## Python

```python
import os
import grpc

from geyser_pb2 import SubscribeRequest, SubscribeRequestFilterSlots
from geyser_pb2_grpc import GeyserStub

channel = grpc.secure_channel("grpc.triport.io:443", grpc.ssl_channel_credentials())
stub = GeyserStub(channel)

metadata = (("x-token", os.environ["TRIPORT_API_KEY"]),)

request = SubscribeRequest(
    slots={"slots": SubscribeRequestFilterSlots()},
)

def requests():
    yield request

for update in stub.Subscribe(requests(), metadata=metadata):
    print(update)
```

## Rust

```rust
use yellowstone_grpc_client::GeyserGrpcClient;
use yellowstone_grpc_proto::geyser::{
    subscribe_request_filter_slots, SubscribeRequest, SubscribeRequestFilterSlots,
};

let mut client = GeyserGrpcClient::build_from_shared("https://grpc.triport.io")?
    .x_token(Some(std::env::var("TRIPORT_API_KEY")?))?
    .connect()
    .await?;

let (mut tx, mut rx) = client.subscribe().await?;

tx.send(SubscribeRequest {
    slots: [("slots".to_string(), SubscribeRequestFilterSlots {
        filter_by_commitment: Some(true),
    })].into(),
    ..Default::default()
}).await?;

while let Some(update) = rx.message().await? {
    println!("{update:?}");
}
```

## Filters

Filters live inside `SubscribeRequest`. Common examples:

```text
# Slot updates only
slots: { slots: {} }

# Account changes for one owner/program
accounts: {
  jupiter: {
    owner: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"]
  }
}

# Non-vote, non-failed transactions touching a program/account
transactions: {
  raydium: {
    vote: false,
    failed: false,
    accountInclude: ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"]
  }
}
```

Keep filters as narrow as your application allows. Unfiltered transaction
streams are high-bandwidth and should run from backend infrastructure, not a
browser or mobile client.

## Troubleshooting

| Symptom | Meaning / fix |
|---|---|
| `Unauthenticated` / `invalid or missing token` | The gRPC route is reachable, but the API key is missing, invalid, expired, or does not have the right scope. Send `x-token` metadata and verify the key has `stream.grpc.solana` or wildcard `*`. |
| `PermissionDenied` / `scope required` | The key is valid but does not include Solana Yellowstone gRPC access. Add `stream.grpc.solana` to the key or use a tier/key that includes it. |
| `RESOURCE_EXHAUSTED` | The key reached its concurrent stream cap for the tier. Close stale streams or upgrade capacity. |
| HTTP `403` with `text/html` instead of a gRPC status | The request did not reach the Triport gRPC handler as gRPC. This usually means the edge hostname is not allowing gRPC traffic. Contact support with the timestamp, endpoint, and client region. |
| `invalid compression flag: 60` while receiving `403 Forbidden` | The client received an HTML error page (`<` is byte `60`) instead of a gRPC frame. This is an edge/proxy issue, not a Yellowstone protobuf issue. |
| `failed to query for service descriptor` | Your tool tried gRPC reflection. Use generated Yellowstone proto descriptors or a client library instead of relying on reflection. |
| Stream opens but no updates arrive | Check that your `SubscribeRequest` contains at least one filter and that the filter is not too narrow. Start with `slots` to verify the connection. |
| Stream drops under load | Apply narrower filters, increase client read throughput, and reconnect with the same `SubscribeRequest`. There is no replay buffer on live streams. |

## Notes

- Yellowstone gRPC is a Solana-only interface. Ethereum and Polygon use their
  own WebSocket/SSE surfaces.
- The Stream dashboard is diagnostic only. Do not build production ingestion on
  the browser UI.
- Treat the API key as a password. Do not put it in frontend code or public
  screenshots.
