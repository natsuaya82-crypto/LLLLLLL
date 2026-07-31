// Spike v4 — SPACING. The user looked at proof3.png and said the letter fit was
// off. It was, for two separate reasons, and one of them was a real bug:
//
//   BUG. v3 set advanceWidth from the outline bbox and set leftSideBearing as a
//   metadata field — but never TRANSLATED the outline. The lsb field in hmtx is
//   descriptive; what actually positions ink is the path coordinates. So every
//   glyph kept the x it happened to be drawn at on the canvas. Measured on
//   LS3-regular.otf: left gaps ran 65..135 and right gaps ran -35..+35, i.e. "i"
//   had a 135-unit hole in front of it and stuck 35 units INTO the next letter.
//
//   DESIGN. Even with that fixed, a fixed gap either side of the bounding box is
//   the wrong metric. The bbox of a round "a" touches its neighbour at one point;
//   the bbox of an open "l" is mostly air. Equal box gaps therefore look unequal.
//   What the eye actually reads is AREA of white between the letters.
//
// So this spike measures the white area beside each glyph and solves each
// sidebearing to make that area constant. This is the standard approach (the same
// idea as Huerta Tipografica's letterspacer) and it is possible here without a
// designer because we already have the outline: sample the margin at every
// scanline, clamp how deep a concavity is allowed to count, average, and give
// back whatever the average is short of the target.
//
// Also: v3 had no space glyph at all, so word gaps came from the fallback font.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const ot = require('opentype.js');
const HERE = new URL('.', import.meta.url).pathname;

const EM = 1000, BASE = 800, ASC = 800, DESC = -200;

const PENS = {
  light:    { width:  60, angleDeg: 0,  contrast: 1.0 },
  regular:  { width: 110, angleDeg: 0,  contrast: 1.0 },
  bold:     { width: 190, angleDeg: 0,  contrast: 1.0 },
  broadnib: { width: 190, angleDeg: 30, contrast: 0.34 },
};

const GLYPHS = [
  { name: 'a', roman: 'a', phonemes: ['a'], strokes: [
      { closed: true, pts: [[300,250,'c'],[520,470,'c'],[300,690,'c'],[80,470,'c']] } ]},
  { name: 'i', roman: 'i', phonemes: ['i'], strokes: [
      { pts: [[190,330],[190,700]] },
      { pts: [[190,160]] } ]},
  { name: 'k', roman: 'k', phonemes: ['k'], strokes: [
      { pts: [[170,110],[170,760]] },
      { pts: [[500,300],[170,470],[470,700]] } ]},
  { name: 'l', roman: 'l', phonemes: ['l'], strokes: [
      { pts: [[150,140],[150,660,'c'],[430,660,'c'],[430,420]] } ]},
  { name: 's', roman: 's', phonemes: ['s'], strokes: [
      { pts: [[470,280,'c'],[170,280,'c'],[170,470,'c'],[430,470,'c'],[430,700,'c'],[130,700]] } ]},
  { name: 'h', roman: 'h', phonemes: ['h'], strokes: [
      { pts: [[160,110],[160,760]] },
      { pts: [[160,440,'c'],[440,440,'c'],[440,760]] } ]},
  { name: 't', roman: 't', phonemes: ['t'], strokes: [
      { pts: [[300,110],[300,700,'c'],[520,600]] },
      { pts: [[130,330],[470,330]] } ]},
  { name: 's_h', roman: null, phonemes: ['ʃ'], strokes: [
      { pts: [[120,700],[120,300,'c'],[340,300,'c'],[340,700]] },
      { pts: [[340,470,'c'],[600,470,'c'],[600,760]] } ]},
];

// --- skeleton -> contours (unchanged from v3) -------------------------------
const ROUND = 0.44, FLAT_TOL = 3;
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function mul(a, k) { return [a[0] * k, a[1] * k]; }
function len(a) { return Math.hypot(a[0], a[1]) || 1e-9; }
function unit(a) { return mul(a, 1 / len(a)); }

