/* ---------------------------------------------------------------------------
   tools/ink-check.mjs — a letter's shape is asked in one place, and a line of
   the language is drawn by one ruler.

   Run it:   node tools/ink-check.mjs

   Two sentences, both from docs/scope/r73-audit.md and both COVERS rather
   than plugs (CLAUDE.md § COVERED): the check counts the surface, so a thing
   added tomorrow is counted tomorrow.

   A.「形があるか・何かは inkGeo() だけが答える」 r73 §2-12.
      A letter's shape is one of two kinds -- strokes (`st`) drawn in the app,
      or rings (`sh`) handed back on a sheet -- and a letter has one and never
      both. inkGeo() says which it has, inkRings() says which kind a shape
      is, and inkSet() is the one writer that keeps "never both". Every other
      place that asked `l.st` answered "no shape" for a sheet letter, and two
      of those answers LOST it: a digit written on a sheet read as blank and
      went when the base came down (numBlank), and a shape named into a free
      slot arrived without its rings (ltSetRoman). A redrawing of a sheet
      letter was saved and never shown, because `sh` went on winning.

      STATIC, and the whole surface: every `.st` and `.sh` in www/ with the
      comments and the insides of strings taken out. Each one is either inside
      the ink block in glyph.js, or on a receiver that CARRIERS below names --
      a thing that is not a letter and says what it is (a cut unit, the
      editor's working strokes, a font def, a glyph read off a sheet). A
      receiver nobody wrote down fails, the way store-check fails a key nobody
      wrote down, so a new `l.st` fails the day it is written.

      AND THE STATE: the three losses above, walked on the real app.

   B.「言語の行は一つの物差しで置く」 r73 §2-11, OWNER 2026-09-23 「一行を描く
      仕組みを一つにして」「オンをデフォルトにしてくれ。」「ローマ字」.
      A digit on the calendar and the clock was drawn by numSignHTML() with a
      rule of its own: the shape whether or not the drawn letters are on, and
      a BORROWED character where none was drawn. It asks ltLineChar() now,
      which is the one place a letter of the language becomes a character on
      a line. Counted: with the drawn letters off, not one shape anywhere on
      the calendar, the clock or the time; with them on, a digit with only a
      borrowed character is its roman, and a drawn one is its shape.

   A browser, on its own port.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PORT = 8233;
const fails = [];
const say = (ok, what) => { if (!ok) fails.push(what); };

/* ---- A, static --------------------------------------------------------- */
/* Comments out with their newlines kept (a line number is a line number), and
   the insides of strings, so `t('find.todo.st')` is not a letter being read. */
function strip(src) {
  let out = '', i = 0; const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '*') {
      const e = src.indexOf('*/', i + 2), end = e < 0 ? n : e + 2;
      out += src.slice(i, end).replace(/[^\n]/g, ' '); i = end; continue;
    }
    if (c === '/' && d === '/') {
      const e = src.indexOf('\n', i), end = e < 0 ? n : e;
      out += ' '.repeat(end - i); i = end; continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out += c + src.slice(i + 1, j).replace(/[^\n]/g, ' ') + c; i = j + 1; continue;
    }
    out += c; i++;
  }
  return out;
}

/* file -> receiver -> what it is. A receiver is the expression before `.st`
   or `.sh`, with anything in brackets written []. None of these is a letter. */
