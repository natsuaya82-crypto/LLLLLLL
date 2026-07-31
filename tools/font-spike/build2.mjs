// Spike v2 — testing two design changes:
//   (1) glyphs authored as POINTS (node editor), so no stroke->outline conversion
//       ever happens, and holes are declared rather than inferred from fill-rule
//   (2) glyphs mapped to the ROMANISATION's own codepoints instead of the Private
//       Use Area, so showing the custom script is a font-family swap and nothing else
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const ot = require('opentype.js');

const EM = 1000, BASE = 800, ASC = 800, DESC = -200;

// ---------------------------------------------------------------------------
// Authoring format. Everything is points. Nothing is a path string.
//   corner node : [x, y]
//   curve node  : [x, y, cx, cy]   quadratic, control point cx,cy
// Coordinates are SVG-style (y down) because that is what a canvas editor gives
// you; the flip to font space happens once, at the end.
// ---------------------------------------------------------------------------
const GLYPHS = [
  { name: 'a', roman: 'a', phonemes: ['a'], advance: 620, contours: [
      // outer ring, drawn with 4 quadratic nodes
      { nodes: [[300,240],[520,470,520,240],[300,700,520,700],[80,470,80,700],[300,240,80,240]] },
      // declared hole — the app reverses its winding automatically
      { hole: true, nodes: [[300,390],[400,470,400,390],[300,550,400,550],[200,470,200,550],[300,390,200,390]] },
  ]},
  // Same glyph as 'a', but authored with BOTH contours wound the wrong way round.
  // It must render pixel-identical to 'a'. This is the winding-correction test.
  { name: 'a_rev', roman: 'e', phonemes: ['a'], advance: 620, contours: [
      { nodes: [[300,240],[80,470,80,240],[300,700,80,700],[520,470,520,700],[300,240,520,240]] },
      { hole: true, nodes: [[300,390],[200,470,200,390],[300,550,200,550],[400,470,400,550],[300,390,400,390]] },
  ]},
  { name: 'i', roman: 'i', phonemes: ['i'], advance: 380, contours: [
      { nodes: [[190,250],[300,430],[190,610],[80,430]] },
      { nodes: [[100,690],[280,690],[280,780],[100,780]] },
  ]},
  { name: 'k', roman: 'k', phonemes: ['k'], advance: 640, contours: [
      { nodes: [[170,110],[280,110],[280,800],[170,800]] },
      { nodes: [[280,170],[540,270],[280,370]] },
  ]},
  { name: 'l', roman: 'l', phonemes: ['l'], advance: 560,
    // SKELETON + nib width. Each segment becomes its own closed contour, all
    // wound the same way, and non-zero fill unions them for free — no boolean
    // path operations anywhere.
    strokes: [ { width: 110, pts: [[130,150],[130,700],[430,700],[430,430]] } ] },
  { name: 's', roman: 's', phonemes: ['s'], advance: 620,
    strokes: [ { width: 100, pts: [[440,240],[180,240],[180,470],[420,470],[420,720],[150,720]] } ] },
  { name: 'h', roman: 'h', phonemes: ['h'], advance: 520, contours: [
      { nodes: [[150,120],[250,120],[250,800],[150,800]] },
      { nodes: [[250,420],[430,420],[430,800],[330,800],[330,510],[250,510]] },
  ]},
  // A digraph: "sh" is ONE letter of this script. Reached through an OpenType
  // ligature, so the user still just types s then h.
  { name: 's_h', roman: null, phonemes: ['ʃ'], advance: 760, contours: [
      { nodes: [[80,800],[80,560],[200,520],[200,800]] },
      { nodes: [[260,800],[260,440],[380,400],[380,800]] },
      { nodes: [[440,800],[440,320],[560,280],[560,800]] },
      { nodes: [[620,300],[700,300],[700,800],[620,800]] },
  ]},
];

