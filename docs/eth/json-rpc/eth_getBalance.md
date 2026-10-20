> Live version: https://triport.io/docs/eth/json-rpc/eth_getBalance

# eth_getBalance

> Returns the native ETH balance of an account, in wei, at a given block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBalance` (JSON-RPC over `POST /`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst (basic 20, pro 100, business 250); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBalance` returns the amount of wei held by an Ethereum address at a
specific point in the chain's history. The balance is the native ETH balance
only — it does not include ERC-20 token balances, which live in their
respective token contracts.

Use this method to display an account's spendable ETH, to check a contract's
treasury, or to confirm a deposit has landed. By varying the second parameter
(the block tag) you can read the balance as of the latest block, a pending
block, the genesis block, or any historical block height.

The result is a hex-encoded `u256` string measured in wei (1 ETH = 10¹⁸ wei).
For example, `0x1bc16d674ec80000` is `2000000000000000000` wei = **2 ETH**.
You are responsible for converting the hex value to a decimal and dividing by
10¹⁸ when presenting it to users.

## Parameters

Positional params array: `[address, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (`0x`-prefixed, 20 bytes / 40 hex chars) | yes | The account address to query. |
| `block` | string | no | Block tag — `latest`, `earliest`, `pending`, or a `0x`-prefixed hex block number. Defaults to `latest` if omitted. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBalance",
    "params": ["0x742d35Cc6634C0532925a3b844Bc9e7595f06b8b", "latest"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1bc16d674ec80000"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Account balance in **wei** as a `0x`-prefixed hex `u256`. Divide by 10¹⁸ for ETH. `0x1bc16d674ec80000` = 2 ETH. |

## Errors

Errors are returned in the standard JSON-RPC envelope (`error.code` +
`error.message`). See [errors.md](../../errors.md) for the full envelope and
shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/eth", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: ["0x742d35Cc6634C0532925a3b844Bc9e7595f06b8b", "latest"],
  }),
});

const { result } = await res.json();
const wei = BigInt(result);
console.log(`${Number(wei) / 1e18} ETH`); // 2 ETH
```

## Notes

- **Wei, not ETH.** The result is always in wei. Use a big-integer type
  (`BigInt`, Python `int`) — a 2 ETH balance overflows the JavaScript safe
  integer range when expressed in wei.
- **Block tags.** `pending` reflects transactions not yet mined and may change;
  `latest` is the safest default for confirmed balances. Historical hex block
  numbers let you reconstruct a balance at any past height (archive lookups).
- **Native balance only.** For ERC-20 token balances, call the token
  contract's `balanceOf` via [eth_call](./eth_call.md).
- **Rate limits** are enforced per second per tier (no daily cap). On HTTP `429`,
  honor exponential backoff rather than retrying immediately.