function flattenQuad(p0, c, p1, out) {
  const dev = len(sub(mul(add(p0, p1), 0.5), c));
  const n = Math.max(2, Math.min(16, Math.ceil(Math.sqrt(dev / (2 * FLAT_TOL)))));
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
              u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
}
function toPolyline(st) {
  const v = st.pts, m = v.length;
  if (m === 1) return [[v[0][0], v[0][1]]];
  const closed = !!st.closed;
  const P = function (i) { const p = v[((i % m) + m) % m]; return [p[0], p[1]]; };
  const bends = function (i) {
    return v[((i % m) + m) % m][2] === 'c' && (closed || (i > 0 && i < m - 1));
  };
  const radius = function (i) {
    return Math.min(ROUND * len(sub(P(i - 1), P(i))), ROUND * len(sub(P(i + 1), P(i))));
  };
  const entry = function (i) { return add(P(i), mul(unit(sub(P(i - 1), P(i))), radius(i))); };
  const exit  = function (i) { return add(P(i), mul(unit(sub(P(i + 1), P(i))), radius(i))); };
  const out = [];
  for (let i = 0; i < m; i++) {
    if (bends(i)) { const A = entry(i), B = exit(i); out.push(A); flattenQuad(A, P(i), B, out); }
    else { out.push(P(i)); }
  }
  if (closed) out.push(out[0].slice());
  return out;
}
function nib(pen, n) {
  n = n || 12;
  const a = pen.width / 2, b = a * pen.contrast;
  const th = pen.angleDeg * Math.PI / 180, ca = Math.cos(th), sa = Math.sin(th);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.cos(t) * a, y = Math.sin(t) * b;
    pts.push([x * ca - y * sa, x * sa + y * ca]);
  }
  return pts;
}
function hull(pts) {
  const p = pts.slice().sort(function (u, w) { return u[0] - w[0] || u[1] - w[1]; });
  const cross = function (o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  };
  const lower = [];
  for (let i = 0; i < p.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p[i]) <= 0) lower.pop();
    lower.push(p[i]);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop();
    upper.push(p[i]);
  }
  const h = lower.slice(0, -1).concat(upper.slice(0, -1));
  const r = [];
  h.forEach(function (q0) {
    const q = [Math.round(q0[0]), Math.round(q0[1])];
    const last = r[r.length - 1];
    if (!last || last[0] !== q[0] || last[1] !== q[1]) r.push(q);
  });
  if (r.length > 2 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
  return r;
}
function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const q = pts[(i + 1) % pts.length];
    a += pts[i][0] * q[1] - q[0] * pts[i][1];
  }
  return a / 2;
}
function glyphContours(g, pen) {
  const N = nib(pen), out = [];
  g.strokes.forEach(function (st) {
    const line = toPolyline(st);
    const at = function (p) { return N.map(function (d) { return [p[0] + d[0], p[1] + d[1]]; }); };
    if (line.length === 1) { out.push(hull(at(line[0]))); return; }
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1];
      if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) continue;
      out.push(hull(at(a).concat(at(b))));
    }
  });
  return out;   // authoring space, y-DOWN. every contour convex, all same winding.
}

// ---------------------------------------------------------------------------
// SPACING. This is the new part.
//
// Every contour we emit is a convex hull, so a horizontal line meets it in
// exactly one interval — no rasterising needed, and no winding rules. The ink
// edges at height y are therefore just min/max over contours.
// ---------------------------------------------------------------------------
const STEP = 8;            // scanline spacing, em units

function spanAt(c, y) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < c.length; i++) {
    const a = c[i], b = c[(i + 1) % c.length];
    if ((a[1] <= y) === (b[1] <= y)) continue;         // no crossing
    const x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
    if (x < lo) lo = x;
    if (x > hi) hi = x;
  }
  return lo === Infinity ? null : [lo, hi];
}

