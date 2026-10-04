// Validates the JSON-LD of every built page in public/.
// Exit 1 on any error. Usage: node scripts/validate-schema.mjs [--no-network]
//
// Severity model:
// - ERROR: the ten rules below, applied to ids on allanaeo.com. For rule 2,
//   only fragment ids (#...) must be materialized in the same document;
//   a path URL @id (e.g. https://allanaeo.com/about/) dereferences on its own
//   and an @id on a third-party domain cannot be defined here without
//   inventing data, so both downgrade to WARNING.
// - WARNING: external/path-URL refs, and non-2xx/3xx third-party URLs
//   (listed for a human; never auto-fixed).
import fs from 'node:fs';
import path from 'node:path';

const NO_NETWORK = process.argv.includes('--no-network');
const PERSON_ID = 'https://allanaeo.com/about/#person';
const TODAY = new Date().toISOString().slice(0, 10);

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') pages.push(p.replace(/\\/g, '/'));
  }
})('public');
pages.sort();

const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
const normText = s => decode(s).replace(/\s+/g, ' ').trim();

const report = {}; // page -> {errors:[], warnings:[]}
const err = (p, m) => report[p].errors.push(m);
const warn = (p, m) => report[p].warnings.push(m);
const defsAcross = {}; // id -> [{page, json}]
const urlChecks = new Map(); // url -> Set(pages)

