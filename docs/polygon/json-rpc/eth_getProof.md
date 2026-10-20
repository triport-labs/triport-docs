> Live version: https://triport.io/docs/polygon/json-rpc/eth_getProof

# eth_getProof

> Returns a Merkle-Patricia proof that a given account — and optionally specific storage slots — is included in the Polygon state trie at a chosen block.

| | |
|---|---|
| **Method / Endpoint** | `eth_getProof` (JSON-RPC, `POST https://triport.io/polygon`) |
| **Type** | Native upstream RPC |
| **Network** | Polygon |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `polygon_read_rpc` |
| **Tier / rate limit** | free (15 rps) · basic (20 rps) · pro (100 rps) · business (250 rps) |

## Description

`eth_getProof` implements [EIP-1186](https://eips.ethereum.org/EIPS/eip-1186).
It returns the account's value (balance, nonce, code hash, storage root)
together with the cryptographic proof needed to verify those values against the
block's `stateRoot` — and, for each storage key you pass, the slot value plus
its proof against the account's `storageHash`.

Use it whenever a client needs to **trust the state without trusting the
provider**: Polygon PoS bridge L1↔L2 state verification, light-client SDKs
(e.g. Helios-style verifying clients), and any flow that re-checks a balance or
storage slot against a known block hash. A verifier walks `accountProof` from
the `stateRoot` down to the account, then walks each `storageProof[].proof`
from `storageHash` down to the slot.

**Gotchas.** The response grows with the number of storage keys — each key adds
its own value plus a full proof branch, so a request for hundreds of keys can
return tens of kilobytes. Request only the slots you actually verify. Proofs are
block-specific: pin an explicit block number or hash for reproducible
verification rather than relying on `latest`, which advances every block (~2 s
on Polygon). Available from the Free trial up; no daily cap applies — limits are
requests-per-second per tier with short bursts.

## Parameters

Positional params array: `[address, storageKeys, blockTag]`.

| Position | Name | Type | Required | Description |
|---|---|---|---|---|
| 0 | `address` | string (20-byte hex) | yes | Account to prove, e.g. `0x0000000000000000000000000000000000001010` (Polygon native token contract). |
| 1 | `storageKeys` | array of string (32-byte hex) | yes | Storage slot keys to prove. Pass `[]` for an account-only proof. |
| 2 | `blockTag` | string | yes | Block number in hex (`0x...`), or a tag: `latest`, `earliest`, `pending`, `safe`, `finalized`. |

## Request

```bash
curl https://triport.io/polygon \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "eth_getProof",
    "params": [
      "0x0000000000000000000000000000000000001010",
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
    "address": "0x0000000000000000000000000000000000001010",
    "balance": "0x0",
    "codeHash": "0x5fbd9c8b6e5d7f2a8c3d1b0e9f4a6c2d7e8b1a3c5d7f9b0e2a4c6d8f0b2e4a6c",
    "nonce": "0x1",
    "storageHash": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "accountProof": [
      "0xf90211a0...",
      "0xf90211a0...",
      "0xf8718080...",
      "0xf8669d3a..."
    ],
    "storageProof": [
      {
        "key": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "value": "0x0",
        "proof": [
          "0xf90211a0...",
          "0xf871808080..."
        ]
      }
    ]
  }
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `address` | string | The account the proof is for. |
| `balance` | string (hex) | Account balance in wei at the requested block. |
| `nonce` | string (hex) | Account nonce. |
| `codeHash` | string (hex) | Keccak-256 hash of the account's code (`0xc5d246...b855a4` for accounts with no code). |
| `storageHash` | string (hex) | Root of the account's storage trie; verify `storageProof` entries against this. |
| `accountProof` | array of string | RLP-encoded trie nodes from the state root down to the account. |
| `storageProof` | array of object | One entry per requested storage key. |
| `storageProof[].key` | string (hex) | The requested storage slot key. |
| `storageProof[].value` | string (hex) | The slot value at the requested block. |
| `storageProof[].proof` | array of string | RLP-encoded trie nodes from `storageHash` down to the slot. |

## Errors

Errors are returned in the standard JSON-RPC envelope. See [`errors.md`](../../errors.md)
for the full shape and the `data` payload fields.

| Code | Meaning | When it happens |
|---|---|---|
| `401` | `trial_expired` | The trial period for the key has ended. |
| `403` | `tier_insufficient` | The key's tier does not grant this method. |
| `429` | `rate_limited` | Per-second limit for your tier exceeded; honor `retry_after_sec`. |
| `401` | `subscription_expired` | The subscription tied to the key has lapsed. |
| `401` | `unauthorized` | Missing or invalid `Authorization` bearer token. |
| HTTP `403` | `method_unknown` | Method not available on this network/key. |

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
    method: "eth_getProof",
    params: [
      "0x0000000000000000000000000000000000001010",
      ["0x0000000000000000000000000000000000000000000000000000000000000000"],
      "latest",
    ],
  }),
});

const { result } = await res.json();
console.log(result.storageHash, result.storageProof[0].value);
```

## Notes

- **Pin the block.** For reproducible bridge or light-client verification, pass
  an explicit hex block number instead of `latest` so the proof matches a known
  `stateRoot`.
- **Payload scales with keys.** Each entry in `storageKeys` adds a value and a
  full proof branch. Batch only the slots you verify; request account-only
  proofs with `[]` when you don't need storage.
- **Verifying a slot** means walking `storageProof[i].proof` from `storageHash`
  to the leaf, and `accountProof` from the block's `stateRoot` to `storageHash` —
  both must check out for the value to be trusted.
- **Related methods:** [`eth_getStorageAt`](./eth_getStorageAt.md) for an
  unproven slot read and [`eth_getBalance`](./eth_getBalance.md) for an unproven
  balance read.
