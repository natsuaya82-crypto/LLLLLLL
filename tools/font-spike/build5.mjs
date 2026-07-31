// Spike v5 — ONE FIXED PEN, PHONE TEXT SIZE, AND THE SQUARE CELL.
//
// Three things the user said, in order of how much they change the design:
//
//   1. "60 くらいの太さがちょうどいいよ / 固定でいい"  -> pen 60, one weight, no slider.
//   2. "サイズも小さくしてスマホの文字と同じサイズ"      -> it has to hold at 15-17px,
//      which is the real test: 60/1000 em is a 1.0px stem at 17px.
//   3. "正方形内に文字を作るんだから、文字間が気になるのも
//      おかしな話なんだけどね"                           -> and this one is correct.
//
// Point 3 deserves to be taken literally rather than politely. calibrate5.mjs
// points v4's own instrument at real shipping fonts, and the scale it reads is:
//
//   proportional Latin   gap cv 11.9-18.0%   pitch cv 26-31%
//   Lingua v4 at pen 60  gap cv 16.5%        pitch cv 20.5%
//   DejaVu Sans Mono     gap cv 50.4%        pitch cv 0%
//   Noto Sans JP kana    gap cv 85.9%        pitch cv 0%
//   IPAGothic kana       gap cv 98.7%        pitch cv 0%
//   Noto Sans KR hangul  gap cv 19.6%        pitch cv 0%
//
// So a square-cell script has gaps between letters that are FOUR TO SIX TIMES less
// even than a Latin text face, and a billion people read it every day without
// noticing. The gaps are not what carries the rhythm there — the PITCH is, and it
// is perfect by construction. Two different rhythms, and you have to pick one:
//
//   proportional  equalise the gaps, accept uneven pitch  (v4: 16.5% / 20.5%)
//   square cell   equalise the pitch, ignore the gaps      (kana: 85.9% / 0%)
//
// v3 was broken because it did NEITHER — uneven pitch and uneven gaps at once.
// That is why it looked wrong, and it is also why "just use a square" was never
// the thing v3 was doing.
//
// This spike builds the square-cell route so it can be compared at the size it
// will actually be read at. Three ways of putting a drawing into a cell:
//
//   asdrawn  advance = the cell, glyph exactly where the user drew it. The purest
//            reading of point 3: no algorithm anywhere.
//   center   advance = the cell, ink centred in it. One line, and it removes the
//            only artefact the user cannot see coming (a letter drawn off to one
//            side of its own square).
//   fit      advance = the cell, ink scaled to fill it edge to edge minus a
//            margin, the way kana actually fill their cell. This is what a
//            "fit to cell" button in the editor would do.
//
// The sample skeletons were authored for a proportional font, not a square, so
// "asdrawn" is measured on drawings that never intended to fill a cell. That is
// itself the finding: a square-cell script needs the square VISIBLE while drawing.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const ot = require('opentype.js');
const HERE = new URL('.', import.meta.url).pathname;

const EM = 1000, BASE = 800, ASC = 800, DESC = -200;

// One pen, fixed. v5 has no weight axis at all -- see PEN below.

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
// The cell. The authoring canvas is 0..800 in x and 0..800 in y with the
// baseline along the bottom edge, so it is already a square; the square-cell
// modes simply stop throwing that away. advance = CELL means one letter is one
// cell wide, exactly like kana, and the pitch is then even by construction with
// no solver, no target gap, no clamp depth and no clearance floor anywhere.
// ---------------------------------------------------------------------------
const CELL = 800;
const FIT_MARGIN_F = 0.06;   // kana do not touch their cell edges either

const PEN60 = { width: 60, angleDeg: 0, contrast: 1.0 };   // fixed. the user chose it.
const PEN = PEN60;                                        // what the report prints