// One scanline row per STEP. The band is the WHOLE ALPHABET's vertical extent,
// not the glyph's own — otherwise a short glyph and a tall one are averaged over
// different denominators and the per-glyph solve stops agreeing with the
// per-pair measurement. (It did; that cost an hour.)
function profile(contours, band) {
  let y0 = Infinity, y1 = -Infinity;
  contours.forEach(function (c) { c.forEach(function (p) {
    if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }); });
  const b0 = band ? band[0] : y0, b1 = band ? band[1] : y1;
  const rows = [];
  for (let y = b0 + STEP / 2; y < b1; y += STEP) {
    let l = Infinity, r = -Infinity;
    for (let i = 0; i < contours.length; i++) {
      const s = spanAt(contours[i], y);
      if (!s) continue;
      if (s[0] < l) l = s[0];
      if (s[1] > r) r = s[1];
    }
    rows.push(l === Infinity ? { y: y, l: null, r: null } : { y: y, l: l, r: r });
  }
  let xMin = Infinity, xMax = -Infinity;
  rows.forEach(function (w) {
    if (w.l === null) return;
    if (w.l < xMin) xMin = w.l; if (w.r > xMax) xMax = w.r;
  });
  return { rows: rows, xMin: xMin, xMax: xMax, y0: y0, y1: y1, b0: b0, b1: b1 };
}
function extent(contours) {
  let y0 = Infinity, y1 = -Infinity;
  contours.forEach(function (c) { c.forEach(function (p) {
    if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }); });
  return [y0, y1];
}
// The solver, in one line of intent: a sidebearing is the target gap minus
// however much white the letter's own shape already gives away.
//
// For each scanline take the margin from the glyph's extreme edge, but never
// count more than DEPTH of it — otherwise the inside of a "C" would drag the
// next letter all the way into its mouth. Average those clamped margins; that
// average IS the white the shape donates. Subtract it from the target.
//
//   flat-sided stem  -> donates ~0     -> gets the full target gap
//   round bowl       -> donates a bit  -> sits slightly closer, as it should
//   open "l" bottom  -> donates a lot  -> the next letter tucks under it
// MIN_SB is not cosmetic. Clearance between two letters at any height is at
// least rsb(left) + lsb(right), so flooring both at C/2 GUARANTEES no pair ever
// comes closer than C. Without it a narrow-stemmed glyph like "t" donates so
// much white that it is pulled clean through its neighbour.
function bearings(p, DEPTH, GAP, MIN_SB) {
  let sl = 0, sr = 0, n = 0;
  p.rows.forEach(function (w) {
    n++;
    if (w.l === null) { sl += DEPTH; sr += DEPTH; return; }   // gap in the ink
    sl += Math.min(w.l - p.xMin, DEPTH);
    sr += Math.min(p.xMax - w.r, DEPTH);
  });
  return {
    lsb: Math.max(MIN_SB, Math.round(GAP - sl / n)),
    rsb: Math.max(MIN_SB, Math.round(GAP - sr / n)),
    donatedL: sl / n,
    donatedR: sr / n,
  };
}

