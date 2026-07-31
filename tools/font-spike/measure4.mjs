// Pick the two spacing parameters by a measurement that has never heard of them.
//
// The trap this file exists to avoid: the area solver in build4.mjs equalises the
// white beside every glyph *under its own DEPTH clamp*, so any metric that also
// clamps at DEPTH reports the solver as perfect by construction. Sweeping on that
// number measures nothing. (I did it once. It said a shallower solver spaced
// better, which was an artefact of the yardstick shrinking with the parameter.)
//
// What replaced it is the squint test, mechanised. Render a string, sum the alpha
// of every pixel column, Gaussian-blur that profile. Blurring is literally
// squinting: it throws the shapes away and leaves the rhythm of dark and light.
// Every trough in the blurred profile is a piece of white; even spacing means the
// troughs are all the same depth, so the coefficient of variation of the trough
// depths is the score, and lower is better.
//
// TWO READINGS, and the difference between them is the whole reason this file went
// through three drafts:
//
//   rhythmCv — every trough, INCLUDING the ones inside letters (the gap between
//     the two stems of "h", the notch beside the diagonal of "k"). This is the
//     score that decides both parameters. It has a genuine interior optimum: too
//     tight and the between-letter troughs are shallower than the inside-letter
//     ones, too loose and they are deeper. The classic rule "the white between
//     letters should match the white inside them" falls out of it rather than
//     being asserted.
//
//   joinCv — the troughs at letter joins only, located from the advances. This
//     one CANNOT choose tracking, and finding out why was the useful part: at a
//     matched overall text width, looser tracking always scores more even, because
//     the letters shrink relative to the squint radius. That is not a measurement
//     artefact — loose tracking really is more forgiving of spacing error — it just
//     means the reading is monotonic in GAP and can only rank DEPTH_F. It is kept
//     because it is the direct answer to "are the gaps between letters equal", and
//     it is measured at a FIXED em size here so it stays comparable.
//
// Neither reading refers to GAP, DEPTH_F, sidebearings, or bounding boxes.

import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

const DIR = new URL('.', import.meta.url).pathname;
const manifest = JSON.parse(fs.readFileSync(DIR + '/manifest4.json', 'utf8'));

// 'h' is excluded from the test alphabet: s+h ligates into one glyph, so a string
// containing "sh" has one fewer join than it has characters, and the join count
// check would fire on a feature working correctly.
const ALPHA = ['a', 'i', 'k', 'l', 's', 't'];

// de Bruijn B(k=6, n=2): every ordered pair appears exactly once as a substring.
function deBruijn(k, n) {
  const a = new Array(k * n).fill(0), seq = [];
  (function db(t, p) {
    if (t > n) { for (let i = 1; i <= p; i++) seq.push(a[i]); return; }
    a[t] = a[t - p];
    db(t + 1, p);
    for (let j = a[t - p] + 1; j < k; j++) { a[t] = j; db(t + 1, t); }
  })(1, 1);
  return seq;
}
const cyc = deBruijn(ALPHA.length, 2).map(function (i) { return ALPHA[i]; });
// the sequence is cyclic; unroll by one so the wrap-around pair is present linearly
const STR = cyc.concat(cyc[0]).join('');
const JOINS = STR.length - 1;

// FIXED EM SIZE for every variant, and a squint radius that is a fixed fraction of
// the em. Not a fixed total width — matching total width is what made the reading
// monotonic in tracking, because it silently changed the letter size per variant.
const SIZE = 100;
// Squint radius. One stem width is the traditional amount to blur by when
// checking spacing, and a stem here is the pen width: 0.06-0.19 em over the four
// pens. 0.07 em keeps the troughs INSIDE letters alive — the first attempt used
// 0.16 em and quietly smeared them out of existence, which is why every variant
// then reported a balance of exactly 1.00: there was nothing left to balance
// against, and rhythmCv had silently collapsed back into joinCv.
const SIGMA = 0.07 * SIZE;
const PAD = 200;

