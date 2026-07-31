// The lattice is settled by measurement (tools/lattice-truth.mjs): 11x11 has a
// centre dot, which an even count cannot have, and keeps more of the letter than
// 10x10 does. What is NOT settled is the pen.
//
// "Pen = half the lattice step" was carried over from 7x7, where the pen was 60 and
// the step 120. But half a step is only the width at which two strokes on ADJACENT
// dots still leave white between them, and that case only arises in a glyph as dense
// as 鬱. The price of obeying it everywhere is weight: measured at body size against
// Noto Sans CJK JP, pen 36 is a third lighter than a real font and pen 60 matches it.
//
// Skeletons come from tools/skeletons.json, written by lattice-truth.mjs, so the
// letters here are still not mine.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;
const LF = require(HERE + '../www/otf5.js');

const CELL = 800, INSET = 40, N = 11;
const STEP = (CELL - INSET * 2) / (N - 1);          // 72
const PENS = [36, 60];
const GLYPHS = ['あ', 'い', 'う', 'え', 'お', '鬱'];
const POLY = JSON.parse(fs.readFileSync(HERE + 'skeletons.json', 'utf8'));

const snap1 = v => {
  let i = Math.round((v - INSET) / STEP);
  if (i < 0) i = 0; if (i > N - 1) i = N - 1;
  return Math.round(INSET + i * STEP);
};
const strokesFor = g => POLY[g].map(p => {
  const out = [];
  p.forEach(q => {
    const s = [snap1(q[0]), snap1(q[1])];
    const l = out[out.length - 1];
    if (!l || l[0] !== s[0] || l[1] !== s[1]) out.push(s);
  });
  // interior vertices are curve points, so the pen rounds off the corners the snap made
  return { pts: out.map((s, i) => (i === 0 || i === out.length - 1) ? s : [s[0], s[1], 'c']) };
}).filter(s => s.pts.length > 1);

