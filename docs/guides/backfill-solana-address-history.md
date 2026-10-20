> Live version: https://triport.io/docs/guides/backfill-solana-address-history

# Backfill a Solana address history within your rate limit

> Walk a Solana address's history backwards, fetch each transaction at a pace your plan allows, resume after a crash, and hand over to a live watcher.

| | |
|---|---|
| **Method / Endpoint** | `n/a — tutorial` (`POST https://triport.io/sol`: `getSignaturesForAddress`, `getTransaction`) |
| **Network** | Solana |
| **Authentication** | `x-token: $TRIPORT_API_KEY` |
| **Required scope** | `solana:rpc` |
| **Tier / rate limit** | Every plan, from the 7-day Free trial (`free`) up; both methods draw on `sol_read_rpc` |

Importing an address's past transactions is two nested loops: page the
signatures backwards, then fetch each transaction. The loops are simple. What
decides whether the import finishes is the part around them. It has to stay
under the plan's request rate, survive a restart without starting over, and
end at a point where a live watcher can take over. This tutorial builds that
program against the live endpoint. Outputs are from a run on 2026-09-22.

## What you need

- **An API key** from the [console](https://triport.io/app/keys), exported as
  `TRIPORT_API_KEY`.
- **Your plan's `sol_read_rpc` rate.** Both methods count against it: 20
  requests/s on the Free trial, 60 on Basic, 200 on Pro and 600 on Business.
  The burst allowance is 2× for short spikes, but a backfill is sustained load,
  so plan for the sustained number
  ([rate limits and tiers](../rate-limits-and-tiers.md)).
- **Node.js 18 or newer.** Only the built-in `fetch` and `fs` are used.

## 1. Budget the job before you start

Each signature costs one `getTransaction` call, and each page of up to 1,000
signatures costs one more `getSignaturesForAddress` call. An address with
*N* transactions needs about *N* + *N*/1000 requests. Divide that by the rate
you pace at, and you have the wall-clock time the import takes on your plan.

Pace **below** the plan rate, not at it. The same key usually serves other
traffic, such as a live watcher or your application's reads, from the same
`sol_read_rpc` bucket. The program below takes the pace as `RPS` and defaults
to 15, which fits under the Free trial's 20.

Every metered response tells you which bucket it was charged to. From the
probe:

```text
x-ratelimit-category: sol_read_rpc
x-ratelimit-limit: -1
x-ratelimit-remaining: -1
```

The probe key was on Enterprise, where `-1` means that no per-second cap
applies. On other plans `X-RateLimit-Limit` carries the plan's rate for the
category.

## 2. The backfill program

Save as `backfill.ts` and run `npx tsx backfill.ts <address>`. It writes one
JSON line per transaction to `<address>.jsonl` and keeps its position in
`<address>.state.json`:

```ts
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const KEY = process.env.TRIPORT_API_KEY!;
const ADDRESS = process.argv[2] ?? "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9";
const RPS = Number(process.env.RPS ?? 15);     // stay below your plan's sol_read_rpc
const PAGE = Number(process.env.PAGE ?? 1000); // getSignaturesForAddress allows up to 1,000
const OUT = `${ADDRESS}.jsonl`;
const STATE = `${ADDRESS}.state.json`;

interface State { before?: string; newest?: string; stored: number }
interface SigInfo { signature: string; slot: number; err: unknown; blockTime: number | null }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const state: State = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { stored: 0 };
const save = () => writeFileSync(STATE, JSON.stringify(state));

// One request slot every 1000/RPS ms, shared by both methods.
let nextSlot = 0;
async function pace(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 1000 / RPS;
  if (wait) await sleep(wait);
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  for (;;) {
    await pace();
    const res = await fetch("https://triport.io/sol", {
      method: "POST",
      headers: { "content-type": "application/json", "x-token": KEY },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (res.status === 429) {
      // Other traffic on this key used the budget: back off for the whole program.
      const retry = Number(res.headers.get("retry-after") ?? "1");
      console.warn(`429 on ${method}, pausing ${retry}s`);
      nextSlot = Date.now() + retry * 1000;
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(`${res.status} ${body.error}: ${body.message}`);
    if (body.error) throw new Error(`RPC ${body.error.code}: ${body.error.message}`);
    return body.result as T;
  }
}

async function main(): Promise<void> {
  for (;;) {
    const page = await rpc<SigInfo[]>("getSignaturesForAddress", [
      ADDRESS,
      { limit: PAGE, before: state.before, commitment: "finalized" },
    ]);
    // The very first signature seen is the hand-over point for a live watcher.
    if (!state.newest && page.length) state.newest = page[0].signature;

    for (const s of page) {
      const tx = await rpc<unknown>("getTransaction", [
        s.signature,
        { encoding: "json", maxSupportedTransactionVersion: 1, commitment: "finalized" },
      ]);
      if (tx === null) console.warn(`no body for ${s.signature} (outside the node's history?)`);
      appendFileSync(OUT, JSON.stringify({ ...s, tx }) + "\n");
      state.before = s.signature; // resume strictly after this one
      state.stored++;
      if (state.stored % 100 === 0) save();
    }
    save();
    console.log(`page of ${page.length}, stored ${state.stored}, cursor ${state.before ?? "-"}`);
    if (page.length < PAGE) break; // reached the oldest signature this node returns
  }
  console.log(`done: ${state.stored} transactions; hand over to a live watcher at ${state.newest}`);
}

