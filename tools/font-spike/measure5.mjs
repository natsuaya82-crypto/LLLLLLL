// Measure the four v5 candidates with the SAME instrument calibrate5.mjs pointed
// at real fonts, so the numbers land on a scale that already has kana and DejaVu
// Sans on it. Two readings, because the two designs optimise different things:
//
//   gapCv    spread of the blurred trough depth at each letter join
//   pitchCv  spread of the per-letter advance widths
//
// Plus the thing that only matters at phone size and cannot be reasoned about
// from em units: at 15 and 17px, is the stem still a stem, and is the counter of
// "a" still a hole? A 1.02px stem is one anti-aliased pixel, and a counter three
// pixels across closes.
import { createRequire } from 'module';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

const DIR = new URL('.', import.meta.url).pathname;
const MODES = ['area', 'asdrawn', 'center', 'fit'];
const WPENS = [60, 90, 120];
const FILES = MODES.map(m => 'LS5-' + m + '.otf').concat(WPENS.map(w => 'LS5-w' + w + '.otf'));
FILES.forEach(f => { if (!fs.existsSync(DIR + f)) { console.error('missing ' + f + ' - run build5.mjs'); process.exit(1); } });

const STR = 'aaiakalasatiikilisitkklksktllsltsstta';   // B(6,2) unrolled, 36 joins
const ALPHA = ['a', 'i', 'k', 'l', 's', 't'];

const srv = http.createServer((rq, rs) => {
  const p = decodeURIComponent(rq.url.slice(1));
  if (!p) {
    rs.writeHead(200, { 'Content-Type': 'text/html' });
    rs.end('<!doctype html><meta charset=utf-8><link rel=icon href="data:,">');
    return;
  }
  const f = path.join(DIR, p);
  if (!f.startsWith(DIR) || !fs.existsSync(f)) { rs.writeHead(404); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': 'font/otf' });
  rs.end(fs.readFileSync(f));
}).listen(8192);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 600, height: 400 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://127.0.0.1:8192/', { waitUntil: 'load' });

const out = await pg.evaluate(async (args) => {
  const { MODES, WPENS, STR, ALPHA } = args;
  const SIZE = 100, PAD = 240, SIGMA = 0.07 * SIZE;
  function blur(a, s) {
    const r = Math.ceil(s * 3), k = []; let sum = 0;
    for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * s * s)); k.push(v); sum += v; }
    const o = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      let acc = 0;
      for (let j = -r; j <= r; j++) { const x = i + j; if (x >= 0 && x < a.length) acc += a[x] * k[j + r]; }
      o[i] = acc / sum;
    }
    return o;
  }
  const cv = v => {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return m === 0 ? 0 : Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length) / m;
  };

  const load = async (fam, file) => {
    const ff = new FontFace(fam, 'url(/' + file + ')');
    await ff.load(); document.fonts.add(ff);
    await document.fonts.load(SIZE + 'px "' + fam + '"', STR);
  };
  for (const m of MODES) await load('M-' + m, 'LS5-' + m + '.otf');
  for (const w of WPENS) await load('W-' + w, 'LS5-w' + w + '.otf');

  const cnv = document.createElement('canvas');
  cnv.height = 300;
  const cx = cnv.getContext('2d');

  const columns = (fam, px, text, baseline) => {
    cx.font = px + 'px "' + fam + '"';
    const w = cx.measureText(text).width;
    cnv.width = Math.ceil(w) + 2 * PAD;
    cx.font = px + 'px "' + fam + '"';
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000';
    cx.fillText(text, PAD, baseline);
    const d = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    const col = new Float64Array(cnv.width);
    for (let x = 0; x < cnv.width; x++) {
      let a = 0;
      for (let y = 0; y < cnv.height; y++) a += d[(y * cnv.width + x) * 4 + 3];
      col[x] = a;
    }
    return { col, w };
  };

  const rhythm = (fam) => {
    const { col, w } = columns(fam, SIZE, STR, 200);
    const prof = blur(col, SIGMA);
    const half = 0.42 * (w / STR.length);
    const troughs = [];
    cx.font = SIZE + 'px "' + fam + '"';
    for (let i = 1; i < STR.length; i++) {
      const at = PAD + cx.measureText(STR.slice(0, i)).width;
      const lo = Math.max(0, Math.round(at - half)), hi = Math.min(col.length - 1, Math.round(at + half));
      let mn = Infinity;
      for (let x = lo; x <= hi; x++) if (prof[x] < mn) mn = prof[x];
      troughs.push(mn);
    }
    const advs = ALPHA.map(ch => cx.measureText(ch).width);
    return {
      gapCv: +(cv(troughs) * 100).toFixed(1),
      pitchCv: +(cv(advs) * 100).toFixed(1),
      joinMin: Math.round(Math.min(...troughs)),
      joinMean: Math.round(troughs.reduce((a, b) => a + b, 0) / troughs.length),
      width: Math.round(w),
    };
  };

  // Small-size ink survival. Rendered at px, the stem of "i" is measured as the
  // peak alpha of its column (255 = a fully covered pixel column somewhere in it),
  // and the counter of "a" as whether any interior column drops back near zero.
  const small = (fam, px) => {
    const stem = columns(fam, px, 'i', px * 1.4);
    let peak = 0;
    for (const v of stem.col) if (v > peak) peak = v;
    // peak is summed over y; normalise by the inked height to get per-pixel alpha
    let rows = 0;
    {
      const d = cx.getImageData(0, 0, cnv.width, cnv.height).data;
      for (let y = 0; y < cnv.height; y++) {
        let a = 0;
        for (let x = 0; x < cnv.width; x++) a += d[(y * cnv.width + x) * 4 + 3];
        if (a > 0) rows++;
      }
    }
    // the counter of the ring "a": scan the middle row band for a white gap
    cx.font = px + 'px "' + fam + '"';
    const aw = cx.measureText('a').width;
    cnv.width = Math.ceil(aw) + 40;
    cx.font = px + 'px "' + fam + '"';
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000';
    cx.fillText('a', 20, px * 1.4);
    const d2 = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    // find the ring's vertical middle
    let y0 = -1, y1 = -1;
    for (let y = 0; y < cnv.height; y++) {
      let a = 0;
      for (let x = 0; x < cnv.width; x++) a += d2[(y * cnv.width + x) * 4 + 3];
      if (a > 0) { if (y0 < 0) y0 = y; y1 = y; }
    }
    const ym = Math.round((y0 + y1) / 2);
    let inked = [], minInside = 255;
    for (let x = 0; x < cnv.width; x++) {
      const a = d2[(ym * cnv.width + x) * 4 + 3];
      if (a > 20) inked.push(x);
    }
    if (inked.length >= 2) {
      for (let x = inked[0] + 1; x < inked[inked.length - 1]; x++) {
        const a = d2[(ym * cnv.width + x) * 4 + 3];
        if (a < minInside) minInside = a;
      }
    }
    return {
      stemAlpha: rows ? +(peak / rows / 255).toFixed(2) : 0,   // 1.00 = solid black stem
      counterAlpha: minInside,          // 0 = counter fully open, 255 = filled in
      counterOpen: minInside < 90,
    };
  };

  const res = { modes: {}, pens: {} };
  for (const m of MODES) res.modes[m] = rhythm('M-' + m);
  for (const w of WPENS) {
    res.pens[w] = { rhythm: rhythm('W-' + w), px: {} };
    for (const px of [12, 15, 17, 22]) res.pens[w].px[px] = small('W-' + w, px);
  }
  // the system UI font at the same sizes, as the reference for "is this a stem"
  res.sys = {};
  for (const px of [12, 15, 17, 22]) res.sys[px] = small('DejaVu Sans', px);
  return res;
}, { MODES, WPENS, STR, ALPHA });

