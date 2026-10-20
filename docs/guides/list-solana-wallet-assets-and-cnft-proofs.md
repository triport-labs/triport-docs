> Live version: https://triport.io/docs/guides/list-solana-wallet-assets-and-cnft-proofs

# List a Solana wallet's assets and fetch cNFT proofs

> Page through a wallet's DAS assets with getAssetsByOwner, recover from an oversized page, and fetch and check the Merkle proof of each compressed NFT.

| | |
|---|---|
| **Method / Endpoint** | `n/a — tutorial` (`POST https://triport.io/sol`: `getAssetsByOwner`, `getAssetProof`) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `solana:rpc` |
| **Tier / rate limit** | DAS is not in the Free trial; Basic includes part of the DAS method set, Pro and above include all of it |

The Digital Asset Standard (DAS) API answers questions an account read cannot:
*which NFTs and tokens does this wallet own*, and for a compressed NFT,
*what is the proof that this leaf is in its tree*. This tutorial lists a
wallet's assets page by page, separates compressed NFTs from the rest, and
fetches a proof for each compressed NFT, which a transfer or burn instruction
needs. Output samples are from a probe on 2026-09-22.

## What you need

- **An API key** from the [console](https://triport.io/app/keys), exported as
  `TRIPORT_API_KEY`.
- **A plan that includes both methods.** DAS calls are refused on the Free
  trial. Basic includes part of the DAS method set, and the plan matrix does not
  name which methods. Pro, Business and Enterprise include all six DAS methods
  (`getAsset`, `getAssetProof`, `getAssetsByGroup`, `getAssetsByOwner`,
  `getTokenAccounts`, `searchAssets`). If you depend on both methods used here,
  use Pro or above.
- **Node.js 18 or newer.** Only the built-in `fetch` is used.

DAS calls go to the same `https://triport.io/sol` endpoint as ordinary Solana
reads. They are gated by plan, not weighted per call, and responses carry
`X-RateLimit-Category: sol_das`: a category of its own, separate from
`sol_read_rpc`.

## 1. One page of assets

`getAssetsByOwner` takes a named-parameter object and pages with `page`
(1-based) and `limit`:

```bash
curl -s https://triport.io/sol \
  -H "x-token: $TRIPORT_API_KEY" -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getAssetsByOwner","params":{"ownerAddress":"86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY","page":1,"limit":5}}'
```

The result has five keys: `last_indexed_slot`, `total`, `limit`, `page` and
`items`. Each item carries `interface`, `id`, `content`, `authorities`,
`compression`, `grouping`, `royalty`, `creators`, `ownership`, `supply`,
`mutable` and `burnt`. The `compression` object of the first item in the probe:

```json
{"eligible":false,"compressed":true,"data_hash":"7zquDVS1VKu9HDh4WS4ray5ozLThiK6xrnFNhJtusj65","creator_hash":"6v7GeYRiVML5mG1kJqi6eujN9sPB3ziCZJF4Vartj1qd","asset_hash":"8gQZkgZ1L91qkNPtsiRGkRzpNcEfhBABEQr1D3wquB8H","tree":"BZNn9zX1MysbSvqyGZ33Seb8bvimaiE9fxmLKwX2Euae","seq":251133,"leaf_id":250758}
```

Two things about the envelope are easy to get wrong:

- **`total` counts the items in this page, not in the wallet.** With
  `limit: 5` the probe got `total: 5`. Do not use it to compute the number of
  pages. Keep requesting until a page returns fewer items than `limit`.
- **A large `limit` can fail as a whole.** The same wallet with `limit: 20`
  returned an error instead of a page, because the assets' metadata made the
  response too large:

```json
{"jsonrpc":"2.0","error":{"code":-32702,"message":"Response is too big","data":"Exceeded max limit of 20971520"},"id":1}
```

The limit is on the response size (20,971,520 bytes), not on the item count,
so a safe `limit` depends on the wallet. The code below starts modestly and
halves the page size when it meets `-32702`.

## 2. Page through every asset

Save as `assets.ts` and run `npx tsx assets.ts <owner>`:

```ts
const KEY = process.env.TRIPORT_API_KEY!;
const OWNER = process.argv[2] ?? "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
const MAX_PROOFS = 3; // proofs to fetch in this demo

class RpcError extends Error {
  code: number;
  constructor(code: number, message: string) { super(message); this.code = code; }
}

async function das<T>(method: string, params: object): Promise<T> {
  for (;;) {
    const res = await fetch("https://triport.io/sol", {
      method: "POST",
      headers: { "content-type": "application/json", "x-token": KEY },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, Number(res.headers.get("retry-after") ?? "1") * 1000));
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${body.error}: ${body.message}`);
    if (body.error) throw new RpcError(body.error.code, body.error.message);
    return body.result as T;
  }
}

interface Asset {
  id: string;
  interface: string;
  compression: { compressed: boolean; tree: string; asset_hash: string; leaf_id: number };
}
interface Page { total: number; limit: number; page: number; items: Asset[]; last_indexed_slot: number }

