> Live version: https://triport.io/docs/robinhood

# Robinhood Chain RPC & APIs

Robinhood Chain is an EVM-compatible Orbit L2. Triport publishes the measured mainnet surface for chain ID `4663` (`0x1237`): 27 catalogued JSON-RPC methods, two JSON-RPC WebSocket subscriptions, and a separate live sequencer feed.

| Method / Endpoint | Network | Chain ID | Authentication | Required scope | Tier / rate limit |
|---|---|---:|---|---|---|
| `POST https://triport.io/rpc/robinhood` | Robinhood Chain mainnet | `4663` | `x-token: $TRIPORT_API_KEY` | `robinhood:rpc` | Category-specific RPS; see [Limits](./index.md#limits) |

## Endpoints

| Surface | Endpoint | Reference |
|---|---|---|
| HTTPS | `https://triport.io/rpc/robinhood` | Backend path `/rpc/robinhood` |
| WSS | `wss://triport.io/ws/robinhood` | Registry path `/ws/robinhood` |
| WSS | `wss://triport.io/ws/robinhood-feed` | Pro+; robinhood:feed scope |
| Stream contract | robinhood feed | [AsyncAPI](https://triport.io/api-specs/streaming/robinhood-feed.asyncapi.yaml) |
| Stream contract | robinhood ws | [AsyncAPI](https://triport.io/api-specs/streaming/robinhood-ws.asyncapi.yaml) |

## Quickstart

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

## What's available

**27 JSON-RPC methods** in the OpenRPC catalog:

- `robinhood_read_rpc_heavy`: 7
- `robinhood_read_rpc`: 18
- `robinhood_send_tx`: 2

Account and pending-state reads, block receipts, logs, proofs, four debug methods, and both standard and conditional transaction submission are available through the published catalog. WebSocket subscriptions start at Basic; the live sequencer feed starts at Pro.

The fast path combines a continuously warm earliest-wins receive fan with warm HTTP/WebSocket submission targets; measured latency claims and their limits are documented in [Sequencer feed](./feed.md) and [Fast submission](./send.md).

## Limits

See [network limits](./limits.md) and [Rate Limits & Tiers](../rate-limits-and-tiers.md).

Finite request-rate budgets include a 2× burst buffer at no extra cost. It refills at sustained RPS; there is no quota on the number of bursts. Interval categories use seconds and have no RPS burst. See [Burst capacity](../rate-limits-and-tiers.md#burst-capacity).

| Category | Free | Basic | Pro | Business | Enterprise |
|---|---:|---:|---:|---:|---:|
| `robinhood_read_rpc` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `robinhood_read_rpc_heavy` | 15 RPS sustained · up to 30 burst | 20 RPS sustained · up to 40 burst | 100 RPS sustained · up to 200 burst | 250 RPS sustained · up to 500 burst | unlimited |
| `robinhood_send_tx` | 3 RPS sustained · up to 6 burst | 5 RPS sustained · up to 10 burst | 30 RPS sustained · up to 60 burst | 80 RPS sustained · up to 160 burst | unlimited |

For indexed wallet activity, see [address-history availability](./address-history.md). A complete address-history API is not currently published for Robinhood.

## Errors

See [network-specific errors](./errors.md) and the [shared error reference](../errors.md).

## Methods

### robinhood read rpc heavy (7)

- [`debug_traceBlockByHash`](./json-rpc/debug_traceBlockByHash.md)
- [`debug_traceBlockByNumber`](./json-rpc/debug_traceBlockByNumber.md)
- [`debug_traceCall`](./json-rpc/debug_traceCall.md)
- [`debug_traceTransaction`](./json-rpc/debug_traceTransaction.md)
- [`eth_getBlockReceipts`](./json-rpc/eth_getBlockReceipts.md)
- [`eth_getLogs`](./json-rpc/eth_getLogs.md)
- [`eth_getProof`](./json-rpc/eth_getProof.md)

### robinhood read rpc (18)

- [`eth_blockNumber`](./json-rpc/eth_blockNumber.md)
- [`eth_call`](./json-rpc/eth_call.md)
- [`eth_chainId`](./json-rpc/eth_chainId.md)
- [`eth_estimateGas`](./json-rpc/eth_estimateGas.md)
- [`eth_feeHistory`](./json-rpc/eth_feeHistory.md)
- [`eth_gasPrice`](./json-rpc/eth_gasPrice.md)
- [`eth_getBalance`](./json-rpc/eth_getBalance.md)
- [`eth_getBlockByHash`](./json-rpc/eth_getBlockByHash.md)
- [`eth_getBlockByNumber`](./json-rpc/eth_getBlockByNumber.md)
- [`eth_getCode`](./json-rpc/eth_getCode.md)
- [`eth_getStorageAt`](./json-rpc/eth_getStorageAt.md)
- [`eth_getTransactionByHash`](./json-rpc/eth_getTransactionByHash.md)
- [`eth_getTransactionCount`](./json-rpc/eth_getTransactionCount.md)
- [`eth_getTransactionReceipt`](./json-rpc/eth_getTransactionReceipt.md)
- [`eth_maxPriorityFeePerGas`](./json-rpc/eth_maxPriorityFeePerGas.md)
- [`eth_syncing`](./json-rpc/eth_syncing.md)
- [`net_version`](./json-rpc/net_version.md)
- [`web3_clientVersion`](./json-rpc/web3_clientVersion.md)

### robinhood send tx (2)

- [`eth_sendRawTransaction`](./json-rpc/eth_sendRawTransaction.md)
- [`eth_sendRawTransactionConditional`](./json-rpc/eth_sendRawTransactionConditional.md)

## Streams

- [robinhood feed](https://triport.io/api-specs/streaming/robinhood-feed.asyncapi.yaml)
- [robinhood ws](https://triport.io/api-specs/streaming/robinhood-ws.asyncapi.yaml)

## SDK

The generated TypeScript client includes this network:

```ts
const result = await c.robinhood.call("eth_blockNumber", []);
```

Equivalent requests can be made with the Python SDK or the curl example above.

## Related

- [Getting started](../getting-started.md)
- [Authentication](../authentication.md)
- [Rate Limits & Tiers](../rate-limits-and-tiers.md)
- [All JSON-RPC methods](./json-rpc/index.md)
- [Streaming overview](../streaming/index.md)

- [Quickstart](./quickstart.md)
- [Public endpoint, no API key](./public.md) — 18 read-only methods on a shared, best-effort surface
- [Guides](./guides/index.md)
- [Fast submission](./send.md)
- [Conditional submission](./conditional.md)
- [Pending data](./pending.md)
- [WebSocket subscriptions](./ws.md)
- [Sequencer feed](./feed.md)
- [Getting ETH for gas](./gas.md)
- [External ecosystem](./ecosystem.md)
- [RPC behavior and measurements](./rpc-behavior.md)

The OpenRPC document and methods catalog define the RPC contract. Pages in this guide are generated and checked for exact method-set equality with that catalog.

## Pages in this section

- [Robinhood archive depth](./archive.md)
- [Robinhood debug and trace methods](./debug.md)
- [Robinhood feed reconciliation](./feed/reconciliation.md)
- [Robinhood feed resume](./feed/resume.md)
- [Robinhood logs subscription](./ws/logs.md)
- [Robinhood newHeads subscription](./ws/newHeads.md)