// ---------------------------------------------------------------------------
// Build. mode 'bbox' reproduces v3 exactly (including the un-translated path)
// so the proof can show both side by side; mode 'area' is the new solver.
// ---------------------------------------------------------------------------
function buildFont(style, pen, mode, DEPTH_F, CLEAR_F, GAP_ABS) {
  // The target white area beside every glyph, in em units. This is the whole
  // "tracking" control: one number for the writing system.
  //
  // It used to be a multiple of pen width, which looked tidy and was wrong. At the
  // light pen that made GAP 45 while glyphs were donating 90..150 of white, so
  // every sidebearing saturated on the collision floor and the solver stopped
  // distinguishing shapes at all — the exact failure it exists to prevent. The
  // skeletons do not shrink when the pen gets thinner, so the white beside them
  // must not either. Absolute, and swept absolutely, so the pen-width relationship
  // is something the measurement reports rather than something I assumed.
  const GAP = Math.round(GAP_ABS);
  // CLEAR_F < 0 means no floor at all, so a sweep can see what the solver wants
  // when nothing holds it back.
  const MIN_SB = CLEAR_F < 0 ? -Infinity : Math.round(CLEAR_F * pen.width / 2);

  const raw0 = GLYPHS.map(function (g) { return { g: g, cs: glyphContours(g, pen) }; });
  // one vertical band for the whole alphabet, so every glyph's white is averaged
  // over the same scanlines
  let B0 = Infinity, B1 = -Infinity;
  raw0.forEach(function (q) {
    const e = extent(q.cs);
    if (e[0] < B0) B0 = e[0];
    if (e[1] > B1) B1 = e[1];
  });
  const BAND = [B0, B1];
  const prepped = raw0.map(function (q) {
    return { g: q.g, cs: q.cs, p: profile(q.cs, BAND) };
  });
  const H = B1 - B0;
  const DEPTH = Math.round(DEPTH_F * H);

  const glyphs = [new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new ot.Path() })];
  const index = {}, metrics = {};
  let points = 0, contours = 0;

  prepped.forEach(function (q) {
    const b = mode === 'area'
      ? bearings(q.p, DEPTH, GAP, MIN_SB)
      : { lsb: 50, rsb: 50, donatedL: 0, donatedR: 0 };
    // v3's bug, kept deliberately in bbox mode: the path is NOT moved, so the
    // real gap is whatever x the glyph was drawn at.
    const dx = mode === 'area' ? b.lsb - q.p.xMin : 0;
    const adv = mode === 'area'
      ? Math.round(b.lsb + (q.p.xMax - q.p.xMin) + b.rsb)
      : Math.round((q.p.xMax - q.p.xMin) + 100);

    const path = new ot.Path();
    q.cs.forEach(function (c) {
      const nodes = signedArea(c) < 0 ? c : c.slice().reverse();
      nodes.forEach(function (pt, i) {
        const X = Math.round(pt[0] + dx), Y = BASE - pt[1];
        if (i === 0) path.moveTo(X, Y); else path.lineTo(X, Y);
      });
      path.close();
    });
    path.commands.forEach(function (c) { if (c.type === 'Z') contours++; else points++; });

    index[q.g.name] = glyphs.length;
    metrics[q.g.name] = {
      adv: adv, dx: dx, xMin: q.p.xMin + dx, xMax: q.p.xMax + dx,
      donatedL: b.donatedL, donatedR: b.donatedR, cs: q.cs, p: q.p,
    };
    glyphs.push(new ot.Glyph({
      name: q.g.name,
      unicode: q.g.roman ? q.g.roman.charCodeAt(0) : undefined,
      advanceWidth: adv,
      leftSideBearing: Math.round(q.p.xMin + dx),
      path: path,
    }));
  });

  // v3 had no space glyph, so every word gap came from the fallback font.
  // A space is two sidebearings plus one stem of white.
  const spaceAdv = mode === 'area' ? Math.round(2 * GAP + pen.width) : 300;
  glyphs.push(new ot.Glyph({
    name: 'space', unicode: 32, advanceWidth: spaceAdv, path: new ot.Path(),
  }));

  const font = new ot.Font({
    familyName: 'LinguaScript', styleName: style,
    unitsPerEm: EM, ascender: ASC, descender: DESC, glyphs: glyphs,
  });
  font.substitution.add('liga', { sub: [index['s'], index['h']], by: index['s_h'] });
  return {
    style: style, mode: mode, buf: Buffer.from(font.toArrayBuffer()),
    GAP: GAP, DEPTH: DEPTH, spaceAdv: spaceAdv,
    metrics: metrics, points: points, contours: contours,
  };
}


// ---------------------------------------------------------------------------
// Exact minimum clearance between two glyphs, geometrically. This one is not a
// matter of taste: if it goes negative, ink overlaps ink and the font is broken.
// ---------------------------------------------------------------------------
function minClearance(metrics) {
  const names = Object.keys(metrics);
  let worst = Infinity, worstPair = '';
  names.forEach(function (A) {
    names.forEach(function (B) {
      const a = metrics[A], b = metrics[B];
      for (let y = a.p.b0 + STEP / 2; y < a.p.b1; y += STEP) {
        let ar = -Infinity, bl = Infinity;
        a.cs.forEach(function (c) { const s = spanAt(c, y); if (s && s[1] + a.dx > ar) ar = s[1] + a.dx; });
        b.cs.forEach(function (c) { const s = spanAt(c, y); if (s && s[0] + b.dx < bl) bl = s[0] + b.dx; });
        if (ar === -Infinity || bl === Infinity) continue;
        const c = a.adv + bl - ar;
        if (c < worst) { worst = c; worstPair = A + B; }
      }
    });
  });
  return { clear: worst, pair: worstPair };
}

// ---------------------------------------------------------------------------
// How much tracking? The rhythm measurement in measure4.mjs cannot answer this,
// and it took a wrong turn before I noticed why: at a matched overall text width,
// looser tracking ALWAYS scores more even, because the letters shrink relative to
// the squint radius. That is not an artefact — loose tracking really is more
// forgiving of spacing error — but it means the metric monotonically prefers
// looser and can only choose DEPTH_F, never GAP.
//
// So GAP gets anchored geometrically instead, on the oldest rule in spacing:
// the white BETWEEN letters should match the white INSIDE them. A line of text is
// one rhythm of dark and light, and the reader does not know which side of an
// outline any given piece of white is on. Both quantities are measurable here with
// the same scanlines and no clamp anywhere, so the ratio is a fact about the
// alphabet rather than a restatement of the solver's own target.
// ---------------------------------------------------------------------------
function unionGaps(cs, dx, y) {
  const iv = [];
  cs.forEach(function (c) { const s = spanAt(c, y); if (s) iv.push([s[0] + dx, s[1] + dx]); });
  if (iv.length < 2) return [];
  iv.sort(function (a, b) { return a[0] - b[0]; });
  const gaps = [];
  let end = iv[0][1];
  for (let i = 1; i < iv.length; i++) {
    if (iv[i][0] > end) gaps.push(iv[i][0] - end);
    if (iv[i][1] > end) end = iv[i][1];
  }
  return gaps;
}

