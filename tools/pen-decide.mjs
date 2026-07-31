// 10x10 held both あいうえお and 鬱. What it did NOT hold is the pen.
//
// The lattice step at 10x10 is 80. A pen of 60 leaves 20 units of white between
// two adjacent strokes -- the top half of 鬱 (木缶木) welds shut. So the open
// question is no longer how many dots; it is how wide the pen may be relative to
// the step.
//
// The honest baseline is a real font: Noto Sans CJK JP's own 鬱, measured with
// exactly the same ruler. If a professional font's 鬱 also loses its counters at
// body size, then losing them is not our bug -- it is what 27 strokes at 14px
// costs anyone.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;
const LF = require(HERE + '../www/otf5.js');

const CELL = 800, INSET = 40, N = 10;
const STEP = (CELL - INSET * 2) / (N - 1);            // 80
const P = (i, j, c) => c ? [INSET + i * STEP, INSET + j * STEP, 'c']
                         : [INSET + i * STEP, INSET + j * STEP];
const s = (...pts) => ({ pts });

const U = [
  /* 木 left */   s(P(1,0), P(1,3)), s(P(0,1), P(2,1)), s(P(1,1), P(0,3)), s(P(1,1), P(2,3)),
  /* 缶 middle */ s(P(5,0), P(4,1)), s(P(3,1), P(6,1)), s(P(5,1), P(5,3)),
                  s(P(4,2), P(6,2)), s(P(4,2), P(4,3)), s(P(6,2), P(6,3)), s(P(4,3), P(6,3)),
  /* 木 right */  s(P(8,0), P(8,3)), s(P(7,1), P(9,1)), s(P(8,1), P(7,3)), s(P(8,1), P(9,3)),
  /* 冖 */        s(P(0,4), P(9,4,'c'), P(9,5)),
  /* 鬯 */        s(P(1,6), P(1,9), P(4,9), P(4,6)), s(P(1,7), P(4,7)),
                  s(P(2,6), P(3,8)), s(P(3,6), P(2,8)), s(P(2,9), P(3,9)),
  /* 彡 */        s(P(8,5), P(6,6)), s(P(9,6), P(7,7)), s(P(9,7), P(7,8)),
];