// ---------------------------------------------------------------------------
// Skeleton -> outline, with zero offsetting maths.
// Per segment: a quad perpendicular to it. Per joint and cap: a disc.
// All forced to the same winding, so non-zero fill merges them.
// ---------------------------------------------------------------------------
function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}
function segQuad(p0, p1, h) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len * h, ny = dx / len * h;
  return [
    [p0[0] + nx, p0[1] + ny], [p1[0] + nx, p1[1] + ny],
    [p1[0] - nx, p1[1] - ny], [p0[0] - nx, p0[1] - ny],
  ];
}
function disc(c, r, n) {
  n = n || 16;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r]);
  }
  return pts;
}
function strokeToContours(st) {
  const h = st.width / 2, out = [];
  for (let i = 0; i < st.pts.length - 1; i++) out.push({ nodes: segQuad(st.pts[i], st.pts[i + 1], h) });
  st.pts.forEach(function (p) { out.push({ nodes: disc(p, h) }); });   // round caps + joins
  return out;
}

// ---------------------------------------------------------------------------
// Points -> opentype Path, flipping y and fixing hole winding.
//
// A contour is a closed ring of nodes. A node's control point governs the
// segment ARRIVING at that node, and the ring closes implicitly, so node 0's
// control governs the closing segment. An author may write the closing node
// explicitly (repeating node 0's coordinates); normalise() folds that away.
// ---------------------------------------------------------------------------
function normalise(nodes) {
  const out = nodes.slice();
  const first = out[0], last = out[out.length - 1];
  if (out.length > 1 && last[0] === first[0] && last[1] === first[1]) {
    out.pop();
    out[0] = last.length > 2 ? [first[0], first[1], last[2], last[3]] : [first[0], first[1]];
  }
  return out;
}

// Reversing a curve ring is NOT nodes.reverse(). Each control point belongs to
// the segment arriving at its node, so reversing direction has to re-attach every
// control to the segment that now arrives there. Skip this and holes come out as
// spikes — silently, with no error anywhere. (Spike v2 shipped this bug first.)
function reverseNodes(nodes) {
  const m = nodes.length, out = [];
  for (let j = 0; j < m; j++) {
    const p = nodes[(m - j) % m];          // on-curve point, walked backwards
    const c = nodes[(m - j + 1) % m];      // control of the segment we just undid
    out.push(c.length > 2 ? [p[0], p[1], c[2], c[3]] : [p[0], p[1]]);
  }
  return out;
}

function emit(path, nodes) {
  path.moveTo(nodes[0][0], BASE - nodes[0][1]);
  for (let i = 1; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.length > 2) path.quadraticCurveTo(n[2], BASE - n[3], n[0], BASE - n[1]);
    else path.lineTo(n[0], BASE - n[1]);
  }
  const z = nodes[0];                      // closing segment
  if (z.length > 2) path.quadraticCurveTo(z[2], BASE - z[3], z[0], BASE - z[1]);
  path.close();
}

function build(g) {
  const contours = (g.contours || []).concat(
    (g.strokes || []).reduce(function (acc, s) { return acc.concat(strokeToContours(s)); }, []));
  const path = new ot.Path();
  contours.forEach(function (c) {
    let nodes = normalise(c.nodes);
    // Area is measured in SVG space (y down); the y flip negates its sign, so
    // font-space-positive means svg-space-negative.
    const positiveInFont = signedArea(nodes) < 0;
    if (positiveInFont === !!c.hole) nodes = reverseNodes(nodes);
    emit(path, nodes);
  });
  return path;
}

// ---------------------------------------------------------------------------
// cmap keyed to the ROMANISATION. 'k' the glyph lives at U+006B.
// So rendering the script is: font-family swap. Nothing else.
// ---------------------------------------------------------------------------
const glyphs = [new ot.Glyph({ name: '.notdef', unicode: 0, advanceWidth: EM, path: new ot.Path() })];
const index = {};
GLYPHS.forEach(function (g) {
  const gl = new ot.Glyph({
    name: g.name,
    unicode: g.roman ? g.roman.charCodeAt(0) : undefined,   // digraph glyph has no cmap entry
    advanceWidth: g.advance,
    path: build(g),
  });
  index[g.name] = glyphs.length;
  glyphs.push(gl);
});