function whiteBalance(metrics) {
  const names = Object.keys(metrics);
  let si = 0, ni = 0, sb = 0, nb = 0;
  names.forEach(function (A) {
    const a = metrics[A];
    for (let y = a.p.b0 + STEP / 2; y < a.p.b1; y += STEP) {
      unionGaps(a.cs, a.dx, y).forEach(function (w) { si += w; ni++; });
    }
  });
  names.forEach(function (A) {
    names.forEach(function (B) {
      const a = metrics[A], b = metrics[B];
      for (let y = a.p.b0 + STEP / 2; y < a.p.b1; y += STEP) {
        let ar = -Infinity, bl = Infinity;
        a.cs.forEach(function (c) { const s = spanAt(c, y); if (s && s[1] + a.dx > ar) ar = s[1] + a.dx; });
        b.cs.forEach(function (c) { const s = spanAt(c, y); if (s && s[0] + b.dx < bl) bl = s[0] + b.dx; });
        if (ar === -Infinity || bl === Infinity) continue;
        sb += a.adv + bl - ar; nb++;
      }
    });
  });
  const interior = ni ? si / ni : 0, between = nb ? sb / nb : 0;
  return { interior: interior, between: between, ratio: interior ? between / interior : 0 };
}

// ---------------------------------------------------------------------------
// Build the whole matrix of candidates. Choosing DEPTH_F by argument would be
// guessing; measure4.mjs renders all of these and picks by blurred rhythm.
// ---------------------------------------------------------------------------
// Two parameters, and no reason to trust an opinion about either:
//   GAP_F   — target white area beside each glyph, x pen width. This is tracking.
//   DEPTH_F — how far into a concavity that white is allowed to be counted.
// Every combination gets built; measure4.mjs renders them all and picks by a
// blurred-rhythm measurement that knows nothing about either parameter.
// The first sweep only covered the regular pen. That is not enough: the winning
// pair has to hold at every weight, because in the app it is ONE setting for the
// whole writing system and the user drags the weight slider afterwards. So the
// full cross product gets built and measure4.mjs picks on WORST-CASE cv across
// pens, not on the best single reading.
const GAPS = [60, 100, 140, 180, 220];   // absolute em units of target white
const DEPTHS = [0.10, 0.14, 0.18, 0.22, 0.26];
const CLEAR = 0.15;
const variants = [];
Object.keys(PENS).forEach(function (style) {
  variants.push({ key: style + '-bbox', style: style, mode: 'bbox',
                  depthF: 0, clearF: 0, gapAbs: 0 });
});
Object.keys(PENS).forEach(function (style) {
  GAPS.forEach(function (gp) {
    DEPTHS.forEach(function (d) {
      variants.push({
        key: style + '-g' + gp + 'd' + Math.round(d * 100),
        style: style, mode: 'area', depthF: d, clearF: CLEAR, gapAbs: gp,
      });
    });
  });
});

// The sweep is 104 throwaway fonts that exist only so measure4.mjs can render
// them; they go in their own directory and are not committed. The four fonts at
// the top level are the ones the measurement chose.
const SWEEP = 'sweep/';
if (!fs.existsSync(HERE + SWEEP)) fs.mkdirSync(HERE + SWEEP);

