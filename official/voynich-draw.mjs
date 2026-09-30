/* ---------------------------------------------------------------------------
   official/voynich-draw.mjs — the Voynich manuscript's letters, as the
   `letters` slice the app stores.

   Run it:   python3 official/voynich-eva.py     -> official/voynich-strokes.json
             node official/voynich-draw.mjs       -> official/voynich.json

   NOT a check and not in the gate. It is how official/voynich.json is made.

   WHERE THE SHAPES COME FROM. official/voynich-eva.py: points placed by eye
   on the app's lattice, with the font Voynich EVA Hand A shown as a picture
   under it (「一旦見本の絵としてやってみて」 OWNER 2026-09-30). Nothing is taken
   out of the font file. This file only turns those lattice points into
   strokes and hands them to the app.

   WHAT A LETTER IS CALLED. EVA (the European Voynich Alphabet, Landini and
   Zandbergen): one lower-case roman letter per basic glyph, and the letter
   is named with it -- so the a-z slots every language starts with ARE the
   EVA letters, and `fachys` typed on the QWERTY is `fachys` in the hand. The
   commonest composites are letters of their own (ch, sh, and the four benched
   gallows), because the hand writes them as one shape; postCut() in
   www/post.js cuts the longest name first, so `cth` is found before `c`.

   THE LETTERS ARE MADE BY THE APP. The real app is booted and asked: a new
   language's slots come from ltSlotsFill() exactly as langNew() lays them
   down, each shape goes on through inkSet(), and a composite is ltNew() named
   by ltSetRoman() -- the road a paid plan's 「文字を追加」 takes. Nothing about
   a letter's id, `ab`, `snd` or `chose` is written out here, so nothing here
   can disagree with how the app files a letter.

   THE LATTICE. Twenty-one dots each way (GGRID in www/glyph.js), [column,
   row] from 0 to 20; a third element 'c' is a point the line bends through.
   The metric is voynich-eva.py's: the x-height is rows 10-15, a gallows
   reaches row 0, a tail row 20. Every stroke is the full pen (no `w`, which
   inkW() reads as 24): the manuscript's pen is a fifth of the x-height, and
   24 is the widest the app has.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from '../tools/fixture.mjs';
import { chromium, LAUNCH } from '../tools/browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(HERE, 'voynich.json');
const PORT = 8161;

/* ---- the shapes: drawn in voynich-eva.py, read from its output -------- */
const TRACED = JSON.parse(fs.readFileSync(path.join(HERE, 'voynich-strokes.json'), 'utf8'));
export const GLYPHS = {};
for (const k in TRACED) GLYPHS[k] = TRACED[k].strokes;
/* Which are added rather than slots: every name longer than one letter. */
export const ADDED = Object.keys(GLYPHS).filter((k) => k.length > 1);

/* lattice units -> the 800 square the app stores */
const S = (v) => 40 + 36 * v;
export function toStrokes(g) {
  return g.map((s) => {
    const out = { pts: s.p.map((q) => (q[2] === 'c' ? [S(q[0]), S(q[1]), 'c'] : [S(q[0]), S(q[1])])) };
    if (s.w) out.w = s.w;
    if (s.closed) out.closed = true;
    return out;
  });
}

/* ---- run directly: build the slice in the real app -------------------- */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const k in GLYPHS) for (const s of GLYPHS[k]) for (const q of s.p)
    if (q[0] < 0 || q[0] > 20 || q[1] < 0 || q[1] > 20 || q[0] !== Math.round(q[0]) || q[1] !== Math.round(q[1]))
      throw new Error(`${k}: ${q} is off the lattice`);

  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const srv = http.createServer((q, r) => {
    const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
    let body;
    try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
    r.end(body);
  }).listen(PORT);
  const br = await chromium.launch(LAUNCH);
  const pg = await br.newPage();
  await pg.goto(`http://localhost:${PORT}/`);
  await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
  await pg.evaluate('window.__seed = ' + seed.toString());
  await pg.evaluate(() => window.__seed());
  const shapes = {};
  for (const k in GLYPHS) shapes[k] = toStrokes(GLYPHS[k]);
  /* AN ADDED LETTER KEEPS THE ID IT WAS GIVEN THE FIRST TIME. ltId() mints a
     new one every run, and two copies of an alphabet are put together BY ID
     (supabase/schema.sql § slice_arr) -- so a redraw put on the server with
     fresh ids would be every composite twice. The slots need nothing: their
     ids are their names (ltSlotId()). */
  const was = {};
  try { for (const l of JSON.parse(fs.readFileSync(OUT, 'utf8')).letters) if (l.ab) was[l.ab] = l.id; } catch (e) {}
  const got = await pg.evaluate(({ shapes, added, was }) => {
    /* a new language, as langNew() makes one: nothing, then the slots */
    planGot('pro');
    LETTERS = [];
    ltSlotsFill();
    var i, l, miss = [];
    for (i = 0; i < LETTERS.length; i++) {
      l = LETTERS[i];
      var k = ltSlotKey(l);
      if (shapes[k]) inkSet(l, shapes[k]);
    }
    for (i = 0; i < added.length; i++) {
      l = ltNew({});
      ltSetRoman(l.id, added[i]);
      l = LETTERS[LETTERS.length - 1];
      if (ltName(l) !== added[i]) miss.push(added[i]);
      if (was[added[i]]) l.id = was[added[i]];
      inkSet(l, shapes[added[i]]);
    }
    return { letters: JSON.parse(JSON.stringify(LETTERS)), miss: miss };
  }, { shapes, added: ADDED, was });
  await br.close(); srv.close();
  if (got.miss.length) { console.error('not named as asked: ' + got.miss.join(' ')); process.exit(1); }
  const doc = { name: 'Voynich', wsys: 'alpha', letters: got.letters };
  fs.writeFileSync(OUT, JSON.stringify(doc, null, 1) + '\n');
  const drawn = got.letters.filter((l) => l.st && l.st.length).length;
  console.log(`${path.relative(ROOT, OUT)}: ${got.letters.length} letters, ${drawn} drawn`);
}
