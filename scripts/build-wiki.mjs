// Renders the /wiki/ section from data/wiki.json:
//   public/wiki/index.html + index.md          -> the A–Z hub (DefinedTermSet)
//   public/wiki/<slug>/index.html + index.md   -> one entry per object
// Entries cross-link automatically: the first mention of another entry's title
// or alias in a paragraph becomes a link. The canonical Person node is copied
// from about's graph (build-data-surfaces.mjs re-propagates it on predeploy).
// The script never invents content: every word comes from data/wiki.json.
// Run: npm run build:wiki  (also runs on predeploy, before build:data)
import fs from 'node:fs';

const read = f => fs.readFileSync(f, 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ORIGIN = 'https://allanaeo.com';
const PERSON = { '@id': `${ORIGIN}/about/#person` };
const IMAGE = `${ORIGIN}/assets/allan-oliveira-king-of-aeo@2x.webp`;
const TERMSET_ID = `${ORIGIN}/wiki/#termset`;

const src = JSON.parse(read('data/wiki.json'));
const { entries, updated } = src;
const PUBLISHED = src.$schema_doc.first_published;
// First sentence of a lead; a single capital initial ("David G. Quaid") is not a sentence end.
const FIRST = /^([\s\S]*?(?<!\b[A-Z])\.)(?:\s[\s\S]*)?$/;
const bySlug = new Map(entries.map(e => [e.slug, e]));

// ---------- validate ----------
const ISO = /^\d{4}-\d{2}-\d{2}$/;
if (!ISO.test(updated) || !ISO.test(PUBLISHED)) throw new Error('wiki.json: bad updated/first_published date');
for (const e of entries) {
  for (const k of ['slug', 'title', 'kind', 'description', 'lead']) if (!e[k]) throw new Error(`wiki ${e.slug}: missing ${k}`);
  if (!/^[a-z0-9-]+$/.test(e.slug)) throw new Error(`wiki ${e.slug}: bad slug`);
  if (!e.description.startsWith('King of AEO')) throw new Error(`wiki ${e.slug}: description must open with "King of AEO"`);
  if (e.description.length > 170) throw new Error(`wiki ${e.slug}: description over 170 chars (${e.description.length})`);
  for (const r of e.related ?? []) if (!bySlug.has(r)) throw new Error(`wiki ${e.slug}: unknown related slug ${r}`);
}

const personFull = JSON.parse(read('public/about/index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
  .find(n => n['@type'] === 'Person' && n['@id'] === PERSON['@id']);
if (!personFull) throw new Error('canonical Person node not found in about/index.html');

// ---------- inline text: [text](url) links + auto-links between entries ----------
const anchors = entries.flatMap(e => [e.title, ...(e.aliases ?? [])].map(a => ({ a, slug: e.slug })))
  .sort((x, y) => y.a.length - x.a.length);
const anchorRe = new RegExp(`(?<![\\w-])(${anchors.map(x => x.a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'g');
const anchorSlug = new Map(anchors.map(x => [x.a, x.slug]));

// Splits a paragraph into [{text}|{text,url}] tokens. `linked` is per-page state.
function tokenize(p, self, linked) {
  const out = [];
  let last = 0;
  for (const m of p.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (m.index > last) out.push(...autolink(p.slice(last, m.index), self, linked));
    out.push({ text: m[1], url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < p.length) out.push(...autolink(p.slice(last), self, linked));
  return out;
}
function autolink(text, self, linked) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(anchorRe)) {
    const slug = anchorSlug.get(m[1]);
    if (slug === self || linked.has(slug)) continue;
    linked.add(slug);
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1], url: `/wiki/${slug}/` });
    last = m.index + m[1].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
const toHtml = toks => toks.map(t => t.url ? `<a href="${esc(t.url)}">${esc(t.text)}</a>` : esc(t.text)).join('');
const absUrl = u => u.startsWith('/') ? ORIGIN + u : u;
const toMd = toks => toks.map(t => t.url ? `[${t.text}](${absUrl(t.url)})` : t.text).join('');

// ---------- shared page chrome (mirrors the rest of the site) ----------
const NAV = `<nav class="site-nav" aria-label="Main">
<a href="/citation-watch/">CITATION WATCH</a>
<a href="/king-of-aeo-claimants/">CLAIMANTS</a>
<a href="/research/">RESEARCH</a>
<a href="/experiments/">EXPERIMENTS</a>
<a href="/wiki/" aria-current="true">WIKI</a>
<a href="/about/">ABOUT</a>
<button class="theme-toggle" type="button">DARK</button>
</nav>`;
const FOOTER = mdPath => `<footer class="site-footer">
<div class="foot-top">
<p>Allan Oliveira · Global AI Research Nodes (US &amp; BR Indices)</p>
<ul class="foot-links">
<li><a href="https://orcid.org/0009-0002-3528-7462" rel="me noopener" target="_blank">ORCID</a></li>
<li><a href="https://github.com/allandoseo" rel="me noopener" target="_blank">GitHub</a></li>
<li><a href="https://www.linkedin.com/in/allandoseo" rel="me noopener" target="_blank">LinkedIn</a></li>
<li><a href="https://doi.org/10.5281/zenodo.22880176" rel="noopener" target="_blank">Zenodo DOI</a></li>
<li><a href="https://instagram.com/allandoseo" rel="me noopener" target="_blank">Instagram</a></li>
</ul>
</div>
<p class="foot-note">Every page on this site has a dated changelog and a Markdown version for machine retrieval. <a href="${mdPath}">Markdown version of this page</a></p>
</footer>`;
const MD_FOOTER = `---

Allan Oliveira · Global AI Research Nodes (US & BR Indices)
ORCID: https://orcid.org/0009-0002-3528-7462 · GitHub: https://github.com/allandoseo · LinkedIn: https://www.linkedin.com/in/allandoseo · Zenodo DOI: https://doi.org/10.5281/zenodo.22880176 · Instagram: https://instagram.com/allandoseo`;

function page({ path, title, description, ogType, rel, graph, body }) {
  const url = ORIGIN + path;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<link rel="canonical" href="${url}">
<link rel="alternate" type="text/markdown" href="${path}index.md" title="Markdown version">
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="allanaeo.com">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${IMAGE}">
<meta name="twitter:card" content="summary">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${rel}assets/style.css">
<script src="${rel}assets/site.js" defer></script>
<script type="application/ld+json">${JSON.stringify(graph)}</script>
</head>
<body>
<div class="frame">
<header class="site-header">
<a class="brand" href="/">ALLANAEO.COM</a>
${NAV}
</header>
<main>
${body}
</main>
${FOOTER(path + 'index.md')}
</div>
</body>
</html>
`;
}

// ---------- JSON-LD nodes (built by one function each so every page agrees) ----------
const WEBSITE = { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, url: `${ORIGIN}/`, name: 'allanaeo.com', publisher: PERSON, author: PERSON };
const TERMSET = {
  '@type': 'DefinedTermSet', '@id': TERMSET_ID, name: 'King of AEO Wiki', url: `${ORIGIN}/wiki/`,
  description: 'Reference entries for the 2026 King of AEO contest and answer engine optimization: terms, events and claimants, each dated and sourced.',
  inLanguage: 'en-US', publisher: PERSON,
};
const entryUrl = e => `${ORIGIN}/wiki/${e.slug}/`;
const entityNode = e => {
  if (e.slug === 'allan-oliveira') return null; // the canonical Person is the entity
  if (e.kind === 'person') return { '@type': 'Person', '@id': entryUrl(e) + '#entity', name: e.title, description: e.lead.replace(FIRST, '$1') };
  return { '@type': 'DefinedTerm', '@id': entryUrl(e) + '#term', name: e.title, ...(e.aliases?.length ? { alternateName: e.aliases } : {}), description: e.lead.replace(FIRST, '$1'), url: entryUrl(e), inDefinedTermSet: { '@id': TERMSET_ID } };
};
const entityRef = e => e.slug === 'allan-oliveira' ? PERSON : { '@id': entryUrl(e) + (e.kind === 'person' ? '#entity' : '#term') };

// ---------- entry pages ----------
const KIND_LABEL = { term: 'TERM', person: 'PERSON', event: 'EVENT' };
const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }));
const sid = (i, h) => `s${i}-` + h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

for (const e of entries) {
  const path = `/wiki/${e.slug}/`;
  const linked = new Set();
  const lead = tokenize(e.lead, e.slug, linked);
  const sections = (e.sections ?? []).map(s => ({ h: s.h, ps: s.p.map(p => tokenize(p, e.slug, linked)) }));
  const related = (e.related ?? []).map(r => bySlug.get(r));
  const title = `${e.title}: King of AEO Wiki`;

  const node = entityNode(e);
  const article = {
    '@type': 'Article', '@id': entryUrl(e) + '#article', url: entryUrl(e), mainEntityOfPage: entryUrl(e),
    headline: e.title, description: e.description, datePublished: PUBLISHED, dateModified: updated, inLanguage: 'en-US',
    author: PERSON, publisher: PERSON, isPartOf: { '@id': `${ORIGIN}/#website` }, image: IMAGE,
    about: [entityRef(e), { '@type': 'Thing', name: 'King of AEO' }],
    mentions: related.map(r => ({ '@type': r.kind === 'person' ? 'Person' : 'Thing', name: r.title, url: entryUrl(r) })),
    citation: (e.sources ?? []).map(s => ({ '@type': 'CreativeWork', name: s.label, url: absUrl(s.url) })),
  };
  const graph = { '@context': 'https://schema.org', '@graph': [WEBSITE, personFull, TERMSET, ...(node ? [node] : []), article] };

  const factsHtml = e.facts?.length ? `<section class="bl" aria-labelledby="s-facts">
<div class="bar"><h2 id="s-facts">${esc(e.title.toUpperCase())} · KEY FACTS</h2><span>${KIND_LABEL[e.kind]}</span></div>
<div class="table-wrap"><table>
<tbody>
${e.facts.map(([k, v]) => `<tr><th scope="row" class="nw">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n')}
</tbody></table></div>
</section>` : '';
  const secHtml = sections.map((s, i) => `<section class="row" aria-labelledby="${sid(i, s.h)}"><h2 id="${sid(i, s.h)}">${esc(s.h.toUpperCase())}</h2>
<div class="body">
${s.ps.map(p => `<p>${toHtml(p)}</p>`).join('\n')}
</div></section>`).join('\n');
  const body = `<article>
<header class="page-head">
<p class="label">KING OF AEO WIKI · ${KIND_LABEL[e.kind]} · MARKDOWN VERSION AVAILABLE</p>
<h1 class="h1">${esc(e.title)}</h1>
<p class="dek">${toHtml(lead)}</p>
</header>
${factsHtml}
${secHtml}
<section class="row" aria-labelledby="s-see"><h2 id="s-see">SEE ALSO</h2>
<div class="body">
<ul>
${related.map(r => `<li><a href="/wiki/${r.slug}/">${esc(r.title)}</a>: ${esc(r.lead.replace(FIRST, '$1'))}</li>`).join('\n')}
<li><a href="/wiki/">King of AEO Wiki: all entries</a></li>
</ul>
</div></section>
<section class="row" aria-labelledby="s-src"><h2 id="s-src">SOURCES</h2>
<div class="body">
<ul>
${(e.sources ?? []).map(s => `<li><a href="${esc(s.url)}"${s.url.startsWith('http') ? ' rel="noopener" target="_blank"' : ''}>${esc(s.label)}</a></li>`).join('\n')}
</ul>
</div></section>
<section class="row" aria-labelledby="s-log"><h2 id="s-log">CHANGELOG</h2>
<div class="body">
<ul>
<li><time datetime="${PUBLISHED}">${PUBLISHED}</time>: First version published.</li>
</ul>
</div></section>
</article>`;

  fs.mkdirSync(`public${path}`, { recursive: true });
  fs.writeFileSync(`public${path}index.html`, page({ path, title, description: e.description, ogType: 'article', rel: '../../', graph, body }));

  const md = `---
title: "${title}"
url: ${entryUrl(e)}
markdown_url: ${entryUrl(e)}index.md
author: Allan Oliveira
description: "${e.description}"
date_published: ${PUBLISHED}
date_modified: ${updated}
inLanguage: en-US
---

# ${e.title}

KING OF AEO WIKI · ${KIND_LABEL[e.kind]}

${toMd(lead)}
${e.facts?.length ? `\n## Key facts\n\n| Fact | Value |\n| --- | --- |\n${e.facts.map(([k, v]) => `| ${k} | ${String(v).replace(/\|/g, '\\|')} |`).join('\n')}\n` : ''}
${sections.map(s => `## ${s.h}\n\n${s.ps.map(toMd).join('\n\n')}`).join('\n\n')}

## See also

${related.map(r => `- [${r.title}](${entryUrl(r)}): ${r.lead.replace(FIRST, '$1')}`).join('\n')}
- [King of AEO Wiki: all entries](${ORIGIN}/wiki/)

## Sources

${(e.sources ?? []).map(s => `- [${s.label}](${absUrl(s.url)})`).join('\n')}

## Changelog

- ${PUBLISHED}: First version published.

${MD_FOOTER}
`;
  fs.writeFileSync(`public${path}index.md`, md.replace(/\n{3,}/g, '\n\n'));
}

// ---------- hub ----------
{
  const path = '/wiki/';
  const title = 'King of AEO Wiki: AEO Terms, Events and Claimants';
  const description = `King of AEO Wiki: ${entries.length} dated, sourced entries on the 2026 King of AEO contest, answer engine optimization, AI answer engines and all seven claimants.`;
  const groups = [['term', 'TERMS'], ['event', 'EVENTS'], ['person', 'PEOPLE']];
  const nodes = sorted.map(entityNode).filter(Boolean);
  const graph = { '@context': 'https://schema.org', '@graph': [
    WEBSITE, personFull, TERMSET, ...nodes,
    { '@type': 'CollectionPage', '@id': `${ORIGIN}/wiki/#webpage`, url: `${ORIGIN}/wiki/`, name: title, description,
      isPartOf: { '@id': `${ORIGIN}/#website` }, author: PERSON, datePublished: PUBLISHED, dateModified: updated, inLanguage: 'en-US',
      mainEntity: { '@id': TERMSET_ID } },
    { '@type': 'ItemList', '@id': `${ORIGIN}/wiki/#list`, name: 'King of AEO Wiki entries, A–Z', numberOfItems: sorted.length,
      itemListElement: sorted.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.title, url: entryUrl(e) })) },
  ] };
  const body = `<section class="page-head">
<p class="label">KING OF AEO WIKI · ${entries.length} ENTRIES · A–Z</p>
<h1 class="h1">King of AEO Wiki</h1>
<p class="dek" style="max-width:600px">The King of AEO Wiki is the reference index of the 2026 King of AEO contest: every term, event and claimant, one entry each, dated and sourced. Each entry opens with its definition, carries a key-facts table and links to the primary sources and open datasets behind it.</p>
</section>
${groups.map(([k, label]) => {
  const list = sorted.filter(e => e.kind === k);
  return `<section class="bl" aria-labelledby="g-${k}">