// Offset-based walk, so the page size can shrink without skipping or repeating items.
async function* allAssets(owner: string): AsyncGenerator<Asset> {
  let limit = 16;
  let offset = 0;
  for (;;) {
    let page: Page;
    try {
      page = await das<Page>("getAssetsByOwner", { ownerAddress: owner, page: offset / limit + 1, limit });
    } catch (e) {
      if (e instanceof RpcError && e.code === -32702 && limit > 1) {
        limit /= 2; // response too big: same offset, smaller pages
        continue;
      }
      throw e;
    }
    yield* page.items;
    if (page.items.length < limit) return;
    offset += page.items.length;
  }
}

async function main(): Promise<void> {
  let seen = 0;
  const compressed: Asset[] = [];
  for await (const a of allAssets(OWNER)) {
    seen++;
    if (a.compression?.compressed) compressed.push(a);
  }
  console.log(`${seen} assets, ${compressed.length} compressed`);

  // Fetch the proof for a few compressed NFTs and check it belongs to the asset.
  for (const a of compressed.slice(0, MAX_PROOFS)) {
    const p = await das<{ root: string; proof: string[]; node_index: number; leaf: string; tree_id: string }>(
      "getAssetProof", { id: a.id },
    );
    const matches = p.leaf === a.compression.asset_hash && p.tree_id === a.compression.tree;
    console.log(`${a.id} tree ${p.tree_id} proof ${p.proof.length} nodes, leaf matches asset: ${matches}`);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
```

Expected output: a count line, then one line per proof. From a run on
2026-09-22 against the default wallet, stopped after its first page:

The shrinking page size is not hypothetical. On that wallet the first request
(`limit: 16`) came back `-32702`, `limit: 8` succeeded, and the next
page at `limit: 8` failed again and continued at `limit: 4`. For a wallet
with thousands of assets the walk makes one request per page, so stop early,
or persist the offset, if you only need part of the list.

## 3. What the proof looks like

`getAssetProof` for the compressed NFT from step 1 returned (the `proof` array
shortened to its first two of 20 entries):

```json
{
  "last_indexed_slot": 449505128,
  "root": "BG6zeTDjGxtCgS8WfGvyhdjrA3uNdr1RUimkxzQaHBTP",
  "proof": ["7ErpXwrLjPxkcvFb2iNR4LJrVApd3NosXoRmoCChnsBs", "CNxcDTsomrRSPnFM4x6F1Ar6PFjmeePPgjXuLrDb3kgr", "…"],
  "node_index": 1299334,
  "leaf": "8gQZkgZ1L91qkNPtsiRGkRzpNcEfhBABEQr1D3wquB8H",
  "tree_id": "BZNn9zX1MysbSvqyGZ33Seb8bvimaiE9fxmLKwX2Euae"
}
```

The check in the code compares two pairs: `leaf` with the asset's
`compression.asset_hash`, and `tree_id` with `compression.tree`. Both matched
in the probe. A mismatch means the proof and the asset listing come from
different index states. Fetch both again before building an instruction.

`root` and `proof` are what a Bubblegum instruction consumes. The number of
proof nodes follows the tree's depth, and some trees keep part of the path in
an on-chain canopy. Consult the tree's configuration before trimming the proof.

## 4. Errors you will actually see

- **`-32702 Response is too big`**: the page is larger than the response cap.
  Lower `limit`; the walker does this for you.
- **A Free-trial key** is refused on every DAS method. **A Basic key** can be
  refused on methods outside its part of the set. Both refusals are plan
  decisions, not transient errors, so do not retry them.
- **HTTP 429** with `Retry-After`, if a request is rate-limited. The body
  follows the same envelope as every other rate limit, with
  `"error": "rate_limited"`, your `current_tier`, the `category` and
  `retry_after_sec` ([rate limits and tiers](../rate-limits-and-tiers.md)).
  The helper waits and retries.
- **A missing or wrong key** returns HTTP 401:

```json
{"error":"unauthorized","message":"Missing or unknown API key. Pass your key as ?api-key=<key> or the header Authorization: Bearer <key>. Create or copy a key at https://triport.io/app/keys","keys_url":"https://triport.io/app/keys"}
```

## What this does not do

- **It does not read live state.** DAS answers from an index. Every response
  carries `last_indexed_slot`. For the current state of one account, read the
  account itself with [`getAccountInfo`](../sol/json-rpc/getAccountInfo.md).
- **It does not verify the root on-chain.** The leaf and tree check catches a
  mismatched pair. Proving the leaf against the tree's current root is the
  job of the program that consumes the proof, or of your own keccak-based
  check.
- **It does not transfer or burn anything.** Building the Bubblegum instruction
  is outside this tutorial.
- **It does not cover the whole DAS family.** Six methods are offered; batch,
  creator, authority, signature and edition queries are not.

## Related

- Reference: [`getAssetsByOwner`](../sol/json-rpc/getAssetsByOwner.md),
  [`getAssetProof`](../sol/json-rpc/getAssetProof.md),
  [`getAsset`](../sol/json-rpc/getAsset.md),
  [`searchAssets`](../sol/json-rpc/searchAssets.md).
- Concepts: [DAS explained](https://triport.io/learn/das),
  [Merkle proof](https://triport.io/learn/glossary/merkle-proof).
- Product page: [Solana DAS API](https://triport.io/features/das-api).
- Network: [Solana docs overview](../sol/index.md) and the
  [Solana RPC page](https://triport.io/solana-rpc).
- Plans: [pricing](https://triport.io/pricing).
