// Render index5.html and re-derive v5's claims from rendered pixels in a browser,
// not from build5.mjs's own geometry.
//
// v5 answers three things the user said, so there are three things to check:
//
//   "60 is about right, fixed"  -> is a 60/1000 stem still ink at 12-22px? measured
//                                  as peak per-pixel alpha of the stem of "i", with
//                                  the system UI face in the same table as the scale.
//   "same size as phone text"   -> everything on the proof page is 12/15/17/22px, and
//                                  there is a real kana line at the same size to
//                                  calibrate the eye against a square-cell script.
//   "letters live in a square,
//    so letter-spacing is a
//    category error"            -> in a square-cell font the pitch cv must be exactly
//                                  0 and every n-letter string must be exactly n cells
//                                  wide. That is checkable to the pixel: is the width
//                                  of "aa" exactly twice the width of "a", for all
//                                  36 ordered pairs, in all three square modes?
//                                  If yes the grid is real and gaps are decoration.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;
const HERE = new URL('.', import.meta.url).pathname;

const html = fs.readFileSync(HERE + 'index5.html');
const srv = http.createServer((rq, rs) => {
  if (rq.url !== '/') { rs.writeHead(204); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(html);
}).listen(8193);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
await pg.goto('http://127.0.0.1:8193/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);

await pg.screenshot({ path: HERE + 'proof5.png', fullPage: true });

const MODES = ['area', 'asdrawn', 'center', 'fit'];
const PENS = [60, 90, 120];
const ALPHA = ['a', 'i', 'k', 'l', 's', 't'];
// B(6,2) unrolled: every ordered pair of the six single-glyph letters exactly once.
// 'h' is excluded because s+h ligates and would break the join count.
const STR = 'aaiakalasatiikilisitkklksktllsltsstta';

const probe = await pg.evaluate(async (args) => {
  const { MODES, PENS, ALPHA, STR } = args;
  const fams = MODES.map(m => 'V5-' + m).concat(PENS.map(p => 'V5-w' + p));
  // A face no DOM node uses is lazily unloaded in Chromium, and measureText would
  // then silently be measuring the fallback UI font instead.
  await Promise.all(fams.map(f => document.fonts.load('100px "' + f + '"', STR + 'h')));

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

  const cnv = document.createElement('canvas');
  cnv.height = 400;
  const cx = cnv.getContext('2d');
  const set = (fam, px) => { cx.font = px + 'px "' + fam + '"'; };
  const wid = (fam, s, px) => { set(fam, px || SIZE); return cx.measureText(s).width; };

  const columns = (fam, px, text, baseline) => {
    set(fam, px);
    const w = cx.measureText(text).width;
    cnv.width = Math.ceil(w) + 2 * PAD;
    set(fam, px);
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

  const rhythm = fam => {
    const { col, w } = columns(fam, SIZE, STR, 300);
    const prof = blur(col, SIGMA);
    const half = 0.42 * (w / STR.length);
    const troughs = [];
    set(fam, SIZE);
    for (let i = 1; i < STR.length; i++) {
      const at = PAD + cx.measureText(STR.slice(0, i)).width;
      const lo = Math.max(0, Math.round(at - half)), hi = Math.min(col.length - 1, Math.round(at + half));
      let mn = Infinity;
      for (let x = lo; x <= hi; x++) if (prof[x] < mn) mn = prof[x];
      troughs.push(mn);
    }
    const advs = ALPHA.map(ch => wid(fam, ch));
    return {
      gapCv: +(cv(troughs) * 100).toFixed(1),
      pitchCv: +(cv(advs) * 100).toFixed(1),
      joinMin: Math.round(Math.min(...troughs)),
      joinMean: Math.round(troughs.reduce((a, b) => a + b, 0) / troughs.length),
      advs: advs.map(a => Math.round(a)),
      width: Math.round(w),
    };
  };

  // The grid claim, checked to the pixel: is every pair exactly two cells wide?
  const gridExact = fam => {
    const cell = wid(fam, 'a');
    let worst = 0, pairs = 0;
    for (const p of ALPHA) for (const q of ALPHA) {
      const d = Math.abs(wid(fam, p + q) - 2 * cell);
      if (d > worst) worst = d;
      pairs++;
    }
    // and a long line: 8 letters must be 8 cells. No 'h' in it — s+h ligates into a
    // single glyph, so "kalishta" is 8 characters but only 7 cells, which is the
    // ligature working, not the grid failing.
    const line = 'kalitass';
    return {
      cellPx: +cell.toFixed(2),
      pairs: pairs,
      worstPairErrPx: +worst.toFixed(3),
      lineErrPx: +(wid(fam, line) - line.length * cell).toFixed(3),
      ligCosts1Cell: +(line.length * cell - wid(fam, 'kalishta')).toFixed(3),
      uniformAdv: new Set(ALPHA.map(ch => wid(fam, ch).toFixed(3))).size === 1,
    };
  };

  // Ink survival at phone sizes. stemAlpha is the peak column alpha of "i"
  // normalised by its inked height: 1.00 means one fully black pixel column.
  const small = (fam, px) => {
    columns(fam, px, 'i', px * 1.4);
    const d = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    let peak = 0, rows = 0;
    for (let x = 0; x < cnv.width; x++) {
      let a = 0;
      for (let y = 0; y < cnv.height; y++) a += d[(y * cnv.width + x) * 4 + 3];
      if (a > peak) peak = a;
    }
    for (let y = 0; y < cnv.height; y++) {
      let a = 0;
      for (let x = 0; x < cnv.width; x++) a += d[(y * cnv.width + x) * 4 + 3];
      if (a > 0) rows++;
    }
    // counter of "a": is there still a white column between its outer edges?
    const aw = wid(fam, 'a', px);
    cnv.width = Math.ceil(aw) + 40;
    set(fam, px);
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000';
    cx.fillText('a', 20, px * 1.4);
    const d2 = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    let y0 = -1, y1 = -1;
    for (let y = 0; y < cnv.height; y++) {
      let a = 0;
      for (let x = 0; x < cnv.width; x++) a += d2[(y * cnv.width + x) * 4 + 3];
      if (a > 0) { if (y0 < 0) y0 = y; y1 = y; }
    }
    const ym = Math.round((y0 + y1) / 2);
    const inked = [];
    for (let x = 0; x < cnv.width; x++) if (d2[(ym * cnv.width + x) * 4 + 3] > 20) inked.push(x);
    let minInside = 255;
    if (inked.length >= 2) {
      for (let x = inked[0] + 1; x < inked[inked.length - 1]; x++) {
        const a = d2[(ym * cnv.width + x) * 4 + 3];
        if (a < minInside) minInside = a;
      }
    }
    return {
      stemAlpha: rows ? +(peak / rows / 255).toFixed(2) : 0,
      counterAlpha: minInside,
      counterOpen: minInside < 90,
    };
  };

  const modes = {}, grids = {}, pens = {};
  MODES.forEach(m => { modes[m] = rhythm('V5-' + m); grids[m] = gridExact('V5-' + m); });
  PENS.forEach(p => {
    pens[p] = { px: {} };
    [12, 15, 17, 22].forEach(px => { pens[p].px[px] = small('V5-w' + p, px); });
  });
  const sys = {};
  [12, 15, 17, 22].forEach(px => { sys[px] = small('DejaVu Sans', px); });

  const el = document.querySelector('input');
  return {
    faces: [...document.fonts].length,
    unloaded: [...document.fonts].filter(f => f.status !== 'loaded').map(f => f.family + ':' + f.status),
    modes, grids, pens, sys,
    space: MODES.reduce((o, m) => {
      const f = 'V5-' + m;
      o[m] = Math.round(wid(f, 'a a') - 2 * wid(f, 'a'));
      return o;
    }, {}),
    ligFired: MODES.reduce((o, m) => {
      const f = 'V5-' + m;
      o[m] = wid(f, 'sh') < wid(f, 's') + wid(f, 'h') - 0.5;
      return o;
    }, {}),
    kanaLoaded: document.fonts.check('17px "Noto Sans CJK JP"', 'あしき'),
    inputAscii: el ? /^[\x20-\x7e]+$/.test(el.value) : null,
    inputValue: el ? el.value : null,
  };
}, { MODES, PENS, ALPHA, STR });

const pad = (s, n) => String(s).padStart(n);
console.log('faces in document.fonts: ' + probe.faces
  + (probe.unloaded.length ? '   NOT LOADED: ' + probe.unloaded.join(', ') : '   all loaded'));
console.log('kana reference face present: ' + probe.kanaLoaded);

const NICE = { area: 'proportional (v4 solve)', asdrawn: 'square, as drawn',
               center: 'square, ink centred', fit: 'square, scaled to fill' };
console.log('\nrendered in the browser (em 100px, de Bruijn 36 joins, blur = 1 stem):');
console.log('  candidate                        gap cv    pitch cv     space');
for (const m of MODES) {
  const r = probe.modes[m];
  console.log('  ' + NICE[m].padEnd(32) + pad(r.gapCv + '%', 7) + pad(r.pitchCv + '%', 12)
    + pad(probe.space[m], 10));
}
console.log('\n  for scale (calibrate5.mjs, same instrument, real shipping fonts):');
console.log('    DejaVu Sans          11.9%    30.6%     <- proportional latin');
console.log('    Carlito              18.0%    28.0%');
console.log('    DejaVu Sans Mono     50.4%     0.0%     <- latin monospace');
console.log('    Noto Sans JP kana    85.9%     0.0%     <- square cell, read by a billion people');
console.log('    IPAGothic kana       98.7%     0.0%');
console.log('    Noto Sans KR hangul  19.6%     0.0%     <- square cell AND even gaps');

console.log('\nis the square actually a square? (all 36 ordered pairs, measured in px at em 100)');
console.log('  candidate                    cell px   uniform   worst pair err   8-letter line err');
for (const m of MODES) {
  const g = probe.grids[m];
  console.log('  ' + NICE[m].padEnd(28) + pad(g.cellPx, 8) + pad(g.uniformAdv ? 'yes' : 'no', 10)
    + pad(g.worstPairErrPx + 'px', 17) + pad(g.lineErrPx + 'px', 20));
}
console.log('  the sh ligature costs exactly one cell (' + MODES.map(m =>
  probe.grids[m].ligCosts1Cell + 'px of ' + probe.grids[m].cellPx).join(', ') + ')');

console.log('\ndoes the ink survive phone sizes? (1.00 = one solid black pixel column)');
console.log('  pen        12px          15px          17px          22px');
for (const p of PENS) {
  const r = probe.pens[p].px;
  console.log('  ' + String(p).padEnd(7) + [12, 15, 17, 22].map(px =>
    (r[px].stemAlpha.toFixed(2) + (r[px].counterOpen ? ' o' : ' X')).padStart(14)).join(''));
}
console.log('  ' + 'sys'.padEnd(7) + [12, 15, 17, 22].map(px =>
  (probe.sys[px].stemAlpha.toFixed(2) + (probe.sys[px].counterOpen ? ' o' : ' X')).padStart(14)).join('')
  + '   <- DejaVu Sans, the reference');
console.log('  o = the counter of "a" is still an open hole, X = the pen filled it in');

console.log('\nsh ligature fires: ' + MODES.map(m => m + ' ' + probe.ligFired[m]).join(', '));
console.log('input stays ascii: ' + probe.inputAscii + '  ' + JSON.stringify(probe.inputValue));
console.log('console errors: ' + (errs.length ? errs.join(' | ') : 'none'));

fs.writeFileSync(HERE + 'shot5.json', JSON.stringify({ probe, errs }, null, 1));
const st = fs.statSync(HERE + 'proof5.png');
console.log('proof5.png ' + (st.size / 1024).toFixed(0) + ' KB');
await br.close();
srv.close();