function advEm(v, s) {
  let w = 0;
  for (let i = 0; i < s.length; i++) w += v.bearings[s[i]].adv;
  return w;
}
// Where each join sits, in em units, from the advances. Using the advances to
// LOCATE a trough is not circular — what gets measured is the ink depth there,
// which the advances do not determine.
function joinsEm(v, s) {
  const xs = [];
  let w = 0;
  for (let i = 0; i < s.length - 1; i++) { w += v.bearings[s[i]].adv; xs.push(w); }
  return xs;
}

const srv = http.createServer(function (rq, rs) {
  const p = decodeURIComponent(rq.url.split('?')[0]);
  if (p === '/') { rs.writeHead(200, { 'Content-Type': 'text/html' }); rs.end('<!doctype html><meta charset=utf-8><link rel=icon href="data:,"><body>'); return; }
  const f = path.join(DIR, p);
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': f.endsWith('.otf') ? 'font/otf' : 'text/html' });
  rs.end(fs.readFileSync(f));
}).listen(8191);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 400, height: 300 } });
const errs = [];
pg.on('console', function (m) {
  if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text());
});
await pg.goto('http://127.0.0.1:8191/', { waitUntil: 'load' });

const jobs = manifest.map(function (v) {
  return { key: v.key, file: v.file, joinsEm: joinsEm(v, STR), advEm: advEm(v, STR) };
});

const out = await pg.evaluate(async function (arg) {
  const { jobs, STR, SIZE, SIGMA, PAD } = arg;

  function blur(a, s) {
    const r = Math.ceil(s * 3), k = [];
    let sum = 0;
    for (let i = -r; i <= r; i++) { const w = Math.exp(-(i * i) / (2 * s * s)); k.push(w); sum += w; }
    const o = new Float64Array(a.length);
    for (let x = 0; x < a.length; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const j = Math.min(a.length - 1, Math.max(0, x + i));
        acc += a[j] * k[i + r];
      }
      o[x] = acc / sum;
    }
    return o;
  }
  function stats(v) {
    const m = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    const sd = Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / v.length);
    return { mean: m, sd: sd, cv: sd / m };
  }

  const res = [];
  for (const job of jobs) {
    const fam = 'M_' + job.key.replace(/[^\w]/g, '_');
    const ff = new FontFace(fam, 'url(/' + job.file + ')');
    document.fonts.add(ff);
    await ff.load();
    // Chromium will not actually use a face no element referenced; force it.
    await document.fonts.load(SIZE + 'px "' + fam + '"');

    const cv = document.createElement('canvas');
    cv.width = Math.ceil(job.advEm / 1000 * SIZE + PAD * 2);
    cv.height = Math.ceil(SIZE * 2.2);
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.font = SIZE + 'px "' + fam + '"';
    c.fillStyle = '#000';
    c.textBaseline = 'alphabetic';
    c.fillText(STR, PAD, SIZE * 1.55);
    const measured = c.measureText(STR).width;

    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    const col = new Float64Array(cv.width);
    for (let y = 0; y < cv.height; y++) {
      const row = y * cv.width * 4;
      for (let x = 0; x < cv.width; x++) col[x] += d[row + x * 4 + 3];
    }
    const bl = blur(col, SIGMA);

    let x0 = 0, x1 = cv.width - 1;
    while (x0 < cv.width && col[x0] === 0) x0++;
    while (x1 > x0 && col[x1] === 0) x1--;
    let ink = 0;
    for (let x = x0; x <= x1; x++) ink += bl[x];
    const mean = ink / (x1 - x0 + 1);

    const k = SIZE / 1000;
    const half = 0.42 * (job.advEm / STR.length) * k;

    // The white between letters, one reading per join, located from the advances.
    // Locating a trough that way is not circular: what gets measured is the ink
    // depth there, which the advances do not determine.
    const joins = job.joinsEm.map(function (em) {
      const cx = PAD + em * k;
      let lo = Infinity;
      for (let x = Math.max(0, Math.round(cx - half)); x <= Math.min(cv.width - 1, Math.round(cx + half)); x++) {
        if (bl[x] < lo) lo = bl[x];
      }
      return lo / mean;
    });

    // The white INSIDE letters: every other trough in the blurred profile — the
    // gap between the two stems of "h", the notch beside the diagonal of "k". The
    // join troughs have to be excluded explicitly. The first version did not
    // exclude them, so the "interior" mean contained the join readings it was
    // meant to be compared against, and the balance figure came out pinned near
    // 1.00 for every variant no matter how badly spaced it was.
    const joinX = job.joinsEm.map(function (em) { return PAD + em * k; });
    const interior = [];
    for (let x = x0 + 1; x < x1; x++) {
      if (!(bl[x] <= bl[x - 1] && bl[x] < bl[x + 1])) continue;
      let nearJoin = false;
      for (let j = 0; j < joinX.length; j++) if (Math.abs(x - joinX[j]) <= half) { nearJoin = true; break; }
      if (!nearJoin) interior.push(bl[x] / mean);
    }

    const js = stats(joins);
    const is_ = interior.length ? stats(interior) : { cv: NaN, mean: NaN };
    res.push({
      key: job.key,
      width: Math.round(measured),
      nInterior: interior.length,
      joinCv: js.cv,
      joinMean: js.mean,
      joinMin: Math.min.apply(null, joins),
      joinVals: joins,
      interiorMean: is_.mean,
      // The white between letters over the white inside them. 1.00 is the classic
      // target, and this is now a comparison of two disjoint populations.
      balance: is_.mean ? js.mean / is_.mean : NaN,
      status: ff.status,
    });
  }
  return res;
}, { jobs: jobs, STR: STR, SIZE: SIZE, SIGMA: SIGMA, PAD: PAD });