for (const page of pages) {
  report[page] = { errors: [], warnings: [] };
  const html = fs.readFileSync(page, 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { err(page, 'nenhum bloco JSON-LD'); continue; }
  const visible = normText(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' '));

  const graphs = [];
  for (const [i, b] of blocks.entries()) {
    try { graphs.push(JSON.parse(b[1])); }
    catch (e) { err(page, `JSON invalido (bloco ${i + 1}): ${e.message}`); } // rule 1
  }

  const defined = new Map(); // id -> json
  const referenced = new Set();
  const langs = new Set();
  const nodes = [];
  const walkNode = o => {
    if (Array.isArray(o)) return o.forEach(walkNode);
    if (o && typeof o === 'object') {
      const propKeys = Object.keys(o).filter(k => k !== '@id' && k !== '@type');
      if (o['@id']) {
        if (propKeys.length) {
          if (defined.has(o['@id']) && defined.get(o['@id']) !== JSON.stringify(o))
            err(page, `@id definido duas vezes com conteudo diferente no mesmo documento: ${o['@id']}`);
          defined.set(o['@id'], JSON.stringify(o));
          (defsAcross[o['@id']] ??= []).push({ page, json: JSON.stringify(o) });
        } else referenced.add(o['@id']);
      }
      if (o['@type']) nodes.push(o);
      if (o.inLanguage) (Array.isArray(o.inLanguage) ? o.inLanguage : [o.inLanguage]).forEach(l => langs.add(l));
      for (const key of ['sameAs', 'url', 'contentUrl']) {
        const v = o[key];
        for (const u of (Array.isArray(v) ? v : [v]))
          if (typeof u === 'string' && /^https?:\/\//.test(u)) (urlChecks.get(u) ?? urlChecks.set(u, new Set()).get(u)).add(page);
      }
      if (o.citation) (Array.isArray(o.citation) ? o.citation : [o.citation]).forEach(c => {
        if (c && typeof c.url === 'string') (urlChecks.get(c.url) ?? urlChecks.set(c.url, new Set()).get(c.url)).add(page);
      });
      for (const k of Object.keys(o)) if (k !== '@id') walkNode(o[k]);
    }
  };
  graphs.forEach(g => (g['@graph'] ?? [g]).forEach(walkNode));

  // rule 2
  for (const id of referenced) {
    if (defined.has(id)) continue;
    const internal = id.startsWith('https://allanaeo.com/');
    const isFragment = id.includes('#');
    if (internal && isFragment) err(page, `@id referenciado mas nao definido por extenso neste documento: ${id}`);
    else warn(page, `ref ${internal ? 'a URL de pagina' : 'externa'} nao definida neste documento: ${id}`);
  }
  // rule 4
  const person = defined.get(PERSON_ID) && JSON.parse(defined.get(PERSON_ID));
  if (!person || !person.name) err(page, `no Person canonico ${PERSON_ID} nao materializado`);
  // rule 5
  if (langs.size > 1) err(page, `inLanguage com mais de um valor: ${[...langs].join(', ')}`);
  // rules 6, 7, 8, 9
  for (const n of nodes) {
    const types = Array.isArray(n['@type']) ? n['@type'] : [n['@type']];
    if (n.dateModified && n.datePublished && n.dateModified < n.datePublished)
      err(page, `${types[0]}: dateModified (${n.dateModified}) anterior a datePublished (${n.datePublished})`);
    if (n.dateModified && /^\d{4}-\d{2}-\d{2}/.test(n.dateModified)) {
      const age = (Date.parse(TODAY) - Date.parse(n.dateModified.slice(0, 10))) / 86400000;
      if (age > 30) err(page, `${types[0]}: dateModified com mais de 30 dias (${n.dateModified})`);
    }
    if (types.some(t => t === 'Article' || t === 'TechArticle') && Object.keys(n).length > 2)
      for (const k of ['headline', 'author', 'datePublished', 'image'])
        if (!(k in n)) err(page, `${types[0]} sem ${k}`);
    if (types.includes('Dataset') && Object.keys(n).length > 2)
      for (const k of ['distribution', 'license', 'creator', 'temporalCoverage'])
        if (!(k in n)) err(page, `Dataset ${n['@id'] ?? ''} sem ${k}`);
    if (types.includes('Question')) {
      const a = n.acceptedAnswer && n.acceptedAnswer.text;
      if (a && !visible.includes(normText(a))) err(page, `acceptedAnswer nao aparece no HTML visivel: "${String(a).slice(0, 60)}..."`);
      if (n.name && !visible.includes(normText(n.name))) err(page, `texto da Question nao aparece no HTML visivel: "${n.name}"`);
    }
  }
}

// rule 3 (across pages)
for (const [id, defs] of Object.entries(defsAcross)) {
  const variants = [...new Set(defs.map(d => d.json))];
  if (variants.length > 1)
    for (const d of defs) err(d.page, `@id ${id} definido com conteudo divergente entre paginas (${variants.length} variantes)`);
}

// rule 10 (network)
if (!NO_NETWORK) {
  const timeoutFetch = (url, method) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12000);
    return fetch(url, { method, redirect: 'follow', signal: ac.signal, headers: { 'user-agent': 'allanaeo-schema-validator' } }).finally(() => clearTimeout(t));
  };
  const results = await Promise.all([...urlChecks.keys()].map(async url => {
    try {
      let r = await timeoutFetch(url, 'HEAD');
      if (r.status >= 400 || r.status === 405) r = await timeoutFetch(url, 'GET');
      return { url, status: r.status };
    } catch (e) { return { url, status: 'ERRO: ' + e.message }; }
  }));
  for (const { url, status } of results) {
    const ok = typeof status === 'number' && status >= 200 && status < 400;
    if (ok) continue;
    const internal = url.startsWith('https://allanaeo.com/');
    for (const page of urlChecks.get(url))
      (internal ? err : warn)(page, `URL ${internal ? 'interna' : 'de terceiro'} sem 2xx/3xx (${status}): ${url}`);
  }
} else console.log('(--no-network: checagem de URLs pulada)\n');

// output
let totalErr = 0, totalWarn = 0;
console.log('| pagina | erros | avisos |');
console.log('| --- | --- | --- |');
for (const page of pages) {
  const { errors, warnings } = report[page];
  totalErr += errors.length; totalWarn += warnings.length;
  console.log(`| ${page} | ${errors.length} | ${warnings.length} |`);
}
console.log('');
for (const page of pages) {
  const { errors, warnings } = report[page];
  if (!errors.length && !warnings.length) continue;
  console.log(`== ${page}`);
  errors.forEach(m => console.log('  ERRO  ' + m));
  warnings.forEach(m => console.log('  aviso ' + m));
}
console.log(`\nResumo: ${totalErr} erro(s), ${totalWarn} aviso(s) em ${pages.length} pagina(s).`);
process.exit(totalErr ? 1 : 0);
