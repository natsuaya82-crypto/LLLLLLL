/* ---------------------------------------------------------------------------
   tools/pv/lang.mjs — the language the film is about.

   tools/fixture.mjs is three letters and a triangle. That is the right
   fixture for a check, which only ever asks whether a screen renders, and it
   is not a language anybody would want to look at for a minute. So the film
   has its own: an alphabet somebody could plausibly have drawn, a dictionary
   with words in it, and a handful of posts.

   THE ALPHABET IS A SYSTEM, not thirty-eight doodles, because that is what
   makes it read as writing rather than as decoration. Every letter stands on
   the same stem, and what a letter IS is what is attached to it and where:

     a tick, up or down, left or right, at the top, the middle or the foot
     a bar across it, at one of those three heights
     a bowl on one side
     a ring, which is what the five vowels have

   Digits count in fives: a bar for the hand, and up to four strokes under it.

   Coordinates are the drawing surface's own -- an 800 x 800 box with the grid
   inset 40 from each edge, y downwards -- so what is here is exactly what a
   person's finger would have left behind. The pen rounds a corner as it
   sweeps (GPEN.curve), so three points make a curve and two make a line.
   --------------------------------------------------------------------------- */

const TOP = 200, MID = 420, BOT = 600, BASE = 660, X = 380;
const TICK = 150, DROP = 105;

/* The editor puts every tap on a lattice -- 21 points a side, inset 40 --
   so a straight stroke's ends land on one of 21 values and nowhere else. The
   alphabet is drawn on that same lattice, because a letter here has to be a
   letter somebody's finger could actually have made. A ring is not snapped:
   a circle is what ROUND makes of three taps, and it is a curve rather than
   a run between two points. */