await br.close();
srv.close();

const byKey = {}, byRes = {};
manifest.forEach(function (v) { byKey[v.key] = v; });
out.forEach(function (r) { byRes[r.key] = r; });

const STYLES = [], GAPSET = [], DEPTHSET = [];
manifest.forEach(function (v) {
  if (STYLES.indexOf(v.style) < 0) STYLES.push(v.style);
  if (v.mode === 'area') {
    if (GAPSET.indexOf(v.gapAbs) < 0) GAPSET.push(v.gapAbs);
    if (DEPTHSET.indexOf(v.depthF) < 0) DEPTHSET.push(v.depthF);
  }
});
GAPSET.sort(function (a, b) { return a - b; });
DEPTHSET.sort(function (a, b) { return a - b; });

function cell(style, gp, d) {
  const v = manifest.filter(function (q) {
    return q.style === style && q.gapAbs === gp && q.depthF === d; })[0];
  return v ? { v: v, r: byRes[v.key] } : null;
}
function grid(label, pick) {
  console.log('\n' + label);
  STYLES.forEach(function (style) {
    const k = style + '-bbox';
    console.log('\n  ' + style + '   v3/bbox = ' + pick(byRes[k], byKey[k]));
    console.log('   gapAbs' + DEPTHSET.map(function (d) {
      return ('d' + d.toFixed(2)).padStart(9); }).join(''));
    GAPSET.forEach(function (gp) {
      console.log('    ' + String(gp).padEnd(5) + DEPTHSET.map(function (d) {
        const q = cell(style, gp, d);
        return (q ? pick(q.r, q.v) : '-').padStart(9);
      }).join(''));
    });
  });
}

console.log('test string: ' + STR + '   (' + JOINS + ' joins, every ordered pair of '
  + ALPHA.join('') + ' once)');
console.log('every variant rendered at ' + SIZE + 'px em, squint sigma '
  + SIGMA.toFixed(1) + 'px (~one stem)');

// ---------------------------------------------------------------------------
// The two parameters do different jobs, so they get chosen by different readings.
// Trying to rank both on one number is what produced three misleading sweeps.
//
//   DEPTH_F decides whether the gaps between letters are EQUAL TO EACH OTHER.
//           -> minimise joinCv. Tracking barely moves it.
//   GAP     decides how much white there is between letters at all, which is only
//           meaningful relative to the white inside the letters.
//           -> drive balance to 1.00. joinCv cannot judge this; it is monotonic in
//              tracking, because looser spacing is genuinely more forgiving.
// ---------------------------------------------------------------------------
grid('JOIN cv %, evenness of the gaps between letters. This picks DEPTH_F.',
  function (r) { return (r.joinCv * 100).toFixed(1); });

