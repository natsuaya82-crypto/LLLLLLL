/* ---------------------------------------------------------------------------
   tools/css-snap.mjs — did an edit to the stylesheet reach a rule it meant
   to leave alone?

   Run it around a change:

     node tools/css-snap.mjs save     before the edit
     node tools/css-snap.mjs check    after it

   WHY THIS EXISTS.

   aa2e987 deleted two selectors that press said nothing wore. They were the
   LAST two of their list, and the declaration block came away with them:

     html[data-script="on"] .hw,
     html[data-script="on"] .psw,
     html[data-script="on"] .whw,
     html[data-script="on"] .gsw,
     .sfont::placeholder{font-family:var(--face-ital) !important}

   Four selectors ending in a comma are the head of the NEXT rule. Every
   headword in the app was set in the italic serif from that day, with a
   placeholder rule's !important behind it, and the app's whole point --
   seeing your words in your own letters -- did nothing. Nothing caught it:
   the file parses, the classes are worn, every screen renders. It took
   measuring .hw in a browser.

   What this does is the one thing that would have caught it. The browser is
   asked what every selector in the stylesheet resolves to, before and after,
   and any selector whose declarations CHANGED while it was not the subject of
   the edit is named. Deleting a selector is expected; a surviving one
   quietly acquiring somebody else's declarations is not.

   The snapshot lands in tools/.css-snap.json, which is not committed.
   --------------------------------------------------------------------------- */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const SNAP = path.join(HERE, '.css-snap.json');
const PORT = 8131;
const mode = process.argv[2] || 'check';

const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain';
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) {}
  if (!d) { r.writeHead(404); r.end('no'); return; }
  r.writeHead(200, { 'Content-Type': mime(f) });
  r.end(d);
});
await new Promise((r) => srv.listen(PORT, r));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
await pg.goto(`http://127.0.0.1:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

/* Every selector the stylesheet carries, and what it sets. Split on the
   selector, not on the rule, because that is exactly the mistake being
   guarded against: a rule's LIST is what changes shape. */
const now = await pg.evaluate(() => {
  const out = {};
  const walk = (rules) => {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; }   /* @media and friends */
      if (!r.selectorText) continue;
      const body = r.style ? r.style.cssText : '';
      r.selectorText.split(',').map((s) => s.trim()).forEach((s) => {
        if (!s) return;
        out[s] = (out[s] ? out[s] + ' ' : '') + body;
      });
    }
  };
  for (const sheet of document.styleSheets) {
    let rules = null;
    try { rules = sheet.cssRules; } catch (e) { continue; }
    if (rules) walk(rules);
  }
  return out;
});
await br.close();
srv.close();

if (mode === 'save') {
  fs.writeFileSync(SNAP, JSON.stringify(now, null, 0));
  console.log('css snapshot saved: ' + Object.keys(now).length + ' selectors');
  process.exit(0);
}

if (!fs.existsSync(SNAP)) {
  console.error('no snapshot to compare with — run `node tools/css-snap.mjs save` first');
  process.exit(1);
}
const was = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
const gone = Object.keys(was).filter((s) => !(s in now)).sort();
const fresh = Object.keys(now).filter((s) => !(s in was)).sort();
const moved = Object.keys(now).filter((s) => s in was && was[s] !== now[s]).sort();

console.log('selectors before ' + Object.keys(was).length +
            ', after ' + Object.keys(now).length);
if (gone.length) console.log('  gone (' + gone.length + '): ' + gone.slice(0, 12).join(' | ') +
  (gone.length > 12 ? ' …' : ''));
if (fresh.length) console.log('  new (' + fresh.length + '): ' + fresh.slice(0, 12).join(' | ') +
  (fresh.length > 12 ? ' …' : ''));

if (!moved.length) {
  console.log('\ncss-snap: every selector that survived the edit sets exactly ' +
              'what it set before.');
  process.exit(0);
}
console.log('\nFAILED (' + moved.length + '): a selector nobody removed is setting ' +
            'something else now.');
for (const s of moved.slice(0, 20)) {
  console.log('  ' + s);
  console.log('      was  ' + (was[s] || '(nothing)').slice(0, 160));
  console.log('      now  ' + (now[s] || '(nothing)').slice(0, 160));
}
process.exit(1);
