> Live version: https://triport.io/docs/polygon/json-rpc/eth_call

# eth_call

> Executes a read-only smart-contract call against the current (or a historical) Polygon state, returning the raw result without creating a transaction or spending gas.

| | |
|---|---|
| **Method / Endpoint** | `eth_call` |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | Free trial (7 days) and up — free 15 rps · basic 20 rps · pro 100 rps · business 250 rps |

## Description

`eth_call` runs a message call locally on a Polygon node and returns whatever
the contract's code would return, **without** broadcasting a transaction,
mining a block, or changing any state. It is the workhorse for reading on-chain
data: token balances (`balanceOf`), allowances, pool reserves, oracle prices,
and any other `view`/`pure` function or simulated state-changing call.

Because the call is executed in-memory against a chosen block, you get an
instant, gas-free answer. Use it whenever you need to *read* contract state or
*simulate* the outcome of a call before sending a real transaction. To actually
broadcast a state change, use `eth_sendRawTransaction` instead.

**Gotchas**

* The `data` field must be the ABI-encoded calldata — a 4-byte function selector
  followed by the 32-byte-padded arguments. Build it with a library
  (ethers/web3/viem) rather than by hand.
* A reverting contract returns an error (with the revert reason when available),
  not an empty result. Always handle the error path.
* Results reflect the state at the requested block tag. Omitting the tag means
  `latest`, which can change between calls.
* **Batch your reads.** Calling `eth_call` once per token/account burns your rps
  budget fast. Route many reads through **Multicall3** at
  `0xcA11bde05977b3631167028862bE2a173976CA11` (same address on Polygon) and
  collapse dozens of reads into a single `eth_call`.

## Parameters

`eth_call` takes two positional params: a call object and a block tag.

| Position | Name | Type | Required | Description |
|---|---|---|---|---|
| `params[0]` | Call object | object | yes | The transaction/call to execute (see fields below). |
| `params[1]` | Block tag | string | no | Block to execute against. Defaults to `latest`. |

### Call object fields

| Name | Type | Required | Description |
|---|---|---|---|
| `to` | string (address) | yes | Address of the contract being called. |
| `from` | string (address) | no | Address the call is made from. Used by contracts that read `msg.sender`. |
| `data` | string (hex) | no | ABI-encoded calldata: 4-byte selector + encoded arguments. |
| `value` | string (hex wei) | no | Amount of native MATIC to send with the simulated call. |

### Block tag values

| Value | Meaning |
|---|---|
| `latest` | Most recent block (default). |
| `earliest` | Genesis block. |
| `pending` | Pending state (may include not-yet-mined transactions). |
| `safe` / `finalized` | Latest safe / finalized block. |
| `0x<hex>` | A specific block number, hex-encoded. |

## Request

The example below reads the bridged-USDC `balanceOf` for a holder address.
The `data` value is `balanceOf(address)` (selector `0x70a08231`) with the
address left-padded to 32 bytes.

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_call",
    "params": [
      {
        "to": "0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359",
        "data": "0x70a08231000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b"
      },
      "latest"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x00000000000000000000000000000000000000000000000000000002540be400"
}
```

The `result` is the raw, ABI-encoded return value. Here
`0x…2540be400` decodes to `10000000000` — i.e. `10,000` USDC (6 decimals).
Decode it with your ABI to get a typed value.

### Response fields

| Field | Type | Description |
|---|---|---|
| `jsonrpc` | string | Always `"2.0"`. |
| `id` | number \| string | Echoes the request `id`. |
| `result` | string (hex) | ABI-encoded return data from the contract. `0x` if the function returns nothing. |

## Errors

On failure the response carries an `error` object instead of `result`. See the
shared [errors reference](../../errors.md) for the full error envelope and the
canonical meaning of each platform code.

| Code | Message | When it happens |
|---|---|---|
| `401` | `trial_expired` | The free-trial period for this key has ended; upgrade to continue. |
| `403` | `tier_insufficient` | The key's tier is below what the method requires. `eth_call` is available from the Free trial up, so this appears only if the key's scopes are restricted. Carries `data.required_tier` / `data.upgrade_url`. |
| `429` | `rate_limited` | Per-second rate limit for your tier exceeded; check `data.retry_after_sec`, back off, and retry. |
| `401` | `subscription_expired` | A previously active paid subscription has lapsed; renew to restore access. |
| `401` | `unauthorized` | Missing, invalid, or revoked API key. |
| HTTP `403` | `method_unknown` | The method name is misspelled or not part of the Polygon product. Carries `data.chain` and `data.method`. |

> **Note:** Rate limiting is enforced per-second per tier with burst headroom —
> there is no daily quota. Exceeding your tier's rps returns HTTP `429`
> (`rate_limited`) with a `data.retry_after_sec` hint; back off and retry.

A reverting contract surfaces a platform error whose message includes the decoded
revert reason when the contract provides one.

## Examples

### JavaScript (fetch)

```js
const res = await fetch("https://triport.io/polygon", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to: "0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359",
        data: "0x70a08231000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b",
      },
      "latest",
    ],
  }),
});

const { result } = await res.json();
console.log("raw return:", result);
console.log("balance:", BigInt(result).toString());
```

## Notes

* **Batching:** wrap multiple reads in a single `eth_call` to **Multicall3**
  (`0xcA11bde05977b3631167028862bE2a173976CA11`). One round trip, one rps charge,
  consistent block snapshot across every read.
* **Historical reads:** pass a hex block number as the second param to read state
  as of that block (subject to node history retention).
* **Simulation:** set `from` and `value` to simulate how a call would behave for
  a specific sender before sending it for real with
  [`eth_sendRawTransaction`](./eth_sendRawTransaction.md).
* **Estimating gas:** to size a transaction rather than read its output, use
  [`eth_estimateGas`](./eth_estimateGas.md).
* **Related reads:** [`eth_getBalance`](./eth_getBalance.md) for native MATIC
  balances, [`eth_getCode`](./eth_getCode.md) to confirm an address is a contract.
