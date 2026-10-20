# Contributing

Found an unclear example, a broken link or a documentation gap? Open an issue
with the page and a description, or submit a pull request editing the Markdown
in `docs/`. Please keep changes focused and use placeholders for credentials.

The Triport team reviews PRs and carries accepted corrections into the source
documentation that powers the website. This repository is a generated public
mirror; the next export includes those source corrections.

With Node.js 20 or later, validate a change without installing dependencies:

```sh
npm run check
npm test
npm run check-links
```

The optional `npm run check-links:external` command also sends HEAD requests to
30 randomly selected website links. CI runs the offline checks.

Maintainers regenerate the mirror from a separate guide source tree with:

```sh
node scripts/export.mjs /path/to/guide --denylist /path/to/private-rules.json
```

`TRIPORT_DOCS_DENYLIST` can supply the rules file instead. Keep that file outside
this repository. Without it the exporter warns and applies only general cleanup
for HTML comments, authoring metadata and IPv4 addresses. Tests use a synthetic
dictionary in `scripts/fixtures/denylist.json`.

See [SECURITY.md](SECURITY.md) for private vulnerability reports.