// mode:
//   'area'    v4's proportional solver, for comparison at the same pen
//   'asdrawn' square cell, glyph left exactly where it was drawn
//   'center'  square cell, ink centred
//   'fit'     square cell, ink scaled to fill the cell minus FIT_MARGIN_F
function buildFont(mode, opt) {
  opt = opt || {};
  // opt.pen exists for exactly one reason: the proof page has to show whether pen
  // 60 is still there at 17px, and that is a question about other pens too.
  const PEN = opt.pen || PEN60;
  const GAP = Math.round(opt.gap || 140);
  const DEPTH_F = opt.depthF || 0.14;
  const MIN_SB = Math.round((opt.clearF || 0.15) * PEN.width / 2);

  const raw0 = GLYPHS.map(function (g) { return { g: g, cs: glyphContours(g, PEN) }; });
  let B0 = Infinity, B1 = -Infinity;
  raw0.forEach(function (q) {
    const e = extent(q.cs);
    if (e[0] < B0) B0 = e[0];
    if (e[1] > B1) B1 = e[1];
  });
  const BAND = [B0, B1];
  const DEPTH = Math.round(DEPTH_F * (B1 - B0));

  const glyphs = [new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new ot.Path() })];
  const index = {}, metrics = {};
  let points = 0, contours = 0;

  raw0.forEach(function (q0) {
    // 'fit' rescales the skeleton BEFORE the nib sweep, so the stroke stays
    // exactly 60 units wide. Scaling the outline afterwards would change the pen
    // width per glyph, which is the one thing the user ruled out.
    let cs = q0.cs, sx = 1;
    if (mode === 'fit') {
      const pre = profile(q0.cs, BAND);
      const inner = CELL * (1 - 2 * FIT_MARGIN_F);
      const w = pre.xMax - pre.xMin;
      // the pen adds PEN.width to the drawn skeleton's width, so scale the
      // skeleton by what is left after the nib is accounted for
      const skel = Math.max(1, w - PEN.width);
      sx = Math.max(0.35, Math.min(2.2, (inner - PEN.width) / skel));
      const scaled = {
        name: q0.g.name, roman: q0.g.roman, phonemes: q0.g.phonemes,
        strokes: q0.g.strokes.map(function (st) {
          return { closed: st.closed, pts: st.pts.map(function (p) {
            return [ (p[0] - pre.xMin) * sx + pre.xMin, p[1], p[2] ]; }) };
        }),
      };
      cs = glyphContours(scaled, PEN);
    }
    const p = profile(cs, BAND);

    let dx, adv, b = { lsb: 0, rsb: 0, donatedL: 0, donatedR: 0 };
    if (mode === 'area') {
      b = bearings(p, DEPTH, GAP, MIN_SB);
      dx = b.lsb - p.xMin;
      adv = Math.round(b.lsb + (p.xMax - p.xMin) + b.rsb);
    } else if (mode === 'asdrawn') {
      dx = 0;                                        // the drawing decides. nothing else.
      adv = CELL;
    } else {                                          // 'center' and 'fit'
      dx = Math.round((CELL - (p.xMax - p.xMin)) / 2 - p.xMin);
      adv = CELL;
    }

    const path = new ot.Path();
    cs.forEach(function (c) {
      const nodes = signedArea(c) < 0 ? c : c.slice().reverse();
      nodes.forEach(function (pt, i) {
        const X = Math.round(pt[0] + dx), Y = BASE - pt[1];
        if (i === 0) path.moveTo(X, Y); else path.lineTo(X, Y);
      });
      path.close();
    });
    path.commands.forEach(function (c) { if (c.type === 'Z') contours++; else points++; });

    index[q0.g.name] = glyphs.length;
    metrics[q0.g.name] = {
      adv: adv, dx: dx, sx: sx, xMin: p.xMin + dx, xMax: p.xMax + dx,
      lsb: Math.round(p.xMin + dx), rsb: Math.round(adv - (p.xMax + dx)),
      cs: cs, p: p,
    };
    glyphs.push(new ot.Glyph({
      name: q0.g.name,
      unicode: q0.g.roman ? q0.g.roman.charCodeAt(0) : undefined,
      advanceWidth: adv,
      leftSideBearing: Math.round(p.xMin + dx),
      path: path,
    }));
  });

  // In a square-cell script the space is one cell, like a full-width space.
  const spaceAdv = mode === 'area' ? Math.round(2 * GAP + PEN.width) : CELL;
  glyphs.push(new ot.Glyph({
    name: 'space', unicode: 32, advanceWidth: spaceAdv, path: new ot.Path(),
  }));

  const font = new ot.Font({
    familyName: 'LinguaScript', styleName: mode,
    unitsPerEm: EM, ascender: ASC, descender: DESC, glyphs: glyphs,
  });
  font.substitution.add('liga', { sub: [index['s'], index['h']], by: index['s_h'] });
  return {
    mode: mode, buf: Buffer.from(font.toArrayBuffer()), spaceAdv: spaceAdv,
    metrics: metrics, points: points, contours: contours,
  };
}