// pen as a fraction of the lattice step -- the thing actually being chosen
const RATIOS = [0.75, 0.5, 0.3];
const pathFor = w => LF.glyphContours({ strokes: U }, { width: w, angleDeg: 0, contrast: 1.0 })
  .filter(c => c.length > 2)
  .map(c => 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z')
  .join('');

const dots = () => {
  let d = '';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    d += `<circle cx="${INSET + i * STEP}" cy="${INSET + j * STEP}" r="8" fill="#453b30"/>`;
  return d;
};
const svg = (w, size, withDots) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${CELL} ${CELL}">${withDots ? dots() : ''}
   <path d="${pathFor(w)}" fill="#efe7d8"/></svg>`;

const PATHS = {};
RATIOS.forEach(r => { PATHS['r' + r] = pathFor(Math.round(STEP * r)); });

const col = r => {
  const w = Math.round(STEP * r);
  return `<div class="c">
    <div class="h">ペン ${w}<i>間隔80の ${r * 100}%</i></div>
    ${svg(w, 300, r === 0.75)}
    <div class="sm">${svg(w, 13.6)}<span class="gap"></span>${svg(w, 40)}</div>
    <div class="hn" id="h${String(r).replace('.', '')}">…</div>
  </div>`;
};

const page = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1480px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Noto Sans CJK JP",sans-serif;padding:46px}
.done{font-size:25px;line-height:1.8;color:#c9bda6;margin-bottom:36px}
.done b{color:#e8c979;font-weight:600}
.q{font-size:30px;color:#e8c979;font-weight:600;margin-bottom:6px}
.qs{font-size:20px;color:#8d8375;margin-bottom:26px}
.row{display:flex;gap:48px;align-items:flex-start}
.c{text-align:center}
.h{font-size:23px;color:#c9bda6;margin-bottom:12px}
.h i{display:block;font-style:normal;font-size:17px;color:#7d7466;margin-top:5px}
.sm{margin-top:16px;display:flex;gap:16px;align-items:flex-end;justify-content:center;height:44px}
.hn{font-size:19px;color:#8d8375;margin-top:12px}
.hn b{color:#e8c979}
.base{margin-left:20px;padding-left:48px;border-left:1px solid #2a241c}
.nt{font-size:300px;line-height:1;font-family:"Noto Sans CJK JP";display:block}
.ns{display:flex;gap:16px;align-items:flex-end;justify-content:center;height:44px;margin-top:16px}
.ns span{font-family:"Noto Sans CJK JP";line-height:1}
</style><body>
<div class="done">
10×10（100点・間隔80）で <b>あいうえお も 鬱（27画）も描けました</b>。曲線もループもそのまま置けます。
潰れる原因は点の数ではなく <b>ペンが太いこと</b>：間隔80にペン60だと、隣の線とのあいだに白が20しか残らず、
鬱の上半分（木缶木）がくっつきます。
</div>
<div class="q">決めたいこと</div>
<div class="qs">ペンの太さ（＝格子の間隔に対する割合）。右端は比較用の実在フォント Noto Sans CJK JP の鬱。</div>
<div class="row">
  ${RATIOS.map(col).join('')}
  <div class="c base">
    <div class="h">実在フォント<i>比較のものさし</i></div>
    <span class="nt">鬱</span>
    <div class="ns"><span style="font-size:13.6px">鬱</span><span style="font-size:40px">鬱</span></div>
    <div class="hn" id="hn">…</div>
  </div>
</div>
<canvas id="cv" width="512" height="512" style="display:none"></canvas>
<script>
var PATHS = ${JSON.stringify(PATHS)};
/* the ruler: flood the background in from the border, then count the white
   regions still trapped inside the ink. Those are the counters. */
function count(draw, px){
  var c=document.getElementById('cv'), x=c.getContext('2d');
  c.width=px; c.height=px; x.clearRect(0,0,px,px);
  draw(x, px);
  var d=x.getImageData(0,0,px,px).data, ink=new Uint8Array(px*px), n=0, i;
  for(i=0;i<px*px;i++){ if(d[i*4+3]>110){ ink[i]=1; n++; } }
  var seen=new Uint8Array(px*px), st=[], k;
  for(k=0;k<px;k++){ st.push(k, (px-1)*px+k, k*px, k*px+px-1); }
  while(st.length){ var q=st.pop(); if(q<0||q>=px*px||seen[q]||ink[q]) continue;
    seen[q]=1; var r=(q/px)|0, cc=q%px;
    if(cc>0)st.push(q-1); if(cc<px-1)st.push(q+1);
    if(r>0)st.push(q-px); if(r<px-1)st.push(q+px); }
  var holes=0;
  for(i=0;i<px*px;i++){ if(!ink[i]&&!seen[i]){ holes++; var s2=[i]; seen[i]=1;
    while(s2.length){ var q2=s2.pop(), r2=(q2/px)|0, c2=q2%px;
      [[c2>0,q2-1],[c2<px-1,q2+1],[r2>0,q2-px],[r2<px-1,q2+px]].forEach(function(e){
        if(e[0]&&!seen[e[1]]&&!ink[e[1]]){ seen[e[1]]=1; s2.push(e[1]); } }); } } }
  return { ink: n/(px*px), holes: holes };
}
function ours(key){ return function(x, px){
  x.save(); x.scale(px/800, px/800);
  var p=new Path2D(PATHS[key]); x.fillStyle='#fff'; x.fill(p); x.restore(); }; }
function noto(x, px){
  x.fillStyle='#fff';
  x.font = Math.round(px*0.92) + 'px "Noto Sans CJK JP"';
  x.textBaseline='alphabetic';
  x.fillText('鬱', px*0.04, px*0.92);
}
function line(big, small){
  return '大 抜け <b>'+big.holes+'</b> / 墨 '+Math.round(big.ink*100)+'%<br>'
       + '14px 抜け <b>'+small.holes+'</b> / 墨 '+Math.round(small.ink*100)+'%';
}
var report=[];
${JSON.stringify(RATIOS)}.forEach(function(r){
  var big=count(ours('r'+r), 400), sm=count(ours('r'+r), 14);
  document.getElementById('h'+String(r).replace('.','')).innerHTML = line(big, sm);
  report.push('ペン '+Math.round(80*r)+'（間隔の'+(r*100)+'%）— 大:抜け'+big.holes+'/墨'
    +Math.round(big.ink*100)+'%  14px:抜け'+sm.holes+'/墨'+Math.round(sm.ink*100)+'%');
});
var nb=count(noto,400), nsm=count(noto,14);
document.getElementById('hn').innerHTML = line(nb, nsm);
report.push('Noto実在フォント — 大:抜け'+nb.holes+'/墨'+Math.round(nb.ink*100)
  +'%  14px:抜け'+nsm.holes+'/墨'+Math.round(nsm.ink*100)+'%');
window.__report = report.join('\\n');
</script>
</body>`;

const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(page);
}).listen(8200);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1480, height: 900 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8200/', { waitUntil: 'load' });
await pg.waitForTimeout(600);
console.log(await pg.evaluate(() => window.__report));
await pg.screenshot({ path: HERE + 'pen-decide.png', fullPage: true });
await br.close();
srv.close();
console.log('\ntools/pen-decide.png written');