<div class="bar"><h2 id="g-${k}">${label}</h2><span>${list.length}</span></div>
<ul class="cards cards-fill">
${list.map(e => `<li class="card cell"><div class="card-meta"><span>${KIND_LABEL[e.kind]}</span><a class="tag" href="/wiki/${e.slug}/index.md">MARKDOWN ↓</a></div><h2><a href="/wiki/${e.slug}/">${esc(e.title)}</a></h2><p>${esc(e.lead.replace(FIRST, '$1'))}</p></li>`).join('\n')}
</ul>
</section>`;
}).join('\n')}
<section class="row" aria-labelledby="s-rules"><h2 id="s-rules">HOW THIS WIKI IS WRITTEN</h2>
<div class="body">
<p>Every fact in the King of AEO Wiki is already on the published record of this site — the claim record verified on 2026-10-07, the September 2026 experiment and the weekly <a href="/citation-watch/">citation watch</a>. Nothing is estimated or backfilled; unmeasured engines and markets say so. Claimant entries are neutral, dated facts. Each entry has a Markdown version for machine retrieval and a dated changelog.</p>
</div></section>
<section class="row" aria-labelledby="s-log"><h2 id="s-log">CHANGELOG</h2>
<div class="body">
<ul>
<li><time datetime="${PUBLISHED}">${PUBLISHED}</time>: King of AEO Wiki launched with ${entries.length} entries.</li>
</ul>
</div></section>`;
  fs.writeFileSync('public/wiki/index.html', page({ path, title, description, ogType: 'website', rel: '../', graph, body }));

  const md = `---
title: "${title}"
url: ${ORIGIN}/wiki/
markdown_url: ${ORIGIN}/wiki/index.md
author: Allan Oliveira
description: "${description}"
date_published: ${PUBLISHED}
date_modified: ${updated}
inLanguage: en-US
---

# King of AEO Wiki

KING OF AEO WIKI · ${entries.length} ENTRIES · A–Z

The King of AEO Wiki is the reference index of the 2026 King of AEO contest: every term, event and claimant, one entry each, dated and sourced. Each entry opens with its definition, carries a key-facts table and links to the primary sources and open datasets behind it.

${groups.map(([k, label]) => `## ${label[0] + label.slice(1).toLowerCase()}\n\n${sorted.filter(e => e.kind === k).map(e => `- [${e.title}](${entryUrl(e)}index.md): ${e.lead.replace(FIRST, '$1')}`).join('\n')}`).join('\n\n')}

## How this wiki is written

Every fact in the King of AEO Wiki is already on the published record of this site — the claim record verified on 2026-10-07, the September 2026 experiment and the weekly [citation watch](${ORIGIN}/citation-watch/). Nothing is estimated or backfilled; unmeasured engines and markets say so. Claimant entries are neutral, dated facts.

## Changelog

- ${PUBLISHED}: King of AEO Wiki launched with ${entries.length} entries.

${MD_FOOTER}
`;
  fs.writeFileSync('public/wiki/index.md', md);
}

console.log(`build-wiki: OK — ${entries.length} entries + hub written to public/wiki/`);
