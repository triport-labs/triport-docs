> Live version: https://triport.io/docs/platform/wallet-funded-by

# Get wallet funded-by

> Who first funded an address, in which transaction and block, and how much.
> Takes the same parameters as Etherscan's `action=fundedby` and returns the
> same fields, plus the kind of transfer and the archive coverage behind the answer.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/wallet/{address}/funded-by?chain={chain}` |
| **Type** | Triport product (REST API) |
| **Network** | Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query) |
| **Required scope** | — (tier-gated, see below) |
| **Tier / rate limit** | Business and Enterprise (`wallet_identity` category, same limits as the identity profile) |

## Description

`{address}` is an EVM address (`0x` + 40 hex characters). Select the network
with `chain` (`eth`, `base`, `polygon`, `bsc`, `robinhood`) or with an
Etherscan-style numeric `chainid` (`1`, `8453`, `137`, `56`, `4663`).

The first block in which the address holds a balance or has sent a
transaction is located directly from archive state, in a few batched rounds. Triport
then reads that block and returns the transfer that funded the address:

- a top-level transaction to the address with a non-zero value and a
  successful receipt. This includes L1 deposits on Arbitrum-stack chains such
  as Robinhood Chain (`kind: "transaction"`);
- otherwise, a successful internal call with value from the block's call
  trace (`kind: "internal"`);
- otherwise, an L1 transfer that Nitro records outside the EVM
  (`kind: "l1_transfer"`).

A first answer for a recently funded wallet typically takes one to two seconds. Results are cached, so a
repeated question returns in milliseconds. A funding older than 64 blocks is
cached for 24 hours. A `not_funded` answer is cached for 15 seconds only,
because a fresh wallet can be funded at any moment.

### Coverage

Public providers keep archive state for a limited and uneven depth. On
Robinhood Chain, lookups are reliable for roughly the last one to two
million blocks, about one to two days. A wallet funded recently, which is
the usual reason to ask, is answered exactly. If the address was already
funded at the earliest block Triport could inspect, the endpoint does not
guess. It returns `status: "before_coverage"` and `coverage.state_from`,
the earliest block at which the funding was confirmed. The true funding
happened at or before that block.

### Incomplete history

Many Ethereum nodes no longer keep old block bodies and receipts
(EIP-4444 history expiry), so older data is not always available. When
the answer depends on history Triport could not read, the response says so
explicitly: `coverage.history_incomplete: true` and
`coverage.history_incomplete_before: N`. Read that as "the address was
funded no later than block N". It does **not** say that block N holds the
first funding. This covers three cases:

- `before_coverage`: no archive state before `coverage.state_from`;
- `funded`, but the block body was unavailable, so `fundingTxn` is empty and
  `note` explains why;
- `funded`, but the funding transaction's receipt was unavailable, so its
  success could not be confirmed.

If `history_incomplete` is `false`, the answer did not depend on missing
history.

## Parameters

### Query

| Name | Type | Required | Description |
|---|---|---|---|
| `chain` | string | one of `chain` / `chainid` | `eth`, `base`, `polygon`, `bsc`, `robinhood` |
| `chainid` | integer | one of `chain` / `chainid` | `1`, `8453`, `137`, `56`, `4663` |

## Response

| Field | Type | Description |
|---|---|---|
| `address` | string | The queried address, lower-case |
| `chain` / `chain_id` | string / integer | Network |
| `status` | string | `funded`, `not_funded` or `before_coverage` |
| `block` | integer | Block of the first funding (`funded` only) |
| `timeStamp` | string | Block time, Unix seconds (Etherscan format) |
| `fundingAddress` | string | Sender of the first funds |
| `fundingTxn` | string | Transaction hash |
| `value` | string | Amount in wei, decimal string |
| `kind` | string | `transaction`, `internal`, `l1_transfer` or `contract_creation` (the address is a contract created by a value-carrying transaction; `fundingAddress` is its creator) |
| `note` | string | Present when the answer is partial (for example, the funding block was found but its trace was unavailable) |
| `coverage.head` | integer | Chain head at lookup time |
| `coverage.state_from` | integer | Earliest inspected block at which the address was already funded (`before_coverage` only); the funding happened at or before it |
| `coverage.history_incomplete` | boolean | `true` when the answer depends on history Triport could not read (see *Incomplete history*). Do not treat such an answer as the first funding |
| `coverage.history_incomplete_before` | integer | History before this block was not available. Present only when `history_incomplete` is `true` |
| `cached` | boolean | Served from cache |
| `elapsed_ms` | integer | Server time for this answer |

## Example

```bash
curl "https://triport.io/v1/wallet/0x1234…abcd/funded-by?chainid=4663" \
  -H "x-token: $TRIPORT_API_KEY"
```

```json
{
  "address": "0x1234…abcd",
  "chain": "robinhood",
  "chain_id": 4663,
  "status": "funded",
  "block": 64210331,
  "timeStamp": "1758100000",
  "fundingAddress": "0x9f8e…01aa",
  "fundingTxn": "0x5c1d…e7b2",
  "value": "2500000000000000",
  "kind": "transaction",
  "coverage": { "head": 66519000, "history_incomplete": false },
  "cached": false,
  "elapsed_ms": 1040
}
```

## Errors

| HTTP | `error` | When |
|---|---|---|
| 400 | `invalid_chain` | `chain` / `chainid` missing or not supported |
| 401 / 403 | — | Missing key, or a plan below Business |
| 502 | `upstream_error` | Providers returned an error |
| 503 | `archive_busy` | Archive providers are throttling, or have no state around the funding block; retry after `Retry-After` |
| 504 | `timeout` | The lookup did not finish in 20 seconds |