const pathOf = (g, pen) => LF.glyphContours({ strokes: strokesFor(g) },
  { width: pen, angleDeg: 0, contrast: 1.0 })
  .filter(c => c.length > 2)
  .map(c => 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z')
  .join('');

const PATHS = {};
GLYPHS.forEach(g => PENS.forEach(w => { PATHS[w + '/' + g] = pathOf(g, w); }));

let DOTS = '';
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
  DOTS += `<circle cx="${INSET + i * STEP}" cy="${INSET + j * STEP}" r="7" fill="#463c30"/>`;

const cell = (key, size, dots) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${CELL} ${CELL}">${dots ? DOTS : ''}
   <path d="${PATHS[key]}" fill="#efe7d8"/></svg>`;
const tiny = w => GLYPHS.map(g => cell(w + '/' + g, 15)).join('')
  + '<span class="sp"></span>' + GLYPHS.map(g => cell(w + '/' + g, 40)).join('');

const page = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1560px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Noto Sans CJK JP",sans-serif;padding:44px}
.done{font-size:24px;line-height:1.8;color:#c9bda6;margin-bottom:28px}
.done b{color:#e8c979;font-weight:600}
.q{font-size:29px;color:#e8c979;font-weight:600;margin-bottom:6px}
.qs{font-size:20px;color:#8d8375;margin-bottom:18px;line-height:1.6}
table{border-collapse:collapse;width:100%}
th{width:250px;text-align:left;font-size:24px;color:#c9bda6;font-weight:500;
   padding:14px 20px 14px 0;vertical-align:middle}
th i{display:block;font-style:normal;font-size:17px;color:#7d7466;margin-top:6px;line-height:1.55}
td{text-align:center;padding:8px 0;border-top:1px solid #221d17}
td.b{text-align:left;padding-left:26px}
.sp{display:inline-block;width:28px}
.nt{font-family:"Noto Sans CJK JP";font-size:150px;line-height:1.05;display:block}
.nb{font-family:"Noto Sans CJK JP";line-height:1}
.m{font-size:20px;color:#8d8375;margin-top:10px}
.m b{color:#e8c979;font-size:23px}
</style><body>
<div class="done">
決まったこと: 格子は <b>11×11</b>。真ん中に点があり（偶数だと真ん中に点が来ません）、形の保持も 10×10 より上でした（50% 対 46%）。
字は僕が描いていません — 実在フォントを細らせて骨にし、その骨を格子に吸い付かせて描き直しています。
</div>
<div class="q">決めたいこと</div>
<div class="qs">ペンの太さ。右は本文サイズ（14px と 40px）。数字は14pxでの墨の量で、実在フォントと同じなら同じ濃さで読めます。</div>
<table>
<tr><th>ペン 36<i>格子の間隔72の半分<br>隣り合う線がくっつかない</i></th>
  <td>${GLYPHS.map(g => cell('36/' + g, 150, true)).join('')}</td>
  <td class="b">${tiny(36)}<div class="m" id="m36">…</div></td></tr>
<tr><th>ペン 60<i>いま入っている太さ<br>隣り合う線はくっつく</i></th>
  <td>${GLYPHS.map(g => cell('60/' + g, 150, true)).join('')}</td>
  <td class="b">${tiny(60)}<div class="m" id="m60">…</div></td></tr>
<tr><th>実在フォント<i>比較のものさし<br>Noto Sans CJK JP</i></th>
  <td>${GLYPHS.map(g => `<span class="nt" style="display:inline-block;width:150px">${g}</span>`).join('')}</td>
  <td class="b"><span class="nb" style="font-size:15px">あいうえお鬱</span><span class="sp"></span><span class="nb" style="font-size:40px">あいうえお鬱</span>
    <div class="m" id="mn">…</div></td></tr>
</table>
<script>
var PATHS = ${JSON.stringify(PATHS)}, KANA = ['あ','い','う','え','お'];
function inkOf(draw, px){
  var c=document.createElement('canvas'); c.width=px; c.height=px;
  var x=c.getContext('2d'); draw(x, px);
  var d=x.getImageData(0,0,px,px).data, n=0, i;
  for(i=0;i<px*px;i++) if(d[i*4+3]>110) n++;
  return n/(px*px);
}
function ours(key){ return function(x, px){ x.save(); x.scale(px/800, px/800);
  x.fillStyle='#fff'; x.fill(new Path2D(PATHS[key])); x.restore(); }; }
function noto(t){ return function(x, px){ x.fillStyle='#fff';
  x.font=Math.round(px*0.92)+'px "Noto Sans CJK JP"'; x.textBaseline='alphabetic';
  x.fillText(t, px*0.04, px*0.92); }; }
function say(id, kana, u){
  document.getElementById(id).innerHTML =
    '14px の墨　かな <b>'+kana+'%</b>　鬱 <b>'+u+'%</b>';
}
var rep=[];
[36,60].forEach(function(w){
  var k=KANA.map(function(g){ return inkOf(ours(w+'/'+g),14); });
  var ka=Math.round(k.reduce(function(a,b){return a+b},0)/5*100);
  var u=Math.round(inkOf(ours(w+'/鬱'),14)*100);
  say('m'+w, ka, u); rep.push('pen '+w+' — kana '+ka+'%  鬱 '+u+'%');
});
var nk=KANA.map(function(g){ return inkOf(noto(g),14); });
var nka=Math.round(nk.reduce(function(a,b){return a+b},0)/5*100);
var nu=Math.round(inkOf(noto('鬱'),14)*100);
say('mn', nka, nu); rep.push('Noto — kana '+nka+'%  鬱 '+nu+'%');
window.__rep = rep.join('\\n');
</script></body>`;

const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(page);
}).listen(8212);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1560, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8212/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.__rep, null, { timeout: 60000 });
console.log(await pg.evaluate(() => window.__rep));
await pg.screenshot({ path: HERE + 'pen-pick.png', fullPage: true });
await br.close();
srv.close();
console.log('\ntools/pen-pick.png written');