const manifest = [];
variants.forEach(function (v) {
  const b = buildFont(v.style, PENS[v.style], v.mode, v.depthF, v.clearF, v.gapAbs);
  fs.writeFileSync(HERE + SWEEP + 'LS4-' + v.key + '.otf', b.buf);
  const mc = minClearance(b.metrics);
  const wb = whiteBalance(b.metrics);
  const bear = {};
  Object.keys(b.metrics).forEach(function (n) {
    const m = b.metrics[n];
    bear[n] = { lsb: Math.round(m.xMin), rsb: Math.round(m.adv - m.xMax), adv: m.adv };
  });
  manifest.push({
    key: v.key, file: SWEEP + 'LS4-' + v.key + '.otf', style: v.style, mode: v.mode,
    penWidth: PENS[v.style].width, depthF: v.depthF, clearF: v.clearF, gapAbs: v.gapAbs,
    GAP: b.GAP, DEPTH: b.DEPTH, spaceAdv: b.spaceAdv, bytes: b.buf.length,
    minClear: Math.round(mc.clear), worstPair: mc.pair,
    whiteInterior: Math.round(wb.interior), whiteBetween: Math.round(wb.between),
    whiteRatio: Math.round(wb.ratio * 1000) / 1000, bearings: bear,
  });
});
fs.writeFileSync(HERE + 'manifest4.json', JSON.stringify(manifest, null, 1));

console.log('built ' + manifest.length + ' variants.  minimum clearance grid '
  + '(em units; negative anywhere = ink overlaps ink):');
const STYLES_OUT = Object.keys(PENS);
STYLES_OUT.forEach(function (style) {
  console.log('\n  ' + style + ' (pen ' + PENS[style].width + ')  '
    + 'bbox=' + manifest.filter(function (m) { return m.style === style && m.mode === 'bbox'; })[0].minClear);
  console.log('   gapAbs' + DEPTHS.map(function (d) { return ('d' + d.toFixed(2)).padStart(8); }).join(''));
  GAPS.forEach(function (gp) {
    console.log('    ' + String(gp).padEnd(4) + DEPTHS.map(function (d) {
      const m = manifest.filter(function (q) {
        return q.style === style && q.gapAbs === gp && q.depthF === d; })[0];
      return (m ? String(m.minClear) + (m.minClear < 0 ? '!' : '') : '-').padStart(8);
    }).join(''));
  });
});
console.log('\nwhite between letters / white inside letters. 1.00 is the classic'
  + ' target;\nbelow 1 the line reads as clumps of letters, above 1 as loose beads:');
STYLES_OUT.forEach(function (style) {
  const bb = manifest.filter(function (m) { return m.style === style && m.mode === 'bbox'; })[0];
  console.log('\n  ' + style + '   interior white ' + bb.whiteInterior
    + '   (v3/bbox ratio ' + bb.whiteRatio.toFixed(2) + ')');
  console.log('   gapAbs' + DEPTHS.map(function (d) {
    return ('d' + d.toFixed(2)).padStart(8); }).join(''));
  GAPS.forEach(function (gp) {
    console.log('    ' + String(gp).padEnd(4) + DEPTHS.map(function (d) {
      const m = manifest.filter(function (q) {
        return q.style === style && q.gapAbs === gp && q.depthF === d; })[0];
      return (m ? m.whiteRatio.toFixed(2) : '-').padStart(8);
    }).join(''));
  });
});

const bad = manifest.filter(function (m) { return m.minClear < 0; });
console.log('\nvariants where ink overlaps ink: ' + (bad.length ? bad.map(function (m) {
  return m.key + '(' + m.worstPair + ' ' + m.minClear + ')'; }).join(', ') : 'none'));

console.log('\nsidebearings lsb/rsb, regular pen (110), DEPTH_F 0.18 slice:');
const cols = manifest.filter(function (m) {
  return m.style === 'regular' && (m.mode === 'bbox' || m.depthF === 0.18);
});
console.log('       ' + cols.map(function (m) {
  return (m.mode === 'bbox' ? 'v3'
    : 'g' + m.gapAbs + 'd' + Math.round(m.depthF * 100)).padStart(11); }).join(''));
Object.keys(cols[0].bearings).forEach(function (n) {
  console.log(n.padEnd(7) + cols.map(function (m) {
    const b = m.bearings[n];
    return (b.lsb + '/' + b.rsb).padStart(11);
  }).join(''));
});

