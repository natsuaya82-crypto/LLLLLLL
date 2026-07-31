// Render index4.html and assert the v4 spacing build is actually intact in a
// browser, not just in my own geometry code.
//
// The probe deliberately re-derives the two claims that matter from rendered
// text metrics rather than from the manifest:
//
//   gap evenness  — sum alpha per pixel column of a de Bruijn string, blur by one
//                   stem, and read the trough at each letter join. cv of those
//                   troughs is the squint test, mechanised. v3 and v4 are measured
//                   by the same code in the same page, so the comparison cannot be
//                   an artefact of two different harnesses.
//   no protrusion — v3's bug was an hmtx lsb that the outline never honoured, so
//                   ink sat outside its own advance. Measured here as: does the
//                   width of 'ii' equal twice the width of 'i'? It does in both
//                   (advances are additive by definition) — so instead check the
//                   thing that broke: per-letter left ink offset inside its own
//                   advance box, read off the canvas.
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

const html = fs.readFileSync(HERE + 'index4.html');
const srv = http.createServer((rq, rs) => {
  if (rq.url !== '/') { rs.writeHead(204); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(html);
}).listen(8189);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
await pg.goto('http://127.0.0.1:8189/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);

await pg.screenshot({ path: HERE + 'proof4.png', fullPage: true });

const STYLES = ['light', 'regular', 'bold', 'broadnib'];
// B(6,2) over the six single-glyph letters, unrolled by one: every ordered pair
// exactly once, 36 joins. 'h' is left out because s+h ligates and would destroy
// the join count.
const STR = 'aaiakalasatiikilisitkklksktllsltsstta';

const probe = await pg.evaluate(async (args) => {
  const { STYLES, STR } = args;
  const fams = [];
  STYLES.forEach(s => { fams.push('V3-' + s); fams.push('V4-' + s); });
  // A face never used by a DOM node is lazily not loaded in Chromium; measureText
  // would then silently fall back to the UI font and every number below would be
  // a measurement of Helvetica.
  await Promise.all(fams.map(f => document.fonts.load('100px "' + f + '"')));

  const SIZE = 100, PAD = 200, SIGMA = 0.07 * SIZE;
  function blur(a, s) {
    const r = Math.ceil(s * 3), k = [];
    let sum = 0;
    for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * s * s)); k.push(v); sum += v; }
    const out = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      let acc = 0;
      for (let j = -r; j <= r; j++) {
        const x = i + j;
        if (x >= 0 && x < a.length) acc += a[x] * k[j + r];
      }
      out[i] = acc / sum;
    }
    return out;
  }
  const cv = v => {
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return m === 0 ? 0 : Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / v.length) / m;
  };

  const cnv = document.createElement('canvas');
  cnv.width = 6000; cnv.height = 400;
  const cx = cnv.getContext('2d');
  const measure = fam => {
    cx.font = SIZE + 'px "' + fam + '"';
    const w = cx.measureText(STR).width;
    cnv.width = Math.ceil(w) + 2 * PAD;
    cx.font = SIZE + 'px "' + fam + '"';
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000';
    cx.fillText(STR, PAD, 300);
    const px = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    const col = new Float64Array(cnv.width);
    for (let x = 0; x < cnv.width; x++) {
      let a = 0;
      for (let y = 0; y < cnv.height; y++) a += px[(y * cnv.width + x) * 4 + 3];
      col[x] = a;
    }
    const prof = blur(col, SIGMA);
    // Locate each join from the cumulative advance of the prefix — that is
    // shaping information, not spacing information, so reading the trough there
    // is not circular.
    const troughs = [];
    const half = 0.42 * (w / STR.length);
    for (let i = 1; i < STR.length; i++) {
      const at = PAD + cx.measureText(STR.slice(0, i)).width;
      let lo = Math.max(0, Math.round(at - half)), hi = Math.min(cnv.width - 1, Math.round(at + half));
      let mn = Infinity;
      for (let x = lo; x <= hi; x++) if (prof[x] < mn) mn = prof[x];
      troughs.push(mn);
    }
    const mean = troughs.reduce((a, b) => a + b, 0) / troughs.length;
    return {
      width: Math.round(w),
      joinCv: +(cv(troughs) * 100).toFixed(1),
      joinMin: Math.round(Math.min(...troughs)),
      joinMean: Math.round(mean),
      touching: troughs.filter(t => t > 0.62 * 255 * 100).length,  // ink bridging the gap
    };
  };

  const rows = {};
  STYLES.forEach(s => { rows[s] = { v3: measure('V3-' + s), v4: measure('V4-' + s) }; });

  // The bug v3 shipped: ink that sits outside its own advance. Draw one letter at
  // a known origin and find the leftmost/rightmost inked column relative to it.
  const inkBox = (fam, ch) => {
    cx.font = SIZE + 'px "' + fam + '"';
    const adv = cx.measureText(ch).width;
    cnv.width = Math.ceil(adv) + 2 * PAD;
    cx.font = SIZE + 'px "' + fam + '"';
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000';
    cx.fillText(ch, PAD, 300);
    const px = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    let lo = -1, hi = -1;
    for (let x = 0; x < cnv.width; x++) {
      let a = 0;
      for (let y = 0; y < cnv.height; y++) a += px[(y * cnv.width + x) * 4 + 3];
      if (a > 0) { if (lo < 0) lo = x; hi = x; }
    }
    return { adv: +adv.toFixed(1), lsb: +(lo - PAD).toFixed(1), rsb: +(PAD + adv - hi - 1).toFixed(1) };
  };
  const boxes = { v3: {}, v4: {} };
  'aiklst'.split('').forEach(ch => {
    boxes.v3[ch] = inkBox('V3-regular', ch);
    boxes.v4[ch] = inkBox('V4-regular', ch);
  });

  const m = (f, s) => { cx.font = '100px "' + f + '"'; return Math.round(cx.measureText(s).width); };
  return {
    loaded: [...document.fonts].map(f => f.family + ':' + f.status).filter(s => /:unloaded/.test(s)),
    faces: [...document.fonts].length,
    rows: rows,
    boxes: boxes,
    spaceV3: m('V3-regular', 'a b') - 2 * m('V3-regular', 'a'),
    spaceV4: m('V4-regular', 'a b') - 2 * m('V4-regular', 'a'),
    ligFired: m('V4-regular', 'sh') < m('V4-regular', 's') + m('V4-regular', 'h'),
    weightAxis: [m('V4-light', 'kalisht'), m('V4-regular', 'kalisht'), m('V4-bold', 'kalisht')],
    inputAscii: /^[\x20-\x7e]+$/.test(document.querySelector('input').value),
    inputValue: document.querySelector('input').value,
  };
}, { STYLES, STR });

