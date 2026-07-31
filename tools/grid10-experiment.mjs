// Can a 10x10 lattice hold あいうえお and 鬱?
//
// The question is not "can I place the points" — of course you can, 100 dots is
// a lot. The question is whether the ink survives at the size the app actually
// shows a letter (17px body text, so one 800-unit cell is 13.6px on screen).
//
// The number that decides it: the lattice step at 10x10 is (800-80)/9 = 80, and
// the pen is 60 wide. Two strokes one lattice unit apart therefore leave 20
// units of white -- 0.34px at body size. This script measures what that does.
//
// Legibility is measured, not eyeballed: after rasterising a glyph we flood the
// background from outside and count the white regions left INSIDE the ink. Those
// are the counters -- the holes in 田, the gaps between the strokes of 彡. A
// legible dense character has many; a blob has almost none.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;
const LF = require(HERE + '../www/otf5.js');

const CELL = 800, INSET = 40, N = 10;
const STEP = (CELL - INSET * 2) / (N - 1);            // 80, exactly
const PENW = 60;
const P = (i, j, c) => c ? [INSET + i * STEP, INSET + j * STEP, 'c']
                         : [INSET + i * STEP, INSET + j * STEP];

// --- hand-drawn on the lattice, the way a user would ------------------------
// Every point below is a lattice index 0..9. Nothing is off-grid.
const s = (...pts) => ({ pts });
const GLY = {
  'あ': [
    s(P(1,2), P(8,2)),
    s(P(5,0), P(4,4,'c'), P(3,9)),
    s(P(8,3), P(4,3,'c'), P(2,5,'c'), P(3,8,'c'), P(6,8,'c'), P(7,6,'c'), P(5,4,'c'), P(3,6)),
  ],
  'い': [
    s(P(2,2), P(2,6,'c'), P(4,8)),
    s(P(7,2), P(7,6)),
  ],
  'う': [
    s(P(3,1), P(6,1)),
    s(P(2,3), P(6,3,'c'), P(7,5,'c'), P(5,8,'c'), P(2,8)),
  ],
  'え': [
    s(P(4,1), P(6,1)),
    s(P(2,3), P(6,3,'c'), P(2,6,'c'), P(4,7,'c'), P(2,9,'c'), P(5,9,'c'), P(7,7)),
  ],
  'お': [
    s(P(0,2), P(6,2)),
    s(P(4,0), P(4,6,'c'), P(2,8,'c'), P(1,6)),
    s(P(6,3), P(7,5,'c'), P(6,7,'c'), P(8,8)),
    s(P(8,1), P(9,2)),
  ],
  // 鬱 = ⿳ ⿲木缶木 / 冖 / ⿰鬯彡 . 27 strokes, drawn as faithfully as 10 rows allow.
  '鬱': [
    /* 木 left */   s(P(1,0), P(1,3)), s(P(0,1), P(2,1)), s(P(1,1), P(0,3)), s(P(1,1), P(2,3)),
    /* 缶 middle */ s(P(5,0), P(4,1)), s(P(3,1), P(6,1)), s(P(5,1), P(5,3)),
                    s(P(4,2), P(6,2)), s(P(4,2), P(4,3)), s(P(6,2), P(6,3)), s(P(4,3), P(6,3)),
    /* 木 right */  s(P(8,0), P(8,3)), s(P(7,1), P(9,1)), s(P(8,1), P(7,3)), s(P(8,1), P(9,3)),
    /* 冖 */        s(P(0,4), P(9,4,'c'), P(9,5)),
    /* 鬯 */        s(P(1,6), P(1,9), P(4,9), P(4,6)), s(P(1,7), P(4,7)),
                    s(P(2,6), P(3,8)), s(P(3,6), P(2,8)), s(P(2,9), P(3,9)),
    /* 彡 */        s(P(8,5), P(6,6)), s(P(9,6), P(7,7)), s(P(9,7), P(7,8)),
  ],
};
const ORDER = ['あ', 'い', 'う', 'え', 'お', '鬱'];
const PENS = [60, 40, 24];

const contoursFor = (name, w) =>
  LF.glyphContours({ strokes: GLY[name] }, { width: w, angleDeg: 0, contrast: 1.0 });

