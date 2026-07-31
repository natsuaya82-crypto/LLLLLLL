// The real question behind "10x10 だと多いかな": how many dots does a dense
// character need before it stops being drawable at all?
//
// The counter-count ruler used earlier is wrong for 鬱: Noto Sans CJK JP's own 鬱
// scores 0 enclosed counters, because 缶 and 鬯 are open shapes (田 scores 4, 目 3,
// あ 2 -- the ruler is fine, the character just has no closed counters). What the
// ruler actually measures for 鬱 is the opposite of legibility: as the glyph blots,
// its open shapes weld shut and start trapping pockets, so the count goes UP.
//
// So the ruler here is ink density against a real font at the same size. A drawn
// glyph that is much darker than Noto's at body size is a blot; one that matches it
// is as legible as 27 strokes at 14px ever get for anybody.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;
const LF = require(HERE + '../www/otf5.js');

const CELL = 800, INSET = 40;
const stepOf = n => (CELL - INSET * 2) / (n - 1);
// The pen is half the lattice step. That is not a new decision: the pen already in
// the app is 60 and the 7x7 step is 120, so 60 already WAS half a step. Carrying the
// same ratio to 10x10 gives 40.
const penOf = n => Math.round(stepOf(n) / 2);

// Authored once on a 0..9 index grid; index i is placed on whatever lattice is asked
// for, so the two densities draw the same intended letter and nothing else differs.
const at = (n, i) => Math.round(INSET + Math.round(i * (n - 1) / 9) * stepOf(n));
const mk = n => {
  const P = (i, j, c) => c ? [at(n, i), at(n, j), 'c'] : [at(n, i), at(n, j)];
  const s = (...pts) => ({ pts });
  return {
    'あ': [ s(P(1,2), P(8,2)),
            s(P(5,0), P(4,4,'c'), P(3,9)),
            s(P(8,3), P(4,3,'c'), P(2,5,'c'), P(3,8,'c'), P(6,8,'c'), P(7,6,'c'), P(5,4,'c'), P(3,6)) ],
    'い': [ s(P(2,2), P(2,6,'c'), P(4,8)), s(P(7,2), P(7,6)) ],
    'う': [ s(P(3,1), P(6,1)), s(P(2,3), P(6,3,'c'), P(7,5,'c'), P(5,8,'c'), P(2,8)) ],
    'え': [ s(P(4,1), P(6,1)), s(P(2,3), P(6,3,'c'), P(2,6,'c'), P(4,7,'c'), P(2,9,'c'), P(5,9,'c'), P(7,7)) ],
    'お': [ s(P(0,2), P(6,2)), s(P(4,0), P(4,6,'c'), P(2,8,'c'), P(1,6)),
            s(P(6,3), P(7,5,'c'), P(6,7,'c'), P(8,8)), s(P(8,1), P(9,2)) ],
    // 鬱 = ⿳ ⿲木缶木 / 冖 / ⿰鬯彡 -- 27 strokes
    '鬱': [ s(P(1,0), P(1,3)), s(P(0,1), P(2,1)), s(P(1,1), P(0,3)), s(P(1,1), P(2,3)),
            s(P(5,0), P(4,1)), s(P(3,1), P(6,1)), s(P(5,1), P(5,3)),
            s(P(4,2), P(6,2)), s(P(4,2), P(4,3)), s(P(6,2), P(6,3)), s(P(4,3), P(6,3)),
            s(P(8,0), P(8,3)), s(P(7,1), P(9,1)), s(P(8,1), P(7,3)), s(P(8,1), P(9,3)),
            s(P(0,4), P(9,4,'c'), P(9,5)),
            s(P(1,6), P(1,9), P(4,9), P(4,6)), s(P(1,7), P(4,7)),
            s(P(2,6), P(3,8)), s(P(3,6), P(2,8)), s(P(2,9), P(3,9)),
            s(P(8,5), P(6,6)), s(P(9,6), P(7,7)), s(P(9,7), P(7,8)) ],
  };
};

const KANA = ['あ', 'い', 'う', 'え', 'お'];
const DENS = [7, 10];

