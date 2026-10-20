> Live version: https://triport.io/docs/platform/wallet-identity-filters

# Wallet identity filters

> The predicate language shared by the [batch endpoint](./wallet-identity-batch.md)
> and wallet-watch subscriptions: JSON predicates over the profile, combined
> with `all` / `any` / `not`, evaluated cheapest-first so the expensive
> deployer scan only runs for addresses that survive the cheap checks.

| | |
|---|---|
| **Method / Endpoint** | `filter` object of `POST /v1/wallet/identity/batch` (and `POST /v1/wallet/watch`) |
| **Type** | Triport product (REST API) |
| **Network** | Cross-chain — Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain, Tron |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query) |
| **Required scope** | — (tier-gated with the carrying endpoint) |
| **Tier / rate limit** | Business — 30 rps (`wallet_identity`); Enterprise — 150 rps |

## Description

A filter is a JSON object with exactly one key: a combinator (`all`, `any`,
`not`) or a leaf predicate. An object with several keys is an implicit
`all`. Every leaf reads one group of the profile (names, socials, balances /
activity, labels, deployer); the evaluator orders leaves by the cost of the
group they need, short-circuits `all` on the first `false` and `any` on the
first `true`, and computes the deployer group only when the cheap leaves
could not decide.

Limits: 64 leaf predicates, nesting depth 8. An unknown predicate name, a
wrong value type, or a range with no operator is rejected with
`400 invalid_filter` and a message naming the offending key.

## Predicates

### Combinators

| Key | Value | Meaning |
|---|---|---|
| `all` | array of filters | Every child must be true (`{"all": []}` is true). |
| `any` | array of filters | At least one child true (`{"any": []}` is false). |
| `not` | filter | Negation. |

### Leaf predicates

| Predicate | Value | Reads | Example |
|---|---|---|---|
| `has_name` | `true` / `false` / list of sources | verified names | `{"has_name": ["ens", "basenames"]}` |
| `name_matches` | glob (case-insensitive) | verified names | `{"name_matches": "*.eth"}` |
| `is_deployer` | boolean | deployer | `{"is_deployer": true}` |
| `tokens_created` | int range | deployer | `{"tokens_created": {"gte": 1}}` |
| `deployed_symbol` | glob (case-insensitive) | deployer | `{"deployed_symbol": "PEPE*"}` |
| `balance` | `{chain, gte\|gt\|lte\|lt\|eq}` in coin units | balances | `{"balance": {"chain": "eth", "gte": "0.5"}}` |
| `balance_any` | decimal range | balances | `{"balance_any": {"gte": "1"}}` — on at least one network |
| `nonce` / `tx_count` | `{chain?, int range}` | balances | `{"nonce": {"chain": "base", "gte": 10}}`; without `chain` — the max across networks |
| `active_on` | list of networks | balances | `{"active_on": ["robinhood"]}` — nonce > 0 on every listed network |
| `is_contract` | boolean or `{chain, value}` | balances | `{"is_contract": false}` — no network reports code |
| `has_label` | `true` / `false` / list of categories | labels | `{"has_label": ["cex", "bridge"]}` |
| `has_social` | `true` / `false` / list of platforms | socials (and names) | `{"has_social": ["twitter", "github"]}` — at least one listed platform in `socials` |
| `fresh_wallet` | boolean | event (monitoring only) | `{"fresh_wallet": true}` — rejected in batch |

Ranges accept any subset of `gte`, `gt`, `lte`, `lt`, `eq` (at least one);
decimal ranges take strings or numbers and are compared exactly (no float
rounding). Sources: `ens`, `basenames`, `unstoppable`, `spaceid`, `farcaster`, `lens`. Social platforms: `twitter`, `github`, `telegram`, `discord`, `reddit`, `youtube`,
`website`, `avatar`, `header` (unknown platform → `400 invalid_filter`). Label
categories: `cex`, `bridge`, `solver`, `dex`, `mixer`, `fund`, `other`.
Only **verified** names and labels count.

## Request

```bash
curl -X POST "https://triport.io/v1/wallet/identity/batch" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
    "fields": ["names", "balances", "deployer"],
    "filter": {
      "all": [
        {"has_name": true},
        {"is_deployer": true},
        {"tokens_created": {"gte": 1}},
        {"balance": {"chain": "eth", "gte": "0.3"}},
        {"not": {"has_label": ["cex"]}}
      ]
    }
  }'
```

## Response

The filter itself has no response; the carrying endpoint reports
`matched` / `total` and, with `return: all`, a per-profile `matched` flag.
`meta.filter_fields` lists the profile groups the filter read:

### Response fields

| Field | Type | Description |
|---|---|---|
| `matched` | boolean (per result) / integer (top level) | Whether the profile passed the filter / how many did. |
| `meta.filter_fields` | string | Comma-separated groups the filter read: `names`, `socials`, `balances`, `deployer`, `labels`, `activity`. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `invalid_filter` | Unknown predicate, wrong value type, empty range, glob syntax error, more than 64 leaves, nesting deeper than 8, or `fresh_wallet` outside a subscription. The message names the key. |

Other codes come from the carrying endpoint — see
[batch errors](./wallet-identity-batch.md#errors).

## Examples

### Named deployer of at least one token with money on Ethereum
```json
{"all": [
  {"has_name": true},
  {"is_deployer": true},
  {"tokens_created": {"gte": 1}},
  {"balance": {"chain": "eth", "gte": "0.3"}}
]}
```

### Fresh-looking wallets that are not exchanges or bridges
```json
{"all": [
  {"nonce": {"lte": 3}},
  {"balance_any": {"gt": "0"}},
  {"not": {"has_label": ["cex", "bridge", "solver"]}}
]}
```

### Active on Robinhood Chain with a Base name or an ENS name
```json
{"all": [
  {"active_on": ["robinhood"]},
  {"any": [{"has_name": ["basenames"]}, {"name_matches": "*.eth"}]}
]}
```

### Contracts only, that created a PEPE-like token
```json
{"all": [
  {"is_contract": {"chain": "eth", "value": true}},
  {"deployed_symbol": "PEPE*"}
]}
```

## Notes

- **Cost ordering:** balances / activity / labels come from the same
  per-network state batch (cheapest), names cost one contract call per
  source, `deployer` costs `⌈nonce / 500⌉` calls per network — write `all`
  filters with the cheap predicates first in spirit; the evaluator reorders
  them anyway, but `any` filters short-circuit on the first true child, so
  the cheapest true branch saves the most.
- **Names and labels are verified-only:** a reverse record whose forward
  resolution points elsewhere, or a behaviourally inferred label without a
  source, never satisfies `has_name` / `has_label`. `has_social` counts only
  entries in `socials[]`, which are taken from verified names and accounts only;
  it adds the socials cost (one `<net>_read_rpc` per name service with a name,
  one `social_read` per external source) for the addresses it is evaluated on.
- **Related:** [batch endpoint](./wallet-identity-batch.md),
  [single-address profile](./wallet-identity.md).