// ---------------------------------------------------------------------------
// Build the four candidates and report what each one actually did to the letters.
// ---------------------------------------------------------------------------
const MODES = ['area', 'asdrawn', 'center', 'fit'];
const LABEL = {
  area:    'proportional (v4 area solve)',
  asdrawn: 'square cell, exactly as drawn',
  center:  'square cell, ink centred',
  fit:     'square cell, scaled to fill',
};
const built = {};
MODES.forEach(function (m) {
  built[m] = buildFont(m);
  fs.writeFileSync(HERE + 'LS5-' + m + '.otf', built[m].buf);
});

// Pen 60 is 0.060 em. A normal text face has a stem around 0.08-0.10 em, so at
// 17px pen 60 renders a 1.0px stem where the system font renders 1.5px. That may
// be exactly the look the user wants, or it may be a hairline that dies on a
// non-retina screen -- either way it is a thing to LOOK at, at 17px, next to
// alternatives. These three exist only for that row of the proof.
const WPENS = [60, 90, 120];
const weights = {};
WPENS.forEach(function (w) {
  weights[w] = buildFont('center', { pen: { width: w, angleDeg: 0, contrast: 1.0 } });
  fs.writeFileSync(HERE + 'LS5-w' + w + '.otf', weights[w].buf);
});

const NAMES = GLYPHS.map(function (g) { return g.name; });
function cv(v) {
  const m = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
  return m === 0 ? 0 : Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / v.length) / m;
}
console.log('pen ' + PEN.width + ' fixed, cell ' + CELL + ', em ' + EM + '\n');
console.log('  mode        adv (a i k l s h t sh)                          pitch cv   space');
MODES.forEach(function (m) {
  const advs = NAMES.map(function (n) { return built[m].metrics[n].adv; });
  console.log('  ' + m.padEnd(10)
    + advs.map(function (a) { return String(a).padStart(5); }).join('')
    + ('  ' + (cv(advs) * 100).toFixed(1) + '%').padStart(14)
    + String(built[m].spaceAdv).padStart(8));
});

console.log('\n  how much white each mode leaves beside each letter (lsb / rsb, em units):');
console.log('  glyph ' + MODES.map(function (m) { return m.padStart(16); }).join(''));
NAMES.forEach(function (n) {
  console.log('  ' + n.padEnd(6) + MODES.map(function (m) {
    const q = built[m].metrics[n];
    return (q.lsb + '/' + q.rsb).padStart(16);
  }).join(''));
});
console.log('\n  "fit" horizontal scale applied per glyph:');
console.log('  ' + NAMES.map(function (n) {
  return n + ' ' + built.fit.metrics[n].sx.toFixed(2);
}).join('   '));

// The stem in device pixels at the sizes a phone actually renders body text at.
// This is the whole risk in "pen 60 fixed, phone size": 60/1000 em is a hairline.
console.log('\n  stem width in px at phone text sizes (pen ' + PEN.width + ' = '
  + (PEN.width / EM).toFixed(3) + ' em):');
[12, 15, 17, 20, 22].forEach(function (px) {
  console.log('    ' + String(px).padStart(3) + 'px  ->  '
    + (PEN.width / EM * px).toFixed(2) + ' px stem');
});
console.log('  for scale: a normal text face has a stem around 0.08-0.10 em,'
  + ' i.e. ' + (0.09 * 17).toFixed(2) + ' px at 17px.');

// ---------------------------------------------------------------------------
// The proof page. Everything at the size it will be read at, not at 74px where
// every spacing decision looks fine.
// ---------------------------------------------------------------------------
const faces = MODES.map(function (m) {
  return "@font-face{font-family:'V5-" + m + "';src:url(data:font/otf;base64,"
    + built[m].buf.toString('base64') + ") format('opentype');}";
}).concat(WPENS.map(function (w) {
  return "@font-face{font-family:'V5-w" + w + "';src:url(data:font/otf;base64,"
    + weights[w].buf.toString('base64') + ") format('opentype');}";
}));

const WORD = 'kalisht';
const LINE = 'ashi kilt hasa talish shakil';
const KANA = 'あしき かると はさ たりし しゃきる';
const SIZES = [17, 15, 12, 22];

