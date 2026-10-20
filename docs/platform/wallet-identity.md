> Live version: https://triport.io/docs/platform/wallet-identity

# Get wallet identity profile

> One request, one JSON: verified on-chain names (ENS, Basenames, Unstoppable
> Domains, SPACE ID), native balance / nonce / contract flag on every mounted
> EVM network plus Tron, activity summary, known-address labels, and — on
> request — deployer detection with the list of created tokens.

| | |
|---|---|
| **Method / Endpoint** | `GET /v1/wallet/{address}/identity` |
| **Type** | Triport product (REST API) |
| **Network** | Cross-chain — Ethereum, Base, Polygon, BNB Smart Chain, Robinhood Chain, Tron |
| **Authentication** | `x-token: $TRIPORT_API_KEY` (or `Authorization: Bearer`, or `?api-key=` query) |
| **Required scope** | — (tier-gated, see below) |
| **Tier / rate limit** | Business — 30 rps (`wallet_identity`, burst ×2); Enterprise — 150 rps |

## Description

For transaction history, period volumes, counterparties, bridge/exchange flows,
token approvals and shared funding candidates, use the separate
[Wallet Research endpoint](./wallet-research.md). It reports scanned coverage per
network and complements this lightweight profile.

Names are read straight from the chain (Universal Resolver for ENS, the
Basenames registry on Base, Unstoppable Domains `ProxyReader` on Ethereum and
Polygon, the SPACE ID registry on BNB Smart Chain). A name is returned only
when its forward record resolves back to the queried address
(`verified: true`), so a reverse record pointing at somebody else's name is
never reported as that name. Names that live off-chain (CCIP-read, e.g.
`*.cb.id`) are listed in `unresolved` with `reason: offchain_lookup`.

The `deployer` group is off by default because it scans the address's CREATE
range: Triport derives every contract address the wallet could have created
(`keccak(rlp([address, nonce]))` for `nonce = 0…N-1`), checks which of them
hold code, and probes each for ERC-20 metadata (`symbol`, `name`, `decimals`,
`totalSupply`). Request it with `fields=deployer`; `deployer_max_nonce` caps
the scan (default 2000, ceiling 5000, `truncated: true` when the wallet's
nonce is higher).

This surface is separate from the Solana wallet REST at
`/v1/wallet/{base58}/…`, which keeps its own contract and is not tier-gated.

## Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `address` | string | yes | Path segment. EVM address, `0x` + 40 hex characters, any letter case. The response echoes it lower-cased. |
| `fields` | string | no | Comma-separated projection of `names,socials,balances,activity,labels,deployer`. Default `names,balances,activity,labels`. `socials` is off by default and implies `names` — see [Socials](./wallet-identity.md#socials-fieldssocials). |
| `deployer_max_nonce` | integer | no | Nonce range scanned for created contracts. Default `2000`, ceiling `5000`. |
| `fresh` | `0`/`1` | no | Bypass the profile cache (names 15 min, balances 60 s). Costs a second `wallet_identity` token. |

## Request

```bash
curl "https://triport.io/v1/wallet/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/identity?chains=eth,base,tron" \
  -H "Authorization: Bearer $TRIPORT_API_KEY" \
  -H "Content-Type: application/json"
```

## Response

### Response fields

| Field | Type | Description |
|---|---|---|
| `address` | string | Queried address, lower-cased. |
| `address_tron` | string | Tron base58 form of the same key. |
| `names[]` | array | Verified names. `source` ∈ `ens`, `basenames`, `unstoppable`, `spaceid`, `farcaster`, `lens`; `chain` is where the record was read (`optimism` for Farcaster, `lens` for Lens Chain); `primary` marks the address's reverse record; `verified` means the forward record resolves back to the address (for Farcaster / Lens — the address is the account's custody address / owner); `normalized` means the name is already ENSIP-15 normalized. With `fields=socials` each name also carries `records` — raw text records, key → value. |
| `socials[]` | array | Only with `fields=socials`: social accounts and profile links, see [Socials](./wallet-identity.md#socials-fieldssocials). |
| `labels[]` | array | Triport labels of known addresses (`source: "triport"`, `entity`, `category` ∈ `cex`, `bridge`, `solver`, `dex`, `mixer`, `fund`, `other`). Only verified labels are returned. |
| `chains.<net>` | object | Per-network state: `balance_wei` (or `balance_sun` on Tron), `balance` in coin units, `nonce` (`null` on Tron), `is_contract`, `latency_ms`. Present with `error` instead when the network did not answer. |
| `deployer` | object | Only with `fields=deployer`: `is_deployer`, `scanned_nonces`, `truncated`, `contracts[]` (`chain`, `address`, `nonce`, `is_erc20`, `symbol`, `name`, `decimals`, `total_supply`), `tokens_created`, `errors`. |
| `activity` | object | `any_tx`, `chains_active[]` (nonce > 0), `max_nonce`. |
| `unresolved[]` | array | Name sources that could not answer: `chain`, `source`, `reason` ∈ `offchain_lookup`, `upstream_error`, `not_mounted`, `timeout`, `budget`, `rpc_error`, `not_available`, `records_error`. Always present (possibly empty). |

### Socials (`fields=socials`)

Request `fields=socials` (off by default; it implies `names`). The response
then carries `socials[]` — normalized social accounts and profile links — and
`records` on every verified name — the raw text records exactly as stored:

```bash
curl "https://triport.io/v1/wallet/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/identity?fields=socials&chains=robinhood" \
  -H "Authorization: Bearer $TRIPORT_API_KEY"
```

Each `socials[]` entry names the `platform`, the `handle` (without `@`; empty
for `website` / `avatar` / `header`), a canonical `url` built by Triport, and
where it came from: `source`, `name` (the name or account), `chain` and the
original `key`. The same platform found under two names gives two entries, in
the order of `names`.

| Platform | ENS / Basenames / SPACE ID key (ENSIP-5) | Unstoppable Domains key | Farcaster | Lens attribute |
|---|---|---|---|---|
| `twitter` | `com.twitter` (`vnd.twitter` if `com.twitter` is empty) | `social.twitter.username` | profile field, or X account confirmed by the Farcaster client | `x`, `twitter` |
| `github` | `com.github` | — | profile field, or GitHub account confirmed by the Farcaster client | `github` |
| `telegram` | `org.telegram` | `social.telegram.username` | — | — |
| `discord` | `com.discord` | `social.discord.username` | — | — |
| `reddit` | `com.reddit` | `social.reddit.username` | — | — |
| `youtube` | — | `social.youtube.username` | — | — |
| `website` | `url`, `url2`, `url3` | — | profile URL | `website`, `url` |
| `avatar` | `avatar` | `social.picture.value` | profile picture | picture |
| `header` | `header` | — | banner | — |

Returned only in `records`, never in `socials`: `email`, `description`,
`xyz.farcaster` (a Farcaster name claimed in a name record — the Farcaster
account itself comes from the `farcaster` source), Unstoppable
`whois.email.value` and `ipfs.html.value`, Lens `name` and bio. Values are
untrusted input written by the name or account owner: `socials[]` holds only
values that passed per-platform validation (handle pattern, 256-character
cap, `https://` links; avatars also `ipfs://` and `eip155:`), while `records`
returns them as stored — escape them before rendering.

**`verified_owner` / `verified_by`.** The name itself is forward-verified
(`names[].verified: true`; records of unverified names never become socials),
but a text record is only what the name owner claims. Entries from ENS,
Basenames, SPACE ID and Unstoppable records, and Farcaster / Lens profile
strings that nobody confirmed, are `verified_owner: false`. `verified_owner:
true` appears only on an X or GitHub account that the Farcaster client
confirmed for the account, and always together with
`verified_by: "farcaster_client"`; the Farcaster protocol itself does not
verify these strings.

**Robinhood Chain and Tron: socials through the address's name.** Neither
network has a name service of its own, and names do not depend on `chains`.
With `chains=robinhood` (or `tron`) and `fields=socials` the response still
reads the address's ENS, Basenames, SPACE ID and Unstoppable names on their
own networks and returns their socials; Farcaster and Lens are looked up by
the same EVM address.

**Cost.** Reading records adds one `<net>_read_rpc` (SPACE ID —
`bsc_read_rpc_heavy`) per name service where a name was found, charged to
that service's own network. Each external source adds one `social_read` per
address on a cache miss. Everything is itemized in `meta.cost`; records are
cached with the names (15 minutes). If records could not be read, the name
stays in `names` without `records` and `unresolved[]` gets
`reason: records_error`.

## Errors

| Code | Meaning | When it happens |
|---|---|---|
| `400` | `invalid_address` / `unknown_chain` / `invalid_fields` / `invalid_name_sources` / `invalid_deployer_max_nonce` | Malformed address, unknown network id, unknown field name, unknown name source, or a negative nonce cap. Body: `{"error": "<code>", "message": "…", "code": 400}`. |
| `401` | `unauthorized` / `trial_expired` / `subscription_expired` | Missing or invalid credentials, or the trial/subscription has lapsed. |
| `403` | `tier_insufficient` | The API key's tier is below `business`. Response carries `current_tier`, `required_tier`, and the `X-Required-Tier` header. |
| `429` | `rate_limited` | `wallet_identity` sustained RPS exceeded (or the second token for `fresh=1` is not available). Response carries `Retry-After`. |

All error bodies use the shared envelope (`error`, `message`, `request_id`).
See [errors.md](../errors.md) for the full envelope and per-code fields.

## Examples

### JavaScript (fetch)
```js
const address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
const res = await fetch(
  `https://triport.io/v1/wallet/${address}/identity?fields=names,balances,deployer`,
  { headers: { Authorization: `Bearer ${process.env.TRIPORT_API_KEY}` } }
);

