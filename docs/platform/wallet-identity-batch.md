> Live version: https://triport.io/docs/platform/wallet-identity-batch

# Batch wallet identity with filters

> Profile up to 100 addresses (Business) or 500 (Enterprise) in one call and
> keep only the ones that pass a JSON filter — the way to run a list of
> millions of addresses through the cross-chain profile without one HTTP
> request per address.

| | |
|---|---|
| **Method / Endpoint** | `POST /v1/wallet/identity/batch` |
| **Type** | Triport product (REST API) |
| **Network** | Cross-chain — Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain, Tron |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query) |
| **Required scope** | — (tier-gated, see below) |
| **Tier / rate limit** | Business — 30 rps (`wallet_identity`, burst ×2 = 60 tokens), 100 addresses per call; Enterprise — 150 rps (burst 300), 500 addresses |

## Description

The batch endpoint assembles the same profile as
[`GET /v1/wallet/{address}/identity`](./wallet-identity.md) for every
address in the request, in parallel with a bounded worker pool, and returns
them in one response. A `filter` (see [filters](./wallet-identity-filters.md))
selects addresses: with `return: matched` (default) only passing profiles are
returned, with `return: all` every profile is returned and carries a
`matched` flag.

Filters are evaluated lazily. Cheap groups (balances, activity, labels) are
computed for every address first; names (one contract call per source) and
the expensive `deployer` scan run only for addresses the cheap predicates
did not already reject. Groups the filter needs are computed regardless of
`fields`, but they are returned only if `fields` lists them — so a filter on
`is_deployer` does not bloat the response with contract lists unless asked.

Duplicate addresses (any letter case, surrounding whitespace) are collapsed
and counted in `meta.deduplicated`; malformed addresses land in `errors[]`
with `invalid_address` and do not fail the batch. A profile that could not be
assembled at all (`all_chains_unavailable`, `timeout`) is likewise reported
in `errors[]`.

## Parameters

### Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `addresses` | string[] | yes | EVM addresses. Max 100 (Business) / 500 (Enterprise); `400 too_many_addresses` above the cap. |
| `chains` | string[] | no | Subset of `eth,base,polygon,bsc,robinhood,tron`. Default: all six networks. `meta.chains` echoes the effective list. |
| `fields` | string[] | no | Returned groups: `names,socials,balances,activity,labels,deployer`. Default `names,balances,activity,labels`. `socials` is off by default and implies `names` (see [Socials](./wallet-identity.md#socials-fieldssocials)); the filter `has_social` computes it regardless. |
| `filter` | object | no | Predicate tree, see [filters](./wallet-identity-filters.md). Empty = every address matches. `400 invalid_filter` on an unknown predicate. |
| `return` | `matched` \| `all` | no | Default `matched`. |
| `deployer_max_nonce` | integer | no | Scan cap for created contracts. Default `2000`, ceiling `5000`. |
| `fresh` | boolean | no | Bypass the cache for every address (doubles the `wallet_identity` cost). |

Unknown body keys are rejected (`400 invalid_body`); the body is limited to
1 MiB (`413 body_too_large`).

## Request

```bash
curl -X POST "https://triport.io/v1/wallet/identity/batch" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "0x0000000000000000000000000000000000000001"
    ],
    "chains": ["eth", "base"],
    "fields": ["names", "balances"],
    "filter": {
      "all": [
        {"has_name": true},
        {"balance": {"chain": "eth", "gte": "0.3"}}
      ]
    },
    "return": "matched"
  }'
```

## Response

### Response fields

| Field | Type | Description |
|---|---|---|
| `results[]` | array | Profiles (same shape as the single-address endpoint) plus `matched`. Only passing profiles with `return: matched`. |
| `matched` | integer | Addresses that passed the filter. |
| `total` | integer | Distinct valid addresses processed. |
| `errors[]` | array | `{address, error, message}` — `invalid_address`, `all_chains_unavailable`, `timeout`, `internal`. |
| `meta.cost` | object | Tokens charged per tier category, summed over all profiles; `wallet_identity` = `⌈addresses × chains / 10⌉` (×2 with `fresh`). |
| `meta.filter_fields` | string | Profile groups the filter read (what the lazy evaluation may have computed). |
| `meta.deduplicated` | integer | Duplicate addresses collapsed. |

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `invalid_body` / `invalid_addresses` / `too_many_addresses` / `batch_too_large` / `unknown_chain` / `invalid_fields` / `invalid_filter` / `invalid_return` / `invalid_deployer_max_nonce` | Malformed body or unknown key, empty address list, over the per-tier address cap or the burst capacity (see below), unknown network / field / predicate, bad `return` value. |
| `401` | `unauthorized` / `trial_expired` / `subscription_expired` | Missing or invalid credentials, or the trial/subscription has lapsed. |
| `403` | `tier_insufficient` | The API key's tier is below `business`. |
| `413` | `body_too_large` | Request body over 1 MiB. |
| `400` | `batch_too_large` | The batch cost exceeds the burst capacity of your tier (`rps × 2`), so it could never be admitted: keep `addresses × chains ≤ capacity × 10` (600 on Business, 3000 on Enterprise; `fresh: true` doubles the cost) or split the batch. |
| `429` | `rate_limited` | Not enough `wallet_identity` tokens for the batch cost right now (`Retry-After` is set); the request is refused before any profile is assembled. |

All error bodies use the shared envelope (`error`, `message`, `request_id`).
See [errors.md](../errors.md) for the full envelope and per-code fields.

## Examples

### Named token deployers with an ETH balance (JavaScript)
```js
const res = await fetch("https://triport.io/v1/wallet/identity/batch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.TRIPORT_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    addresses,                       // up to 100 per call
    chains: ["eth", "base"],
    fields: ["names", "deployer"],
    filter: {
      all: [
        { has_name: true },
        { is_deployer: true },
        { tokens_created: { gte: 1 } },
        { balance: { chain: "eth", gte: "0.3" } },
      ],
    },
  }),
});
const { results, matched, total, errors } = await res.json();
console.log(`${matched}/${total} matched, ${errors.length} errors`);
for (const r of results) console.log(r.address, r.names[0]?.name, r.deployer.tokens_created);
```

### Streaming a large list in pages of 100 (Python)
```python
import os
import requests

API = "https://triport.io/v1/wallet/identity/batch"
HEADERS = {"Authorization": f"Bearer {os.environ['TRIPORT_API_KEY']}"}

def pages(seq, size=100):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]

with open("addresses.txt") as f:
    addresses = [line.strip() for line in f if line.strip()]

for page in pages(addresses):
    res = requests.post(API, headers=HEADERS, json={
        "addresses": page,
        "chains": ["eth", "base", "bsc"],
        "fields": ["names", "balances", "labels"],
        "filter": {"any": [{"has_name": True}, {"has_label": ["cex", "bridge"]}]},
    }, timeout=120)
    res.raise_for_status()
    body = res.json()
    for r in body["results"]:
        print(r["address"], [n["name"] for n in r.get("names", [])], [l["entity"] for l in r.get("labels", [])])
```

## Notes

- **Filter first, fields second:** put the cheap predicates (`balance`,
  `active_on`, `has_label`) into the filter and request `deployer` only in
  `fields` where you need the contract list — the scan then runs for the
  survivors only.
- **Partial profiles still match:** a network that failed is present as
  `chains.<net>.error`; predicates on that network see it as balance `0` /
  nonce `0`. Check `errors[]` and `chains.*.error` before treating a
  non-match as final.
- **Related:** [single-address profile](./wallet-identity.md),
  [filter catalog](./wallet-identity-filters.md).
