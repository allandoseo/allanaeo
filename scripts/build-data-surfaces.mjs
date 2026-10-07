// Renders the data-driven surfaces from the hand-filled files in data/:
//   data/citation-log.json -> /citation-watch/ weekly tables + /data/citation-log.csv
//   data/prompts.json      -> /citation-watch/ fixed prompt set table
//   data/claimants.json    -> homepage claim-record table
// Everything lands in the HTML (and the .md mirror) at build time — no client fetching.
// The script never invents a row: empty sources render their documented empty state.
// Run: npm run build:data  (also runs on predeploy)
import fs from 'node:fs';

const read = f => fs.readFileSync(f, 'utf8');
const readJson = f => JSON.parse(read(f));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mdCell = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const ENGINES = { google_ai_overview: 'Google AI Overview', chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini' };
const COUNTRIES = ['US', 'BR'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function fillRegion(file, region, content) {
  const src = read(file);
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const re = new RegExp(`(<!-- BEGIN GENERATED: ${region} -->)[\\s\\S]*?(<!-- END GENERATED: ${region} -->)`);
  if (!re.test(src)) throw new Error(`Region ${region} not found in ${file}`);
  const body = content.trim() ? eol + content.trim().replace(/\r?\n/g, eol) + eol : eol;
  fs.writeFileSync(file, src.replace(re, `$1${body}$2`));
}
function replaceJsonLd(file, graph) {
  const src = read(file);
  const out = src.replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/, `$1${JSON.stringify(graph)}$2`);
  fs.writeFileSync(file, out);
}

// ---------- load + validate sources ----------
const promptsSrc = readJson('data/prompts.json');
const logSrc = readJson('data/citation-log.json');
const claimantsSrc = readJson('data/claimants.json');
const prompts = promptsSrc.prompts ?? [];
const observations = logSrc.observations ?? [];
const claimants = claimantsSrc.claimants ?? [];

const promptById = new Map(prompts.map(p => [p.prompt_id, p.prompt_text]));
for (const [i, o] of observations.entries()) {
  const at = `observations[${i}]`;
  if (!ISO.test(o.date ?? '')) throw new Error(`${at}: bad date ${o.date}`);
  if (!promptById.has(o.prompt_id)) throw new Error(`${at}: unknown prompt_id ${o.prompt_id}`);
  if (o.prompt_text !== promptById.get(o.prompt_id)) throw new Error(`${at}: prompt_text differs from data/prompts.json for ${o.prompt_id}`);
  if (!ENGINES[o.engine]) throw new Error(`${at}: bad engine ${o.engine}`);
  if (!COUNTRIES.includes(o.country)) throw new Error(`${at}: bad country ${o.country}`);
  if (!Array.isArray(o.entities_named)) throw new Error(`${at}: entities_named must be an array`);
  const pos = o.position_of_allan_oliveira;
  if (pos !== null && (!Number.isInteger(pos) || pos < 1 || pos > o.entities_named.length))
    throw new Error(`${at}: position_of_allan_oliveira out of range`);
}
for (const [i, c] of claimants.entries()) {
  const at = `claimants[${i}]`;
  for (const k of ['name', 'earliest_public_claim_date', 'claim_surface', 'source_url', 'date_verified'])
    if (!c[k]) throw new Error(`${at}: missing ${k}`);
  if (!ISO.test(c.earliest_public_claim_date) || !ISO.test(c.date_verified)) throw new Error(`${at}: bad ISO date`);
}

// ---------- weekly tables ----------
const weekStart = iso => { // Monday of that ISO date's week
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const fmtEntities = o => o.entities_named.length ? o.entities_named.join(', ') : 'none named';
const fmtPos = o => o.position_of_allan_oliveira === null ? 'not named' : `#${o.position_of_allan_oliveira}`;
const fmtNote = o => o.source_note + (o.screenshot_path ? ` (screenshot: ${o.screenshot_path})` : '');

const EMPTY_LOG_HTML = '<p>No observations are published yet. The first weekly log is scheduled for 2026-10-05. Every future row comes from the fixed prompt set below and ships on this page and in the raw CSV on the same day it is collected.</p>';
const EMPTY_LOG_MD = 'No observations are published yet. The first weekly log is scheduled for 2026-10-05. Every future row comes from the fixed prompt set below and ships on this page and in the raw CSV on the same day it is collected.';

let weeklyHtml = EMPTY_LOG_HTML, weeklyMd = EMPTY_LOG_MD;
if (observations.length) {
  const byWeek = new Map();
  for (const o of observations) {
    const w = weekStart(o.date);
    (byWeek.get(w) ?? byWeek.set(w, []).get(w)).push(o);
  }
  const weeks = [...byWeek.keys()].sort().reverse();
  const sortRows = rows => rows.sort((a, b) => a.date.localeCompare(b.date) || a.prompt_id.localeCompare(b.prompt_id) || a.engine.localeCompare(b.engine) || a.country.localeCompare(b.country));
  weeklyHtml = weeks.map(w => {
    const rows = sortRows(byWeek.get(w));
    return `<div class="table-wrap"><table>
<caption>Week of ${w} — ${rows.length} observation${rows.length === 1 ? '' : 's'}</caption>
<thead><tr><th scope="col">DATE</th><th scope="col">PROMPT</th><th scope="col">ENGINE</th><th scope="col">COUNTRY</th><th scope="col">ENTITIES NAMED (IN ORDER)</th><th scope="col">ALLAN OLIVEIRA POSITION</th><th scope="col">SOURCE NOTE</th></tr></thead>
<tbody>
${rows.map(o => `<tr><td class="nw"><time datetime="${o.date}">${o.date}</time></td><td>${esc(o.prompt_text)}</td><td class="nw">${ENGINES[o.engine]}</td><td>${o.country}</td><td>${esc(fmtEntities(o))}</td><td class="nw">${fmtPos(o)}</td><td>${esc(fmtNote(o))}</td></tr>`).join('\n')}
</tbody></table></div>`;
  }).join('\n');
  weeklyMd = weeks.map(w => {
    const rows = sortRows(byWeek.get(w));
    return `### Week of ${w} (${rows.length} observation${rows.length === 1 ? '' : 's'})\n\n| Date | Prompt | Engine | Country | Entities named (in order) | Allan Oliveira position | Source note |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.map(o => `| ${o.date} | ${mdCell(o.prompt_text)} | ${ENGINES[o.engine]} | ${o.country} | ${mdCell(fmtEntities(o))} | ${fmtPos(o)} | ${mdCell(fmtNote(o))} |`).join('\n')}`;
  }).join('\n\n');
}
fillRegion('public/citation-watch/index.html', 'weekly-tables', weeklyHtml);
fillRegion('public/citation-watch/index.md', 'weekly-tables', weeklyMd);

// ---------- fixed prompt set ----------
const promptHtml = `<div class="table-wrap"><table>
<caption>The fixed prompt set${promptsSrc.frozen_since ? ` — frozen since ${promptsSrc.frozen_since}` : ' — freezes with the first published observation'}</caption>
<thead><tr><th scope="col">ID</th><th scope="col">PROMPT (VERBATIM)</th></tr></thead>
<tbody>
${prompts.map(p => `<tr><td class="nw">${esc(p.prompt_id)}</td><td>${esc(p.prompt_text)}</td></tr>`).join('\n')}
</tbody></table></div>`;
const promptMd = `| ID | Prompt (verbatim) |\n| --- | --- |\n${prompts.map(p => `| ${p.prompt_id} | ${mdCell(p.prompt_text)} |`).join('\n')}\n\n${promptsSrc.frozen_since ? `Frozen since ${promptsSrc.frozen_since}.` : 'The set freezes with the first published observation.'}`;
fillRegion('public/citation-watch/index.html', 'prompt-set', promptHtml);
fillRegion('public/citation-watch/index.md', 'prompt-set', promptMd);

// ---------- CSV ----------
const csvEsc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvHeader = 'date,prompt_id,prompt_text,engine,country,entities_named,position_of_allan_oliveira,source_note,screenshot_path';
const csvRows = observations.map(o => [o.date, o.prompt_id, o.prompt_text, o.engine, o.country, o.entities_named.join('|'), o.position_of_allan_oliveira ?? '', o.source_note, o.screenshot_path ?? ''].map(csvEsc).join(','));
fs.mkdirSync('public/data', { recursive: true });
fs.writeFileSync('public/data/citation-log.csv', [csvHeader, ...csvRows].join('\n') + '\n');

// ---------- citation-watch JSON-LD ----------
const PERSON = { '@id': 'https://allanaeo.com/about/#person' };
const dates = observations.map(o => o.date).sort();
const dataset = {
  '@type': 'Dataset', '@id': 'https://allanaeo.com/citation-watch/#dataset',
  name: 'King of AEO Citation Watch: weekly observations',
  description: 'Weekly manual observations of which entities Google AI Overview, ChatGPT, Perplexity and Gemini name for a fixed set of five King of AEO prompts in the US and Brazil, logged out, one run per prompt per engine per country.',
  url: 'https://allanaeo.com/citation-watch/',
  creator: PERSON,
  license: 'https://creativecommons.org/licenses/by/4.0/',
  isAccessibleForFree: true,
  variableMeasured: ['date', 'prompt_id', 'prompt_text', 'engine', 'country', 'entities_named', 'position_of_allan_oliveira', 'source_note', 'screenshot_path'],
  distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://allanaeo.com/data/citation-log.csv' }],
};
// With no rows yet, coverage states the announced series start (published on the page);
// once observations exist it is derived from the real dates.
dataset.temporalCoverage = dates.length ? `${dates[0]}/${dates[dates.length - 1]}` : '2026-10-05/..';
replaceJsonLd('public/citation-watch/index.html', {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': 'https://allanaeo.com/#website', url: 'https://allanaeo.com/', name: 'allanaeo.com', publisher: PERSON, author: PERSON },
    { '@type': 'Person', '@id': PERSON['@id'] },
    { '@type': 'WebPage', '@id': 'https://allanaeo.com/citation-watch/', url: 'https://allanaeo.com/citation-watch/',
      name: 'King of AEO Citation Watch: Weekly Log',
      description: 'King of AEO citation data: every recorded observation from the September 2026 experiment and the weekly watch — 5 fixed prompts, 4 AI engines, US and Brazil, open CSV.',
      isPartOf: { '@id': 'https://allanaeo.com/#website' }, author: PERSON,
      datePublished: '2026-10-03', dateModified: '2026-10-07', inLanguage: 'en-US',
      mainEntity: { '@id': 'https://allanaeo.com/citation-watch/#dataset' } },
    dataset,
  ],
});

// ---------- homepage claim-record table ----------
const CLAIM_HEAD = '<thead><tr><th scope="col">CLAIMANT</th><th scope="col">EARLIEST DATED PUBLIC CLAIM</th><th scope="col">SURFACE</th><th scope="col">SOURCE</th><th scope="col">DATE VERIFIED</th></tr></thead>';
let claimHtml, claimMd;
if (claimants.length) {
  const rows = [...claimants].sort((a, b) => a.earliest_public_claim_date.localeCompare(b.earliest_public_claim_date));
  claimHtml = `<div class="table-wrap"><table>
<caption>Public claims on the term King of AEO, dated and sourced</caption>
${CLAIM_HEAD}
<tbody>
${rows.map(c => `<tr><td class="nw">${esc(c.name)}</td><td class="nw"><time datetime="${c.earliest_public_claim_date}">${c.earliest_public_claim_date}</time></td><td>${esc(c.claim_surface)}</td><td><a href="${esc(c.source_url)}" rel="noopener" target="_blank">source</a></td><td class="nw">${c.date_verified}</td></tr>`).join('\n')}
</tbody></table></div>`;
  claimMd = `| Claimant | Earliest dated public claim | Surface | Source | Date verified |\n| --- | --- | --- | --- | --- |\n${rows.map(c => `| ${mdCell(c.name)} | ${c.earliest_public_claim_date} | ${mdCell(c.claim_surface)} | ${c.source_url} | ${c.date_verified} |`).join('\n')}`;
} else {
  claimHtml = `<div class="table-wrap"><table>
<caption>Public claims on the term King of AEO, dated and sourced</caption>
${CLAIM_HEAD}
<tbody></tbody></table></div>
<p>No verified rows are published yet. A claim enters this table only after its source URL has been checked by hand against the published record.</p>`;
  claimMd = 'No verified rows are published yet. A claim enters this table only after its source URL has been checked by hand against the published record. Columns: claimant, earliest dated public claim, surface, source, date verified.';
}
fillRegion('public/index.html', 'claim-record', claimHtml);
fillRegion('public/index.md', 'claim-record', claimMd);
fillRegion('public/king-of-aeo-claimants/index.html', 'claim-record', claimHtml);
fillRegion('public/king-of-aeo-claimants/index.md', 'claim-record', claimMd);

// ---------- propagate canonical nodes to every page ----------
// LLM crawlers read pages in isolation and do not join graphs across URLs, so the
// canonical Person node (maintained ONLY in about's graph) is materialized verbatim
// into every page, the WebSite node is normalized site-wide, and the experiment
// Dataset cited on the homepage is embedded in full there. Idempotent; runs on predeploy.
const PAGES = [
  'public/index.html', 'public/about/index.html', 'public/citation-watch/index.html',
  'public/king-of-aeo-claimants/index.html',
  'public/research/index.html', 'public/experiments/index.html',
  'public/experiments/king-of-aeo/index.html',
  'public/research/6-dollar-press-release/index.html',
  'public/research/king-of-aeo-contest-timeline/index.html',
  'public/research/september-2026-spam-update-log/index.html',
];
const readGraph = f => JSON.parse(read(f).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const editGraph = (f, fn) => {
  const g = readGraph(f); fn(g);
  fs.writeFileSync(f, read(f).replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/, `$1${JSON.stringify(g)}$2`));
};
const personFull = readGraph('public/about/index.html')['@graph'].find(n => n['@type'] === 'Person' && n['@id'] === PERSON['@id']);
if (!personFull || !personFull.name) throw new Error('canonical Person node not found in about/index.html');
const WEBSITE = { '@type': 'WebSite', '@id': 'https://allanaeo.com/#website', url: 'https://allanaeo.com/', name: 'allanaeo.com', publisher: { ...PERSON }, author: { ...PERSON } };
const expDataset = readGraph('public/experiments/king-of-aeo/index.html')['@graph'].find(n => n['@type'] === 'Dataset');
for (const f of PAGES) {
  editGraph(f, g => {
    const arr = g['@graph'];
    const wi = arr.findIndex(n => n['@type'] === 'WebSite');
    if (wi >= 0) arr[wi] = WEBSITE;
    const pi = arr.findIndex(n => n['@type'] === 'Person' && n['@id'] === PERSON['@id']);
    if (pi >= 0) arr[pi] = personFull; else arr.splice(1, 0, personFull);
    if (f === 'public/index.html') {
      const wp = arr.find(n => n['@type'] === 'WebPage');
      if (wp && Array.isArray(wp.citation)) {
        const ci = wp.citation.findIndex(c => c['@id'] === expDataset['@id']);
        if (ci >= 0) wp.citation[ci] = { '@id': expDataset['@id'] };
      }
      if (!arr.some(n => n['@type'] === 'Dataset' && n['@id'] === expDataset['@id'])) arr.push(expDataset);
      else arr[arr.findIndex(n => n['@type'] === 'Dataset' && n['@id'] === expDataset['@id'])] = expDataset;
    }
  });
}
console.log('canonical nodes propagated to ' + PAGES.length + ' pages');

// ---------- scoreboard + per-engine observation tables ----------
// One merged view over BOTH real data sources: the September experiment
// (public/experiments/king-of-aeo/data.json) and the weekly citation log.
// Nothing here is typed by hand; unmeasured engines render "Not yet measured".
const expData = JSON.parse(read('public/experiments/king-of-aeo/data.json'));
const EXP_ENGINE_KEY = { 'Google AI Overview': 'google_ai_overview', 'ChatGPT': 'chatgpt' };
const allanStatus = names => {
  const joined = names.join(' | ');
  if (names.some(n => n.includes('Allan Oliveira'))) return 'Appeared (#' + (names.findIndex(n => n.includes('Allan Oliveira')) + 1) + ')';
  if (joined.includes('four claimants')) return 'Listed among contenders (no single holder)';
  return 'Not appeared';
};
const rows = [
  ...expData.observations.map(o => ({
    date: o.date, engineKey: EXP_ENGINE_KEY[o.engine] ?? o.engine, engineLabel: o.engine,
    market: o.country, query: 'king of aeo', result: o.entities_named ? '' : '', names: o.names_returned,
    status: allanStatus(o.names_returned), source: '/experiments/king-of-aeo/data.csv', sourceLabel: 'experiment CSV',
  })),
  ...observations.map(o => ({
    date: o.date, engineKey: o.engine, engineLabel: ENGINES[o.engine],
    market: o.country, query: o.prompt_text, names: o.entities_named,
    status: o.position_of_allan_oliveira === null ? (o.entities_named.length ? 'Not appeared' : 'Not appeared (no entity named)') : `Appeared (#${o.position_of_allan_oliveira})`,
    source: '/data/citation-log.csv', sourceLabel: 'citation log CSV',
  })),
].sort((a, b) => b.date.localeCompare(a.date) || a.engineLabel.localeCompare(b.engineLabel) || a.market.localeCompare(b.market));

const sbHtml = `<div class="table-wrap"><table>
<caption>All recorded King of AEO search observations — ${rows.length} row${rows.length === 1 ? '' : 's'}, from the open datasets</caption>
<thead><tr><th scope="col">DATE</th><th scope="col">ENGINE</th><th scope="col">MARKET</th><th scope="col">QUERY</th><th scope="col">RESULT (NAMES RETURNED)</th><th scope="col">ALLAN OLIVEIRA</th><th scope="col">SOURCE</th></tr></thead>
<tbody>
${rows.map(r => `<tr><td class="nw"><time datetime="${r.date}">${r.date}</time></td><td class="nw">${esc(r.engineLabel)}</td><td>${r.market}</td><td>${esc(r.query)}</td><td>${esc(r.names.join(', '))}</td><td class="nw">${esc(r.status)}</td><td class="nw"><a href="${r.source}">${r.sourceLabel}</a></td></tr>`).join('\n')}
</tbody></table></div>`;
const sbMd = `| Date | Engine | Market | Query | Result (names returned) | Allan Oliveira | Source |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows.map(r => `| ${r.date} | ${r.engineLabel} | ${r.market} | ${mdCell(r.query)} | ${mdCell(r.names.join(', '))} | ${r.status} | https://allanaeo.com${r.source} |`).join('\n')}`;
fillRegion('public/citation-watch/index.html', 'scoreboard', sbHtml);
fillRegion('public/citation-watch/index.md', 'scoreboard', sbMd);

for (const key of ['google_ai_overview', 'chatgpt', 'perplexity', 'gemini']) {
  const er = rows.filter(r => r.engineKey === key);
  let eh, em;
  if (er.length) {
    eh = `<div class="table-wrap"><table>
<caption>Recorded ${esc(ENGINES[key])} observations for the King of AEO query</caption>
<thead><tr><th scope="col">DATE</th><th scope="col">MARKET</th><th scope="col">QUERY</th><th scope="col">NAMES RETURNED (IN ORDER)</th><th scope="col">ALLAN OLIVEIRA</th></tr></thead>
<tbody>
${er.map(r => `<tr><td class="nw"><time datetime="${r.date}">${r.date}</time></td><td>${r.market}</td><td>${esc(r.query)}</td><td>${esc(r.names.join(', '))}</td><td class="nw">${esc(r.status)}</td></tr>`).join('\n')}
</tbody></table></div>`;
    em = `| Date | Market | Query | Names returned (in order) | Allan Oliveira |\n| --- | --- | --- | --- | --- |\n${er.map(r => `| ${r.date} | ${r.market} | ${mdCell(r.query)} | ${mdCell(r.names.join(', '))} | ${r.status} |`).join('\n')}`;
  } else {
    eh = `<p><strong>Not yet measured.</strong> ${ENGINES[key]} enters the weekly tracking scope on 2026-10-05; the first observations publish with the first weekly log and appear here and in the raw CSV the same day.</p>`;
    em = `**Not yet measured.** ${ENGINES[key]} enters the weekly tracking scope on 2026-10-05; the first observations publish with the first weekly log and appear here and in the raw CSV the same day.`;
  }
  fillRegion('public/citation-watch/index.html', `obs-${key}`, eh);
  fillRegion('public/citation-watch/index.md', `obs-${key}`, em);
}
console.log(`scoreboard + engine tables rendered (${rows.length} merged observation rows)`);

// ---------- sitemap.xml ----------
const urlOf = f => 'https://allanaeo.com' + f.replace(/^public/, '').replace(/index\.html$/, '');
const lastmodOf = f => {
  const g = readGraph(f);
  const n = g['@graph'].find(n => n.dateModified) ?? {};
  return (n.dateModified ?? '').slice(0, 10) || null;
};
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
for (const f of PAGES) {
  const lm = lastmodOf(f);
  sm.push(`<url><loc>${urlOf(f)}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}</url>`);
}
sm.push('</urlset>');
fs.writeFileSync('public/sitemap.xml', sm.join('\n') + '\n');
console.log('sitemap.xml written (' + PAGES.length + ' URLs)');

// ---------- report ----------
const empties = [];
if (!observations.length) empties.push('data/citation-log.json (observations: [])');
if (!claimants.length) empties.push('data/claimants.json (claimants: [])');
if (!promptsSrc.frozen_since) empties.push('data/prompts.json (frozen_since: null — set it when the first observation publishes)');
console.log('build-data-surfaces: OK');
console.log(`  observations: ${observations.length} | prompts: ${prompts.length} | claimants: ${claimants.length}`);
console.log(`  wrote: public/citation-watch/index.html, public/citation-watch/index.md, public/data/citation-log.csv, public/index.html, public/index.md`);
console.log(empties.length ? `  waiting on hand-filled data:\n${empties.map(e => '    - ' + e).join('\n')}` : '  all sources have data');
