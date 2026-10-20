# Mirror maintenance

Run `node scripts/export.mjs <guide-directory>` from any working directory with
Node.js 20 or later. The destination is always this repository's `docs/` tree.
The exporter reads the source without changing it. Repeating an export with the
same input produces identical bytes and removes stale generated pages.

The website's documentation tree maps `guide/<path>.md` to `/docs/<path>` and
`guide/<directory>/index.md` to `/docs/<directory>`. Paths retain their case.
Each exported page begins with its canonical live URL. GitHub links explicitly
name `.md` files, including directory indexes.

The exporter excludes authoring scaffolds, non-Markdown inputs, private/draft
metadata, operator pages, operational runbooks and retired website pages.
`retired-routes.json` is a snapshot of the website's retired-route redirect table
as of 2026-10-20. Maintainers should refresh it from the website routing source
when refreshing this mirror. It contains public route destinations only.

HTML comments, front matter, private notes, internal measurements and restricted
infrastructure details are removed. Affected prose paragraphs, table rows, list
items or complete code examples are omitted rather than partially edited.
Public API examples, schemas, scopes, availability and tier caveats remain when
they do not contain private authoring details.
Public availability and minimum-tier fields are rendered as readable metadata
when they are not already present in a page's contract table. Directory indexes
receive missing child-page links that the website normally generates at build.

Links to retired pages follow their website redirect to an exported page.
Public machine-readable contracts and method fixtures link to the website's
`/api-specs/` surface. Links to excluded pages and malformed URLs retain readable
labels.
Anchors removed during cleanup fall back to the containing page; the export
summary lists omitted links and adjusted anchors for source review.

`node scripts/check-links.mjs` checks local Markdown, reference-style and HTML
links, image targets and heading fragments, ignoring fenced and inline examples.
It exits unsuccessfully on missing files, missing headings or escaped repository
paths. `--external` additionally chooses 30 unique website URLs at random and
performs one HEAD request per URL, accepting HTTP 200–399. Redirects are not
followed. This optional network check runs locally; PR CI stays offline.