if (!res.ok) {
  const err = await res.json();
  throw new Error(`${res.status} ${err.error}: ${err.message}`);
}

const profile = await res.json();
const primary = profile.names.find((n) => n.primary && n.verified);
console.log(primary?.name ?? "(no verified name)", profile.deployer?.tokens_created ?? 0);
```

### Python (requests)
```python
import os
import requests

address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
res = requests.get(
    f"https://triport.io/v1/wallet/{address}/identity",
    params={"chains": "eth,base,bsc", "fields": "names,balances,labels"},
    headers={"Authorization": f"Bearer {os.environ['TRIPORT_API_KEY']}"},
    timeout=30,
)
res.raise_for_status()
profile = res.json()
for chain, state in profile["chains"].items():
    print(chain, state.get("balance"), state.get("error", ""))
```

### Filtering a list of addresses (shell)
```bash
while read -r addr; do
  curl -s "https://triport.io/v1/wallet/$addr/identity?fields=names,balances" \
    -H "Authorization: Bearer $TRIPORT_API_KEY" \
  | jq -r 'select(.names | length > 0) | "\(.address) \(.names[0].name) \(.chains.eth.balance // "-")"'
done < addresses.txt
```

## Notes

- **Cost accounting:** each request charges one `wallet_identity` token plus,
  per queried network, one `<net>_read_rpc` token per internal upstream call
  (BSC `eth_call` is charged as `bsc_read_rpc_heavy`). The exact breakdown is
  returned in `meta.cost`, so batch runs can be sized against the key's
  per-network budgets.
- **Tron:** the account model has no nonce, so `chains.tron.nonce` is `null`
  and the deployer scan skips Tron; activity comes from the account's last
  operation time.
- **Off-chain names:** CCIP-read resolvers (ENSIP-10) are not followed in this
  version; such names appear in `unresolved` with `reason: offchain_lookup`
  rather than being silently dropped.
- **Related:** the Solana wallet surface is documented under
  [Solana REST](../sol/rest/index.md); the tier matrix is in
  [Rate limits and tiers](../rate-limits-and-tiers.md).

## Wallet overview preview

The app offers a limited overview before upgrading: counts of used networks,
verified names and address labels. Names, entity labels, balances, transaction
counts by network and deployment details require Business or Enterprise.
These details are omitted from preview API responses; the locked panel displays
placeholders. Preview requests retain address, concurrency and rate limits.
