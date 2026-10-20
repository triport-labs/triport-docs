> Live version: https://triport.io/docs/polygon/json-rpc/eth_getStorageAt

# eth_getStorageAt

> Returns the raw 32-byte value stored at a given storage slot of a contract on Polygon, at a specific block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getStorageAt` (JSON-RPC over `POST /polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free — 15 RPS sustained · up to 30 burst (basic 20, pro 100, business 250); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getStorageAt` reads a single 32-byte word directly out of a contract's
storage trie on Polygon. Every smart contract has a flat key→value storage space
indexed by 256-bit slot numbers; this method returns the raw value at one slot,
exactly as the EVM sees it, as a `0x`-prefixed 32-byte hex string.

Use it to inspect contract state that no public getter exposes — for example,
detecting and reading a proxy's implementation slot (EIP-1967), reading a
token's packed balance/total state, or any internal variable once you have
computed its slot. By varying the third parameter (the block tag) you can read
the slot as of the latest block, a pending block, or any historical block
height.

You are responsible for knowing the storage layout of the contract you query.
Solidity assigns simple state variables to sequential slots starting at `0`,
while mapping and dynamic-array entries live at slots derived with `keccak256`.
The method does no decoding: a slot that has never been written returns
all-zeroes (`0x0000…0000`).

## Parameters

Positional params array: `[address, storageSlot, blockTag]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (`0x`-prefixed, 20 bytes / 40 hex chars) | yes | The contract address whose storage you are reading. |
| `storageSlot` | string (`0x`-prefixed hex, up to 32 bytes) | yes | The storage slot (position) to read, as a hex quantity. |
| `blockTag` | string | no | Block tag — `latest`, `earliest`, `pending`, or a `0x`-prefixed hex block number. Defaults to `latest` if omitted. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getStorageAt",
    "params": [
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bba",
      "latest"
    ]
  }'
```

The slot above is the EIP-1967 implementation pointer — reading it on a proxy
contract returns the current implementation address (left-padded into 32 bytes).

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x000000000000000000000000a3f7bf5b0fa93176c260bba57cee85525de2baf9"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The 32-byte value at the requested slot, as a `0x`-prefixed hex string. Always 66 characters (`0x` + 64 hex digits). An unset slot returns all-zeroes. For an address-valued slot (such as an EIP-1967 pointer), the address is the lowest 20 bytes. |

## Errors

Errors are returned in the standard JSON-RPC envelope (`error.code` +
`error.message`, with extra fields under `error.data`). See
[errors.md](../../errors.md) for the full envelope and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's free trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier (free 15 RPS sustained · up to 30 burst). Honor `Retry-After` and back off. |
| HTTP `403` | `method_unknown` | The method is not recognised on the `polygon` chain. |

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
    method: "eth_getStorageAt",
    params: [
      "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bba",
      "latest",
    ],
  }),
});

const { result } = await res.json();
console.log(result);                      // 0x0000...baf9
console.log("0x" + result.slice(-40));    // implementation address
```

## Notes

- **Proxy detection (EIP-1967).** Polygon hosts many upgradeable proxy
  contracts (USDC.e, bridged assets, DeFi pools). Read slot
  `0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bba` — a
  non-zero result means the address is a proxy whose implementation lives in the
  lowest 20 bytes. Some older proxies instead keep the implementation at slot
  `0x0`.
- **You must compute mapping/array slots yourself.** For a
  `mapping(address => uint)` at declared slot `p`, the entry for key `k` lives at
  `keccak256(abi.encode(k, p))` — this is how you read an ERC-20 balance
  manually. Dynamic-array data starts at `keccak256(p)`. Simple variables occupy
  slots `0, 1, 2, …` in declaration order, with several small variables packed
  into one 32-byte slot.
- **Raw bytes, no decoding.** The result is always 32 bytes. Interpret it
  yourself — as a `uint256`, an address (lowest 20 bytes), a `bool`, or packed
  fields — based on the contract's storage layout.
- **Block tags.** `pending` reflects not-yet-mined state and may change;
  `latest` is the safest default. A `0x`-prefixed hex block number reads
  historical storage (archive lookups).
- **Related methods.** To read return values of view functions instead of raw
  storage, call [eth_call](./eth_call.md). To fetch a contract's bytecode, use
  [eth_getCode](./eth_getCode.md); pairing it with `eth_getStorageAt` at slot
  `0x0` is a common proxy-unwrap pattern.
- **Rate limits** are enforced per second per tier (no daily cap). On HTTP `429`,
  honor the `Retry-After` header and use exponential backoff rather than
  retrying immediately.