const pathFor = (name, w) => contoursFor(name, w)
  .filter(c => c.length > 2)
  .map(c => 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z')
  .join('');

const svg = (name, w, size, dots) => {
  let d = '';
  if (dots) for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
    d += `<circle cx="${INSET + i * STEP}" cy="${INSET + j * STEP}" r="9" fill="#463c30"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${CELL} ${CELL}">${d}
    <path d="${pathFor(name, w)}" fill="#efe7d8"/></svg>`;
};

const PATHS = {};
ORDER.forEach(n => PENS.forEach(w => { PATHS[n + '/' + w] = pathFor(n, w); }));

const page = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1560px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Hiragino Sans","Noto Sans JP",sans-serif;padding:46px}
.done{font-size:25px;line-height:1.75;color:#c9bda6;margin-bottom:34px}
.done b{color:#e8c979;font-weight:600}
h2{font-size:27px;color:#e8c979;font-weight:600;margin:34px 0 4px;padding-top:26px;border-top:1px solid #2a241c}
.qs{font-size:20px;color:#8d8375;margin-bottom:22px}
.strip{display:flex;gap:10px;align-items:flex-end;margin-bottom:10px}
.real{display:flex;gap:0;align-items:flex-end;margin:6px 0 4px}
.lab{font-size:19px;color:#7d7466;margin-bottom:26px}
.pens{display:flex;gap:52px;align-items:flex-end}
.pen{text-align:center}
.pen i{display:block;font-style:normal;font-size:19px;color:#7d7466;margin-top:10px}
#m{font-size:20px;color:#c9bda6;line-height:1.9;margin-top:8px}
#m b{color:#e8c979}
</style><body>
<div class="done">
10×10（100点・<b>間隔80</b>）。ペンは<b>60</b>のままなので、隣り合う線のあいだに残る白は
<b>20単位＝本文17pxで0.34px</b>。以下は全部その格子だけで描いたもの。曲線とループはそのまま使えます。
</div>

<h2>あいうえお</h2>
<div class="qs">上＝格子つきの下描き、下＝アプリが実際に出すサイズ（本文17px、1文字13.6px）</div>
<div class="strip">${ORDER.slice(0,5).map(n => svg(n, 60, 230, true)).join('')}</div>
<div class="real">${ORDER.slice(0,5).map(n => svg(n, 60, 13.6)).join('')}
  <span style="width:26px"></span>${ORDER.slice(0,5).map(n => svg(n, 60, 34)).join('')}</div>
<div class="lab">左が実寸 13.6px、右は 2.5倍</div>

<h2>鬱（27画）</h2>
<div class="qs">同じ10×10の格子に、木・缶・木／冖／鬯・彡 をそのまま置いたもの</div>
<div class="pens">
  ${PENS.map(w => `<div class="pen">${svg('鬱', w, 300, w === 60)}<i>ペン ${w}</i>
    <div style="margin-top:14px">${svg('鬱', w, 13.6)}
      <span style="display:inline-block;width:14px"></span>${svg('鬱', w, 34)}</div></div>`).join('')}
</div>
<div id="m">測定中…</div>

<canvas id="cv" width="512" height="512" style="display:none"></canvas>
<script>
var PATHS = ${JSON.stringify(PATHS)};
/* ink ratio, and the number of white regions enclosed by the ink (the counters).
   A legible dense character keeps its counters; a blob loses them. */
function measure(key, px){
  var c=document.getElementById('cv'), x=c.getContext('2d');
  c.width=px; c.height=px;
  x.clearRect(0,0,px,px);
  x.save(); x.scale(px/800, px/800);
  var p=new Path2D(PATHS[key]); x.fillStyle='#fff'; x.fill(p); x.restore();
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
var out=[];
[60,40,24].forEach(function(w){
  var big=measure('鬱/'+w, 400), small=measure('鬱/'+w, 14);
  out.push('ペン '+w+' — 大きく描くと 白い抜けが <b>'+big.holes+'</b> 個 / 墨 '
    + Math.round(big.ink*100) + '%　→　本文サイズ(14px)では 抜け <b>'+small.holes
    + '</b> 個 / 墨 ' + Math.round(small.ink*100) + '%');
});
var kana=[60].map(function(w){
  var r=['あ','い','う','え','お'].map(function(n){ return measure(n+'/'+w,14).holes; });
  return 'かな（ペン60・本文サイズ）— 抜けの数 あ'+r[0]+' い'+r[1]+' う'+r[2]+' え'+r[3]+' お'+r[4];
});
document.getElementById('m').innerHTML =
  '<b>測定</b>（白い抜けの数＝字の中に残った隙間。潰れると 0 に近づく）<br>'
  + out.join('<br>') + '<br>' + kana.join('<br>');
</script>
</body>`;

const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(page);
}).listen(8199);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 1560, height: 1000 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8199/', { waitUntil: 'load' });
await pg.waitForTimeout(500);
console.log((await pg.locator('#m').innerText()).replace(/\n/g, '\n  '));
await pg.screenshot({ path: HERE + 'grid10.png', fullPage: true });
await br.close();
srv.close();
console.log('\ntools/grid10.png written');