const pad = (s, n) => String(s).padStart(n);
console.log('same instrument as calibrate5.mjs (em 100px, blur 0.07em, every ordered pair once)\n');
console.log('  candidate                        gap cv    pitch cv');
const NICE = { area: 'proportional (v4 solve)', asdrawn: 'square, as drawn',
               center: 'square, ink centred', fit: 'square, scaled to fill' };
for (const m of MODES) {
  const r = out.modes[m];
  console.log('  ' + NICE[m].padEnd(32) + pad(r.gapCv + '%', 7) + pad(r.pitchCv + '%', 12));
}
console.log('\n  for scale, from calibrate5.mjs:');
console.log('    DejaVu Sans          11.9%    30.6%     <- proportional latin, drawn by a professional');
console.log('    Carlito              18.0%    28.0%');
console.log('    DejaVu Sans Mono     50.4%     0.0%     <- latin monospace');
console.log('    Noto Sans JP kana    85.9%     0.0%     <- a square-cell script a billion people read');
console.log('    IPAGothic kana       98.7%     0.0%');
console.log('    Noto Sans KR hangul  19.6%     0.0%     <- square cell AND even gaps: designed for it');

console.log('\ndoes the ink survive phone sizes? (stem 1.00 = one solid black pixel column)');
console.log('  pen      12px          15px          17px          22px');
for (const w of WPENS) {
  const r = out.pens[w].px;
  console.log('  ' + String(w).padEnd(6) + [12, 15, 17, 22].map(px =>
    (r[px].stemAlpha.toFixed(2) + (r[px].counterOpen ? ' o' : ' X')).padStart(14)).join(''));
}
const s = out.sys;
console.log('  ' + 'sys'.padEnd(6) + [12, 15, 17, 22].map(px =>
  (s[px].stemAlpha.toFixed(2) + (s[px].counterOpen ? ' o' : ' X')).padStart(14)).join('')
  + '   <- DejaVu Sans');
console.log('  o = the counter of "a" is still an open hole, X = the pen has filled it in');

console.log('\nconsole errors: ' + (errs.length ? errs.join(' | ') : 'none'));
fs.writeFileSync(DIR + 'measure5.json', JSON.stringify(out, null, 1));
await br.close();
srv.close();