main().catch((e) => { save(); console.error(e.message); process.exit(1); });
```

Run with `PAGE=3` to watch the loop turn over quickly. From the run against
the default address:

```text
page of 3, stored 3, cursor 3dPG9CWJGPX4nrvdG9RSz6mtZJ4CAdved3V39SKBg1KDcsExSTfpyM3S1GiHqZS4b8Li1efE9XHQyvu4SkETNstn
page of 3, stored 6, cursor 5B7SRxD517gusrJCpGuz2R6Si6Qqp6VuSdz9TEE97qYhyPogH5WYphZ3Dv4G38Pd7b4pV311qnnC79zHZbehBmhJ
```

The state file after those two pages:

```json
{"stored":6,"newest":"51Pr7xvGjDmHZcgfp1de6HRc4dAwXBFSJXvfWWE5KxcqsX9wUKFiLjfyQbY9MZhvi5kdjBDcVUkj9TBX9MmT14RH","before":"5B7SRxD517gusrJCpGuz2R6Si6Qqp6VuSdz9TEE97qYhyPogH5WYphZ3Dv4G38Pd7b4pV311qnnC79zHZbehBmhJ"}
```

Each line in the `.jsonl` file is the `getSignaturesForAddress` entry
(`signature`, `slot`, `err`, `memo`, `blockTime`, `confirmationStatus`,
`transactionIndex`) with the full `getTransaction` result under `tx`.

## 3. Why the program is shaped this way

- **The cursor is the last stored signature.** `before` means "start strictly
  after this one", so saving it after each write makes a restart resume at the
  next transaction. Saving it every 100 writes bounds the rework after a crash
  to at most 100 transactions. If you store rows by signature (an upsert),
  that rework is invisible.
- **`finalized`, not `confirmed`.** A backfill has no reason to read state that
  could still be rolled back. See
  [commitment levels](https://triport.io/learn/glossary/commitment-level).
- **`maxSupportedTransactionVersion: 1`.** Version 1 transactions are on
  mainnet. With `0`, `getTransaction` on one of them returns error `-32015`
  ("Transaction version (1) is not supported by the requesting client"), and a
  loop that throws on errors would stop there.
- **One pacer for both methods.** They share one bucket, so they share one
  schedule. A 429 moves the shared schedule back, instead of each call
  retrying on its own.
- **A stored `newest`.** The first signature of the first page is where history
  ends and live data begins. Start the
  [wallet watcher](./watch-a-solana-wallet.md) with that signature as its
  cursor (`lastSeen`), and its first catch-up covers everything that happened
  during the import.

How `before` and `until` page through the method in general is explained in
[paging getSignaturesForAddress](https://triport.io/learn/getsignaturesforaddress-pagination).

## 4. Errors you will actually see

**HTTP 429** when the key's traffic, the backfill included, goes over the plan
rate. On a Basic key the body is:

```json
{
  "error": "rate_limited",
  "message": "Rate limit reached: your basic plan allows 60 requests/s for sol_read_rpc. Retry in 1s (see the Retry-After header) or upgrade for a higher limit at https://triport.io/app/pricing",
  "current_tier": "basic",
  "category": "sol_read_rpc",
  "limit_rps": 60,
  "burst_capacity": 120,
  "retry_after_sec": 1,
  "upgrade_url": "https://triport.io/app/pricing",
  "docs_url": "https://triport.io/errors/http-429-rate-limit"
}
```

A steady trickle of 429s means `RPS` is set too close to the plan limit, or
something else on the key is busy. Lower `RPS` rather than relying on retries.

**`result: null` from `getTransaction`**: the node has no body for that
signature. The program records the row with `tx: null` and continues. If
many rows come back null, the walk has gone past the node's history; see
[transaction outside the history window](https://triport.io/learn/transaction-outside-history-window).

**An empty first page** for an address you know is active is the same
boundary, seen from the other side; see
[empty address history](https://triport.io/learn/empty-address-history).

**A missing or wrong key**: HTTP 401 with
`{"error":"unauthorized", …, "keys_url":"https://triport.io/app/keys"}`. Fix the
key; the state file keeps your position.

## What this does not do

- **It does not decode transfers.** It stores raw transactions. Balance
  changes are in `meta.preBalances` / `meta.postBalances` and
  `meta.preTokenBalances` / `meta.postTokenBalances`.
- **It does not include token-account activity.** Signatures are listed per
  address. SPL token transfers touch the owner's token accounts, and those
  may not list the wallet itself. Backfill the token accounts too if you need
  them ([associated token account](https://triport.io/learn/glossary/associated-token-account)).
- **It does not go beyond what the node retains.** How far back a walk reaches
  is a property of the history the node keeps, not of your plan.
- **It does not parallelise.** One request at a time keeps the cursor exact,
  but a sequential loop is also bounded by each request's round trip, so on
  higher plans it may not reach `RPS`. To use more of the plan, run several
  workers, give each its own address, and share one pacer between them.

## Related

- Reference: [`getSignaturesForAddress`](../sol/json-rpc/getSignaturesForAddress.md),
  [`getTransaction`](../sol/json-rpc/getTransaction.md),
  [Solana limits](../sol/limits.md).
- Concepts: [pagination cursor](https://triport.io/learn/glossary/pagination-cursor),
  [rate limit](https://triport.io/learn/glossary/rate-limit).
- Next step: [watch the address live](./watch-a-solana-wallet.md).
- Network: [Solana docs overview](../sol/index.md) and the
  [Solana RPC page](https://triport.io/solana-rpc).
- Plans: [pricing](https://triport.io/pricing).
