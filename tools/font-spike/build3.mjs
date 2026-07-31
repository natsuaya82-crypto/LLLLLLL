// Spike v3 — the pen is ONE global setting for the whole writing system, and a
// vertex is either a corner or a curve. That is the entire authoring model.
//
//   * no per-stroke width. Kana, Hangul and Latin on a phone are all one weight;
//     a script the user draws should be too. One number for the whole font.
//   * a curve is a BUTTON on a vertex, not extra points. Same 4 taps make a
//     sharp corner or a smooth bend depending on the toggle.
//   * every glyph is a pen skeleton. No filled contours, no hole flags: a CLOSED
//     skeleton swept with the nib produces its counter (hole) by itself.
//
// What that buys, and what this spike measures:
//   - weight is now a slider. The same points regenerate Light/Regular/Bold.
//   - pen ANGLE + CONTRAST is also one global pair, so calligraphic thick/thin
//     comes from stroke direction with zero extra authoring.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const ot = require('opentype.js');

const EM = 1000, BASE = 800, ASC = 800, DESC = -200, SIDE = 50;

// ---------------------------------------------------------------------------
// THE PEN. One per writing system. This is the whole style control surface.
//   width    — nib size in em units
//   angleDeg — nib rotation. 0 = upright
//   contrast — 1.0 monoline (round nib); < 1.0 broad nib, thick/thin from
//              stroke direction, the way a real chisel pen behaves
// ---------------------------------------------------------------------------
const PENS = {
  light:    { width:  60, angleDeg: 0,  contrast: 1.0 },
  regular:  { width: 110, angleDeg: 0,  contrast: 1.0 },
  bold:     { width: 190, angleDeg: 0,  contrast: 1.0 },
  broadnib: { width: 190, angleDeg: 30, contrast: 0.34 },
  over:     { width: 340, angleDeg: 0,  contrast: 1.0 },   // deliberately past the ceiling
};

// ---------------------------------------------------------------------------
// Authoring format. A glyph is a list of pen strokes. A stroke is a list of
// vertices; a vertex is [x, y] for a corner or [x, y, 'c'] for a curve. Add
// closed:true and the stroke joins back to its first vertex.
// Coordinates are y-DOWN, like the canvas the user draws on.
// ---------------------------------------------------------------------------
const GLYPHS = [
  // A closed ring. Its counter appears on its own — nothing declares a hole.
  { name: 'a', roman: 'a', phonemes: ['a'], strokes: [
      { closed: true, pts: [[300,250,'c'],[520,470,'c'],[300,690,'c'],[80,470,'c']] } ]},
  // A one-vertex stroke is just the nib: a dot, for free.
  { name: 'i', roman: 'i', phonemes: ['i'], strokes: [
      { pts: [[190,330],[190,700]] },
      { pts: [[190,160]] } ]},
  { name: 'k', roman: 'k', phonemes: ['k'], strokes: [
      { pts: [[170,110],[170,760]] },
      { pts: [[500,300],[170,470],[470,700]] } ]},
  // Identical four vertices to 'l' below, but every bend curved instead of sharp.
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
  // "sh" is ONE letter of this script. No codepoint of its own — an OpenType
  // ligature reaches it, so the user still just types s then h.
  { name: 's_h', roman: null, phonemes: ['ʃ'], strokes: [
      { pts: [[120,700],[120,300,'c'],[340,300,'c'],[340,700]] },
      { pts: [[340,470,'c'],[600,470,'c'],[600,760]] } ]},
];

// ---------------------------------------------------------------------------
// Vertex list -> polyline. A 'c' vertex has its corner rounded: pull back along
// both neighbours and bend through the vertex with a quadratic. This is what the
// curve button does, and it is why curving costs no extra points.
// ---------------------------------------------------------------------------
const ROUND = 0.44;       // < 0.5 so two adjacent curve vertices never overlap
const FLAT_TOL = 3;       // em units of chord error allowed when flattening

function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function mul(a, k) { return [a[0] * k, a[1] * k]; }
function len(a) { return Math.hypot(a[0], a[1]) || 1e-9; }
function unit(a) { return mul(a, 1 / len(a)); }

