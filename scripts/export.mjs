#!/usr/bin/env node
import { readdir, readFile, mkdir, writeFile, rm, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { anchors, links, rewriteLinks } from './markdown.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const routeOf = (file) => file.replace(/\.md$/, '').replace(/(?:^|\/)index$/, '');
const ipv4 = /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/;
export function compileDenylist(config = {}) {
  const patterns = (values = []) => values.map((value) => new RegExp(value, 'i'));
  return {
    files: patterns(config.files), pages: patterns(config.pages), content: patterns(config.content),
    sections: patterns(config.sections), tableRows: patterns(config.tableRows),
    listItems: patterns(config.listItems), headings: patterns(config.headings),
    sectionsByFile: Object.fromEntries(Object.entries(config.sectionsByFile ?? {}).map(([file, values]) => [file, patterns(values)])),
    replacements: (config.replacements ?? []).map(({ pattern, replacement }) => [new RegExp(pattern, 'g'), replacement]),
  };
}
const generalRules = compileDenylist();
export async function loadDenylist(file = process.env.TRIPORT_DOCS_DENYLIST) {
  if (!file) {
    console.warn('Warning: no denylist file configured; applying general cleanup only (HTML comments, authoring metadata, IPv4).');
    return generalRules;
  }
  return compileDenylist(JSON.parse(await readFile(file, 'utf8')));
}

export async function walk(dir, prefix = '') {
  const files = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not accepted in the source tree');
    const rel = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await walk(path.join(dir, entry.name), rel + '/'));
    else if (entry.isFile()) files.push(rel);
  }
  return files.sort();
}

