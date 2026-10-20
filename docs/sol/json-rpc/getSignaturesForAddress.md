> Live version: https://triport.io/docs/sol/json-rpc/getSignaturesForAddress

# getSignaturesForAddress

> Returns the signatures of confirmed transactions that include the given address, newest first.

| | |
|---|---|
| **Method / Endpoint** | `getSignaturesForAddress` (JSON-RPC) |
| **Type** | Native upstream RPC |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`) |
| **Required scope** | `sol_read_rpc` |
| **Tier / rate limit** | free+ — 20 / 60 / 200 / 600 RPS sustained · short burst 40 / 120 / 400 / 1200 (free / basic / pro / business); [Burst capacity](../../rate-limits-and-tiers.md#burst-capacity) |

## Description

`getSignaturesForAddress` returns a list of transaction signatures that
reference the given account, ordered from **newest to oldest** (reverse
chronological). It is the primary building block for reconstructing an
account's transaction history: page through the signatures here, then fetch the
full transactions with `getTransaction` for each one you care about.

Each entry is a lightweight `SignatureInfo` record — the signature itself plus
the slot, success/failure status, optional memo, block time, and confirmation
status. It does **not** include the transaction payload, so this call stays cheap
even on busy accounts.

Results are paginated by signature, not by offset. A single call returns at most
`limit` entries (default and maximum `1000`). To walk further back in history,
pass the oldest signature you received as `before` on the next call; to bound a
scan to transactions newer than a known point, pass that signature as `until`.

## Parameters

JSON-RPC `params` is a positional array: `[address, config?]`.

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string (base-58) | yes | The account public key to query, as a base-58 `Pubkey`. Must match `^[1-9A-HJ-NP-Za-km-z]{32,44}$`. |
| `config` | object | no | Optional configuration object (see below). |

### `config` object

| Field | Type | Required | Description |
|---|---|---|---|
| `limit` | integer | no | Maximum number of signatures to return. Default and maximum `1000`. |
| `before` | string (base-58) | no | Start searching backwards from this signature (exclusive). Used for pagination. |
| `until` | string (base-58) | no | Stop searching once this signature is reached (exclusive). Bounds the scan to newer transactions. |
| `commitment` | string | no | Commitment level: `processed`, `confirmed`, or `finalized`. |
| `minContextSlot` | integer | no | Minimum slot the request must be evaluated at. |

## Request

```bash
curl https://triport.io/sol \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getSignaturesForAddress",
    "params": [
      "Vote111111111111111111111111111111111111111",
      { "limit": 3 }
    ]
  }'
```

## Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    {
      "signature": "5h6xBEauJ3PK6SWCZ1PGjBvj8vDdWG3KpwATGy1ARAXFSDwt8GFXM7W5Ncn16wmqokgpiKRLuS83KUxyZyv2sUYv",
      "slot": 348392041,
      "err": null,
      "memo": null,
      "blockTime": 1746950400,
      "confirmationStatus": "finalized"
    },
    {
      "signature": "4zCo5q1tQ9fhqXgmYDP9X3J3qDgs5LZ3y4cN7eW9R2hT8mP1bVwUaK6sD2eF4gH7jK9LmN3pQrStUvWxYzAbCd",
      "slot": 348392009,
      "err": null,
      "memo": "[12] payment#42",
      "blockTime": 1746950387,
      "confirmationStatus": "finalized"
    },
    {
      "signature": "2pQrStUvWxYzAbCdEfGhJkLmN3oP5qR7sT9uV1wX2yZ3aB4cD5eF6gH7jK8LmN9pQrStUvWxYzAbCdEfGhJ",
      "slot": 348391972,
      "err": { "InstructionError": [0, { "Custom": 1 }] },
      "memo": null,
      "blockTime": 1746950372,
      "confirmationStatus": "finalized"
    }
  ]
}
```

### Response fields

`result` is an array of `SignatureInfo` objects, ordered newest-first.

| Field | Type | Description |
|---|---|---|
| `signature` | string (base-58) | The transaction signature. Pass to `getTransaction` to fetch the full transaction. |
| `slot` | integer | The slot that contains the transaction. |
| `err` | object \| null | `null` if the transaction succeeded; otherwise the transaction error object describing why it failed. |
| `memo` | string \| null | The memo associated with the transaction, or `null` if there was none. |
| `blockTime` | integer \| null | Estimated production time as a Unix timestamp (seconds), or `null` if unavailable. |
| `confirmationStatus` | string | Confirmation level of the transaction: `processed`, `confirmed`, or `finalized`. |

## Errors

Errors are returned in the standard JSON-RPC error envelope. See the shared
[errors reference](../../errors.md) for the full envelope shape and shared codes.

| Code | Meaning | When it happens |
|---|---|---|
| `-32602` | Invalid params | `address` is missing or not a valid base-58 pubkey, `limit` exceeds `1000`, or `config` is malformed. |
| `429` | Rate limited | More than your tier's RPS for `sol_read_rpc` (20 / 60 / 200 / 600). An HTTP error, not a JSON-RPC one: body `{"error":"rate_limited", …}` with `limit_rps`, `burst_capacity` and `retry_after_sec`, plus `Retry-After` and `X-RateLimit-Reset` headers. |
| `401` | Unauthorized | Missing or invalid `Authorization: Bearer` key. |

## Examples

### JavaScript (fetch)
```js
const res = await fetch("https://triport.io/sol", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getSignaturesForAddress",
    params: ["Vote111111111111111111111111111111111111111", { limit: 100 }],
  }),
});

const { result } = await res.json();
for (const sig of result) {
  console.log(`${sig.signature} @ slot ${sig.slot}${sig.err ? " (failed)" : ""}`);
}
```

### TypeScript SDK (`@triport/sdk`)
```ts
import { TriportClient } from "@triport/sdk";

const client = new TriportClient({ apiKey: process.env.TRIPORT_API_KEY });

const signatures = await client.solana.getSignaturesForAddress(
  "Vote111111111111111111111111111111111111111",
  { limit: 100, commitment: "finalized" }
);

for (const { signature, slot, err } of signatures) {
  console.log(`${signature} @ slot ${slot}${err ? " (failed)" : ""}`);
}
```

## Notes

- **Pagination:** results never exceed `limit` (max `1000`). To page backwards,
  take the `signature` of the **last** entry returned and pass it as `before` on
  the next request. Repeat until you receive fewer than `limit` entries.
- **Bounded scans:** pass a previously-seen signature as `until` to fetch only
  transactions newer than that point — useful for polling an account for new
  activity without re-reading old history.
- **Failed transactions are included:** entries with a non-null `err` represent
  transactions that were confirmed on-chain but failed during execution. Check
  `err` before treating a signature as a successful action.
- **Resolving full transactions:** this method returns only signatures and
  metadata. Pass each `signature` to `getTransaction` to retrieve the decoded
  instructions, balances, and logs.
- **Related methods:** `getSignatureStatuses` to check the confirmation state of
  specific signatures, and `getTransaction` to fetch transaction bodies.
- **Empty result?** An empty `result` array is not an error — see
  [why getSignaturesForAddress returns an empty array](https://triport.io/learn/empty-address-history)
  for how to tell "no history" apart from "history outside this node's
  retained index".
- **More than one page?** See
  [paging getSignaturesForAddress with before/until](https://triport.io/learn/getsignaturesforaddress-pagination).
- **Tutorials:** [backfill an address history within your rate limit](../../guides/backfill-solana-address-history.md)
  and [watch a wallet live](../../guides/watch-a-solana-wallet.md).
