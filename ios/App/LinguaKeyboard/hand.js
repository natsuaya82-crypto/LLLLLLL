/* hand.js -- which drawn letter a finger just wrote (the handwriting face).
   OWNER 2026-09-25「後手書き追加しよう」: write on the keyboard's face and the
   nearest of the language's own drawn letters goes in.

   ONE FILE AND TWO PROGRAMS. The keyboard extension runs this in
   JavaScriptCore (Hand.swift) and tools/hand-check.mjs runs it in Node --
   the same bytes, so what the check counts is what the phone does. Writing
   the measure again in Swift would be a second answer to "which letter is
   nearest" with nothing able to see the two come apart, which is the reason
   www/share.js sends the ink already cut rather than the strokes.

   What it compares against is exactly what www/share.js already hands the
   keyboard: a letter's ink as closed convex polygons in the 800 box, x right
   and y down (shareFace()'s `st`). What it compares is a finger's strokes,
   lists of [x, y] in whatever space the pad has -- position and size do not
   matter, because both sides are fitted into the same square first.

   ES5 on purpose, like everything under www/: JavaScriptCore on the oldest
   phone the keyboard runs on is not a place to find out otherwise. Nothing
   here touches a DOM, a timer or a global besides the four functions. */

/* The square both sides are drawn into, and the margin inside it. 32 is
   enough to tell a letter's parts apart and small enough that a hundred and
   eighty letters are prepared in a few milliseconds. */
var HAND_N = 32, HAND_PAD = 2;

/* How far a writing may lean and still be read upright: the most slant
   handShear() takes back out. A letter that IS a slant -- a `/` beside a `|`
   -- keeps what is past this, so the two stay two letters. */
var HAND_LEAN = 0.3;

/* A shape fitted into the square: slanted back by `k` (x moves by k for every
   unit of y, about the middle), then the bounding box of everything scaled by
   its LONGER side so a tall letter stays tall and a wide one wide, and
   centred. Returns the function that takes a point there. */
function handFit(pts, k){
  var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, i, s, ox, oy, big, my = 0, q;
  for (i = 0; i < pts.length; i++) my += pts[i][1];
  my /= pts.length;
  function lean(p){ return [p[0] - k * (p[1] - my), p[1]]; }
  for (i = 0; i < pts.length; i++){
    q = lean(pts[i]);
    if (q[0] < x0) x0 = q[0];
    if (q[0] > x1) x1 = q[0];
    if (q[1] < y0) y0 = q[1];
    if (q[1] > y1) y1 = q[1];
  }
  big = Math.max(x1 - x0, y1 - y0, 1e-6);
  s = (HAND_N - HAND_PAD * 2) / big;
  ox = (HAND_N - (x1 - x0) * s) / 2;
  oy = (HAND_N - (y1 - y0) * s) / 2;
  return function (p){ q = lean(p); return [ox + (q[0] - x0) * s, oy + (q[1] - y0) * s]; };
}
/* How far the inked cells lean: x against y, over how much y varies, which
   is the slant a shear by that much removes. Held to HAND_LEAN either way. */
function handShear(g){
  var n = 0, mx = 0, my = 0, sxy = 0, syy = 0, x, y, k;
  for (y = 0; y < HAND_N; y++) for (x = 0; x < HAND_N; x++)
    if (g[y * HAND_N + x]){ n++; mx += x; my += y; }
  if (n < 2) return 0;
  mx /= n; my /= n;
  for (y = 0; y < HAND_N; y++) for (x = 0; x < HAND_N; x++)
    if (g[y * HAND_N + x]){ sxy += (x - mx) * (y - my); syy += (y - my) * (y - my); }
  if (syy <= 0) return 0;
  k = sxy / syy;
  return Math.max(-HAND_LEAN, Math.min(HAND_LEAN, k));
}
function handCell(g, x, y){
  var cx = Math.floor(x), cy = Math.floor(y);
  if (cx < 0) cx = 0; if (cx >= HAND_N) cx = HAND_N - 1;
  if (cy < 0) cy = 0; if (cy >= HAND_N) cy = HAND_N - 1;
  g[cy * HAND_N + cx] = 1;
}
/* Both sides into the square the same way: drawn once as they are, measured
   for how far they lean, and drawn again upright. `paint(g, fit)` is the only
   thing the ink and the finger do differently -- one fills, one walks. */
function handGrid(pts, paint){
  var g, i, k;
  if (!pts.length) return null;
  function blank(){ var o = []; for (i = 0; i < HAND_N * HAND_N; i++) o.push(0); return o; }
  g = blank(); paint(g, handFit(pts, 0));
  k = handShear(g);
  if (k === 0) return g;
  g = blank(); paint(g, handFit(pts, k));
  return g;
}
/* Is a point inside a convex polygon: on the same side of every edge. */
function handInside(poly, x, y){
  var i, a, b, c, sgn = 0;
  for (i = 0; i < poly.length; i++){
    a = poly[i]; b = poly[(i + 1) % poly.length];
    c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
    if (c === 0) continue;
    if (sgn === 0) sgn = c > 0 ? 1 : -1;
    else if ((c > 0 ? 1 : -1) !== sgn) return false;
  }
  return true;
}
/* A letter's ink: every cell whose middle is in it, plus the cell of every
   corner -- a stroke the pen made thinner than a cell would otherwise fall
   between the middles and come out as dots. */