export function exclusion(file, text, retired, rules = generalRules) {
  if (file.split('/').some((part) => part.startsWith('_') || part.startsWith('.'))) return 'authoring scaffold';
  if (!file.endsWith('.md')) return 'not a user Markdown page';
  if (rules.files.some((pattern) => pattern.test(file))) return 'excluded method namespace';
  if (rules.pages.some((pattern) => pattern.test(text))) return 'excluded page metadata';
  if (retired[routeOf(file)]) return 'retired website page';
  if (file.includes('+')) return 'unservable website route';
  if (/\|\s*\*{0,2}\s*audience\s*\*{0,2}\s*\|.*operator/i.test(text)) return 'operator audience';
  if (/(?:^|\/)(?:operations|runbook|l1|[^/]*(?:draft|plan|internal)[^/]*)\.md$/i.test(file)) return 'internal operations, plan or draft';
  if (/^\s*(?:draft:\s*true|(?:audience|visibility|status|tier_min):\s*["']?(?:internal|private|draft)\b)/im.test(text)) return 'private or draft metadata';
  return null;
}

export function sanitize(text, file = '', rules = generalRules) {
  const matches = (patterns, value) => patterns.some((pattern) => pattern.test(value));
  const isRestricted = (value) => ipv4.test(value) || matches(rules.content, value);
  const frontMatter = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1] ?? '';
  // All front matter is authoring metadata; public method/tier tables remain.
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
    .replace(/^---\n[\s\S]*?\n---(?:\n|$)/, '').replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  for (const [pattern, replacement] of rules.replacements) text = text.replace(pattern, replacement);
  const privateSections = [...rules.sections, ...(rules.sectionsByFile[file] ?? [])];
  const kept = [];
  let skipDepth = 0;
  let fence = '';
  for (const line of text.split('\n')) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) fence = fence ? '' : marker[1][0];
    const heading = !fence && line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (heading) {
      if (matches(rules.headings, heading[2])) continue;
      if (skipDepth && heading[1].length <= skipDepth) skipDepth = 0;
      if (matches(privateSections, heading[2])) skipDepth = heading[1].length;
    }
    if (!skipDepth) kept.push(line);
  }
  text = kept.join('\n');
  // Remove whole examples if they contain internal hosts/addresses; never leave
  // partial JSON or runnable commands with a silently changed destination.
  text = text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*(?:\n|$)/gm,
    (block) => isRestricted(block) ? '' : block);
  // Table rows and list items form independent blocks, prose is paragraph-based.
  text = text.split(/\n\s*\n/).map((block) => {
    if (/^\s*\|/.test(block)) {
      const rows = block.split('\n').filter((line) => !isRestricted(line)
        && !matches(rules.tableRows, line));
      return rows.length > 2 ? rows.join('\n') : '';
    }
    if (/^\s*[-*] /.test(block)) return block.split(/\n(?=[-*] )/).filter((item) => !isRestricted(item)
      && !matches(rules.listItems, item)).join('\n');
    return isRestricted(block) ? '' : block;
  }).join('\n\n');
  // Preserve public availability caveats even when the authoring front matter
  // is removed, unless the page already presents them in its contract table.
  const publicMeta = [];
  for (const [key, label] of [['availability', 'Availability'], ['tier_min', 'Minimum tier']]) {
    const value = frontMatter.match(new RegExp(`^${key}:\\s*["']?([\\w-]+)`, 'm'))?.[1];
    if (value && !new RegExp(`^\\| ${label} \\|`, 'im').test(text)) publicMeta.push(`${label}: \`${value}\``);
  }
  if (publicMeta.length) text = text.replace(/^(# .+)$/m, `$1\n\n> ${publicMeta.join(' · ')}`);
  // Empty headings can be left behind when a complete example was private.
  let previous;
  do {
    previous = text;
    const lines = text.split('\n');
    let inFence = '';
    text = lines.filter((line, i) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) inFence = inFence ? '' : marker[1][0];
      const heading = !inFence && line.match(/^(#{2,6})\s/);
      if (!heading) return true;
      let next = i + 1;
      while (next < lines.length && !lines[next].trim()) next++;
      if (next === lines.length) return false;
      const following = lines[next].match(/^(#{1,6})\s/);
      return !following || following[1].length > heading[1].length;
    }).join('\n');
  } while (text !== previous);
  return text.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export function addChildIndexes(pages) {
  for (const [file, text] of pages) {
    if (!file.endsWith('/index.md')) continue;
    const directory = path.posix.dirname(file);
    const existing = new Set(links(text).map(({ url }) => path.posix.normalize(path.posix.join(directory, url.split('#')[0]))));
    const children = [];
    for (const [child, body] of pages) {
      if (child === file || !child.startsWith(directory + '/') || existing.has(child)) continue;
      let parent = path.posix.dirname(child);
      if (path.posix.basename(child) === 'index.md') parent = path.posix.dirname(parent);
      let nestedHub = false;
      while (parent.startsWith(directory + '/')) {
        if (pages.has(parent + '/index.md')) { nestedHub = true; break; }
        parent = path.posix.dirname(parent);
      }
      if (nestedHub) continue;
      const title = body.match(/^# (.+)$/m)?.[1] ?? path.posix.basename(child, '.md');
      children.push(`- [${title.replace(/[\[\]]/g, '')}](./${path.posix.relative(directory, child)})`);
    }
    if (children.length) pages.set(file, text.trimEnd() + '\n\n## Pages in this section\n\n' + children.join('\n') + '\n');
  }
}

export async function exportDocs(source, rules = generalRules) {
  source = path.resolve(source);
  const destination = path.join(root, 'docs');
  if (source === destination || source.startsWith(destination + path.sep) || destination.startsWith(source + path.sep)) throw new Error('Source and output must be separate trees');
  const retired = JSON.parse(await readFile(new URL('./retired-routes.json', import.meta.url), 'utf8'));
  const files = await walk(source);
  const pages = new Map();
  const routes = new Map([['', '../README.md']]);
  const excluded = [];
  for (const file of files) {
    const text = file.endsWith('.md') ? await readFile(path.join(source, file), 'utf8') : '';
    const reason = exclusion(file, text, retired, rules);
    if (reason) { excluded.push({ file, reason }); continue; }
    const route = routeOf(file);
    if (routes.has(route)) throw new Error(`Duplicate public route: ${route}`);
    pages.set(file, sanitize(text, file, rules));
    routes.set(route, file);
  }
  addChildIndexes(pages);
  const omittedLinks = [];
  const adjustedAnchors = [];
  const output = new Map();
  for (const [file, text] of pages) {
    const result = rewriteLinks(text, (url) => {
      if (/^(?:mailto:|tel:)/i.test(url)) return url;
      if (url.startsWith('//')) return 'https:' + url;
      const absolute = /^https?:\/\//i.test(url);
      if (absolute && !/^https?:\/\/(?:www\.)?triport\.io\/docs(?:[/?#]|$)/i.test(url)) return url;
      if (!absolute && /^[a-z][\w+.-]*:/i.test(url)) {
        if (/^(?:wss?:|grpc:)/i.test(url)) return url;
        omittedLinks.push({ file, url });
        return '';
      }
      let [target, hash = ''] = url.split('#');
      target = target.split('?')[0];
      let sourceTarget;
      try {
        target = decodeURIComponent(target);
        if (absolute || target.startsWith('/docs')) {
          const route = (absolute ? new URL(target).pathname : target).replace(/^\/docs\/?/, '').replace(/\/$/, '').replace(/\.md$/, '').replace(/\/index$/, '');
          sourceTarget = routes.get(route);
          if (!sourceTarget && retired[route]) sourceTarget = routes.get(retired[route].replace(/^\/docs\/?/, ''));
        } else if (target.startsWith('/')) return `https://triport.io${url}`;
        else {
          const resolved = target ? path.posix.normalize(path.posix.join(path.posix.dirname(file), target)) : file;
          sourceTarget = pages.has(resolved) ? resolved : routes.get(routeOf(resolved));
          if (!sourceTarget && retired[routeOf(resolved)]) sourceTarget = routes.get(retired[routeOf(resolved)].replace(/^\/docs\/?/, ''));
          // The site's spec-copy pipeline publishes contracts and method
          // fixtures under these API directories; no files are copied here.
          if (!sourceTarget && /^\.\.\/(?:json-rpc|streaming|product-rest)\/.+\.(?:json|ya?ml)$/.test(resolved)) return `https://triport.io/api-specs/${resolved.slice(3)}${hash ? '#' + hash : ''}`;
        }
      } catch { sourceTarget = undefined; }
      if (!sourceTarget) {
        omittedLinks.push({ file, url });
        return ''; // Unlinked label stays readable; no invented target.
      }
      if (hash && pages.has(sourceTarget) && !anchors(pages.get(sourceTarget)).has(decodeURIComponent(hash))) {
        adjustedAnchors.push({ file, url });
        hash = ''; // Retain the page link after a private section was removed.
      }
      let rel = path.posix.relative(path.posix.dirname(file), sourceTarget);
      if (!rel.startsWith('.')) rel = './' + rel;
      return rel + (hash ? '#' + hash : '');
    }).replace(/\[([^\]]+)\]\(\)/g, '$1');
    output.set(file, `> Live version: https://triport.io/docs/${routeOf(file)}\n\n${result}`);
  }
  // Compute every page before replacing the generated directory. Refuse a
  // symlink at the output boundary and only remove this fixed output tree.
  try { if ((await lstat(destination)).isSymbolicLink()) throw new Error('Output cannot be a symlink'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await rm(destination, { recursive: true, force: true });
  for (const [file, text] of output) {
    await mkdir(path.dirname(path.join(destination, file)), { recursive: true });
    await writeFile(path.join(destination, file), text);
  }
  return { pages: pages.size, excluded, omittedLinks, adjustedAnchors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (!args[0] || args[0].startsWith('--') || !(args.length === 1 || (args.length === 3 && args[1] === '--denylist' && args[2]))) {
    console.error('Usage: node scripts/export.mjs <path-to-docs/api/guide> [--denylist <file>]');
    process.exitCode = 1;
  } else {
    try {
      const result = await exportDocs(args[0], await loadDenylist(args[2]));
      console.log(JSON.stringify(result, null, 2));
    } catch (e) { console.error(e.message); process.exitCode = 1; }
  }
}
