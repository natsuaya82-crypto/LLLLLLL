/* ---------------------------------------------------------------------------
   tools/shot.mjs — a picture of a screen, so a person can look at it.

   Run it:   node tools/shot.mjs home words gram:neg
             node tools/shot.mjs --all
             node tools/shot.mjs --dark home
             node tools/shot.mjs --lang ja home

   NOT a gate. The checks prove a screen renders, that every button resolves
   and that nothing is hard-coded. None of them can say whether it looks
   right, and nobody should be asked to approve a change to a screen by
   reading a diff of string concatenation.

   A route and its argument are one name: `gram:neg` is the negation stage,
   `set:voice` is that room of the settings. Bare `gram` is the list, which is
   a different screen, and both are worth looking at.

   The app is filled from tools/fixture.mjs first -- the same six words and
   three letters the checks walk -- so two pictures taken a week apart differ
   because the screen changed and for no other reason.

   Pictures land in shots/ and that directory is not committed. They are for
   looking at once and throwing away; the screen is what gets kept.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';

const req = createRequire(import.meta.url);
function loadChromium(){
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'shots');
const PORT = 8124;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';

const argv = process.argv.slice(2);
const all = argv.indexOf('--all') >= 0;
const dark = argv.indexOf('--dark') >= 0;
const li = argv.indexOf('--lang');
const uiLang = li >= 0 ? argv[li + 1] : 'en';
/* everything that is not a flag, and not the word after --lang. li is -1 when
   there is no --lang, and li + 1 is then 0, which silently ate whichever
   screen was asked for first. */
const named = argv.filter((a, i) => !a.startsWith('--') && !(li >= 0 && i === li + 1));

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);

fs.mkdirSync(OUT, { recursive: true });

/* A phone, not a desktop window: this is a Capacitor app and a screen that
   only holds together at 1200 px wide is not a screen anyone will see. */
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 390, height: 844 },
                              deviceScaleFactor: 2 });
await pg.goto(`http://localhost:${PORT}/`);

await pg.evaluate(({ s, ui, dk }) => {
  eval('(' + s + ')()');           /* the fixture, run inside the page */
  SET.done = true;                 /* past the onboarding, which is its own screen */
  SET.ui = ui;
  SET.theme = dk ? 'dark' : 'light';
}, { s: seed.toString(), ui: uiLang, dk: dark });

/* Every route the app has, and every argument each one takes, asked of the
   page rather than listed here -- so a screen added tomorrow can be
   photographed tomorrow. */
const routes = await pg.evaluate(() => Object.keys(PAGES));
const shots = all
  ? routes.map((r) => r)
  : named.length ? named : ['home'];

const made = [];
for (const spec of shots) {
  const [r, a] = spec.split(':');
  if (routes.indexOf(r) < 0) { console.error(`  no route called ${r}`); continue; }
  const err = await pg.evaluate(({ r, a }) => {
    try { go(r, a === undefined ? undefined : a); render(); return null; }
    catch (e) { return String(e && e.message || e); }
  }, { r, a });
  if (err) { console.error(`  ${spec} threw: ${err}`); continue; }
  await pg.waitForTimeout(120);            /* fonts and any transition settle */
  const name = spec.replace(':', '-') + (dark ? '-dark' : '') +
               (uiLang === 'en' ? '' : '-' + uiLang) + '.png';
  const file = path.join(OUT, name);
  await pg.screenshot({ path: file, fullPage: true });
  made.push(path.relative(ROOT, file));
}

await br.close();
srv.close();

if (!made.length) { console.error('nothing was photographed.'); process.exit(1); }
console.log(made.join('\n'));
