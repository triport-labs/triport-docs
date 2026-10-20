> Live version: https://triport.io/docs/stellar

# Stellar RPC & APIs

Stellar combines 10 read-only Soroban JSON-RPC methods with 11 Horizon REST GET operations and two Horizon SSE channels.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/rpc/stellar` | Stellar mainnet | — | `x-token: $TRIPORT_API_KEY` | `stellar:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/rpc/stellar` | Horizon SSE: /rpc/stellar/horizon/{ledgers|transactions}?cursor=now |
| REST | Product routes | [REST catalog](./rest/index.md) |
| Stream contract | stellar sse | [AsyncAPI](https://triport.io/api-specs/streaming/stellar-sse.asyncapi.yaml) |

## Quickstart

```bash
curl https://triport.io/rpc/stellar \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getEvents","params":{}}'
```

## What's available

**10 JSON-RPC methods** in the OpenRPC catalog:

- `stellar_read_rpc_heavy`: 2
- `stellar_read_rpc`: 8

Soroban and Horizon reads are subject to retention limits. Horizon is a best-effort service without an SLA. SSE delivers only new records with `cursor=now`; HAL `_links` and `_embedded` fields are unchanged. See the error reference for requests beyond retained history.

## Limits

See [network limits](./rate-limits-and-tiers.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `stellar_read_rpc` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `stellar_read_rpc_heavy` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |

Horizon `limit`, Soroban `getLedgers`, and Soroban `getTransactions` accept at most 200 items.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

A deeper Horizon read returns HTTP `410` / `beyond_retention`; Soroban uses `-32602` with `beyond_retention` and `oldest N`. These identify the current retention boundary, not a service failure.

## Methods

### stellar read rpc heavy (2)

- [`getEvents`](./json-rpc/getEvents.md)
- [`getTransactions`](./json-rpc/getTransactions.md)

### stellar read rpc (8)

- [`getFeeStats`](./json-rpc/getFeeStats.md)
- [`getHealth`](./json-rpc/getHealth.md)
- [`getLatestLedger`](./json-rpc/getLatestLedger.md)
- [`getLedgerEntries`](./json-rpc/getLedgerEntries.md)
- [`getLedgers`](./json-rpc/getLedgers.md)
- [`getNetwork`](./json-rpc/getNetwork.md)
- [`getVersionInfo`](./json-rpc/getVersionInfo.md)
- [`simulateTransaction`](./json-rpc/simulateTransaction.md)

## Streams

- [stellar sse](https://triport.io/api-specs/streaming/stellar-sse.asyncapi.yaml)

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.stellar.call("getEvents", {});
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
- [REST API](./rest/index.md)
- [Streaming overview](../streaming/index.md)

## Pages in this section

- [Stellar guides](./guides/index.md)
- [Horizon SSE](./streams/sse.md)
