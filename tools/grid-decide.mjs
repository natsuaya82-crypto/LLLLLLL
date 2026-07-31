// The one open question: how many dots.
//
// Settled and therefore stated once in words, never drawn twice: the square cell,
// the fixed pen of 60, and the fact that a point now lands on a lattice instead of
// wherever the finger stopped. The only thing compared is the density of that
// lattice, because that is the only thing still to choose.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;
const LF = require(HERE + '../www/otf5.js');

const PEN = { width: 60, angleDeg: 0, contrast: 1.0 };
const CELL = 800, INSET = 40;

// the same skeletons the spike has always used, so the comparison is about the
// lattice and nothing else
const GLYPHS = {
  a: [{ closed: true, pts: [[300,250,'c'],[520,470,'c'],[300,690,'c'],[80,470,'c']] }],
  i: [{ pts: [[190,330],[190,700]] }, { pts: [[190,160]] }],
  k: [{ pts: [[170,110],[170,760]] }, { pts: [[500,300],[170,470],[470,700]] }],
  l: [{ pts: [[150,140],[150,660,'c'],[430,660,'c'],[430,420]] }],
  s: [{ pts: [[470,280,'c'],[170,280,'c'],[170,470,'c'],[430,470,'c'],[430,700,'c'],[130,700]] }],
  t: [{ pts: [[300,110],[300,700,'c'],[520,600]] }, { pts: [[130,330],[470,330]] }],
};

const step = n => (CELL - INSET * 2) / (n - 1);
const snap1 = (v, n) => {
  const s = step(n);
  let i = Math.round((v - INSET) / s);
  if (i < 0) i = 0; if (i > n - 1) i = n - 1;
  return Math.round(INSET + i * s);
};
const snapGlyph = (strokes, n) => strokes.map(st => ({
  closed: st.closed,
  pts: st.pts.map(p => p.length > 2 ? [snap1(p[0], n), snap1(p[1], n), p[2]]
                                    : [snap1(p[0], n), snap1(p[1], n)]),
}));

// centred in the cell, exactly as the app places a letter
const svgFor = (strokes, size) => {
  const cs = LF.glyphContours({ strokes }, PEN);
  let xMin = Infinity, xMax = -Infinity;
  cs.forEach(c => c.forEach(p => { if (p[0] < xMin) xMin = p[0]; if (p[0] > xMax) xMax = p[0]; }));
  const dx = isFinite(xMin) ? Math.round((CELL - (xMax - xMin)) / 2 - xMin) : 0;
  const d = cs.filter(c => c.length > 2)
    .map(c => 'M' + c.map(p => (p[0] + dx).toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z')
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${CELL} ${CELL}"><path d="${d}" fill="#efe7d8"/></svg>`;
};

const wordSvg = (word, n, size) => word.split('').map(ch =>
  `<span style="display:inline-block">${svgFor(snapGlyph(GLYPHS[ch], n), size)}</span>`).join('');

// the editor square: the dots, and one letter's points sitting on them
const editorSvg = (n, size) => {
  const s = step(n);
  let dots = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    dots += `<circle cx="${INSET + i * s}" cy="${INSET + j * s}" r="11" fill="#4a4034"/>`;
  const st = snapGlyph(GLYPHS.k, n);
  const cs = LF.glyphContours({ strokes: st }, PEN);
  const ink = cs.filter(c => c.length > 2)
    .map(c => 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z').join('');
  let hit = '';
  st.forEach(k => k.pts.forEach(p => { hit += `<circle cx="${p[0]}" cy="${p[1]}" r="26" fill="#e8c979"/>`; }));
  return `<svg width="${size}" height="${size}" viewBox="-20 -20 ${CELL + 40} ${CELL + 40}">
    <rect x="10" y="10" width="${CELL - 20}" height="${CELL - 20}" fill="none" stroke="#5c4d33" stroke-width="5"/>
    ${dots}<path d="${ink}" fill="#efe7d8" opacity=".92"/>${hit}</svg>`;
};

const row = (n, tag) => `
<div class="opt">
  <div class="tag">${tag}<i>${n}×${n} = ${n * n}点<br>間隔 ${Math.round(step(n))}</i></div>
  <div class="ed">${editorSvg(n, 300)}</div>
  <div class="wd"><div class="w1">${wordSvg('salt', n, 132)}</div>
    <div class="w2">${wordSvg('kistal', n, 74)}</div></div>
</div>`;

const page = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1500px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans","Noto Sans JP",sans-serif;padding:46px}
.done{font-size:26px;line-height:1.75;color:#c9bda6;margin-bottom:38px}
.done b{color:#e8c979;font-weight:600}
.q{font-size:31px;color:#e8c979;font-weight:600;margin-bottom:6px}
.qs{font-size:21px;color:#8d8375;margin-bottom:8px}
.opt{display:flex;align-items:center;gap:44px;padding:34px 0;border-top:1px solid #2a241c}
.tag{width:210px;font-size:26px;color:#c9bda6}
.tag i{display:block;font-style:normal;font-size:19px;color:#7d7466;margin-top:8px;line-height:1.6}
.wd{display:flex;flex-direction:column;gap:18px;align-items:flex-start}
.w1,.w2{display:flex;align-items:flex-end}
.w2{opacity:.72}
</style><body>
<div class="done">
決まったこと: <b>正方形セル</b>・<b>ペン太さ60固定</b>・<b>点は格子にしか置けない</b>（指を離した場所ではなく、必ず一番近い点に吸い付く）。
だから同じ高さの横棒は全部きっちり同じ高さに揃います。左が編集画面、右がその格子で描いた字。
</div>
<div class="q">決めたいこと</div>
<div class="qs">格子の細かさ。細かいほど描けるが、細かいほど指で狙いにくくなります。</div>
${row(5, 'A')}
${row(7, 'B')}
</body>`;

const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(page);
}).listen(8198);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8198/', { waitUntil: 'load' });
await pg.waitForTimeout(200);
await pg.screenshot({ path: HERE + 'grid-decide.png', fullPage: true });
await br.close();
srv.close();
console.log('tools/grid-decide.png written');
