/* hand-check -- the handwriting face picks the letter that was written.

   OWNER 2026-09-25「後手書き追加しよう」: a finger writes on the keyboard and
   the nearest of the language's own drawn letters goes in. Which one is
   nearest is ios/App/LinguaKeyboard/hand.js -- handDist() is the one measure
   and handRank() the one ordering -- and the keyboard extension runs that file
   in JavaScriptCore. This runs THE SAME FILE in Node, so what is counted
   here is what the phone does.

   What it is compared against is built the way www/share.js builds it:
   shareInk() is LinguaFont.glyphContours(inkDef(g), GPEN), so the ink here is
   otf5.js's glyphContours with the pen read out of www/glyph.js -- a pen
   changed there is a pen changed here.

   What is written is the letter's own strokes, the way a finger would go over
   them, and then made worse: moved and resized (which must never matter),
   and then wobbled, turned, slanted, squashed, written in another order and
   in the other direction, with each stroke a little off where it belongs.
   Every one is counted, per kind, twice: whether the letter written is the
   FIRST the bar offers, and whether it is among the HAND_PICKS the bar offers
   at all (「候補は何個か出して選ぶ形」 OWNER 2026-09-25) -- that second one
   has to be every time, whatever was done to the writing. Where it was only moved, resized or written
   in another order, every one has to come back as the letter it was -- none of
   those may make any difference at all. Where it was made worse, a floor:
   FLOOR_ONE of each kind alone and FLOOR_ALL of all of them at once. Those two
   numbers are this check's, not the owner's; they are here so a change that
   makes the keyboard read worse goes red, and the run prints what it got.

   And that the file counted is the file the phone has: hand.js has to be in
   the LinguaKeyboard target's Resources phase of project.pbxproj, or the
   extension opens with no measure at all and nothing on this side knows. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../www/otf5.js');
const H = require('../ios/App/LinguaKeyboard/hand.js');

let bad = 0;
const say = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) bad++; };

/* The pen, from where the app says it. */
const gsrc = fs.readFileSync('www/glyph.js', 'utf8');
const pm = gsrc.match(/var GPEN=(\{[^}]*\})/);
const GPEN = pm ? Function('return ' + pm[1])() : null;
const gm = gsrc.match(/var GGRID=\{n:(\d+), inset:(\d+)\}/);
say(!!GPEN && !!gm, 'the pen and the lattice read out of www/glyph.js');
if (!GPEN || !gm) process.exit(1);
const N = +gm[1], INSET = +gm[2], STEP = (800 - INSET * 2) / (N - 1);

/* An alphabet on the lattice: [x, y] in lattice steps, 'c' to round the
   corner, `o` for a closed stroke. Roman-shaped so a person reading a
   failure can see which two were confused. */
const L = (x, y, c) => c ? [INSET + x * STEP, INSET + y * STEP, 'c'] : [INSET + x * STEP, INSET + y * STEP];
const S = (pts, closed) => ({ pts: pts.map((p) => L(p[0], p[1], p[2])), closed: !!closed });
const bowlR = [[7, 13, 'c'], [10, 9, 'c'], [13, 13, 'c'], [10, 17, 'c']];
const bowlL = [[13, 13, 'c'], [10, 9, 'c'], [7, 13, 'c'], [10, 17, 'c']];
const ABC = {
  a: [S([[13, 9], [13, 17]]), S(bowlL, true)],
  b: [S([[7, 3], [7, 17]]), S(bowlR, true)],
  c: [S([[13, 10], [10, 9, 'c'], [7, 13, 'c'], [10, 17, 'c'], [13, 16]])],
  d: [S([[13, 3], [13, 17]]), S(bowlL, true)],
  e: [S([[7, 13], [13, 13], [10, 9, 'c'], [7, 13, 'c'], [10, 17, 'c'], [13, 16]])],
  f: [S([[12, 3], [9, 4, 'c'], [9, 17]]), S([[7, 9], [12, 9]])],
  g: [S(bowlL, true), S([[13, 9], [13, 19, 'c'], [8, 20]])],
  h: [S([[7, 3], [7, 17]]), S([[7, 12], [10, 9, 'c'], [13, 12], [13, 17]])],
  i: [S([[10, 9], [10, 17]]), S([[10, 5], [10, 6]])],
  j: [S([[11, 9], [11, 19, 'c'], [8, 20]]), S([[11, 5], [11, 6]])],
  k: [S([[7, 3], [7, 17]]), S([[13, 9], [7, 13], [13, 17]])],
  l: [S([[10, 3], [10, 17]])],
  m: [S([[5, 9], [5, 17]]), S([[5, 11], [8, 9, 'c'], [10, 11], [10, 17]]), S([[10, 11], [13, 9, 'c'], [15, 11], [15, 17]])],
  n: [S([[7, 9], [7, 17]]), S([[7, 12], [10, 9, 'c'], [13, 12], [13, 17]])],
  o: [S([[10, 9, 'c'], [13, 13, 'c'], [10, 17, 'c'], [7, 13, 'c']], true)],
  p: [S([[7, 9], [7, 20]]), S(bowlR, true)],
  q: [S([[13, 9], [13, 20]]), S(bowlL, true)],
  r: [S([[7, 9], [7, 17]]), S([[7, 12], [10, 9, 'c'], [13, 10]])],
  s: [S([[13, 10], [10, 9, 'c'], [7, 11, 'c'], [13, 15, 'c'], [10, 17, 'c'], [7, 16]])],
  t: [S([[10, 4], [10, 16, 'c'], [13, 17]]), S([[7, 9], [13, 9]])],
  u: [S([[7, 9], [7, 15, 'c'], [10, 17, 'c'], [13, 15]]), S([[13, 9], [13, 17]])],
  v: [S([[7, 9], [10, 17], [13, 9]])],
  w: [S([[5, 9], [7, 17], [10, 11], [13, 17], [15, 9]])],
  x: [S([[7, 9], [13, 17]]), S([[13, 9], [7, 17]])],
  y: [S([[7, 9], [10, 17]]), S([[13, 9], [8, 20]])],
  z: [S([[7, 9], [13, 9], [7, 17], [13, 17]])],
};
const names = Object.keys(ABC);