const pad = (s, n) => String(s).padStart(n);
console.log('faces in document.fonts: ' + probe.faces
  + (probe.loaded.length ? '   STILL UNLOADED: ' + probe.loaded.join(', ') : '   all loaded'));
console.log('\nrendered-in-browser gap evenness (de Bruijn, 36 joins, blur = 1 stem):');
console.log('  pen         v3 cv    v4 cv     v3 min   v4 min    touching v3/v4');
for (const s of STYLES) {
  const r = probe.rows[s];
  console.log('  ' + s.padEnd(11)
    + pad(r.v3.joinCv + '%', 6) + pad(r.v4.joinCv + '%', 9)
    + pad(r.v3.joinMin, 11) + pad(r.v4.joinMin, 9)
    + pad(r.v3.touching + ' / ' + r.v4.touching, 18));
}
console.log('\nink inside its own advance (regular pen, em 1000 -> px 100):');
console.log('  glyph    v3 adv/lsb/rsb            v4 adv/lsb/rsb');
for (const ch of 'aiklst') {
  const a = probe.boxes.v3[ch], b = probe.boxes.v4[ch];
  console.log('  ' + ch + '        '
    + (a.adv + ' / ' + a.lsb + ' / ' + a.rsb).padEnd(26)
    + (b.adv + ' / ' + b.lsb + ' / ' + b.rsb));
}
console.log('\nspace advance px:  v3 ' + probe.spaceV3 + '   v4 ' + probe.spaceV4
  + '   (v3 emitted no space glyph; 300 em placeholder here. v4: 2*GAP + pen)');
console.log('sh ligature fires: ' + probe.ligFired);
console.log('weight axis kalisht px: ' + probe.weightAxis.join(' / '));
console.log('input stays ascii: ' + probe.inputAscii + '  ' + JSON.stringify(probe.inputValue));
console.log('console errors: ' + (errs.length ? errs.join(' | ') : 'none'));

fs.writeFileSync(HERE + 'shot4.json', JSON.stringify({ probe, errs }, null, 1));
const st = fs.statSync(HERE + 'proof4.png');
console.log('proof4.png ' + (st.size / 1024).toFixed(0) + ' KB');
await br.close();
srv.close();
