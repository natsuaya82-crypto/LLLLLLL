/* ---------------------------------------------------------------------------
   tools/official-shot.mjs — pictures of an official account's language, in
   the real app, so the owner can judge the letters by looking at them.

   Run it:   node tools/official-shot.mjs                 (official/voynich.json)
             node tools/official-shot.mjs official/x.json --tag x

   NOT a gate. docs/FEATURE_RULES.md § 2026-09-30: the letters are data the
   leader puts on the server, and nothing in www/ changes for them. What this
   does is open the app the checks open (tools/fixture.mjs), put the language
   in front of it, and photograph what the app's own drawing code makes of it:

     shots/r151-letters.png        the alphabet screen (ltset:alpha)
     shots/r151-letters-dark.png   the same, dark
     shots/r151-glyph-<name>.png   every drawn letter on the drawing surface,
                                   large, with the lattice and the baseline
     shots/r151-sheet.png          every drawn letter at one size, side by side
     shots/r151-line.png           a line of the manuscript as a post in the
                                   timeline -- somebody else's post, so it is
                                   drawn from the ink it carries (rule 8)
     shots/r151-line-large.png     the same row with the line set at 30px
     shots/r151-line-dark.png      the same, dark

   The line is cut by postInk() -- longest name first -- so `cthres` is cth,
   r, e, s and not c, t, h.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'shots');
const PORT = 8162;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const argv = process.argv.slice(2);
const ti = argv.indexOf('--tag');
const TAG = ti >= 0 ? argv[ti + 1] : 'r151';
const SRC = argv.filter((a, i) => !a.startsWith('--') && !(ti >= 0 && i === ti + 1))[0] ||
            path.join(ROOT, 'official', 'voynich.json');
const ONLY = (argv.indexOf('--no-glyphs') >= 0);
const doc = JSON.parse(fs.readFileSync(SRC, 'utf8'));
/* The first line of f1r, in EVA. */
const LINE = 'fachys ykal ar ataiin shol shory cthres y kor sholdy';

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain', 'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);
fs.mkdirSync(OUT, { recursive: true });

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate('window.__seed = ' + seed.toString());

/* The fixture, then this language in place of its alphabet. */
async function open(dark) {
  await pg.evaluate(({ doc, dark }) => {
    window.__seed();
    SET.walked = true; SET.ui = 'ja';
    SET.theme = dark ? 'dark' : 'light';
    if (typeof applyTheme === 'function') applyTheme();
    LETTERS = JSON.parse(JSON.stringify(doc.letters));
    installScriptFont();
  }, { doc, dark });
}
async function settle() {
  await pg.waitForTimeout(150);
  for (let i = 0; i < 4; i++) {
    if (!await pg.evaluate(() => typeof popOn === 'function' && popOn())) break;
    await pg.evaluate(() => { if (typeof popOff === 'function') popOff(); });
    await pg.waitForTimeout(260);
  }
}
const made = [];
async function shoot(name, sel) {
  const file = path.join(OUT, `${TAG}-${name}.png`);
  /* The pop arrives about fifteen seconds after load, whenever that falls
     (tools/shot.mjs says why), so it is asked about again after the picture
     is taken and the picture is taken again if it was up. */
  for (let i = 0; i < 6; i++) {
    await settle();
    if (sel) await pg.locator(sel).first().screenshot({ path: file });
    else await pg.screenshot({ path: file, fullPage: true });
    if (!await pg.evaluate(() => typeof popOn === 'function' && popOn())) break;
  }
  made.push(path.relative(ROOT, file));
}

/* (a) the alphabet */
for (const dark of [false, true]) {
  await open(dark);
  await pg.evaluate(() => { go('ltset', 'alpha'); render(); });
  await shoot('letters' + (dark ? '-dark' : ''));
}

/* (c) the line, as somebody else's post */
for (const dark of [false, true]) {
  await open(dark);
  const cut = await pg.evaluate(({ line }) => {
    var ink = postInk(line);
    POSTS = [{ id: 'pv', at: Date.now() - 60000, lang: 'voynich', lname: 'Voynich', ln: line,
               who: 'Lingua', hd: 'lingua', mine: false, av: { ch: 'L' }, mn: '', ui: 'en',
               ink: { g: ink.g, s: ink.s, sp: 1 } }];
    go('feed'); render();
    document.getElementById('app').innerHTML = '<div class="vln">' + postRow(POSTS[0]) + '</div>';
    renderMount();
    return ink.s.map(function (x) { return typeof x === 'number' ? '#' : x; }).join('') + '  (' + ink.g.length + ' shapes)';
  }, { line: LINE });
  if (!dark) console.log('cut: ' + cut);
  await shoot('line' + (dark ? '-dark' : ''), '.vln');
  /* and the same row with the line set larger -- a style put on the page from
     here, nothing in www/ -- because at the timeline's own size a letter is
     a few pixels of pen and there is nothing to judge */
  if (!dark) {
    await pg.evaluate(() => {
      var st = document.createElement('style');
      st.textContent = '.vln .pline{font-size:30px!important;line-height:1.5!important}';
      document.head.appendChild(st);
    });
    await shoot('line-large', '.vln');
  }
}

/* the sheet: every drawn letter at one size, by the app's own ltInk() */
await open(false);
await pg.evaluate(() => {
  var h = '<style>.vsh{display:flex;flex-wrap:wrap;gap:6px;padding:12px}' +
          '.vsh div{width:80px;text-align:center;font:12px sans-serif;color:var(--tx)}' +
          '.vsh canvas.tc{width:80px!important;height:80px!important;display:block}</style><div class="vsh">';
  for (var i = 0; i < LETTERS.length; i++) {
    var l = LETTERS[i];
    if (!inkGeo(l)) continue;
    h += '<div>' + ltInk(l) + esc(ltName(l)) + '</div>';
  }
  document.getElementById('app').innerHTML = h + '</div>';
  renderMount();
});
await shoot('sheet', '.vsh');

/* (b) every drawn letter, large, on the drawing surface */
if (!ONLY) {
  const ids = await pg.evaluate(() => LETTERS.filter((l) => inkGeo(l)).map((l) => [l.id, ltName(l)]));
  for (const [id, nm] of ids) {
    await open(false);
    await pg.evaluate((id) => { var l = ltById(id); geOpen(id, ltName(l)); render(); }, id);
    await shoot('glyph-' + nm, '#app canvas');
  }
}

await br.close();
srv.close();
console.log(made.join('\n'));