const CARRIERS = {
  'card.js':   { CARD: 'the card\'s chosen shape, a string', u: 'one unit of a cut line' },
  'glyph.js':  { GE: 'the editor\'s working strokes, not yet a letter\'s', w: 'a shape waiting for a face (INKCP.wait)' },
  'onboard.js':{ GE: 'the editor\'s working strokes' },
  'otf5.js':   { g: 'a glyph def handed to the font writer', 'q0.g': 'a glyph def handed to the font writer' },
  'post.js':   { hit: 'one unit of a cut line', 'cut[]': 'one unit of a cut line', 'units[]': 'one unit of a cut line',
                 u: 'one unit of a cut line', a: 'one unit of a cut line', av: 'a face as the post carries it' },
  'share.js':  { o: 'a key being built for the extension' },
  'sheet.js':  { g: 'a glyph read off a sheet', 's.got[]': 'a glyph read off a sheet', 'got[]': 'a glyph read off a sheet' },
};
/* The ink block: inkGeo(), inkRings(), inkSet() in glyph.js. */
const INK_FNS = ['inkGeo', 'inkRings', 'inkSet'];
const RE = /([A-Za-z_$][\w$]*(?:\[[^\]\n]*\])?(?:\.[A-Za-z_$][\w$]*(?:\[[^\]\n]*\])?)*)\.(st|sh)\b(?!\s*\()/g;
let sites = 0, inBlock = 0, carried = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.js')).sort()) {
  const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  /* where each ink-block function starts and ends, by brace depth */
  const spans = [];
  if (f === 'glyph.js') {
    for (const fn of INK_FNS) {
      const at = src.search(new RegExp('\\bfunction\\s+' + fn + '\\s*\\('));
      if (at < 0) { fails.push('glyph.js has no ' + fn + '() -- the ink block is where a letter\'s shape is asked'); continue; }
      let i = src.indexOf('{', at), depth = 0;
      for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
      }
      spans.push([at, i]);
    }
  }
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(src))) {
    sites++;
    const line = src.slice(0, m.index).split('\n').length;
    const recv = m[1].replace(/\[[^\]]*\]/g, '[]');
    if (spans.some(([a, b]) => m.index > a && m.index < b)) { inBlock++; continue; }
    if (CARRIERS[f] && CARRIERS[f][recv]) { carried++; continue; }
    fails.push(`A  www/${f}:${line}  ${recv}.${m[2]} -- a letter's shape is inkGeo()'s to say and inkSet()'s to write`);
  }
  /* and a call's result, which no carrier is: `ltById(x).st` is a letter */
  const call = /\)\s*\.(st|sh)\b(?!\s*\()/g;
  while ((m = call.exec(src))) {
    sites++;
    fails.push(`A  www/${f}:${src.slice(0, m.index).split('\n').length}  (...).${m[1]} -- a letter's shape is inkGeo()'s to say and inkSet()'s to write`);
  }
}

/* ---- the page ---------------------------------------------------------- */
const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : f.endsWith('.css') ? 'text/css; charset=utf-8'
  : 'text/plain; charset=utf-8';
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) { d = null; }
  if (d === null) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': mime(f) });
  res.end(d);
});
await new Promise((r) => srv.listen(PORT, r));
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
pg.on('pageerror', (e) => errs.push(e.message));
const fresh = async () => {
  await pg.goto(`http://localhost:${PORT}/`);
  await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
  /* the settings are kept on the phone and outlive a reload, so B1's switch
     would still be off here: every group starts from nobody-has-decided */
  await pg.evaluate((s) => { eval('(' + s + ')()'); SET.walked = true; SET.ui = 'en'; delete SET.myfont; }, seed.toString());
};
/* One ring, as a sheet hands it back: a plain array of points. */
const RING = [[[200, 200], [600, 200], [600, 600], [200, 600]]];
const STROKES = [{ pts: [[400, 160], [400, 640]] }];

/* A1. a digit written on a sheet is somebody's digit when the base comes down */
await fresh();
say(await pg.evaluate((RING) => {
  numSetBase(12);
  const d = numByVal(11);
  if (!d) return false;
  d.st = null; d.sh = RING;
  numSetBase(10);
  return !!numByVal(11);
}, RING), 'A1 a digit written on a SHEET was taken as blank and deleted when the base came down (numBlank)');

