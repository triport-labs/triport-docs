> Live version: https://triport.io/docs/tron/wallet

# Tron wallet HTTP methods

Send wallet requests to `POST /rpc/tron/wallet/<name>`. All operations require
`x-token: $TRIPORT_API_KEY` and the `tron:rpc` scope. Block values are decimal
JSON integers. Addresses default to hex-41; Base58 requires `visible: true`.

## Blocks

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`getnowblock`](./getnowblock.md) | `tron_read_rpc` | Return the current solid block. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getblockbylatestnum`](./getblockbylatestnum.md) | `tron_read_rpc` | Return a count of recent included blocks. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getblockbynum`](./getblockbynum.md) | `tron_read_rpc_heavy` | Return a native block by decimal height. | free+; 2 / 5 / 20 / 80 RPS sustained · short burst 4 / 10 / 40 / 160 (default, unmeasured) |

## Chain and account state

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`getaccount`](./getaccount.md) | `tron_read_rpc` | Return current native account state. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getchainparameters`](./getchainparameters.md) | `tron_read_rpc` | Return current native chain parameters. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getcontractinfo`](./getcontractinfo.md) | `tron_read_rpc` | Return native contract metadata. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getenergyprices`](./getenergyprices.md) | `tron_read_rpc` | Return native energy price changes. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getnextmaintenancetime`](./getnextmaintenancetime.md) | `tron_read_rpc` | Return the next maintenance boundary. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`getnodeinfo`](./getnodeinfo.md) | `tron_read_rpc` | Return public status for the selected node. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`listwitnesses`](./listwitnesses.md) | `tron_read_rpc` | Return the native witness inventory. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |
| [`triggerconstantcontract`](./triggerconstantcontract.md) | `tron_read_rpc_heavy` | Execute a read-only native contract call. | free+; 2 / 5 / 20 / 80 RPS sustained · short burst 4 / 10 / 40 / 160 (default, unmeasured) |

## Confirmed execution

| Method | Category | Summary | Tier / rate limit |
|---|---|---|---|
| [`gettransactioninfobyid`](./gettransactioninfobyid.md) | `tron_read_rpc` | Return confirmed transaction execution information. | free+; 15 / 20 / 100 / 250 RPS sustained · short burst 30 / 40 / 200 / 500 (default, unmeasured) |

## Network constraints

- No public wallet mempool, pending queue, or WebSocket surface is published.
- The OpenAPI response schema is intentionally extensible and contains no
  concrete response examples; method pages mark response fields as unknown.
- TRC20 event-oriented REST access belongs to the separate REST layer.

See [Tron errors](../errors.md), [Tron limits](../limits.md), and the
[EVM JSON-RPC methods](../json-rpc/index.md).
