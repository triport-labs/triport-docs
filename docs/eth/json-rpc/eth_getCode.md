> Live version: https://triport.io/docs/eth/json-rpc/eth_getCode

# eth_getCode

> Returns the deployed bytecode stored at an address at a given block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getCode` (JSON-RPC over `POST /`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst (basic 20, pro 100, business 250); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getCode` returns the compiled EVM bytecode deployed at an address, as a
`0x`-prefixed hex string, as of a specific block. This is the code that actually
runs when the contract is called — not the source, the ABI, or the constructor
("init") code, but the runtime bytecode persisted on chain.

Use it to tell a contract apart from an externally-owned account (EOA), to fetch
the on-chain bytecode for verification or disassembly, or to confirm that a
deployment landed at the expected address before you start calling it.

The key behaviour to plan for: **an empty result is `0x`.** A plain wallet
(EOA), an address that has never been deployed to, and a contract that hasn't
been deployed *yet at the queried block* all return `0x`. Code presence is
therefore the reliable "is this a contract?" check — `result !== "0x"` means
bytecode exists at that address at that block.

## Parameters

Positional params array: `[address, block]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (`0x`-prefixed, 20 bytes / 40 hex chars) | yes | The address whose code you want to read. |
| `block` | string | no | Block tag — `latest`, `earliest`, `pending`, or a `0x`-prefixed hex block number. Defaults to `latest` if omitted. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getCode",
    "params": ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "latest"]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x60806040523661001357610011610017565b005b6100115b610027610022610067565b610100565b565b..."
}
```

For an EOA or an address with no deployed code, the result is empty:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The deployed runtime bytecode at `address`, as a `0x`-prefixed hex string. `0x` (empty) for EOAs, never-deployed addresses, and contracts not yet deployed at the queried block. |

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
    method: "eth_getCode",
    params: ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "latest"],
  }),
});

const { result } = await res.json();
const isContract = result !== "0x";
console.log(isContract ? "contract" : "EOA / no code");
```

## Notes

- **`0x` is the empty answer.** EOAs, never-deployed addresses, and contracts
  that don't exist *yet at the queried block* all return `0x`. Treat
  `result !== "0x"` as the canonical "this is a contract" test.
- **Runtime code, not init code.** You get the bytecode persisted on chain, not
  the constructor/deployment bytecode and not the Solidity source. There is no
  ABI here — pair it with [eth_call](./eth_call.md) to actually invoke functions.
- **Block matters for proxies and self-destructs.** Code at an address can
  appear or disappear over time (counterfactual/CREATE2 deployments, historical
  `SELFDESTRUCT`). Pin a `block` hex height for reproducible historical reads
  instead of relying on `latest`.
- **Rate limits** are enforced per second per tier (no daily cap). On HTTP `429`,
  honor exponential backoff rather than retrying immediately.
