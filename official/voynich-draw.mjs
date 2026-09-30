/* ---------------------------------------------------------------------------
   official/voynich-draw.mjs — the Voynich manuscript's letters, drawn on the
   app's own lattice, written out as the `letters` slice the app stores.

   Run it:   node official/voynich-draw.mjs      -> official/voynich.json

   NOT a check and not in the gate. It is how official/voynich.json is made,
   kept so the next person to redraw a letter edits a line here and runs it
   again rather than editing a JSON file by hand.

   WHERE THE SHAPES COME FROM. The manuscript's hand (Beinecke MS 408, early
   15th century, public domain), drawn from what the letters look like. No
   Voynich font file -- EVA Hand, Voynich 101 or any other -- was opened, read
   or traced: docs/FEATURE_RULES.md § 2026-09-30 「既存のヴォイニッチ用フォント
   のファイルは使わず、線を描き起こす」.

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

   THE LATTICE. Twenty-one dots each way (GGRID in www/glyph.js), written here
   as [column, row] from 0 to 20; a third element 'c' is a point the line
   bends through (the curve flag), `o:1` is the round primitive. One metric
   for every letter so they stand on one line:
     row 19  the foot of every letter -- one dot above the bottom row, as
             near geBase() (the foot of the square) as a letter with a tail
             under it allows
     row 11  the top of the short letters -- eight steps of body
     row 2   the top of the gallows (k t f p), which rise above the rest
     row 20  the foot of the letters that go below (y, g)
   And one pen: every stroke is W wide, inside GE_W (6-24).
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

export const W = 18;

/* ---- the shapes ------------------------------------------------------- */
const T = 11, B = 19, M = 15;   /* the body's top, foot and middle */
const GT = 2;                   /* the top of a gallows */
const c = (x, y) => [x, y, 'c'];

/* The c-stroke every bench is made of: open to the right, starting a little
   under the top at its right end and coming round to finish just above the
   foot. `x` is its left edge; it is four steps wide. */
const C = (x) => [[x + 4, T + 1], c(x + 2, T), c(x, T + 2), c(x, B - 2), c(x + 2, B), [x + 4, B - 1]];
/* A minim: a short stem with the small turn at its foot the hand gives it. */
const I = (x) => [[x, T], c(x, B - 1), [x + 1, B]];
/* An oval, closed. Every point bends; the seam is between the first and
   the last, which are neighbouring dots at the top, because a closed line is
   shut with a straight piece between those two (toPolyline() in
   www/otf5.js) and one dot of straight is too short to see. */
const O = (x, t, b) => [c(x + 2, t), c(x + 4, t + 1), c(x + 5, (t + b) >> 1), c(x + 4, b - 1), c(x + 2, b),
                        c(x, b - 1), c(x - 1, (t + b) >> 1), c(x, t + 1), c(x + 1, t)];
/* A gallows, and the four are one frame: two legs standing on the foot, the
   left one rising to GT, and the loop that makes it a gallows. `x` is the
   left leg. `left` adds the loop the t and p carry over the left leg;
   `flag` is the long stroke the f and p run out to the right along the top. */
function G(x, o) {
  const s = [
    { p: [[x, GT], c(x, B - 1), [x - 1, B]] },                                /* the tall leg */
    { p: [[x, 7], c(x + 2, 4), c(x + 5, 4), c(x + 5, 8), [x + 4, T]] },     /* the loop */
    { p: [[x + 4, T - 1], c(x + 4, B - 1), [x + 5, B]] },                     /* the short leg */
  ];
  if (o && o.left) s.push({ p: [[x, 4], c(x - 2, GT), c(x - 3, 5), [x - 1, 7]] });
  if (o && o.flag) s.push({ p: [[x + 5, 5], c(x + 7, 3), c(x + 9, 3), [x + 11, GT]] });
  return s;
}
/* The bench: two c-strokes joined along the top. */
const BENCH = (x0, x1) => [{ p: C(x0) }, { p: C(x1) }, { p: [[x0 + 2, T], [x1 + 3, T]] }];

export const GLYPHS = {
  /* ---- the body letters ---- */
  o: [{ p: O(8, T, B), closed: 1 }],
  e: [{ p: C(8) }],
  c: [{ p: C(8) }, { p: [[10, T], [14, T]] }],
  h: [{ p: [[5, T], [11, T]] }, { p: C(9) }],
  i: [{ p: I(10) }],
  a: [{ p: C(7) }, { p: I(11) }],
  y: [{ p: C(7) }, { p: [[11, T], c(11, B), c(10, 20), [7, 20]] }],
  n: [{ p: [[8, T], c(8, B - 1), c(9, B), c(11, B - 1), c(12, M), c(12, 10), c(11, 8), [9, 8]] }],
  r: [{ p: [[8, T], c(8, B - 1), c(9, B), c(11, B - 1), c(12, M + 1), [11, M - 1]] }],
  m: [{ p: [[7, T], c(7, B - 1), c(8, B), c(10, B - 1), c(11, M), c(12, T + 1), c(14, T + 1), c(14, M), [13, B - 2]] }],
  s: [{ p: C(8) }, { p: [[10, T], c(11, 8), [13, 7]] }],
  d: [{ p: O(8, T + 1, B), closed: 1 }, { p: [[12, M], c(12, 9), c(10, 6), [7, 7]] }],
  l: [{ p: [[7, B - 1], c(9, M + 1), c(11, T), c(11, 7), c(9, 6), c(8, 8), c(9, M - 1), c(10, B), [13, B - 1]] }],
  q: [{ p: [[12, 9], [7, M + 1], [14, M + 1]] }, { p: [[12, 9], c(12, B - 1), [13, B]] }],
  g: [{ p: O(8, T + 1, B - 1), closed: 1 }, { p: [[12, M], c(12, B), c(13, 20), [15, 19]] }],
  v: [{ p: [[7, T], c(10, B), [12, T], c(13, 9), [11, 9]] }],
  x: [{ p: [[7, T], [13, B]] }, { p: [[13, T], c(10, M), c(8, B), [7, B - 2]] }],
  z: [{ p: [[7, T + 1], c(9, T), [13, T], [7, B], c(11, B), [13, B - 1]] }],
  /* ---- the gallows ---- */
  k: G(8),
  t: G(9, { left: 1 }),
  f: G(5, { flag: 1 }),
  p: G(6, { left: 1, flag: 1 }),
  /* ---- the composites ---- */
  ch: BENCH(4, 10),
  sh: BENCH(4, 10).concat([{ p: [[9, T], c(10, 8), [12, 7]] }]),
  cth: BENCH(2, 14).concat(G(8, { left: 1 })),
  ckh: BENCH(2, 14).concat(G(8)),
  cph: BENCH(1, 15).concat(G(7, { left: 1, flag: 1 })),
  cfh: BENCH(1, 15).concat(G(6, { flag: 1 })),
};
/* Which are the slots (a-z, one letter long) and which are added. */
export const ADDED = ['ch', 'sh', 'cth', 'ckh', 'cph', 'cfh'];

/* lattice units -> the 800 square the app stores */
const S = (v) => 40 + 36 * v;
export function toStrokes(g) {
  return g.map((s) => {
    const out = { pts: s.p.map((q) => (q[2] === 'c' ? [S(q[0]), S(q[1]), 'c'] : [S(q[0]), S(q[1])])) };
    if (W !== 24) out.w = W;
    if (s.closed) out.closed = true;
    if (s.o) out.k = 'o';
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