function handGridInk(polys){
  var pts = [], i, j;
  for (i = 0; i < polys.length; i++) for (j = 0; j < polys[i].length; j++) pts.push(polys[i][j]);
  return handGrid(pts, function (g, fit){
    var i, j, q, fp, x, y;
    for (i = 0; i < polys.length; i++){
      fp = [];
      for (j = 0; j < polys[i].length; j++){ q = fit(polys[i][j]); fp.push(q); handCell(g, q[0], q[1]); }
      if (fp.length < 3) continue;
      for (y = 0; y < HAND_N; y++) for (x = 0; x < HAND_N; x++)
        if (!g[y * HAND_N + x] && handInside(fp, x + 0.5, y + 0.5)) g[y * HAND_N + x] = 1;
    }
  });
}
/* A finger's strokes: every segment walked a quarter of a cell at a time. */
function handGridPen(strokes){
  var pts = [], i, j;
  for (i = 0; i < strokes.length; i++) for (j = 0; j < strokes[i].length; j++) pts.push(strokes[i][j]);
  return handGrid(pts, function (g, fit){
    var i, j, a, b, n, t, d;
    for (i = 0; i < strokes.length; i++){
      if (!strokes[i].length) continue;
      a = fit(strokes[i][0]);
      handCell(g, a[0], a[1]);
      for (j = 1; j < strokes[i].length; j++){
        b = fit(strokes[i][j]);
        d = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
        n = Math.max(1, Math.ceil(d * 4));
        for (t = 1; t <= n; t++) handCell(g, a[0] + (b[0] - a[0]) * t / n, a[1] + (b[1] - a[1]) * t / n);
        a = b;
      }
    }
  });
}
/* The grid, and how far every cell is from the nearest inked one -- the
   3-4 chamfer, two passes, divided back into cells. Worked out once per
   letter, so a question costs one pass over the ones that are inked. */
function handShape(g){
  var dt = [], on = [], i, x, y, v, BIG = 1e9;
  if (!g) return null;
  for (i = 0; i < g.length; i++){ dt.push(g[i] ? 0 : BIG); if (g[i]) on.push(i); }
  function at(x, y){ return (x < 0 || y < 0 || x >= HAND_N || y >= HAND_N) ? BIG : dt[y * HAND_N + x]; }
  for (y = 0; y < HAND_N; y++) for (x = 0; x < HAND_N; x++){
    v = dt[y * HAND_N + x];
    v = Math.min(v, at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
    dt[y * HAND_N + x] = v;
  }
  for (y = HAND_N - 1; y >= 0; y--) for (x = HAND_N - 1; x >= 0; x--){
    v = dt[y * HAND_N + x];
    v = Math.min(v, at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
    dt[y * HAND_N + x] = v;
  }
  for (i = 0; i < dt.length; i++) dt[i] = dt[i] / 3;
  return {on: on, dt: dt};
}

/* THE MEASURE, and the only one. How far apart two shapes are: on average,
   how far each inked cell of one is from the nearest inked cell of the
   other, SQUARED, both ways round -- so a letter that is only PART of another
   (an l inside a b) is as far from it as the part that is missing, a part in
   the wrong place counts for more than a line drawn a little wide, and
   neither the order the strokes were written in nor which way each one went
   makes any difference. Smaller is nearer. Squared rather than plain was
   measured: tools/hand-check.mjs read 135 of 156 with everything wrong at
   once, and 146 squared. */
function handDist(a, b){
  var i, sa = 0, sb = 0;
  if (!a || !b || !a.on.length || !b.on.length) return Infinity;
  for (i = 0; i < a.on.length; i++) sa += b.dt[a.on[i]] * b.dt[a.on[i]];
  for (i = 0; i < b.on.length; i++) sb += a.dt[b.on[i]] * a.dt[b.on[i]];
  return sa / a.on.length + sb / b.on.length;
}

/* The letters, prepared once when the keyboard opens: one entry per face in
   the order given, null where a face has no shape (it can never be chosen). */
function handPrep(inks){
  var out = [], i;
  for (i = 0; i < inks.length; i++)
    out.push(inks[i] && inks[i].length ? handShape(handGridInk(inks[i])) : null);
  return out;
}
/* Which of them the strokes are nearest to: its index in what handPrep()
   was given, or -1 when there is nothing to choose from or nothing written. */
function handNear(prep, strokes){
  var me = handShape(handGridPen(strokes || [])), best = -1, bd = Infinity, i, d;
  if (!me) return -1;
  for (i = 0; i < prep.length; i++){
    d = handDist(me, prep[i]);
    if (d < bd){ bd = d; best = i; }
  }
  return best;
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = {handPrep: handPrep, handNear: handNear, handDist: handDist,
                    handShape: handShape, handGridInk: handGridInk, handGridPen: handGridPen};