/* The ink, as share.js cuts it, and prepared as the extension prepares it. */
const inks = names.map((n) => F.glyphContours({ strokes: ABC[n] }, GPEN));
say(inks.every((c) => c && c.length), 'every letter cut to ink: ' + inks.length + ' letters');
const prep = H.handPrep(inks);

/* What a finger drawing over the letter gives: each stroke's centre line, the
   curves flattened the way the pen flattens them, a point every few units --
   a finger reports a point a frame, not a point a corner. */
function trace(strokes){
  return strokes.map((st) => {
    let line = F.toPolyline(st, GPEN.curve).map((p) => [p[0], p[1]]);
    if (st.closed) line.push(line[0]);
    const out = [line[0]];
    for (let i = 1; i < line.length; i++){
      const a = line[i - 1], b = line[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 8));
      for (let t = 1; t <= n; t++) out.push([a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n]);
    }
    return out;
  });
}

/* Deterministic, so a red is the same red twice. */
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pm1 = () => rnd() * 2 - 1;

/* Into the pad: a finger writes in points, somewhere on a keyboard 390 wide. */
function place(strokes, sc, dx, dy){ return strokes.map((s) => s.map((p) => [p[0] * sc + dx, p[1] * sc + dy])); }
function around(strokes, f){
  let x = 0, y = 0, n = 0;
  strokes.forEach((s) => s.forEach((p) => { x += p[0]; y += p[1]; n++; }));
  x /= n; y /= n;
  return strokes.map((s) => s.map((p) => { const q = f(p[0] - x, p[1] - y); return [q[0] + x, q[1] + y]; }));
}
const KINDS = {
  'moved and resized': (s) => place(s, 0.2 + rnd() * 0.3, pm1() * 120 + 150, pm1() * 40 + 60),
  'wobbled (a finger is not a lattice)': (s) => {
    /* a slow drift plus a tremor, per stroke -- about 3% of the box */
    return s.map((st) => { const ph = rnd() * 6, fq = 0.05 + rnd() * 0.1;
      return st.map((p, i) => [p[0] + 18 * Math.sin(ph + i * fq) + pm1() * 6, p[1] + 18 * Math.cos(ph * 1.3 + i * fq) + pm1() * 6]); });
  },
  'turned up to 10 degrees': (s) => { const a = pm1() * Math.PI / 18, c = Math.cos(a), n = Math.sin(a); return around(s, (x, y) => [x * c - y * n, x * n + y * c]); },
  'slanted like italics': (s) => { const k = -(0.1 + rnd() * 0.15); return around(s, (x, y) => [x + k * y, y]); },
  'squashed or stretched by 15%': (s) => { const f = 1 + pm1() * 0.15; return around(s, (x, y) => [x * f, y / f]); },
  'another order, the other way round': (s) => s.slice().reverse().map((st, i) => (i % 2 ? st : st.slice().reverse())),
  'each stroke a little off where it belongs': (s) => s.map((st) => { const ox = pm1() * 25, oy = pm1() * 25; return st.map((p) => [p[0] + ox, p[1] + oy]); }),
};
/* and all of them at once, then put in the pad */
const ALL = (s) => {
  let o = s;
  for (const k of Object.keys(KINDS)) if (k !== 'moved and resized') o = KINDS[k](o);
  return KINDS['moved and resized'](o);
};

