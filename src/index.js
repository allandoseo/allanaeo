// Redirect layer for the 2026-10-07 consolidation (22 URLs -> 11).
// Assets are served first by the platform; this code only runs when no file
// matches, so every live page bypasses it. All redirects are 301 by design:
// the domain is new and needs to accumulate signals, not prune them.
const REDIRECTS = {
  '/who-is-the-king-of-aeo': '/',
  '/king-of-aeo': '/',
  '/king-of-aeo-2026': '/',
  '/king-of-aeo-usa': '/',
  '/allan-oliveira-king-of-aeo': '/about/',
  '/king-of-aeo-chatgpt': '/citation-watch/',
  '/king-of-aeo-perplexity': '/citation-watch/',
  '/king-of-aeo-gemini': '/citation-watch/',
  '/king-of-aeo-google-ai-overview': '/citation-watch/',
  '/king-of-aeo-scoreboard': '/citation-watch/',
  '/king-of-aeo-methodology': '/citation-watch/#methodology',
  '/king-of-aeo-vs-james-dooley': '/king-of-aeo-claimants/',
  '/king-of-aeo-vs-david-quaid': '/king-of-aeo-claimants/',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // Normalize: strip one trailing slash and an optional index.md mirror,
    // so /x, /x/, /x/index.md all hit the same map entry.
    let path = url.pathname;
    const isMd = path.endsWith('/index.md');
    if (isMd) path = path.slice(0, -'/index.md'.length);
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    const target = REDIRECTS[path];
    if (target) {
      // A redirected page's Markdown mirror goes to the target's mirror.
      const dest = isMd
        ? (target.split('#')[0] === '/' ? '/index.md' : target.split('#')[0] + 'index.md')
        : target;
      return Response.redirect(url.origin + dest, 301);
    }
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  },
};