const STEP = (800 - 80) / 20;
function snap(v){
  const k = Math.round((v - 40) / STEP);
  return Math.round(40 + Math.max(0, Math.min(20, k)) * STEP);
}
function pt(x, y){ return [snap(x), snap(y)]; }
function raw(x, y){ return [Math.round(x), Math.round(y)]; }
function s(pts){ return { pts: pts }; }
function line(x1, y1, x2, y2){ return s([pt(x1, y1), pt(x2, y2)]); }
function poly(a){ return s(a.map(function(p){ return pt(p[0], p[1]); })); }
/* Degrees, y downwards, so 0 is to the right and 90 is below. */
function arc(cx, cy, r, a0, a1, n){
  const out = [];
  const steps = n || Math.max(6, Math.round(Math.abs(a1 - a0) / 18));
  for (let i = 0; i <= steps; i++){
    const a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180;
    out.push(raw(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return s(out);
}
function ring(cx, cy, r){ return arc(cx, cy, r, -90, 271, 20); }

/* The stem every letter stands on. */
const stem = () => line(X, TOP, X, BASE);
/* A stem that carries on below the line -- five letters have one, so the
   writing has something below the baseline to give it a rhythm. */
const stemLong = () => line(X, TOP, X, BASE + 110);
const stemShort = () => line(X, MID - 40, X, BASE);

const ru = (h) => line(X, h, X + TICK, h - DROP);   /* up and to the right */
const rd = (h) => line(X, h, X + TICK, h + DROP);
const lu = (h) => line(X, h, X - TICK, h - DROP);
const ld = (h) => line(X, h, X - TICK, h + DROP);
const bar = (h) => line(X - TICK, h, X + TICK, h);
const armR = (h) => line(X, h, X + TICK, h);
const armL = (h) => line(X, h, X - TICK, h);
/* A bowl leaves the stem, swells out and comes back to it. */
const bowlR = (h) => arc(X, h, 130, -90, 90, 10);
const bowlL = (h) => arc(X, h, 130, 90, 270, 10);
const ringR = (h, r) => ring(X + (r || 95), h, r || 95);
const ringL = (h, r) => ring(X - (r || 95), h, r || 95);
const dot = (h) => ring(X, h, 34);

/* ---- the twenty-six ------------------------------------------------------ */
const A = {
  /* the five vowels: a ring, and where it sits is which vowel it is */
  a: [stem(), ringR(TOP + 40)],
  e: [stem(), ringR(MID)],
  i: [stemShort(), ringR(BOT - 30, 78)],
  o: [line(X, TOP + 120, X, BASE), ring(X, TOP + 60, 105)],
  u: [stem(), ringR(TOP + 30, 72), ringR(BOT - 10, 72)],

  /* a tick, and where and which way it points is which letter it is */
  b: [stem(), ru(TOP + 60)],
  c: [stem(), rd(TOP + 60)],
  d: [stem(), ru(MID)],
  f: [stem(), rd(MID)],
  g: [stemLong(), ru(BOT)],
  h: [stem(), rd(BOT - 20)],
  j: [stemLong(), lu(TOP + 60)],
  k: [stem(), ld(TOP + 60)],
  l: [stem(), lu(MID)],
  m: [stem(), ld(MID)],
  n: [stem(), lu(BOT)],
  p: [stemLong(), ld(BOT - 20)],

  /* a bar across it */
  q: [stem(), bar(TOP + 70)],
  r: [stem(), bar(MID)],
  s: [stemLong(), bar(BOT - 20)],

  /* a bowl */
  t: [stem(), bowlR(MID)],
  v: [stem(), bowlL(MID)],
  w: [stem(), bowlR(TOP + 110)],
  x: [stem(), bowlL(TOP + 110)],

  /* and three that are two marks at once */
  y: [stem(), ru(TOP + 60), rd(BOT - 20)],
  z: [stem(), lu(TOP + 60), ld(BOT - 20)],

  /* the two marks the free plan gives everybody */
  '!': [line(X, TOP, X, BOT - 60), dot(BASE + 20)],
  '?': [s([pt(X - 120, TOP + 60), pt(X - 20, TOP - 20), pt(X + 110, TOP + 60),
            pt(X + 20, MID + 40), pt(X, BOT - 70)]), dot(BASE + 20)],
};

/* ---- the ten ------------------------------------------------------------
   Counting in fives: strokes under a bar, and a second bar for the second
   hand. Nought is the ring, which is the one shape the alphabet keeps for
   the letter that is not there either. */
function digit(v){
  if (v === 0) return [ring(X, MID + 20, 150)];
  const out = [];
  const hands = Math.floor(v / 5), ones = v % 5;
  if (hands) out.push(line(X - 170, TOP + 90, X + 170, TOP + 90));
  if (hands > 1) out.push(line(X - 170, TOP + 10, X + 170, TOP + 10));
  const top = hands ? TOP + 150 : TOP + 60;
  for (let i = 0; i < ones; i++){
    const x = X - 130 + i * 65;
    out.push(line(x, top, x, BASE));
  }
  if (!ones) out.push(line(X, top, X, BASE));
  return out;
}

export const PV_STROKES = (function(){
  const m = {};
  for (const k in A) m[k] = A[k];
  for (let v = 0; v <= 9; v++) m['#' + v] = digit(v);
  return m;
})();

/* ---- the dictionary -----------------------------------------------------
   Enough of it that the lexicon is a page somebody has been keeping, and
   short enough that every line of it can be read at a glance. The words are
   built out of the same handful of sounds, the way a language's are. */
export const PV_WORDS = [
  { hw:'kano',  ph:['k','a','n','o'],         mn:'mountain',      pos:'n',   at:1,  tags:['land'], ety:'from the word for head' },
  { hw:'sar',   ph:['s','a','r'],             mn:'river',         pos:'n',   at:2,  tags:['land'] },
  { hw:'tir',   ph:['t','i','r'],             mn:'to see',        pos:'v',   at:3 },
  { hw:'tira',  ph:['t','i','r','a'],         mn:'saw',           pos:'v',   at:4,  from:'tir', fm:'pst' },
  { hw:'tiran', ph:['t','i','r','a','n'],     mn:'seeing',        pos:'v',   at:5,  from:'tir', fm:'prg' },
  { hw:'tiror', ph:['t','i','r','o','r'],     mn:'watcher',       pos:'n',   at:6,  from:'tir' },
  { hw:'mos',   ph:['m','o','s'],             mn:'tall',          pos:'adj', at:7 },
  { hw:'mosun', ph:['m','o','s','u','n'],     mn:'height',        pos:'n',   at:8,  from:'mos' },
  { hw:'lenu',  ph:['l','e','n','u'],         mn:'quiet',         pos:'adj', at:9 },
  { hw:'lenka', ph:['l','e','n','k','a'],     mn:'to fall silent',pos:'v',   at:10, from:'lenu' },
  { hw:'veth',  ph:['v','e','t','h'],         mn:'sea',           pos:'n',   at:11, tags:['land'] },
  { hw:'venar', ph:['v','e','n','a','r'],     mn:'evening',       pos:'n',   at:12 },
  { hw:'ora',   ph:['o','r','a'],             mn:'to walk',       pos:'v',   at:13 },
  { hw:'orana', ph:['o','r','a','n','a'],     mn:'a road',        pos:'n',   at:14, from:'ora' },
  { hw:'kel',   ph:['k','e','l'],             mn:'stone',         pos:'n',   at:15 },
  { hw:'keluk', ph:['k','e','l','u','k'],     mn:'wall',          pos:'n',   at:16, from:'kel' },
  { hw:'nak',   ph:['n','a','k'],             mn:'not',           pos:'part',at:17, slot:'neg.not' },
  { hw:'ke',    ph:['k','e'],                 mn:'what',          pos:'pro', at:18, slot:'ask.what' },
  { hw:'aru',   ph:['a','r','u'],             mn:'to hold',       pos:'v',   at:19 },
  { hw:'sarin', ph:['s','a','r','i','n'],     mn:'to flow',       pos:'v',   at:20, from:'sar' }
].map(function(w){ w.mns = [w.mn]; return w; });

export const PV_SND = ['k','t','m','n','s','r','l','v','h','a','i','u','e','o'];
