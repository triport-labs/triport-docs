> Live version: https://triport.io/docs/ton/json-rpc

# TON JSON-RPC methods

Send every method below to `POST /rpc/ton` in a JSON-RPC 2.0 envelope. All
methods require `x-token: $TRIPORT_API_KEY`, the `ton:rpc` scope, and a by-name
`params` object. In a batch, correlate responses by `id`, not array position.

## Standard reads

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`getMasterchainInfo`](./getMasterchainInfo.md) | `ton_read_rpc` | Return the current masterchain block, state root, and zero-state ID. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getTime`](./getTime.md) | `ton_read_rpc` | Return the selected liteserver's current Unix time. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getVersion`](./getVersion.md) | `ton_read_rpc` | Return version and capability data from the selected liteserver. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Heavy reads

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`getAddressInformation`](./getAddressInformation.md) | `ton_read_rpc_heavy` | Read account balance, state, code, data, and last-transaction metadata. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getBlock`](./getBlock.md) | `ton_read_rpc_heavy` | Return a serialized block body and its full block ID. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getBlockHeader`](./getBlockHeader.md) | `ton_read_rpc_heavy` | Return block metadata and proof material without the block body. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getConfigAll`](./getConfigAll.md) | `ton_read_rpc_heavy` | Return all available configuration cells at a masterchain point. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getConfigParam`](./getConfigParam.md) | `ton_read_rpc_heavy` | Return one numbered configuration cell at a masterchain point. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getShards`](./getShards.md) | `ton_read_rpc_heavy` | Return active shardchain block IDs for a masterchain sequence. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getTransactions`](./getTransactions.md) | `ton_read_rpc_heavy` | Return account transactions newest-first with paired-cursor pagination. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`lookupBlock`](./lookupBlock.md) | `ton_read_rpc_heavy` | Resolve a block by sequence number, logical time, or Unix time. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`runGetMethod`](./runGetMethod.md) | `ton_read_rpc_heavy` | Execute a read-only contract getter with legacy stack conventions. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`runSmcMethod`](./runSmcMethod.md) | `ton_read_rpc_heavy` | Execute a read-only liteserver contract method with an explicit mode. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Network constraints

- Public HTTP gateways are not used as upstreams. TON has no REST product
  surface, write methods, or WebSocket subscriptions here.
- Accepted live fixtures mark selected BoC and proof fields as sanitized. Those
  placeholders document response shape and must not be treated as chain data.

See [TON errors](../errors.md), [TON rate limits](../rate-limits-and-tiers.md),
and the [network overview](../index.md).