const ROUNDS = 6, FLOOR_ONE = 0.95, FLOOR_ALL = 0.9;
const missed = [];
let offered = 0, offeredOf = 0;
function count(label, f, floor){
  let hit = 0, n = 0, inBar = 0;
  for (let r = 0; r < ROUNDS; r++) for (let i = 0; i < names.length; i++){
    const rank = H.handRank(prep, f(trace(ABC[names[i]])));
    const got = rank.length ? rank[0] : -1;
    n++;
    if (rank.indexOf(i) >= 0) inBar++;
    if (got === i) hit++;
    else missed.push(label + ': ' + names[i] + ' came back ' + (got < 0 ? 'nothing' : names[got]));
  }
  offered += inBar; offeredOf += n;
  say(hit >= n * floor, label + ': ' + hit + '/' + n + ' the letter written first' +
      (floor < 1 ? ' (at least ' + Math.ceil(n * floor) + ')' : '') + ', ' + inBar + '/' + n + ' in the bar');
}
const EXACT = ['moved and resized', 'another order, the other way round'];
count('as drawn', (s) => s, 1);
for (const k of Object.keys(KINDS)) count(k, KINDS[k], EXACT.indexOf(k) >= 0 ? 1 : FLOOR_ONE);
count('all of those at once', ALL, FLOOR_ALL);
say(offered === offeredOf, 'the letter written is among the ' + H.HAND_PICKS + ' the bar offers every time: ' + offered + '/' + offeredOf);
say(H.handRank(prep, trace(ABC.o)).length === Math.min(H.HAND_PICKS, names.length), 'the bar is offered ' + H.HAND_PICKS + ', nearest first');
if (missed.length) console.log('  ' + missed.slice(0, 12).join('\n  ') + (missed.length > 12 ? '\n  ...' : ''));

/* Nothing written, and nothing to choose from, are both "no letter" -- never
   the first one. */
say(H.handRank(prep, []).length === 0, 'nothing written offers nothing');
say(H.handRank(H.handPrep([null, null]), trace(ABC.l)).length === 0, 'no drawn letter to choose from offers nothing');
/* A face with no shape is skipped, not chosen: a letter nobody drew. */
const holey = H.handPrep([null].concat(inks));
say(H.handRank(holey, trace(ABC.o))[0] === names.indexOf('o') + 1 && H.handRank(holey, trace(ABC.o), 99).indexOf(0) < 0, 'a letter with no shape is passed over, and never offered');

/* The file counted is the file the phone has. */
const pbx = fs.readFileSync('ios/App/App.xcodeproj/project.pbxproj', 'utf8');
const ref = (pbx.match(/([0-9A-F]{24}) \/\* hand\.js in Resources \*\//) || [])[1];
const phases = pbx.match(/\/\* Begin PBXResourcesBuildPhase section \*\/[\s\S]*?\/\* End PBXResourcesBuildPhase section \*\//);
const kbTarget = pbx.match(/\/\* LinguaKeyboard \*\/ = \{\s*isa = PBXNativeTarget;[\s\S]*?buildPhases = \(([\s\S]*?)\);/);
let inPhase = false;
if (ref && phases && kbTarget){
  const ids = kbTarget[1].match(/[0-9A-F]{24}/g) || [];
  for (const id of ids){
    const m = phases[0].match(new RegExp(id + ' /\\* Resources \\*/ = \\{[\\s\\S]*?files = \\(([\\s\\S]*?)\\);'));
    if (m && m[1].indexOf(ref) >= 0) inPhase = true;
  }
}
say(inPhase, 'hand.js is in the LinguaKeyboard target\'s Resources phase');

console.log('\nhand: ' + names.length + ' letters, ' + (Object.keys(KINDS).length + 2) + ' kinds of writing, ' +
            ROUNDS + ' rounds each' + (bad ? ' -- ' + bad + ' failed' : ''));
process.exit(bad ? 1 : 0);
