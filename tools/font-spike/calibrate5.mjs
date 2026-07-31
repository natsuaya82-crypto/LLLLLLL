// Calibrate the yardstick before trusting it again.
//
// v4 reported "gap evenness cv 16.9%, down from 41.3%". Neither number means
// anything until the same instrument is pointed at fonts that nobody complains
// about. So: run the identical de Bruijn / blur / trough measurement on real
// shipping faces and read the scale off them.
//
// It also settles the actual design question. The user's point is that if you
// author each letter inside a SQUARE, worrying about the gaps between letters is
// a category error — and that is exactly how kana and hangul work on a phone. If
// that is right, then a real kana face should score BADLY on gap evenness and
// nobody minds, because a square-cell script equalises something else entirely:
// the PITCH. So both are measured here.
//
//   joinCv   spread of the trough depth at each letter join  (gap evenness)
//   pitchCv  spread of the per-letter advance widths          (pitch evenness)
//
// A proportional Latin face should score low on the first and high on the second.
// A square-cell face should be the exact opposite. If it is, the two families are
// not competing designs with one winner — they are two different rhythms, and
// which one Lingua wants is a decision, not a measurement.
import { createRequire } from 'module';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

// B(6,2) unrolled by one: every ordered pair of the six letters exactly once.
function deBruijn(set) {
  const k = set.length, a = new Array(2 * k).fill(0), seq = [];
  (function db(t, p) {
    if (t > 2) { for (let i = 1; i <= p; i++) seq.push(a[i]); return; }
    a[t] = a[t - p]; db(t + 1, p);
    for (let j = a[t - p] + 1; j < k; j++) { a[t] = j; db(t + 1, t); }
  })(1, 1);
  const s = seq.map(i => set[i]);
  return s.concat([s[0]]).join('');
}

const CASES = [
  // proportional Latin, drawn by people who do this for a living
  { label: 'DejaVu Sans',        family: 'DejaVu Sans',        set: ['a','i','k','l','s','t'] },
  { label: 'Carlito',            family: 'Carlito',            set: ['a','i','k','l','s','t'] },
  { label: 'FreeSerif',          family: 'FreeSerif',          set: ['a','i','k','l','s','t'] },
  // Latin monospace: pitch is perfect by construction, gaps are not
  { label: 'DejaVu Sans Mono',   family: 'DejaVu Sans Mono',   set: ['a','i','k','l','s','t'] },
  // square-cell scripts, which is what the user is proposing
  { label: 'Noto Sans JP kana',  family: 'Noto Sans CJK JP',   set: ['あ','い','う','か','し','ち'] },
  { label: 'IPAGothic kana',     family: 'IPAGothic',          set: ['あ','い','う','か','し','ち'] },
  { label: 'Noto Sans JP kanji', family: 'Noto Sans CJK JP',   set: ['日','本','語','川','三','国'] },
  { label: 'Noto Sans KR hangul',family: 'Noto Sans CJK KR',   set: ['가','나','다','리','스','한'] },
  // and Lingua's own two candidates at the pen the user chose
  { label: 'LS4 area pen60',     family: 'LS4-light',          set: ['a','i','k','l','s','t'],
    url: 'LS4-light.otf' },
];

const files = {};
for (const c of CASES) if (c.url) files[c.url] = fs.readFileSync(new URL(c.url, import.meta.url));

const http = await import('http');
const srv = http.createServer((rq, rs) => {
  const name = decodeURIComponent(rq.url.slice(1));
  if (files[name]) { rs.writeHead(200, { 'Content-Type': 'font/otf' }); rs.end(files[name]); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html' });
  rs.end('<!doctype html><meta charset=utf-8><link rel=icon href="data:,">');
}).listen(8190);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 600, height: 400 } });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://127.0.0.1:8190/', { waitUntil: 'load' });

const jobs = CASES.map(c => ({ ...c, str: deBruijn(c.set) }));
const out = await pg.evaluate(async (jobs) => {
  const SIZE = 100, PAD = 240, SIGMA = 0.07 * SIZE;   // same numbers as measure4.mjs
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
  cnv.height = 260;
  const cx = cnv.getContext('2d');
  const res = [];
  for (const job of jobs) {
    if (job.url) {
      const ff = new FontFace(job.family, 'url(/' + job.url + ')');
      await ff.load(); document.fonts.add(ff);
    }
    const font = SIZE + 'px "' + job.family + '"';
    await document.fonts.load(font, job.str);
    cx.font = font;
    const w = cx.measureText(job.str).width;
    cnv.width = Math.ceil(w) + 2 * PAD;
    cx.font = font;
    cx.clearRect(0, 0, cnv.width, cnv.height);
    cx.fillStyle = '#000';
    cx.fillText(job.str, PAD, 180);
    const px = cx.getImageData(0, 0, cnv.width, cnv.height).data;
    const col = new Float64Array(cnv.width);
    for (let x = 0; x < cnv.width; x++) {
      let a = 0;
      for (let y = 0; y < cnv.height; y++) a += px[(y * cnv.width + x) * 4 + 3];
      col[x] = a;
    }
    const prof = blur(col, SIGMA);
    const half = 0.42 * (w / job.str.length);
    const troughs = [];
    for (let i = 1; i < job.str.length; i++) {
      const at = PAD + cx.measureText(job.str.slice(0, i)).width;
      const lo = Math.max(0, Math.round(at - half)), hi = Math.min(cnv.width - 1, Math.round(at + half));
      let mn = Infinity;
      for (let x = lo; x <= hi; x++) if (prof[x] < mn) mn = prof[x];
      troughs.push(mn);
    }
    const advs = job.set.map(ch => cx.measureText(ch).width);
    // did the face actually load, or is this a fallback measurement?
    cx.font = SIZE + 'px "' + job.family + '", monospace';
    res.push({
      label: job.label,
      str: job.str,
      joinCv: +(cv(troughs) * 100).toFixed(1),
      pitchCv: +(cv(advs) * 100).toFixed(1),
      advs: advs.map(a => +a.toFixed(1)),
      width: Math.round(w),
      loaded: document.fonts.check(SIZE + 'px "' + job.family + '"', job.str),
    });
  }
  return res;
}, jobs);

const pad = (s, n) => String(s).padStart(n);
console.log('same instrument as measure4.mjs, em 100px, blur 0.07em, every ordered pair once\n');
console.log('  font                      gap cv    pitch cv   loaded');
for (const r of out) {
  console.log('  ' + r.label.padEnd(24) + pad(r.joinCv + '%', 7) + pad(r.pitchCv + '%', 12)
    + pad(r.loaded ? 'yes' : 'NO - FALLBACK', 16));
}
console.log('\nconsole errors: ' + (errs.length ? errs.join(' | ') : 'none'));
fs.writeFileSync(new URL('calibrate5.json', import.meta.url).pathname,
  JSON.stringify(out, null, 1));
await br.close();
srv.close();
