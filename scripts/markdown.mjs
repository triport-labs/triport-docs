// Small Markdown link scanner shared by the exporter and offline checker.
// Masks examples, so code samples are never mistaken for navigation.
export function prose(text, maskInline = true) {
  const unfenced = text.replace(/^( {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[^\n]*(?:\n|$)/gm,
    (s) => s.replace(/[^\n]/g, ' '));
  return maskInline ? unfenced.replace(/(`+)[^\n]*?\1/g, (s) => ' '.repeat(s.length)) : unfenced;
}

export function links(text) {
  const masked = prose(text);
  const found = [];
  const patterns = [
    /!?\[(?:[^\[\]\n]|\[[^\]\n]*\])*\]\(\s*(<[^>\n]+>|[^\s()]*(?:\([^\n()]*\)[^\s()]*)*)(?:\s+["'][^\n]*?["'])?\s*\)/gd,
    /^ {0,3}\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)/gmd,
    /\b(?:href|src)\s*=\s*["']([^"']+)["']/gid,
    /<(https?:\/\/[^>\s]+)>/gd,
  ];
  for (const pattern of patterns) {
    for (const m of masked.matchAll(pattern)) {
      const raw = m[1];
      if (!raw) continue;
      const url = raw.startsWith('<') ? raw.slice(1, -1) : raw;
      const start = m.indices[1][0] + (raw.startsWith('<') ? 1 : 0);
      found.push({ url, start, end: start + url.length });
    }
  }
  return found.sort((a, b) => a.start - b.start).filter((x, i, a) => !i || x.start >= a[i - 1].end);
}

export function rewriteLinks(text, rewrite) {
  for (const link of links(text).reverse()) {
    text = text.slice(0, link.start) + rewrite(link.url) + text.slice(link.end);
  }
  return text;
}

export function anchors(text) {
  const ids = new Set();
  const counts = new Map();
  for (const m of prose(text, false).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm)) {
    const base = m[1].replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '')
      .toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
    const n = counts.get(base) ?? 0;
    ids.add(n ? `${base}-${n}` : base);
    counts.set(base, n + 1);
  }
  for (const m of text.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) ids.add(m[1]);
  return ids;
}
