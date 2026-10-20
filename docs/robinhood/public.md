> Live version: https://triport.io/docs/robinhood/public

# Robinhood Chain public endpoint (no API key)

> Call Robinhood Chain from a browser or a script without an API key: 18 read-only JSON-RPC methods, published per-IP limits and CORS enabled.

Triport publishes a keyless endpoint for Robinhood Chain mainnet (chain ID `4663`). It exists so wallets, chain lists and first experiments can reach the network without an account. It is **not** a smaller version of the product: it serves read-only methods, has hard limits, and carries no availability commitment.

| | |
|---|---|
| **Endpoint** | `https://triport.io/rpc/robinhood/public` |
| **Transport** | JSON-RPC 2.0 over `POST`; `OPTIONS` preflight is answered |
| **Authentication** | none — a key sent here is ignored and removed from the request |
| **Browser use** | allowed: `Access-Control-Allow-Origin: *` |
| **Availability** | best-effort, no SLA; limits can change without notice |

For anything steady, use the keyed endpoint `https://triport.io/rpc/robinhood` — see the [Quickstart](./quickstart.md).

## What you can call

The public endpoint serves the 18 methods catalogued as light reads:

`eth_blockNumber`, `eth_call`, `eth_chainId`, `eth_estimateGas`, `eth_feeHistory`, `eth_gasPrice`, `eth_getBalance`, `eth_getBlockByHash`, `eth_getBlockByNumber`, `eth_getCode`, `eth_getStorageAt`, `eth_getTransactionByHash`, `eth_getTransactionCount`, `eth_getTransactionReceipt`, `eth_maxPriorityFeePerGas`, `eth_syncing`, `net_version`, `web3_clientVersion`.

The list is derived from the same method catalog that drives the keyed endpoint, so it moves with the catalog rather than with a separate hand-kept list.

## What it does not serve

| Not available here | Where it lives |
|---|---|
| `eth_getLogs`, `eth_getProof`, `eth_getBlockReceipts` | keyed endpoint — see [JSON-RPC methods](./json-rpc/index.md) |
| `debug_traceCall`, `debug_traceTransaction`, `debug_traceBlockByHash`, `debug_traceBlockByNumber` | keyed endpoint, best-effort — see [Debug and trace](./debug.md) |
| `eth_sendRawTransaction`, `eth_sendRawTransactionConditional` | keyed endpoint — see [Submission](./send.md) |
| `newHeads` / `logs` subscriptions, sequencer feed | keyed WebSocket — see [WebSocket subscriptions](./ws.md) and [Sequencer feed](./feed.md) |

A call to any of them returns HTTP 403 with a JSON-RPC error `-32601` naming the keyed URL:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"eth_getLogs is not available without a key — use https://triport.io/r/<API_KEY>/rpc/robinhood"}}
```

## Limits

| Limit | Value |
|---|---|
| Calls per IP | 60 per minute |
| Calls across all clients | 50 per second |
| Batch elements | 5 per request (each element counts as one call) |
| Request body | 64 KiB |

A batch of five calls costs five calls, exactly as on the keyed endpoint. Exceeding a limit returns HTTP 429 with a `Retry-After` header; an oversized body or batch returns HTTP 413. These numbers are operational defaults for a free shared surface, not a measurement of upstream capacity, and they are deliberately far below any paid plan — see [Limits](./limits.md) for the per-plan rates.

## First call

```bash
curl https://triport.io/rpc/robinhood/public \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
```

```json
{"jsonrpc":"2.0","id":1,"result":"0x1237"}
```

`0x1237` is 4663 — mainnet. Wallets reject a network whose `eth_chainId` disagrees with the configured chain ID, so this is the first thing to check when adding the network by hand.

## Adding the network to a wallet

Use RPC URL `https://triport.io/rpc/robinhood/public`, chain ID `4663`, currency symbol `ETH`. A wallet configured this way can read balances and submit nothing: sends are refused, so sign-and-send flows need the keyed URL from the [Quickstart](./quickstart.md).

## When to move to a key

- Your traffic is regular rather than occasional, and 60 calls per minute is a ceiling you actually meet.
- You need logs, receipts, proofs or `debug_*`.
- You need to submit transactions.
- You need subscriptions or the sequencer feed instead of polling.
- You want limits you can plan against, published per plan, instead of a shared free ceiling.

## Notes

- The testnet (chain ID `46630`) is not proxied by Triport, on this endpoint or any other.
- Sending `x-token`, `Authorization` or `?api-key=` to this URL does nothing: the credential is stripped before the request is served, and it is never authenticated. Use the keyed endpoint if you want your plan's limits.
- Error shapes, batch accounting and the 4 MiB body ceiling of the keyed endpoint are documented in [Limits](./limits.md) and [Errors](./errors.md).