grid('BALANCE = white between letters / white inside letters. This picks GAP.\n'
  + '1.00 is the classic target; below 1 the line clumps, above 1 it beads.',
  function (r) { return r.balance.toFixed(2); });

// ---------------------------------------------------------------------------
// Choosing. joinCv turns out to have an interior optimum in BOTH parameters once
// it is measured at a fixed em size, so it can rank the pair jointly:
//   - too tight and the gaps cannot be equalised at all, because the collision
//     floor takes over and every sidebearing saturates on it;
//   - too loose and the troughs approach zero ink, so their spread explodes.
// The earlier draft of this file matched total width instead of em size, which
// removed the upper half of that curve and made the reading monotonic.
//
// balance is printed above as a diagnostic and NOT used to choose, for a reason
// worth writing down: it cannot be driven to 1.00 at a heavy pen. At pen 190 the
// counters are so nearly filled that the ink density inside a letter is far above
// anything achievable between letters, so the crossing does not exist in range and
// extrapolating it gives a negative GAP. Real bold faces have the same problem and
// real designers accept balance < 1 there. A criterion that only works for light
// weights is not a criterion for a font whose weight is a slider.
//
// The pen is ONE global setting and the user drags that slider afterwards, so rank
// on the WORST pen, not the mean and certainly not the best.
// ---------------------------------------------------------------------------
const combos = [];
GAPSET.forEach(function (gp) {
  DEPTHSET.forEach(function (d) {
    const rs = STYLES.map(function (style) { return cell(style, gp, d); }).filter(Boolean);
    if (rs.length !== STYLES.length) return;
    combos.push({
      gapAbs: gp, depthF: d,
      worstJoin: Math.max.apply(null, rs.map(function (q) { return q.r.joinCv; })),
      worstClear: Math.min.apply(null, rs.map(function (q) { return q.v.minClear; })),
      balLo: Math.min.apply(null, rs.map(function (q) { return q.r.balance; })),
      balHi: Math.max.apply(null, rs.map(function (q) { return q.r.balance; })),
    });
  });
});
const safe = combos.filter(function (c) { return c.worstClear > 0; });
safe.sort(function (a, b) { return a.worstJoin - b.worstJoin; });
console.log('\n\nranked on worst pen, gaps-between-letters evenness:');
console.log('   GAP  DEPTH_F   worst join cv   clearance   balance range');
safe.slice(0, 10).forEach(function (c) {
  console.log('  ' + String(c.gapAbs).padStart(4) + c.depthF.toFixed(2).padStart(9)
    + ((c.worstJoin * 100).toFixed(1) + '%').padStart(16)
    + String(c.worstClear).padStart(12)
    + (c.balLo.toFixed(2) + '-' + c.balHi.toFixed(2)).padStart(16));
});

const wj = Math.max.apply(null, STYLES.map(function (s2) { return byRes[s2 + '-bbox'].joinCv; }));
const best = safe[0];
console.log('\nper pen at the winner (GAP ' + best.gapAbs + ', DEPTH_F ' + best.depthF.toFixed(2) + '):');
STYLES.forEach(function (style) {
  const q = cell(style, best.gapAbs, best.depthF);
  console.log('  ' + style.padEnd(10) + 'v3 join cv ' + (byRes[style + '-bbox'].joinCv * 100).toFixed(1)
    + '%  ->  v4 ' + (q.r.joinCv * 100).toFixed(1) + '%'
    + '   clearance ' + String(q.v.minClear).padStart(4)
    + '   interior troughs ' + q.r.nInterior);
});
console.log('\nv3 baseline, worst pen: join cv ' + (wj * 100).toFixed(1) + '%'
  + '   ->   v4 at the winner: ' + (best.worstJoin * 100).toFixed(1) + '%');
console.log('console errors: ' + (errs.length ? errs.join(' | ') : 'none'));
fs.writeFileSync(DIR + '/measure4.json', JSON.stringify(out, null, 1));
