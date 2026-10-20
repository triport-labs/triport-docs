> Live version: https://triport.io/docs/polygon/json-rpc/eth_getBalance

# eth_getBalance

> Returns the native MATIC balance of an address, in wei, at a given block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getBalance` (JSON-RPC over `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst (basic 20, pro 100, business 250); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getBalance` returns the amount of wei held by a Polygon address at a
specific point in the chain's history. On Polygon this is the **native MATIC
balance** — it does not include ERC-20 token balances (including wrapped MATIC,
WMATIC), which live in their respective token contracts.

Use this method to display an account's spendable MATIC, to check a contract's
treasury, or to confirm a deposit has landed. By varying the second parameter
(the block tag) you can read the balance as of the latest block, a pending
block, the genesis block, or any historical block height.

The result is a hex-encoded `u256` string measured in wei (1 MATIC = 10¹⁸ wei).
For example, `0x21e19e0c9bab2400000` is `10000000000000000000000` wei =
**10,000 MATIC**. You are responsible for converting the hex value to a decimal
and dividing by 10¹⁸ when presenting it to users.

## Parameters

Positional params array: `[address, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (`0x`-prefixed, 20 bytes / 40 hex chars) | yes | The account address to query. |
| `block` | string | no | Block tag — `latest`, `earliest`, `pending`, or a `0x`-prefixed hex block number. Defaults to `latest` if omitted. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getBalance",
    "params": ["0x0000000000000000000000000000000000001010", "latest"]
  }'
```

The address `0x0000000000000000000000000000000000001010` is the Polygon MATIC
native precompile — a convenient, always-present target for a worked example.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x21e19e0c9bab2400000"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | Account balance in **wei** as a `0x`-prefixed hex `u256`. Divide by 10¹⁸ for MATIC. `0x21e19e0c9bab2400000` = 10,000 MATIC. |

## Errors

Errors are returned in the standard JSON-RPC envelope (`error.code` +
`error.message`, with extra fields under `error.data`). See
[errors.md](../../errors.md) for the full envelope and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's free trial period has ended; upgrade to a paid tier to continue. |
| `403` | `tier_insufficient` | Your tier is below the method's required tier. (`eth_getBalance` only needs free — this surfaces if your key is otherwise restricted.) |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier. Back off and retry; honor `error.data.retry_after_sec`. |
| `401` | `subscription_expired` | The paid subscription tied to the key has lapsed. |
| `401` | `unauthorized` | No credentials supplied, or the key is invalid or revoked. |
| HTTP `403` | `method_unknown` | The method name is not recognized on this chain. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getBalance",
    params: ["0x0000000000000000000000000000000000001010", "latest"],
  }),
});

const { result } = await res.json();
const wei = BigInt(result);
console.log(`${Number(wei) / 1e18} MATIC`); // 10000 MATIC
```

## Notes

- **Wei, not MATIC.** The result is always in wei. Use a big-integer type
  (`BigInt`, Python `int`) — a balance of a few thousand MATIC overflows the
  JavaScript safe-integer range when expressed in wei.
- **Native MATIC only.** For wrapped MATIC (WMATIC) or any ERC-20 token
  balance, call the token contract's `balanceOf` via [eth_call](./eth_call.md).
  WMATIC on Polygon mainnet lives at
  `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270`.
- **Block tags.** `pending` reflects transactions not yet mined and may change;
  `latest` is the safest default for confirmed balances. Historical hex block
  numbers let you read a balance at any past height (archive lookups).
- **Rate limits** are enforced per second per tier (no daily cap). On HTTP `429`,
  honor exponential backoff rather than retrying immediately.