function flattenQuad(p0, c, p1, out) {
  // chord error of a quadratic split into n pieces is about dev / (2 n^2)
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
  // an endpoint of an open stroke has only one neighbour, so it stays a corner
  const bends = function (i) {
    return v[((i % m) + m) % m][2] === 'c' && (closed || (i > 0 && i < m - 1));
  };
  const radius = function (i) {
    return Math.min(ROUND * len(sub(P(i - 1), P(i))), ROUND * len(sub(P(i + 1), P(i))));
  };
  const entry = function (i) {
    return add(P(i), mul(unit(sub(P(i - 1), P(i))), radius(i)));
  };
  const exit = function (i) {
    return add(P(i), mul(unit(sub(P(i + 1), P(i))), radius(i)));
  };

  const out = [];
  for (let i = 0; i < m; i++) {
    if (bends(i)) {
      const A = entry(i), B = exit(i);
      out.push(A);
      flattenQuad(A, P(i), B, out);   // pushes intermediate points and B
    } else {
      out.push(P(i));
    }
  }
  if (closed) out.push(out[0].slice());
  return out;
}

// ---------------------------------------------------------------------------
// Polyline + nib -> outline, exactly, with no offsetting maths.
// Sweeping a convex nib along a segment is the Minkowski sum, and the Minkowski
// sum of a segment and a convex polygon is just the convex hull of the polygon
// placed at both ends. So: one hull per segment, all wound the same way, and
// non-zero fill unions them. Joins and caps come out of that for free, and a
// curve tighter than the nib cannot fold the outline inside out — which is the
// failure mode of every real offsetting routine.
// ---------------------------------------------------------------------------
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
  // integer coordinates: CFF encodes them far more compactly than reals, and at
  // 1000 units per em one unit is invisible
  const r = [];
  h.forEach(function (p) {
    const q = [Math.round(p[0]), Math.round(p[1])];
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

function strokeContours(st, pen) {
  const line = toPolyline(st);
  const N = nib(pen);
  const at = function (p) { return N.map(function (d) { return [p[0] + d[0], p[1] + d[1]]; }); };
  if (line.length === 1) return [hull(at(line[0]))];
  const out = [];
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1];
    if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) continue;
    out.push(hull(at(a).concat(at(b))));
  }
  return out;
}

function glyphPath(g, pen) {
  const path = new ot.Path();
  g.strokes.forEach(function (st) {
    strokeContours(st, pen).forEach(function (c) {
      // every contour same winding; flipping y negates area, so positive in font
      // space means negative here
      const nodes = signedArea(c) < 0 ? c : c.slice().reverse();
      nodes.forEach(function (p, i) {
        if (i === 0) path.moveTo(p[0], BASE - p[1]);
        else path.lineTo(p[0], BASE - p[1]);
      });
      path.close();
    });
  });
  return path;
}

// ---------------------------------------------------------------------------
// How bold can this glyph go?
// A global pen width is only safe up to the point where the pen starts filling in
// the glyph's own gaps — counters close, and two strokes merge into a blob. So
// measure it: the narrowest gap between two parts of the skeleton that are not
// neighbours along the same stroke. The pen may be that wide and no wider.
// This is what a weight slider has to clamp itself to.
// ---------------------------------------------------------------------------
// Strokes are MEANT to touch, so stroke-to-stroke distance is the wrong metric.
// What actually breaks is the counter: an enclosed pocket of white. So measure the
// pocket. Build a distance field to the skeleton on a coarse grid, then for a
// candidate nib radius flood the white from the outside; any white cell the flood
// cannot reach is a surviving counter. Binary search the largest radius that still
// leaves one. Glyphs with no enclosed pocket ("i", "k") have no ceiling at all.
const CELL = 10, MARGIN = 260;
function maxPenWidth(g) {
  const lines = g.strokes.map(function (st) { return toPolyline(st); });
  const seg = [];
  lines.forEach(function (L) {
    if (L.length === 1) { seg.push([L[0], L[0]]); return; }
    for (let i = 0; i < L.length - 1; i++) seg.push([L[i], L[i + 1]]);
  });
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  seg.forEach(function (s) {
    s.forEach(function (p) {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    });
  });
  x0 -= MARGIN; y0 -= MARGIN; x1 += MARGIN; y1 += MARGIN;
  const W = Math.ceil((x1 - x0) / CELL), H = Math.ceil((y1 - y0) / CELL);

  function distToSeg(px, py, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const L2 = vx * vx + vy * vy;
    let t = L2 ? ((px - a[0]) * vx + (py - a[1]) * vy) / L2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - (a[0] + vx * t), py - (a[1] + vy * t));
  }
  const D = new Float32Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const px = x0 + (i + 0.5) * CELL, py = y0 + (j + 0.5) * CELL;
      let d = Infinity;
      for (let k = 0; k < seg.length; k++) {
        const dd = distToSeg(px, py, seg[k][0], seg[k][1]);
        if (dd < d) d = dd;
      }
      D[j * W + i] = d;
    }
  }

  function hasCounter(r) {
    const seen = new Uint8Array(W * H), stack = [];
    const push = function (i, j) {
      const k = j * W + i;
      if (i < 0 || j < 0 || i >= W || j >= H || seen[k] || D[k] <= r) return;
      seen[k] = 1; stack.push(k);
    };
    for (let i = 0; i < W; i++) { push(i, 0); push(i, H - 1); }
    for (let j = 0; j < H; j++) { push(0, j); push(W - 1, j); }
    while (stack.length) {
      const k = stack.pop(), i = k % W, j = (k - i) / W;
      push(i + 1, j); push(i - 1, j); push(i, j + 1); push(i, j - 1);
    }
    for (let k = 0; k < D.length; k++) if (D[k] > r && !seen[k]) return true;
    return false;
  }

  // the wall has to be at least one cell thick or the flood leaks straight through
  const SEAL = CELL;
  if (!hasCounter(SEAL)) return null;           // no enclosed pocket: no ceiling
  let lo = SEAL, hi = 500;
  for (let s = 0; s < 14; s++) {
    const mid = (lo + hi) / 2;
    if (hasCounter(mid)) lo = mid; else hi = mid;
  }
  return Math.round(lo * 2);                    // radius -> pen width
}

