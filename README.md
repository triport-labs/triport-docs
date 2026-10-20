<p align="center"><img src="https://raw.githubusercontent.com/triport-labs/.github/main/profile/assets/banner-9-networks.png" alt="Triport" width="100%"></p>

# Triport documentation

The public Markdown mirror of Triport's user documentation. Browse the network
references, search this repository, and suggest corrections through issues or PRs.
Each page links to its live website version.

[Website](https://triport.io) · [Docs](https://triport.io/docs) · [X](https://x.com/triport_io) · [Telegram](https://t.me/triport_dev) · [Email](mailto:sales@triport.io)

## Start in one minute

Open [Getting started](docs/getting-started.md), create an API key, and choose a
network below. For a read-only Solana example, set `TRIPORT_API_KEY` in your shell:

```sh
curl 'https://triport.io/sol' \
  -H "x-token: $TRIPORT_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[]}'
```

See the [getSlot reference](docs/sol/json-rpc/getSlot.md) and
[wallet research guide](docs/platform/wallet-research.md) for more examples.

## Documentation sections

| Section | Start here |
|---|---|
| Getting started | [First request](docs/getting-started.md) · [Overview](docs/overview.md) |
| Authentication | [Keys and authentication](docs/authentication.md) |
| Rate limits | [Rate limits and tiers](docs/rate-limits-and-tiers.md) |
| Streaming | [Streaming overview](docs/streaming/index.md) |
| Guides | [Product guides](docs/guides/index.md) |
| Platform API | [Platform API](docs/platform/index.md) · [Console API](docs/console/index.md) |
| Errors | [Error handling](docs/errors.md) |

## Networks

| Network | Documentation | Errors |
|---|---|---|
| Solana | [Reference](docs/sol/index.md) | [Errors](docs/sol/errors.md) |
| Ethereum | [Reference](docs/eth/index.md) | [Errors](docs/eth/errors.md) |
| Polygon | [Reference](docs/polygon/index.md) | [Errors](docs/polygon/errors.md) |
| BNB Smart Chain | [Reference](docs/bsc/index.md) | [Errors](docs/bsc/errors.md) |
| Base | [Reference](docs/base/index.md) | [Errors](docs/base/errors.md) |
| Tron | [Reference](docs/tron/index.md) | [Errors](docs/tron/errors.md) |
| Robinhood Chain | [Reference](docs/robinhood/index.md) | [Errors](docs/robinhood/errors.md) |
| Stellar | [Reference](docs/stellar/index.md) | [Errors](docs/stellar/errors.md) |
| TON | [Reference](docs/ton/index.md) | [Errors](docs/ton/errors.md) |

## Contribute

Send a focused correction as a PR or describe a gap in an issue. The Triport team
carries accepted edits into the source documentation. See
[Contributing](CONTRIBUTING.md) and [Security](SECURITY.md).

## Refresh the mirror

Maintainers use Node.js 20 or later; no dependencies need to be installed:

```sh
node scripts/export.mjs /path/to/docs/api/guide
npm run check
npm test
npm run check-links
```

The exporter replaces the generated `docs/` directory, rewrites website and source
links to local Markdown, and removes private authoring content. The public route
mapping and refresh policy are described in [scripts/README.md](scripts/README.md).