let body = '<h1>pen 60, fixed &mdash; and the square cell question</h1>'
+ '<div class="sub">the user chose pen 60 fixed and phone text size, and pointed out that if each'
+ ' letter is drawn inside a square then the gaps between letters are not a thing to worry about.'
+ ' that is correct, and calibrate5.mjs proves it with v4’s own instrument: real kana score'
+ ' 85.9% on gap evenness where a latin text face scores 11.9%, and nobody has ever complained about'
+ ' kana spacing. a square-cell script equalises the PITCH instead, and pitch is exact by'
+ ' construction. so this page is not asking which is better — it is asking which rhythm Lingua'
+ ' wants. everything below is at real phone text sizes.</div>';

// The main comparison: every mode at 17px, the size iOS uses for body text.
body += '<div class="row"><div class="lbl">ios body text size, 17px. the same word in all four</div>';
MODES.forEach(function (m) {
  body += '<div class="cmp"><span class="tag">' + m + '</span>'
    + '<span class="p17" style="font-family:\'V5-' + m + '\'">' + LINE + '</span></div>';
});
body += '<div class="cmp"><span class="tag ref">kana ref</span>'
  + '<span class="p17 jp">' + KANA + '</span></div>';
body += '<div class="note">the kana line is a real square-cell script at the same 17px, for the eye'
  + ' to calibrate against. it is monospaced and its gaps are wildly uneven.</div></div>';

SIZES.slice(1).forEach(function (px) {
  body += '<div class="row"><div class="lbl">' + px + 'px</div>';
  MODES.forEach(function (m) {
    body += '<div class="cmp"><span class="tag">' + m + '</span>'
      + '<span style="font-size:' + px + 'px;font-family:\'V5-' + m + '\'">' + LINE + '</span></div>';
  });
  body += '<div class="cmp"><span class="tag ref">kana ref</span>'
    + '<span class="jp" style="font-size:' + px + 'px">' + KANA + '</span></div></div>';
});

// Big, once, so the letterforms themselves can be checked -- especially whether
// "fit" distorted anything the user would object to.
body += '<div class="row"><div class="lbl">large, to check the letterforms survive'
  + ' &mdash; note what "fit" does to the ring of "a"</div>';
MODES.forEach(function (m) {
  body += '<div class="cmp"><span class="tag">' + m + '</span>'
    + '<span class="big" style="font-family:\'V5-' + m + '\'">' + WORD + '</span></div>';
});
body += '</div>';

// Grid: the square modes should show a visible, regular column rhythm.
const PAIRSET = ['a', 'i', 'k', 'l', 's', 't'];
body += '<div class="row"><div class="lbl">every ordered pair. in the square modes the columns'
  + ' line up exactly, which is the whole point of a cell</div><div class="two">';
