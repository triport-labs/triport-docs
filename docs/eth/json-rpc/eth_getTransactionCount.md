> Live version: https://triport.io/docs/eth/json-rpc/eth_getTransactionCount

# eth_getTransactionCount

> Returns the number of transactions sent from an address — its nonce — at a given block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getTransactionCount` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_read_rpc` |
| **Tier / rate limit** | free — 10 RPS sustained · up to 20 burst (free) / 20 (basic) / 100 (pro) / 250 (business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getTransactionCount` returns the total number of transactions that have
been sent *from* the given account, counted up to the specified block. Because
Ethereum assigns each transaction a sequential nonce starting at `0`, this count
**is** the account's current nonce.

The single most common use is to obtain the next nonce when building and signing
a transaction. Query the address against the `pending` block tag — the result is
exactly the nonce you should assign to your next outgoing transaction, accounting
for any transactions you have already broadcast but that are not yet mined.

The result is returned as a hex-encoded quantity (e.g. `"0x1f"` for 31). Querying
against `latest` counts only mined transactions, while `pending` also includes
transactions sitting in the mempool — the two can differ if you have in-flight
transactions.

## Parameters

Parameters are positional (a JSON array of exactly two elements).

| Position | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `address` | string (20-byte hex, `0x`-prefixed) | yes | The account address to query. |
| 1 | `block` | string \| object | yes | Block tag — `latest`, `pending`, `earliest`, `safe`, `finalized` — or a hex block number (e.g. `"0x10d4f"`), or a block reference object such as `{ "blockHash": "0x..." }`. Use `pending` to get the next nonce for signing. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getTransactionCount",
    "params": [
      "0xb60e8dd61c5d32be8058bb8eb970870f07233155",
      "pending"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1f"
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `result` | string | The transaction count (nonce) as a hex-encoded quantity. Decode to an integer to use as the next nonce. `"0x1f"` = 31. |

## Errors

Errors are returned in the standard JSON-RPC error envelope (`{ "jsonrpc": "2.0", "id": …, "error": { "code", "message" } }`).

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The API key's trial period has ended; upgrade to a paid tier to continue. |
| `429` | `rate_limited` | You exceeded the requests-per-second limit for your tier (10 RPS sustained · up to 20 burst on free). Back off and retry. |

See [Errors](../../errors.md) for the full error envelope and shared codes.

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
    method: "eth_getTransactionCount",
    params: ["0xb60e8dd61c5d32be8058bb8eb970870f07233155", "pending"],
  }),
});

const { result } = await res.json();
const nextNonce = parseInt(result, 16); // 31
```

## Notes

- **Signing transactions:** always use the `pending` tag when fetching a nonce to
  sign with. Using `latest` ignores transactions you have already broadcast but
  that are not yet mined, which can produce a nonce collision (`nonce too low`)
  on submission.
- **Hex decoding:** the result is a hex quantity with no leading zeros (`"0x0"`
  for an account that has never sent a transaction). Decode with
  `parseInt(result, 16)` / `int(result, 16)`.
- **Related methods:** [`eth_getBalance`](./eth_getBalance.md) for the account
  balance at a block, and [`eth_sendRawTransaction`](./eth_sendRawTransaction.md)
  to broadcast the signed transaction you build with this nonce.
- **Stuck transaction?** A nonce above the next expected one waits as queued —
  see [why an EVM transaction is stuck: nonce gaps](https://triport.io/learn/evm-transaction-stuck-nonce-gap).