// ---------------------------------------------------------------------------
// Build one font per pen. Identical points every time — only the pen changes.
// ---------------------------------------------------------------------------
function buildFont(name, pen) {
  const glyphs = [new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new ot.Path() })];
  const index = {};
  let points = 0, contours = 0;
  GLYPHS.forEach(function (g) {
    const path = glyphPath(g, pen);
    path.commands.forEach(function (c) { if (c.type === 'Z') contours++; else points++; });
    let xMin = Infinity, xMax = -Infinity;
    path.commands.forEach(function (c) {
      if ('x' in c) { if (c.x < xMin) xMin = c.x; if (c.x > xMax) xMax = c.x; }
    });
    const gl = new ot.Glyph({
      name: g.name,
      unicode: g.roman ? g.roman.charCodeAt(0) : undefined,
      advanceWidth: Math.round((xMax - xMin) + SIDE * 2),
      leftSideBearing: Math.round(SIDE - xMin),
      path: path,
    });
    index[g.name] = glyphs.length;
    glyphs.push(gl);
  });
  const font = new ot.Font({
    familyName: 'LinguaScript', styleName: name,
    unitsPerEm: EM, ascender: ASC, descender: DESC, glyphs: glyphs,
  });
  font.substitution.add('liga', { sub: [index['s'], index['h']], by: index['s_h'] });
  const buf = Buffer.from(font.toArrayBuffer());
  return { name: name, buf: buf, points: points, contours: contours };
}

const built = Object.keys(PENS).map(function (k) { return buildFont(k, PENS[k]); });
built.forEach(function (b) { fs.writeFileSync('./LS3-' + b.name + '.otf', b.buf); });

// ---------------------------------------------------------------------------
// Proof page
// ---------------------------------------------------------------------------
const face = built.map(function (b) {
  return "@font-face{font-family:'LS-" + b.name + "';src:url(data:font/otf;base64,"
    + b.buf.toString('base64') + ") format('opentype');}";
}).join('\n');