const font = new ot.Font({
  familyName: 'LinguaScript', styleName: 'Regular',
  unitsPerEm: EM, ascender: ASC, descender: DESC, glyphs: glyphs,
});

// s + h  ->  the single sh letter
font.substitution.add('liga', { sub: [index['s'], index['h']], by: index['s_h'] });

const buf = Buffer.from(font.toArrayBuffer());
fs.writeFileSync('./LinguaScript2.otf', buf);

// ---------------------------------------------------------------------------
// The toggle: the SAME text node, rendered twice. No transliteration step.
// ---------------------------------------------------------------------------
const SAMPLE = 'kalish';
const b64 = buf.toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face{ font-family:'LinguaScript'; src:url(data:font/otf;base64,${b64}) format('opentype'); }
  body{ background:#0d0b09; color:#e8dcc8; font-family:Georgia,serif; padding:34px; margin:0; }
  h1{ font-size:14px; letter-spacing:.18em; text-transform:uppercase; color:#c9a961; font-weight:400; margin:0 0 6px; }
  .sub{ font-size:12px; color:#8a7c66; margin-bottom:26px; }
  .row{ border-top:1px solid #2a241c; padding:16px 0; }
  .lbl{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8a7c66; margin-bottom:10px; }
  .script{ font-family:'LinguaScript'; }
  .big{ font-size:76px; line-height:1.45; color:#f0e6d2; }
  .med{ font-size:34px; color:#f0e6d2; }
  .sml{ font-size:17px; color:#f0e6d2; }
  input{ font-size:44px; background:#151109; color:#f0e6d2; border:1px solid #3a3126;
         border-radius:6px; padding:8px 14px; width:90%; }
  .noliga{ font-variant-ligatures:none; }
  .ipa{ font-size:17px; color:#c9a961; }
</style></head><body>
<h1>points in, font out &mdash; and the script is a font-family swap</h1>
<div class="sub">every glyph below was authored as points; "l" and "s" from a skeleton + nib width, no offsetting</div>

<div class="row">
  <div class="lbl">the string "${SAMPLE}" &mdash; toggle OFF (roman)</div>
  <div class="big">${SAMPLE}</div>
</div>

<div class="row">
  <div class="lbl">the same string "${SAMPLE}" &mdash; toggle ON (custom script). identical text node.</div>
  <div class="big script">${SAMPLE}</div>
  <div class="ipa">/kaliʃ/ &mdash; note s+h became one letter via an OpenType ligature</div>
</div>

<div class="row">
  <div class="lbl">ligature off, to show the two source letters really are s and h</div>
  <div class="big script noliga">${SAMPLE}</div>
</div>

<div class="row">
  <div class="lbl">a real input. what you type is ascii, what you see is your script, what you copy is "${SAMPLE}"</div>
  <input class="script" value="kalisha lish">
</div>

<div class="row">
  <div class="lbl">alphabet a i k l s h + the sh letter, at three sizes</div>
  <div class="med script">aiklsh &nbsp; ashishakil</div>
  <div class="sml script">aiklsh &nbsp; ashishakil</div>
</div>

<div class="row">
  <div class="lbl">winding test &mdash; left authored correctly, right authored backwards on purpose. must be identical.</div>
  <div class="big script">a e</div>
</div>

<div class="row">
  <div class="lbl">undrawn letters still fall back silently &mdash; "z" and "q" have no glyph</div>
  <div class="med script">kaz qil</div>
</div>
</body></html>`;
fs.writeFileSync('./index2.html', html);

console.log('otf bytes  :', buf.length);
console.log('glyphs     :', glyphs.length, '(incl .notdef)');
console.log('cmap       :', GLYPHS.filter(g => g.roman).map(g => g.roman).join(' '), '| ligature: s+h ->', 's_h');
console.log('from points:', GLYPHS.filter(g => g.contours).map(g => g.name).join(' '));
console.log('from skel  :', GLYPHS.filter(g => g.strokes).map(g => g.name).join(' '));