const pathFor = (n, name) =>
  LF.glyphContours({ strokes: mk(n)[name] }, { width: penOf(n), angleDeg: 0, contrast: 1.0 })
    .filter(c => c.length > 2)
    .map(c => 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z')
    .join('');

const dots = n => {
  const st = stepOf(n); let d = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    d += `<circle cx="${INSET + i * st}" cy="${INSET + j * st}" r="${n === 7 ? 10 : 8}" fill="#463c30"/>`;
  return d;
};
const svg = (n, name, size, withDots) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${CELL} ${CELL}">${withDots ? dots(n) : ''}
   <path d="${pathFor(n, name)}" fill="#efe7d8"/></svg>`;

const PATHS = {};
DENS.forEach(n => [...KANA, '鬱'].forEach(g => { PATHS[n + '/' + g] = pathFor(n, g); }));

const col = n => `
<div class="c">
  <div class="h">${n}×${n}<i>${n * n}点・間隔 ${Math.round(stepOf(n))}／ペン ${penOf(n)}</i></div>
  ${svg(n, '鬱', 330, true)}
  <div class="kana">${KANA.map(g => svg(n, g, 96)).join('')}</div>
  <div class="tiny">${[...KANA, '鬱'].map(g => svg(n, g, 13.6)).join('')}
    <span class="sp"></span>${[...KANA, '鬱'].map(g => svg(n, g, 38)).join('')}</div>
  <div class="hn" id="d${n}">…</div>
</div>`;

const page = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1420px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Noto Sans CJK JP",sans-serif;padding:46px}
.done{font-size:25px;line-height:1.8;color:#c9bda6;margin-bottom:36px}
.done b{color:#e8c979;font-weight:600}
.q{font-size:30px;color:#e8c979;font-weight:600;margin-bottom:6px}
.qs{font-size:20px;color:#8d8375;margin-bottom:28px}
.row{display:flex;gap:60px;align-items:flex-start}
.c{text-align:center}
.h{font-size:26px;color:#c9bda6;margin-bottom:14px}
.h i{display:block;font-style:normal;font-size:18px;color:#7d7466;margin-top:6px}
.kana{display:flex;gap:2px;justify-content:center;margin-top:14px}
.tiny{display:flex;gap:0;align-items:flex-end;justify-content:center;height:44px;margin-top:18px}
.tiny .sp{display:inline-block;width:26px}
.hn{font-size:19px;color:#8d8375;margin-top:14px;line-height:1.6}
.hn b{color:#e8c979}
.base{padding-left:58px;border-left:1px solid #2a241c}
.nt{font-size:330px;line-height:1;font-family:"Noto Sans CJK JP";display:block}
.nk{font-family:"Noto Sans CJK JP";font-size:96px;line-height:1;margin-top:14px;display:block}
.ntiny{margin-top:18px;height:44px;display:flex;align-items:flex-end;justify-content:center;gap:26px}
.ntiny span{font-family:"Noto Sans CJK JP";line-height:1}
</style><body>
<div class="done">
10×10 で <b>あいうえお も 鬱（27画）も描けました</b>。曲線もループもそのまま置けます。
ペンは<b>格子の間隔の半分</b>にしました — いま入っているペン60は7×7の間隔120のちょうど半分なので、
これは新しい決定ではなく同じ比率を持っていっただけです（10×10なら40）。
</div>
<div class="q">決めたいこと</div>
<div class="qs">格子の細かさ。右端は比較用の実在フォント Noto Sans CJK JP。</div>
<div class="row">
  ${DENS.map(col).join('')}
  <div class="c base">
    <div class="h">実在フォント<i>比較のものさし</i></div>
    <span class="nt">鬱</span>
    <span class="nk">あいうえお</span>
    <div class="ntiny"><span style="font-size:13.6px">あいうえお鬱</span><span style="font-size:38px">あいうえお鬱</span></div>
    <div class="hn" id="dn">…</div>
  </div>
</div>
<canvas id="cv" width="512" height="512" style="display:none"></canvas>
<script>
var PATHS = ${JSON.stringify(PATHS)};
function inkOf(draw, px){
  var c=document.getElementById('cv'), x=c.getContext('2d');
  c.width=px; c.height=px; x.clearRect(0,0,px,px);
  draw(x, px);
  var d=x.getImageData(0,0,px,px).data, n=0, i;
  for(i=0;i<px*px;i++) if(d[i*4+3]>110) n++;
  return n/(px*px);
}
function ours(key){ return function(x, px){
  x.save(); x.scale(px/800, px/800);
  var p=new Path2D(PATHS[key]); x.fillStyle='#fff'; x.fill(p); x.restore(); }; }
function noto(t){ return function(x, px){ x.fillStyle='#fff';
  x.font=Math.round(px*0.92)+'px "Noto Sans CJK JP"'; x.textBaseline='alphabetic';
  x.fillText(t, px*0.04, px*0.92); }; }
var lines=[];
[7,10].forEach(function(n){
  var u=inkOf(ours(n+'/鬱'),14), k=['あ','い','う','え','お'].map(function(g){
    return inkOf(ours(n+'/'+g),14); });
  var ka=Math.round(k.reduce(function(a,b){return a+b},0)/5*100);
  document.getElementById('d'+n).innerHTML =
    '本文サイズの墨の量<br>鬱 <b>'+Math.round(u*100)+'%</b>　かな平均 <b>'+ka+'%</b>';
  lines.push(n+'x'+n+' pen'+(n===7?60:40)+' — 鬱 '+Math.round(u*100)+'%  かな平均 '+ka+'%');
});
var nu=inkOf(noto('鬱'),14), nk=['あ','い','う','え','お'].map(function(g){
  return inkOf(noto(g),14); });
var nka=Math.round(nk.reduce(function(a,b){return a+b},0)/5*100);
document.getElementById('dn').innerHTML =
  '本文サイズの墨の量<br>鬱 <b>'+Math.round(nu*100)+'%</b>　かな平均 <b>'+nka+'%</b>';
lines.push('Noto — 鬱 '+Math.round(nu*100)+'%  かな平均 '+nka+'%');
window.__report = lines.join('\\n');
</script>
</body>`;

const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(page);
}).listen(8206);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1420, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8206/', { waitUntil: 'load' });
await pg.waitForTimeout(600);
console.log(await pg.evaluate(() => window.__report));
await pg.screenshot({ path: HERE + 'grid-final.png', fullPage: true });
await br.close();
srv.close();
console.log('\ntools/grid-final.png written');