const SAMPLE = 'kalisht';
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
${face}
body{background:#0d0b09;color:#e8dcc8;font-family:Georgia,serif;padding:34px;margin:0;}
h1{font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#c9a961;font-weight:400;margin:0 0 6px;}
.sub{font-size:12px;color:#8a7c66;margin-bottom:24px;}
.row{border-top:1px solid #2a241c;padding:14px 0;}
.lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a7c66;margin-bottom:8px;}
.big{font-size:80px;line-height:1.35;color:#f0e6d2;}
.med{font-size:38px;color:#f0e6d2;}
.lt{font-family:'LS-light';} .rg{font-family:'LS-regular';}
.bd{font-family:'LS-bold';}  .bn{font-family:'LS-broadnib';}
.ov{font-family:'LS-over';}
input{font-size:44px;background:#151109;color:#f0e6d2;border:1px solid #3a3126;
      border-radius:6px;padding:8px 14px;width:90%;font-family:'LS-regular';}
.noliga{font-variant-ligatures:none;}
.ipa{font-size:16px;color:#c9a961;margin-top:4px;}
</style></head><body>
<h1>one global pen &mdash; and a curve is a button, not extra points</h1>
<div class="sub">every glyph is a pen skeleton. the four rows below are the SAME vertices; only the pen changed.</div>

<div class="row"><div class="lbl">pen width 60 &mdash; light</div><div class="big lt">${SAMPLE}</div></div>
<div class="row"><div class="lbl">pen width 110 &mdash; regular</div><div class="big rg">${SAMPLE}</div></div>
<div class="row"><div class="lbl">pen width 190 &mdash; bold</div><div class="big bd">${SAMPLE}</div></div>
<div class="row"><div class="lbl">pen width 190, angle 30&deg;, contrast 0.34 &mdash; broad nib. thick/thin from stroke direction, zero extra authoring.</div>
  <div class="big bn">${SAMPLE}</div></div>

<div class="row"><div class="lbl">"a" is a CLOSED stroke. nothing declares a hole &mdash; the counter is what the pen did not cover.</div>
  <div class="big"><span class="lt">aaa</span> <span class="rg">aaa</span> <span class="bd">aaa</span></div></div>

<div class="row"><div class="lbl">and the limit of a global weight slider: 60 / 110 / 190 / 298 (measured ceiling) / 340 (past it &mdash; counter gone)</div>
  <div class="big"><span class="lt">a</span> <span class="rg">a</span> <span class="bd">a</span> <span class="ov">a</span></div>
  <div class="ipa">the app can compute this ceiling per glyph and clamp the slider, so the user cannot ruin their own alphabet</div></div>

<div class="row"><div class="lbl">the sh ligature still fires &mdash; left as typed, right with ligatures off</div>
  <div class="big rg">${SAMPLE}</div><div class="big rg noliga">${SAMPLE}</div>
  <div class="ipa">/kaliʃt/</div></div>

<div class="row"><div class="lbl">a real input. what you type is ascii, what you see is your script.</div>
  <input value="kalisht ha si"></div>

<div class="row"><div class="lbl">alphabet a i k l s h t + sh</div>
  <div class="med rg">aiklsht &nbsp; ashi kilt hasa</div>
  <div class="med bn">aiklsht &nbsp; ashi kilt hasa</div></div>

<div class="row"><div class="lbl">holds up small &mdash; 22px, 15px, 12px, the sizes a phone word list actually uses</div>
  <div class="rg" style="font-size:22px">ashi kilt hasa talish shakil</div>
  <div class="rg" style="font-size:15px">ashi kilt hasa talish shakil</div>
  <div class="rg" style="font-size:12px">ashi kilt hasa talish shakil</div></div>
</body></html>`;
fs.writeFileSync('./index3.html', html);

console.log('pen'.padEnd(10), 'otf bytes'.padStart(10), 'contours'.padStart(9), 'points'.padStart(8));
built.forEach(function (b) {
  console.log(b.name.padEnd(10), String(b.buf.length).padStart(10),
              String(b.contours).padStart(9), String(b.points).padStart(8));
});
console.log('\nglyphs   :', GLYPHS.length, '+ .notdef   cmap:',
  GLYPHS.filter(function (g) { return g.roman; }).map(function (g) { return g.roman; }).join(' '),
  '| liga: s+h -> s_h');
console.log('authored :', GLYPHS.reduce(function (n, g) {
  return n + g.strokes.reduce(function (m, s) { return m + s.pts.length; }, 0); }, 0),
  'vertices total, for ALL four weights');

const caps = GLYPHS.map(function (g) { return { name: g.name, max: maxPenWidth(g) }; });
const bound = caps.filter(function (c) { return c.max !== null; });
const limit = bound.reduce(function (m, c) { return Math.min(m, c.max); }, Infinity);
console.log('\npen width at which each glyph loses its counter:');
console.log('  ' + caps.map(function (c) {
  return c.name + ' ' + (c.max === null ? '(no counter)' : c.max); }).join('   '));
console.log('  -> topological ceiling for this alphabet: ' + limit
  + '.  past it the counter is GONE, not just tight (see the "over" row: width 340).');
console.log('     comfortable ceiling is lower, around ' + Math.round(limit * 0.62)
  + '; a real bold also widens the glyph to keep the counter open.');
