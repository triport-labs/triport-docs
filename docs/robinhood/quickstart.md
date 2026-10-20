> Live version: https://triport.io/docs/robinhood/quickstart

# Robinhood Chain quickstart

> Connect to Robinhood Chain mainnet (chain ID 4663) in five minutes: one keyed endpoint for JSON-RPC, viem, ethers, Hardhat, Foundry and MetaMask.

Robinhood Chain is an EVM-compatible Arbitrum Orbit L2 that pays gas in ETH. Mainnet is chain ID `4663` (`0x1237`). A public testnet with chain ID `46630` exists, but Triport does not proxy it.

| | |
|---|---|
| **HTTPS endpoint** | `https://triport.io/rpc/robinhood` |
| **WebSocket endpoint** | `wss://triport.io/ws/robinhood` (from Basic) |
| **Sequencer feed** | `wss://triport.io/ws/robinhood-feed` (from Pro) |
| **Authentication** | `x-token: $TRIPORT_API_KEY` header; `Authorization: Bearer` is also accepted |
| **Required scope** | `robinhood:rpc` (the feed needs `robinhood:feed`) |

Create a key in the console first — see [Authentication](../authentication.md) and [Getting started](../getting-started.md).

## 1. First call

```bash
curl https://triport.io/rpc/robinhood \
  -H "x-token: $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

A successful reply is a JSON-RPC envelope with a hex quantity:

```json
{"jsonrpc":"2.0","id":1,"result":"0x1f4a2c"}
```

`eth_chainId` returns `0x1237`; use it to confirm you reached mainnet.

### If the call fails

Two different layers can reject the same request, and they do not look alike. Branch on the **shape of the body**, not on the HTTP status alone.

**Refused before the RPC layer** — an unknown key, an insufficient plan, an exhausted budget or an oversized batch. The body is a flat object with a string `error` and **no `jsonrpc` field**:

```json
{"error":"unauthorized","message":"Missing or unknown API key"}
```

You will see `401` `unauthorized`, `403` `tier_insufficient` (which also sends an `X-Required-Tier` header), `429` `rate_limited` (with `Retry-After` and `X-RateLimit-Reset`; the body repeats the wait as `retry_after_sec`) and `413` `batch_too_large` — on this network the inspected body ceiling is 4 MiB, see [Limits](./limits.md).

**Rejected by the RPC layer** — the body is a normal JSON-RPC envelope. Here the HTTP status is **not always `200`**, so a client that switches on the status alone will misread these replies:

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"method not found"}}
```

That envelope arrives with `404` for a method outside the catalogued surface or a mistyped path, `400` with `-32700` or `-32600` for malformed JSON or a malformed request, `405` with `-32600` for any verb other than `POST`, and `503` with `-32000` when the request deadline passes. An envelope with `200` means the call reached a channel and was rejected there — that is the case the [Errors](./errors.md) table covers, including upstream codes such as `-32029` and `35`.

A request sent without an `id` is a notification: the reply is `204 No Content` with an empty body, which is success, not failure.

## 2. Keys in URLs vs headers

Wallets, `hardhat.config`, `foundry.toml` and most SDK constructors cannot send a custom header, so they use the keyed URL form:

```text
https://triport.io/r/<API_KEY>/robinhood
wss://triport.io/ws/robinhood/<API_KEY>
```

Server-side code should send the `x-token` header instead. Keep keyed URLs out of logs, screenshots and bug reports — the key is the credential.

## 3. Wallets (MetaMask)

Add a custom network with these values: network name `Robinhood Chain`, RPC URL `https://triport.io/r/<API_KEY>/robinhood`, chain ID `4663`, currency symbol `ETH`. Wallets reject a network whose `eth_chainId` disagrees with the configured chain ID, so verify step 1 first.

## 4. viem

```ts
import { createPublicClient, defineChain, http } from "viem";

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://triport.io/rpc/robinhood"] } },
});

const client = createPublicClient({
  chain: robinhood,
  transport: http(undefined, { fetchOptions: { headers: { "x-token": process.env.TRIPORT_API_KEY! } } }),
});

await client.getBlockNumber();
```

## 5. ethers v6

```ts
import { FetchRequest, JsonRpcProvider } from "ethers";

const request = new FetchRequest("https://triport.io/rpc/robinhood");
request.setHeader("x-token", process.env.TRIPORT_API_KEY!);
const provider = new JsonRpcProvider(request, 4663);

await provider.getBlockNumber();
```

## 6. Hardhat and Foundry

```ts
// hardhat.config.ts
networks: {
  robinhood: { url: `https://triport.io/r/${process.env.TRIPORT_API_KEY}/rpc/robinhood`, chainId: 4663 },
}
```

```toml
# foundry.toml
[rpc_endpoints]
robinhood = "https://triport.io/r/${TRIPORT_API_KEY}/rpc/robinhood"
```

## 7. What to read next

- [JSON-RPC methods](./json-rpc/index.md) — the catalogued surface, including block receipts, proofs and four best-effort `debug_*` methods.
- [WebSocket subscriptions](./ws.md) — `newHeads` and `logs` from Basic.
- [Sequencer feed](./feed.md) — assembled L2 blocks with cursor resume, from Pro.
- [Limits](./limits.md) — per-plan request rates, the 4 MiB body ceiling and batch accounting.
- [Submission](./send.md) — the route is implemented; acceptance of a valid transaction is not yet verified.
- [Errors](./errors.md) — what the product returns and how to react.
