import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeOf, exclusion, sanitize as generalSanitize, addChildIndexes, loadDenylist } from './export.mjs';
import { anchors, links, rewriteLinks } from './markdown.mjs';
import { checkLinks, sample } from './check-links.mjs';

const rules = await loadDenylist(new URL('./fixtures/denylist.json', import.meta.url));
const sanitize = (text, file) => generalSanitize(text, file, rules);

test('general cleanup works without a private dictionary', () => {
  const cleaned = generalSanitize('---\nowner: team\n---\n# API\n\n<!-- hidden -->\n\nacme-upstream at edge-zone\n\nHost 127.0.0.1\n');
  assert.match(cleaned, /acme-upstream at edge-zone/);
  assert.doesNotMatch(cleaned, /owner|hidden|127\.0\.0\.1/);
  assert.doesNotMatch(sanitize(cleaned), /acme-upstream|edge-zone/);
});

test('dictionary loading rejects a missing file and malformed configuration', async () => {
  await assert.rejects(loadDenylist(new URL('./fixtures/missing.json', import.meta.url)), { code: 'ENOENT' });
  const dir = await mkdtemp(path.join(tmpdir(), 'triport-docs-rules-'));
  try {
    const file = path.join(dir, 'invalid.json');
    await writeFile(file, '{');
    await assert.rejects(loadDenylist(file), SyntaxError);
    await writeFile(file, '{"content":["["]}');
    await assert.rejects(loadDenylist(file), SyntaxError);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('dictionary loading supports the environment and warns without configuration', async () => {
  const previous = process.env.TRIPORT_DOCS_DENYLIST;
  const warn = console.warn;
  const warnings = [];
  try {
    process.env.TRIPORT_DOCS_DENYLIST = fileURLToPath(new URL('./fixtures/denylist.json', import.meta.url));
    const loaded = await loadDenylist();
    assert.doesNotMatch(generalSanitize('# API\n\nacme-upstream\n', '', loaded), /acme-upstream/);
    delete process.env.TRIPORT_DOCS_DENYLIST;
    console.warn = (message) => warnings.push(message);
    await loadDenylist();
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /general cleanup only/);
  } finally {
    console.warn = warn;
    if (previous === undefined) delete process.env.TRIPORT_DOCS_DENYLIST;
    else process.env.TRIPORT_DOCS_DENYLIST = previous;
  }
});

test('website routes retain method case and collapse directory indexes', () => {
  assert.equal(routeOf('sol/json-rpc/getBalance.md'), 'sol/json-rpc/getBalance');
  assert.equal(routeOf('sol/json-rpc/index.md'), 'sol/json-rpc');
  assert.equal(routeOf('index.md'), '');
});

test('private pages, scaffolds and retired routes are excluded', () => {
  assert.ok(exclusion('_templates/example.md', '', {}));
  assert.ok(exclusion('base/runbook.md', '', {}));
  assert.ok(exclusion('draft.md', '', {}));
  assert.ok(exclusion('x.md', '---\nstatus: draft\n---', {}));
  assert.ok(exclusion('x.md', '---\nvisibility: staff-only\n---', {}, rules));
  assert.ok(exclusion('x.md', '| **Audience** | Operator only |', {}));
  assert.ok(exclusion('x.md', '', { x: '/docs/getting-started' }));
  assert.equal(exclusion('x.md', '| **Audience** | Public |', {}), null);
  const brandedName = 'acme-upstream_method';
  assert.ok(exclusion(`eth/json-rpc/${brandedName}.md`, '', {}, rules));
  assert.ok(!sanitize('# API\n\nA reference to `' + brandedName + '`.\n').includes(brandedName));
});

test('cleanup removes comments, private sections and complete unsafe examples', () => {
  const source = '---\nowner: team\n---\n# Method\n\n<!-- private -->\n\n## Internal notes\nHidden\n### More\nHidden too\n\n## Request\n\n```json\n{"endpoint":"127.0.0.1:8080"}\n```\n\n```json\n{"method":"getSlot","params":[]}\n```\n\n| Field | Value |\n|---|---|\n| Scope | read |\n| Host | 127.0.0.1 |\n';
  const cleaned = sanitize(source);
  assert.ok(!/owner|private|Hidden|127\.0\.0\.1/.test(cleaned));
  assert.match(cleaned, /"method":"getSlot"/);
  assert.match(cleaned, /\| Scope \| read \|/);
  assert.equal(sanitize(cleaned), cleaned);
});

test('link scanner handles nested labels, titles, references, HTML and code', () => {
  const text = '[README.md](README.md)\n[`call`](../call.md#params "Call")\n[ref]: <page.md>\n<a href="next.md">next</a>\n![image](asset.svg)\n[Array[T]](array.md)\n`[fake](no.md)`\n```md\n[example](missing.md)\n```\n';
  assert.deepEqual(links(text).map((x) => x.url), ['README.md', '../call.md#params', 'page.md', 'next.md', 'asset.svg', 'array.md']);
  assert.match(rewriteLinks(text, (url) => 'local/' + url), /^\[README.md\]\(local\/README.md\)/);
  assert.ok(rewriteLinks(text, (url) => 'local/' + url).includes('[example](missing.md)'));
});

test('website-generated child navigation is supplied locally without duplicate entries', () => {
  const pages = new Map([
    ['sol/index.md', '# Solana\n'], ['sol/json-rpc/index.md', '# JSON-RPC\n[Existing](./getSlot.md)\n'],
    ['sol/json-rpc/getSlot.md', '# getSlot\n'], ['sol/json-rpc/getBalance.md', '# getBalance\n'],
  ]);
  addChildIndexes(pages);
  assert.match(pages.get('sol/index.md'), /\.\/json-rpc\/index\.md/);
  assert.ok(!pages.get('sol/index.md').includes('getBalance'));
  assert.match(pages.get('sol/json-rpc/index.md'), /\.\/getBalance\.md/);
  assert.equal(pages.get('sol/json-rpc/index.md').match(/getSlot\.md/g).length, 1);
});

test('cleanup preserves public availability from front matter', () => {
  const cleaned = sanitize('---\navailability: "unknown"\ntier_min: "pro"\nvalidation: "documented"\n---\n# Feed\n\nPublic content.\n');
  assert.match(cleaned, /Availability: `unknown`/);
  assert.match(cleaned, /Minimum tier: `pro`/);
  assert.ok(!cleaned.includes('validation'));
});

test('cleanup keeps parent headings and replaces credential-shaped examples', () => {
  const cleaned = sanitize('# API\n\n## Examples\n\n### JavaScript\n\n```js\nconst key = "tri_live_1234567890abcdef1234567890abcdef";\n```\n\n## Empty\n\n## Notes\n\nPublic.\n');
  assert.match(cleaned, /## Examples/);
  assert.ok(!cleaned.includes('## Empty'));
  assert.ok(!cleaned.includes('1234567890abcdef'));
  assert.match(cleaned, /tri_live_your_key_here/);
});

test('GitHub anchors preserve code words, punctuation and duplicate headings', () => {
  const ids = anchors('# `eth_getLogs`\n## Source, proto & delivery semantics\n## Repeat\n## Repeat\n```md\n# Fake\n```');
  assert.deepEqual([...ids], ['eth_getlogs', 'source-proto--delivery-semantics', 'repeat', 'repeat-1']);
});

test('checker catches missing files, anchors and paths escaping the repository', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'triport-docs-links-'));
  try {
    await mkdir(path.join(root, 'docs'));
    await writeFile(path.join(root, 'docs', 'index.md'), '# Method\n');
    await writeFile(path.join(root, 'README.md'), '[good](docs/index.md#method)\n[bad](missing.md)\n[fragment](docs/index.md#absent)\n[escape](../outside.md)\n');
    const result = await checkLinks({ root });
    assert.equal(result.relativeLinks, 4);
    assert.equal(result.brokenLinks, 3);
    assert.equal(result.externalChecked, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('external mode samples exactly 30 distinct URLs and uses only HEAD without following redirects', async () => {
  assert.equal(new Set(sample(Array.from({ length: 50 }, (_, i) => String(i)))).size, 30);
  const root = await mkdtemp(path.join(tmpdir(), 'triport-docs-head-'));
  try {
    await writeFile(path.join(root, 'README.md'), Array.from({ length: 35 }, (_, i) => `> Live version: https://triport.io/docs/page-${i}`).join('\n'));
    let calls = 0;
    const result = await checkLinks({ root, external: true, request: async (url, options) => {
      assert.equal(new URL(url).hostname, 'triport.io');
      assert.equal(options.method, 'HEAD');
      assert.equal(options.redirect, 'manual');
      calls++;
      return { status: calls === 1 ? 404 : 301 };
    } });
    assert.equal(calls, 30);
    assert.equal(result.externalChecked, 30);
    assert.equal(result.brokenLinks, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
