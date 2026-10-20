#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomInt } from 'node:crypto';
import { walk } from './export.mjs';
import { anchors, links, prose } from './markdown.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));

export function sample(values, count = 30) {
  const shuffled = [...new Set(values)].sort();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export async function checkLinks({ root = repoRoot, external = false, request = fetch } = {}) {
  root = path.resolve(root);
  const files = (await walk(root)).filter((file) => file.endsWith('.md') && !file.startsWith('.git/'));
  const texts = new Map(await Promise.all(files.map(async (file) => [file, await readFile(path.join(root, file), 'utf8')])));
  const failures = [];
  const externalUrls = new Set();
  let relativeLinks = 0;
  for (const [file, text] of texts) {
    // Live-version URLs are bare Markdown text, as well as ordinary links.
    for (const m of prose(text).matchAll(/https:\/\/triport\.io(?:\/[^\s<>"'`)]*)?/g)) {
      try {
        const url = new URL(m[0]);
        url.hash = '';
        if (url.hostname === 'triport.io') externalUrls.add(url.href);
      } catch { failures.push({ file, url: m[0], reason: 'invalid external URL' }); }
    }
    for (const { url } of links(text)) {
      if (/^(?:https?:|mailto:|tel:|wss?:|grpc:|\/\/)/i.test(url)) continue;
      if (/^[a-z][\w+.-]*:/i.test(url)) {
        failures.push({ file, url, reason: 'unrecognized URL scheme' });
        continue;
      }
      relativeLinks++;
      try {
        const [target, hash = ''] = url.split('#');
        const decoded = decodeURIComponent(target.split('?')[0]);
        const full = decoded ? path.resolve(root, path.dirname(file), decoded) : path.join(root, file);
        const rel = path.relative(root, full).replace(/\\/g, '/');
        if (rel.startsWith('../') || path.isAbsolute(rel)) throw new Error('outside repository');
        if (!(await stat(full)).isFile()) throw new Error('target is not a file (use index.md)');
        if (hash && rel.endsWith('.md')) {
          const body = texts.get(rel) ?? await readFile(full, 'utf8');
          if (!anchors(body).has(decodeURIComponent(hash))) throw new Error('missing heading anchor');
        }
      } catch (e) { failures.push({ file, url, reason: e.code === 'ENOENT' ? 'missing file' : e.message }); }
    }
  }
  const head = [];
  if (external) {
    const selected = sample([...externalUrls]);
    if (selected.length < 30) failures.push({ reason: `Need 30 unique Triport links; found ${selected.length}` });
    // One request at a time, no API keys, no redirect following, no retries.
    for (const url of selected) {
      try {
        const response = await request(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(15000) });
        head.push({ url, status: response.status });
        if (response.status !== 200 && (response.status < 300 || response.status >= 400)) failures.push({ url, reason: `HEAD ${response.status}` });
      } catch (e) {
        head.push({ url, error: e.message });
        failures.push({ url, reason: `HEAD failed: ${e.message}` });
      }
    }
  }
  return { pages: files.filter((file) => file.startsWith('docs/')).length,
    markdownFiles: files.length, relativeLinks, brokenLinks: failures.length,
    externalCandidates: externalUrls.size, externalChecked: head.length, head, failures };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--external')) {
    console.error('Usage: node scripts/check-links.mjs [--external]');
    process.exitCode = 1;
  } else {
    try {
      const result = await checkLinks({ external: args.includes('--external') });
      console.log(JSON.stringify(result, null, 2));
      if (result.brokenLinks) process.exitCode = 1;
    } catch (e) { console.error(e.message); process.exitCode = 1; }
  }
}
