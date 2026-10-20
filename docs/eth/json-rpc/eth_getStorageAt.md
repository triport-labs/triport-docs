> Live version: https://triport.io/docs/eth/json-rpc/eth_getStorageAt

# eth_getStorageAt

> Returns the 32-byte value stored at a given storage slot of a contract, at a specific block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getStorageAt` (JSON-RPC over `POST /`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst (basic 20, pro 100, business 250); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getStorageAt` reads a single 32-byte word directly out of a contract's
storage trie. Every smart contract has a flat key→value storage space indexed
by 256-bit slot numbers; this method returns the raw value at one slot, exactly
as the EVM sees it, as a `0x`-prefixed 32-byte hex string.

Use it to inspect contract state that is not exposed by a public getter — for
example, reading a proxy's implementation slot, a token's packed balance/total
state, or any internal variable when you have computed its slot. By varying the
third parameter (the block tag) you can read the slot as of the latest block,
a pending block, or any historical block height.

You are responsible for knowing the layout of the contract you are querying.
Solidity assigns simple state variables to sequential slots starting at `0`,
while mapping and dynamic-array entries live at slots derived with `keccak256`.
The method does no decoding: a slot that has never been written returns
all-zeroes (`0x0000…0000`).

## Parameters

Positional params array: `[address, slot, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (`0x`-prefixed, 20 bytes / 40 hex chars) | yes | The contract address whose storage you are reading. |
| `slot` | string (`0x`-prefixed hex, up to 32 bytes) | yes | The storage slot (position) to read, as a hex quantity. |
| `block` | string | no | Block tag — `latest`, `earliest`, `pending`, or a `0x`-prefixed hex block number. Defaults to `latest` if omitted. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getStorageAt",
    "params": [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0x0",
      "latest"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0000000000000000000000000000000000000000000000000000000000000001"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The 32-byte value at the requested slot, as a `0x`-prefixed hex string. Always 66 characters (`0x` + 64 hex digits). An unset slot returns all-zeroes. |

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
    method: "eth_getStorageAt",
    params: [
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "0x0",
      "latest",
    ],
  }),
});

const { result } = await res.json();
console.log(result);            // 0x0000...0001
console.log(BigInt(result));    // 1n
```

## Notes

- **You must compute the slot yourself.** For a `mapping(address => uint)` at
  declared slot `p`, the entry for key `k` lives at
  `keccak256(abi.encode(k, p))`. For dynamic arrays the data starts at
  `keccak256(p)`. Simple variables occupy slots `0, 1, 2, …` in declaration
  order, with several small variables packed into one 32-byte slot.
- **Raw bytes, no decoding.** The result is always 32 bytes. Interpret it
  yourself — as a `uint256`, an address (lowest 20 bytes), a `bool`, or packed
  fields — based on the contract's storage layout.
- **Block tags.** `pending` reflects not-yet-mined state and may change;
  `latest` is the safest default. A `0x`-prefixed hex block number reads
  historical storage (archive lookups).
- **Proxy contracts.** EIP-1967 proxies keep the implementation address at slot
  `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bba`.
- **Related methods.** To read return values of view functions instead of raw
  storage, call [eth_call](./eth_call.md). To fetch a contract's bytecode, use
  `eth_getCode`.
- **Rate limits** are enforced per second per tier (no daily cap). On HTTP `429`,
  honor exponential backoff rather than retrying immediately.