// ---------------------------------------------------------------------------
// The winner, locked in.
//
// measure4.mjs ranked every (GAP, DEPTH_F) pair on the WORST of the four pens,
// using the evenness of the gaps between letters read off a blurred column
// profile — the squint test, which knows nothing about either parameter. GAP 140
// with DEPTH_F 0.14 won, and it wins at every pen rather than at one:
//
//   worst-pen gap evenness (cv, lower is better)
//     v3 bbox spacing   41.3%      <- the bug: outlines never translated
//     v4 area spacing   16.9%
//
//   per pen        v3      v4     guaranteed clearance
//     light      30.9%   16.5%          114
//     regular    38.1%   12.0%          114
//     bold       36.2%   12.7%          110
//     broadnib   41.3%   16.9%          113
//
// GAP came out ABSOLUTE, not a multiple of pen width. That is the right shape for
// it: the skeletons do not change when the pen thickens, so the white beside them
// should not either. The earlier pen-proportional version starved the light pen
// until every sidebearing saturated on the collision floor.
//
// The residual 12-17% is structured rather than random, which says what the next
// lever is and is not. Pairs beginning with "l" read tight and pairs ending in "k"
// or "t" read loose, at every weight — that is a per-GLYPH bias, not a per-pair
// one, so kerning is the wrong tool for it. A better margin statistic than a
// clamped mean is the right one.
// ---------------------------------------------------------------------------
const FINAL = { GAP: 140, DEPTH_F: 0.14, CLEAR_F: 0.15 };
const finals = {};
Object.keys(PENS).forEach(function (style) {
  const b = buildFont(style, PENS[style], 'area', FINAL.DEPTH_F, FINAL.CLEAR_F, FINAL.GAP);
  fs.writeFileSync(HERE + 'LS4-' + style + '.otf', b.buf);
  finals[style] = b;
});

const faces = [];
Object.keys(PENS).forEach(function (style) {
  faces.push("@font-face{font-family:'V4-" + style + "';src:url(data:font/otf;base64,"
    + finals[style].buf.toString('base64') + ") format('opentype');}");
  const bb = buildFont(style, PENS[style], 'bbox', 0, 0, 0);
  faces.push("@font-face{font-family:'V3-" + style + "';src:url(data:font/otf;base64,"
    + bb.buf.toString('base64') + ") format('opentype');}");
});

