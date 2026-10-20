> Live version: https://triport.io/docs/eth/json-rpc/eth_getProof

# eth_getProof

> Returns the Merkle-Patricia proof for an account and, optionally, a set of its storage slots at a given block, per EIP-1186.

| | |
|---|---|
| **Method / Endpoint** | `eth_getProof` |
| **Type** | Native upstream RPC |
| **Network** | Ethereum |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `eth_getproof` |
| **Tier / rate limit** | pro (5 RPS sustained · up to 10 burst), business (15 RPS sustained · up to 30 burst); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`eth_getProof` returns a cryptographic proof that an account — and the storage
slots you ask for — held specific values at a specific block. The proof is the
list of Merkle-Patricia trie nodes from the state root down to the account, and
from each storage root down to the requested slot, as standardized in
[EIP-1186](https://eips.ethereum.org/EIPS/eip-1186).

Use it when you need to *verify* on-chain state against a trusted block header
without trusting the RPC node itself — for example in light clients, L2
fraud/validity proofs, cross-chain bridges, or any system that checks account
balances and storage values against a known state root.

This is a `pro`-tier method. It is heavier than ordinary reads, so it carries a
lower rate limit than `eth_getBalance` / `eth_getStorageAt`. Request only the
storage keys you actually need to verify — every extra key adds another proof
branch to compute and return.

## Parameters

Positional array of three elements:

| # | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `address` | `string` (20-byte hex, `0x`-prefixed) | yes | The account address to prove. |
| 1 | `storageKeys` | `string[]` (32-byte hex each) | yes | Storage slot keys to prove. Pass `[]` for an account-only proof. |
| 2 | `block` | `string` | yes | Block number as hex (e.g. `0x10d4f`) or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. |

## Request

```bash
curl https://triport.io/eth \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getProof",
    "params": [
      "0x7F0d15C7FAae65896648C8273B6d7E43f58Fa842",
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      "latest"
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "address": "0x7f0d15c7faae65896648c8273b6d7e43f58fa842",
    "accountProof": [
      "0xf90211a0...80",
      "0xf90211a0...c0",
      "0xf8718080...80"
    ],
    "balance": "0x1b1ae4d6e2ef500000",
    "codeHash": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    "nonce": "0x0",
    "storageHash": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "storageProof": [
      {
        "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "value": "0x0",
        "proof": [
          "0xf90211a0...d0",
          "0xf8518080...20"
        ]
      }
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `address` | `string` | The account address the proof is for. |
| `accountProof` | `string[]` | RLP-encoded Merkle-Patricia trie nodes from the state root to the account, in order. |
| `balance` | `string` (hex) | The account balance in wei at the requested block. |
| `codeHash` | `string` | Keccak-256 hash of the account's code (`0xc5d2…a470` for accounts with no code). |
| `nonce` | `string` (hex) | The account nonce. |
| `storageHash` | `string` | Root hash of the account's storage trie; the root the `storageProof` entries verify against. |
| `storageProof` | `object[]` | One entry per requested storage key. |
| `storageProof[].key` | `string` | The requested storage key. |
| `storageProof[].value` | `string` (hex) | The value stored at that key (`0x0` if empty). |
| `storageProof[].proof` | `string[]` | RLP-encoded trie nodes from `storageHash` down to the slot. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `403` | `tier_insufficient` | Your key's tier is below `pro`; upgrade to `pro` or `business`. |
| `429` | `rate_limited` | You exceeded your tier's RPS (5 on pro, 15 on business). Back off and retry. |
| `-32602` | `invalid_params` | Malformed address, non-32-byte storage key, or unknown block tag. |

See the shared [error envelope reference](../../errors.md) for the full error
object shape and handling guidance.

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
    method: "eth_getProof",
    params: [
      "0x7F0d15C7FAae65896648C8273B6d7E43f58Fa842",
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      "latest",
    ],
  }),
});
const { result } = await res.json();
console.log(result.balance, result.storageHash);
```

## Notes

- Pass `[]` for `storageKeys` when you only need to prove account-level fields
  (`balance`, `nonce`, `codeHash`); `storageProof` then comes back empty.
- To verify a proof, hash the account header against the block's `stateRoot`
  (from [`eth_getBlockByNumber`](./eth_getBlockByNumber.md)) and each storage
  slot against the returned `storageHash`.
- For non-verified single-value reads, the lighter methods available from the Free trial up,
  [`eth_getBalance`](./eth_getBalance.md) and
  [`eth_getStorageAt`](./eth_getStorageAt.md) are cheaper and faster.
- Proofs are only retained for full archival history on the `business` tier;
  proofs against very old blocks may be unavailable on lower tiers.
- **Historical state:** proofs at old blocks need historical state — see
  [archive node vs full node](https://triport.io/learn/archive-node-vs-full-node).
