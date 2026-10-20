> Live version: https://triport.io/docs/eth/json-rpc/eth_call

# eth_call

> Executes a read-only message call against the EVM at a chosen block, without creating, signing, or broadcasting a transaction.

| | |
|---|---|
| **Method / Endpoint** | `eth_call` (JSON-RPC, `POST /v1/ethereum`) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst · basic — 20 RPS sustained · up to 40 burst · pro — 100 RPS sustained · up to 200 burst · business — 250 RPS sustained · up to 500 burst; [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_call` runs a contract message call in the context of the current EVM state
(or a historical block) and returns whatever the call would have returned, as
hex-encoded data. Nothing is mined: there is no transaction, no signature, no
gas is spent, and no state change is persisted. It is the workhorse for reading
on-chain data — token balances, allowances, pool reserves, the output of any
`view`/`pure` function, or a dry-run of a state-changing function to preview its
return value or revert reason.

Because the call is simulated, `from` is optional and may be any address; supply
it only when the target contract's logic depends on `msg.sender`. The second
parameter selects the block at which state is read — pass `"latest"` for current
state, a hex block number for a historical read, or a tag like `"pending"`,
`"safe"`, or `"finalized"`.

If the underlying call reverts, the request returns a JSON-RPC error (code `3`,
"execution reverted") rather than a result; decode the `data` field to recover
the revert reason. For gas estimation use `eth_estimateGas` instead.

## Parameters

Positional params array: `[transaction, blockParameter]`.

### 1. `transaction` (object, required)

| Name | Type | Required | Description |
|---|---|---|---|
| `to` | string (20-byte hex address) | yes | Address of the contract being called. |
| `data` | string (hex) | no | ABI-encoded function selector + arguments. Omitting it calls the contract's fallback/receive. |
| `from` | string (20-byte hex address) | no | Address the call is made from (`msg.sender`). Defaults to the zero address. |
| `gas` | string (hex) | no | Gas cap for the simulated execution. Defaults to a node-side maximum. |
| `gasPrice` | string (hex) | no | Gas price used during simulation. |
| `value` | string (hex) | no | Wei sent with the call (`msg.value`). |

### 2. `blockParameter` (string, required)

| Value | Description |
|---|---|
| `"latest"` | Most recent block (typical choice). |
| `"pending"` | Pending state, including not-yet-mined transactions. |
| `"safe"` / `"finalized"` | Latest safe / finalized block. |
| `"earliest"` | Genesis block. |
| `"0x..."` | A specific block number in hex. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_call",
    "params": [
      {
        "to": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "data": "0x70a08231000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b"
      },
      "latest"
    ]
  }'
```

The `data` above is `balanceOf(address)` (selector `0x70a08231`) for the USDT
contract, querying the balance of `0xab58…ec9b`.

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x00000000000000000000000000000000000000000000000000000002540be400"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | string (hex) | ABI-encoded return data of the call. `"0x"` if the function returns nothing. Decode against the function's return ABI (here, `0x…2540be400` = `10000000000` = 10,000 USDT at 6 decimals). |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | Per-tier RPS limit exceeded (10 / 20 / 100 / 250 RPS sustained · short burst 20 / 40 / 200 / 500 for free / basic / pro / business). Retry after backing off. |
| `-32602` | Invalid params | Malformed transaction object, bad address, or missing block parameter. |
| `3` | Execution reverted | The simulated call reverted; the `error.data` field holds the ABI-encoded revert reason. |

Every error follows the shared JSON-RPC error envelope — see
[Errors](../../errors.md) for the full structure and handling guidance.

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
    method: "eth_call",
    params: [
      {
        to: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        data: "0x70a08231000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b",
      },
      "latest",
    ],
  }),
});

const { result } = await res.json();
console.log(BigInt(result).toString()); // raw balance
```

## Notes

- **No gas is spent.** `eth_call` never costs ETH and never alters state; it only
  reads. To get the gas a real transaction would use, call `eth_estimateGas`.
- **Reverts vs. results.** A reverting call returns a JSON-RPC error (code `3`),
  not an empty result. Always check for `error` before decoding `result`.
- **Historical reads.** Passing a hex block number reads state as of that block,
  subject to the node's archive depth.
- **`from` matters only for permissioned logic.** Set it when the contract gates
  behavior on `msg.sender`; otherwise it can be omitted.
- **Related methods:** [`eth_estimateGas`](./eth_estimateGas.md),
  [`eth_getBalance`](./eth_getBalance.md), [`eth_getCode`](./eth_getCode.md).
- **Result is `0x`?** Usually no contract code at that address and block — see
  [why eth_call returns 0x](https://triport.io/learn/eth-call-returns-0x).