/* A2. a sheet shape named into a free slot arrives with its rings */
await fresh();
const a2 = await pg.evaluate((RING) => {
  const slot = LETTERS.filter((l) => ltName(l) === 'a' && ltIsBase(l))[0];
  if (!slot || can('letters')) return 'no free slot a';
  slot.st = null; delete slot.sh; slot.ch = '';
  LETTERS.push({ id: 'ink-a2', st: null, sh: RING, ch: '', nm: '', snd: [] });
  const id = ltSetRoman('ink-a2', 'a');
  return JSON.stringify(inkGeo(ltById(id))) === JSON.stringify(RING) ? '' : 'arrived as ' + JSON.stringify(inkGeo(ltById(id)));
}, RING);
say(!a2, 'A2 a shape named into a free slot lost its rings on the way: ' + a2);

/* A3. a sheet letter drawn over shows the drawing, and never holds both */
await fresh();
const a3 = await pg.evaluate(({ RING, STROKES }) => {
  const l = LETTERS[0];
  l.ch = ''; l.st = null; l.sh = RING;
  ltSetStrokes(l.id, STROKES);
  const out = [];
  if (JSON.stringify(inkGeo(l)) !== JSON.stringify(STROKES)) out.push('drawn over, inkGeo still ' + JSON.stringify(inkGeo(l)).slice(0, 40));
  if (l.st && l.sh) out.push('holds strokes AND rings');
  l.st = null; l.sh = RING;
  ltSetChar(l.id, 'Ж');
  if (inkGeo(l)) out.push('a borrowed character set on a sheet letter is hidden under the rings');
  return out.join('; ');
}, { RING, STROKES });
say(!a3, 'A3 ' + a3);

/* A4. what the widget is told: a word spelled in sheet letters is all in the font */
await fresh();
say(await pg.evaluate((RING) => {
  const l = LETTERS[0]; l.ch = ''; l.st = null; l.sh = RING;
  return shareWordAll({ sp: [{ l: l.id }] });
}, RING), 'A4 shareWordAll() says a word of sheet letters is not in the font -- the widget spells it in roman');

/* A5. the find screen's key draws a sheet letter */
say(await pg.evaluate((RING) => {
  const l = LETTERS[0]; l.ch = ''; l.st = null; l.sh = RING;
  return fLtkHTML(l, '').indexOf('pkc') >= 0;
}, RING), 'A5 the find screen\'s letter key shows no face for a sheet letter');

/* ---- B ----------------------------------------------------------------- */
const PUA = /[-]/g;
const cal = () => pg.evaluate(() => numCalHTML() + numClockHTML() + numTimeHTML() + numMonthHTML());

await fresh();
await pg.evaluate(() => { SET.myfont = false; });
const off = await cal();
const offN = (off.match(PUA) || []).length;
say(offN === 0, `B1 the drawn letters OFF and the calendar, clock and time still draw ${offN} shapes`);

await fresh();
const b2 = await pg.evaluate(() => {
  const d = numByVal(1); if (!d) return 'no digit 1';
  d.st = null; delete d.sh; d.ch = 'Ж';
  const h = numSignHTML(1);
  return h.indexOf('Ж') >= 0 ? 'a digit with only a borrowed character shows it: ' + h
       : h.indexOf('1') < 0 ? 'and not its roman: ' + h : '';
});
say(!b2, 'B2 ' + b2);

const b3 = await pg.evaluate((STROKES) => {
  const d = numByVal(1); d.ch = ''; d.st = STROKES; delete d.sh;
  installScriptFont();
  return [(numSignHTML(1).match(/[\uE000-\uF8FF]/g) || []).length, myFontWant(), numSignHTML(1)];
}, STROKES);
say(b3[0] === 1, `B3 a drawn digit with the letters on is ${b3[0]} shapes, not 1 (the positive half of B1): ${JSON.stringify(b3)}`);

say(!errs.length, 'page errors: ' + errs.join(' | '));
await br.close();
srv.close();

console.log(`ink-check: ${sites} .st/.sh in www/ -- ${inBlock} in the ink block, ${carried} on things that are not letters`);
console.log(`ink-check: calendar with the drawn letters off: ${offN} shapes`);
if (fails.length) {
  for (const f of fails) console.log('FAIL ' + f);
  process.exit(1);
}
console.log('ink-check: A1-A5 B1-B3 held');