MODES.forEach(function (m) {
  body += '<div><div class="tag">' + m + '</div><table class="pg" style="font-family:\'V5-'
    + m + '\'">' + PAIRSET.map(function (A) {
        return '<tr>' + PAIRSET.map(function (B) { return '<td>' + A + B + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table></div>';
});
body += '</div></div>';

body += '<div class="row"><div class="lbl">a real input at 17px. what you type is ascii,'
  + ' what you see is your script</div>'
  + '<input value="kalisht ha si"><div class="note">the sh ligature still fires: '
  + '<span class="p17" style="font-family:\'V5-center\'">shakil</span>'
  + ' &nbsp;vs ligatures off&nbsp; '
  + '<span class="p17 noliga" style="font-family:\'V5-center\'">shakil</span></div></div>';

// Is pen 60 still there at 17px? Not a question geometry can answer.
body += '<div class="row"><div class="lbl">is pen 60 still there at phone size? same cell,'
  + ' three pens, at 17px then 15px then 12px &mdash; with the system ui font underneath</div>';
[17, 15, 12].forEach(function (px) {
  body += '<div class="wgrp"><div class="tag ref">' + px + 'px</div>';
  WPENS.forEach(function (w) {
    body += '<div class="cmp"><span class="tag">pen ' + w + ' &middot; '
      + (w / EM * px).toFixed(2) + 'px stem</span>'
      + '<span style="font-size:' + px + 'px;font-family:\'V5-w' + w + '\'">' + LINE + '</span></div>';
  });
  body += '<div class="cmp"><span class="tag ref">system ui</span>'
    + '<span class="sys" style="font-size:' + px + 'px">ashi kilt hasa talish shakil</span></div></div>';
});
body += '<div class="note">the user picked 60 looking at 64px type. at 17px it is a 1.02px stem'
  + ' against roughly 1.5px for a normal text face, so it will read lighter than the ui around it.'
  + ' that is a choice, not a bug &mdash; but it is a choice made at a size nobody was looking at.</div></div>';

body += '<div class="row"><div class="lbl">measured, with v4’s instrument pointed at real fonts'
  + ' first so the numbers have a scale</div><table class="num">'
  + '<tr><th>font</th><th>gap cv</th><th>pitch cv</th></tr>'
  + '<tr><td>DejaVu Sans (proportional latin)</td><td>11.9%</td><td>30.6%</td></tr>'
  + '<tr><td>Carlito</td><td>18.0%</td><td>28.0%</td></tr>'
  + '<tr class="hi"><td>Lingua v4, proportional, pen 60</td><td>16.5%</td><td>20.5%</td></tr>'
  + '<tr><td>DejaVu Sans Mono</td><td>50.4%</td><td>0%</td></tr>'
  + '<tr><td>Noto Sans JP, kana</td><td>85.9%</td><td>0%</td></tr>'
  + '<tr><td>IPAGothic, kana</td><td>98.7%</td><td>0%</td></tr>'
  + '<tr><td>Noto Sans KR, hangul</td><td>19.6%</td><td>0%</td></tr>'
  + '</table><div class="note">square-cell numbers for the four candidates are measured by'
  + ' measure5.mjs and printed there, not asserted here.</div></div>';

const html = '<!doctype html><html><head><meta charset="utf-8"><style>\n'
+ faces.join('\n') + '\n'
+ 'body{background:#0d0b09;color:#e8dcc8;font-family:Georgia,serif;padding:34px;margin:0;}\n'
+ 'h1{font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#c9a961;font-weight:400;margin:0 0 6px;}\n'
+ '.sub{font-size:12px;color:#8a7c66;margin-bottom:22px;max-width:860px;line-height:1.7;}\n'
+ '.row{border-top:1px solid #2a241c;padding:14px 0;}\n'
+ '.lbl{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:#8a7c66;margin-bottom:9px;}\n'
+ '.note{font-size:11px;color:#6b5f4c;margin-top:8px;line-height:1.6;max-width:820px;}\n'
+ '.tag{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6b5f4c;width:84px;display:inline-block;vertical-align:middle;}\n'
+ '.tag.ref{color:#8a6f4c;}\n'
+ '.cmp{padding:3px 0;}\n'
+ '.p17{font-size:17px;}\n'
+ '.jp{font-family:"Noto Sans CJK JP","IPAGothic",sans-serif;color:#cdbfa4;}\n'
+ '.big{font-size:64px;line-height:1.25;color:#f0e6d2;}\n'
+ '.noliga{font-variant-ligatures:none;font-feature-settings:"liga" 0;}\n'
+ 'table.pg{border-collapse:collapse;font-size:22px;color:#f0e6d2;}\n'
+ 'table.pg td{padding:1px 0;}\n'
+ '.two{display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;}\n'
+ 'table.num{border-collapse:collapse;font-size:12px;color:#cdbfa4;}\n'
+ 'table.num th{text-align:left;color:#8a7c66;font-weight:400;padding:2px 18px 6px 0;}\n'
+ 'table.num td{padding:2px 18px 2px 0;}\n'
+ 'tr.hi td{color:#c9a961;}\n'
+ '.sys{font-family:-apple-system,"DejaVu Sans",sans-serif;color:#9d8e76;}\n'
+ '.wgrp{margin-bottom:11px;}\n'
+ 'input{font-size:17px;background:#141009;color:#f0e6d2;border:1px solid #2a241c;'
+ 'border-radius:8px;padding:11px 13px;width:520px;font-family:\'V5-center\';}\n'
+ '</style></head><body>';
fs.writeFileSync(HERE + 'index5.html', html + body + '</body></html>');

console.log('\n  LS5-{' + MODES.join(',') + '}.otf + index5.html written');
MODES.forEach(function (m) {
  console.log('    ' + m.padEnd(9) + built[m].buf.length + ' bytes   '
    + built[m].contours + ' contours   ' + built[m].points + ' points');
});

// build6.mjs reuses the geometry and the cell above rather than forking it, so the
// square-cell fonts on the decision page are byte-for-byte the same code path as
// the ones measured here.
export { buildFont, GLYPHS, CELL, EM, BASE, ASC, DESC };