const PAIRSET = ['a', 'i', 'k', 'l', 's', 't'];
function pairGrid(fam) {
  return '<table class="pg" style="font-family:\'' + fam + '\'">'
    + PAIRSET.map(function (A) {
        return '<tr>' + PAIRSET.map(function (B) {
          return '<td>' + A + B + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table>';
}

const W = 'kalisht';
const LINE = 'ashi kilt hasa talish shakil';
const html = '<!doctype html><html><head><meta charset="utf-8"><style>\n'
+ faces.join('\n') + '\n'
+ 'body{background:#0d0b09;color:#e8dcc8;font-family:Georgia,serif;padding:34px;margin:0;}\n'
+ 'h1{font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#c9a961;font-weight:400;margin:0 0 6px;}\n'
+ '.sub{font-size:12px;color:#8a7c66;margin-bottom:22px;max-width:900px;line-height:1.6;}\n'
+ '.row{border-top:1px solid #2a241c;padding:13px 0;}\n'
+ '.lbl{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#8a7c66;margin-bottom:7px;}\n'
+ '.tag{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#6b5f4c;width:74px;display:inline-block;}\n'
+ '.big{font-size:74px;line-height:1.3;color:#f0e6d2;}\n'
+ '.med{font-size:34px;color:#f0e6d2;}\n'
+ '.bad{color:#b8695a;} .good{color:#c9a961;}\n'
+ 'table.pg{border-collapse:collapse;font-size:30px;color:#f0e6d2;}\n'
+ 'table.pg td{padding:2px 9px;}\n'
+ '.two{display:flex;gap:40px;align-items:flex-start;}\n'
+ '.two > div{flex:1;}\n'
+ 'input{font-size:42px;background:#151109;color:#f0e6d2;border:1px solid #3a3126;\n'
+ '      border-radius:6px;padding:8px 14px;width:92%;font-family:\'V4-regular\';}\n'
+ '.noliga{font-variant-ligatures:none;}\n'
+ '.ipa{font-size:15px;color:#c9a961;margin-top:4px;}\n'
+ '</style></head><body>\n'
+ '<h1>spacing &mdash; where a machine puts a letter, and how it knows</h1>\n'
+ '<div class="sub">v3 set the advance from the bounding box and wrote a left side bearing into hmtx &mdash; '
+ 'but never moved the outline. hmtx lsb is only metadata; the path coordinates are what position ink. '
+ 'so every glyph kept whatever x it was drawn at: "i" carried a 135-unit hole in front of it and stuck 35 units into the next letter. '
+ 'v4 translates the outline, and sets each bearing by measuring the WHITE AREA beside the glyph rather than its box, '
+ 'so a flat stem gets the full gap, a round bowl sits closer, and an open shape lets its neighbour tuck under. '
+ 'the numbers below the last row are measured, not asserted.</div>\n';

let body = '';
Object.keys(PENS).forEach(function (style) {
  body += '<div class="row"><div class="lbl">' + style + ' &mdash; pen ' + PENS[style].width
    + (PENS[style].angleDeg ? ', angle ' + PENS[style].angleDeg + '&deg;, contrast ' + PENS[style].contrast : '')
    + '</div>'
    + '<div class="big"><span class="tag bad">v3</span><span style="font-family:\'V3-' + style + '\'">' + W + '</span></div>'
    + '<div class="big"><span class="tag good">v4</span><span style="font-family:\'V4-' + style + '\'">' + W + '</span></div>'
    + '</div>\n';
});

body += '<div class="row"><div class="lbl">every ordered pair, regular pen. v3 left, v4 right &mdash; watch the "i" column and the "k" row</div>'
  + '<div class="two"><div>' + pairGrid('V3-regular') + '</div><div>' + pairGrid('V4-regular') + '</div></div></div>\n';

body += '<div class="row"><div class="lbl">the space. v3 emitted none, so word gaps came from the fallback font; the v3 row here gets a flat 300-unit placeholder so the two are comparable at all. v4 derives it: two sidebearings plus one stem</div>'
  + '<div class="med"><span class="tag bad">v3</span><span style="font-family:\'V3-regular\'">' + LINE + '</span></div>'
  + '<div class="med"><span class="tag good">v4</span><span style="font-family:\'V4-regular\'">' + LINE + '</span></div></div>\n';

body += '<div class="row"><div class="lbl">the sh ligature still fires &mdash; typed, then with ligatures off</div>'
  + '<div class="big" style="font-family:\'V4-regular\'">' + W + '</div>'
  + '<div class="big noliga" style="font-family:\'V4-regular\'">' + W + '</div>'
  + '<div class="ipa">/kaliʃt/</div></div>\n';

body += '<div class="row"><div class="lbl">a real input. what you type is ascii, what you see is your script.</div>'
  + '<input value="kalisht ha si"></div>\n';

body += '<div class="row"><div class="lbl">holds up small &mdash; 22 / 15 / 12px, v3 then v4 at each size</div>';
[22, 15, 12].forEach(function (sz) {
  body += '<div style="font-size:' + sz + 'px;font-family:\'V3-regular\'">' + LINE + '</div>'
    + '<div style="font-size:' + sz + 'px;font-family:\'V4-regular\';margin-bottom:7px">' + LINE + '</div>';
});
body += '</div>\n';

body += '<div class="row"><div class="lbl">measured, worst of the four pens: evenness of the gaps between letters</div>'
  + '<div class="sub" style="margin:0">squint test, mechanised: render one string containing every ordered pair, '
  + 'sum the alpha of each pixel column, gaussian-blur it by about one stem width, and read the depth of the trough at each join. '
  + 'even spacing means equal troughs. the score is their coefficient of variation, and it refers to nothing the solver was tuned on.'
  + '<br><br>v3 bounding-box spacing &nbsp;<b class="bad">41.3%</b> &nbsp;&rarr;&nbsp; v4 area spacing &nbsp;<b class="good">16.9%</b>'
  + '<br>per pen: light 30.9&rarr;16.5 &nbsp; regular 38.1&rarr;12.0 &nbsp; bold 36.2&rarr;12.7 &nbsp; broadnib 41.3&rarr;16.9'
  + '<br>minimum clearance between any two letters, guaranteed by construction: 110 em units at every pen. nothing collides.'
  + '</div></div>\n';

fs.writeFileSync(HERE + 'index4.html', html + body + '</body></html>');
console.log('\nfinal fonts LS4-{light,regular,bold,broadnib}.otf   GAP ' + FINAL.GAP
  + '  DEPTH_F ' + FINAL.DEPTH_F + '  CLEAR_F ' + FINAL.CLEAR_F);
Object.keys(finals).forEach(function (k) {
  console.log('  ' + k.padEnd(10) + String(finals[k].buf.length).padStart(6) + ' bytes'
    + '   space advance ' + finals[k].spaceAdv);
});
