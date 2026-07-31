// The previous experiment measured my handwriting, not the lattice. Every point in
// it was one I placed by hand, badly, so "10x10 can hold 鬱" was really "I drew
// something on 100 dots and called it 鬱".
//
// This takes me out of it. The pipeline is:
//   real Noto glyph -> raster -> Zhang-Suen thinning to a 1px skeleton
//   -> traced into polylines -> simplified -> EVERY VERTEX SNAPPED TO THE LATTICE
//   -> re-stroked with the app's own pen engine
// Nothing in that chain is a judgement call about what the letter looks like. The
// only thing the lattice can be blamed for is the snap step, which is exactly the
// thing under test.
//
// Pass 1 (browser): rasterise + thin + trace, in 800-unit glyph space.
// Pass 2 (node): snap + stroke through LF.glyphContours + render the comparison.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const HERE = new URL('.', import.meta.url).pathname;
const LF = require(HERE + '../www/otf5.js');

const CELL = 800, INSET = 40;
const GLYPHS = ['あ', 'い', 'う', 'え', 'お', '鬱'];
const R = 200;                                  // raster resolution for thinning

const pass1 = `<!doctype html><meta charset="utf-8"><body>
<canvas id="cv" width="${R}" height="${R}"></canvas>
<script>
var R = ${R};
function raster(ch){
  var c=document.getElementById('cv'), x=c.getContext('2d');
  x.clearRect(0,0,R,R);
  x.fillStyle='#fff'; x.font=Math.round(R*0.88)+'px "Noto Sans CJK JP"';
  x.textBaseline='alphabetic';
  var m=x.measureText(ch);
  x.fillText(ch, (R-m.width)/2, R*0.90);
  var d=x.getImageData(0,0,R,R).data, g=new Uint8Array(R*R), i;
  for(i=0;i<R*R;i++) g[i] = d[i*4+3]>128 ? 1 : 0;
  return g;
}
/* Zhang-Suen: erode the shape one layer at a time from both sides, but only
   where removing a pixel cannot break the shape apart, until one pixel is left
   down the middle of every stroke. */
function thin(g){
  var a=g.slice(), w=R, changed=true;
  function idx(r,c){ return r*w+c; }
  function nb(a,r,c){ return [a[idx(r-1,c)],a[idx(r-1,c+1)],a[idx(r,c+1)],a[idx(r+1,c+1)],
                              a[idx(r+1,c)],a[idx(r+1,c-1)],a[idx(r,c-1)],a[idx(r-1,c-1)]]; }
  while(changed){
    changed=false;
    for(var step=0; step<2; step++){
      var kill=[];
      for(var r=1;r<w-1;r++) for(var c=1;c<w-1;c++){
        if(!a[idx(r,c)]) continue;
        var p=nb(a,r,c), B=0, A=0, k;
        for(k=0;k<8;k++){ B+=p[k]; if(p[k]===0 && p[(k+1)%8]===1) A++; }
        if(B<2||B>6||A!==1) continue;
        var c1 = step===0 ? p[0]*p[2]*p[4] : p[0]*p[2]*p[6];
        var c2 = step===0 ? p[2]*p[4]*p[6] : p[0]*p[4]*p[6];
        if(c1===0 && c2===0) kill.push(idx(r,c));
      }
      if(kill.length){ changed=true; for(var j=0;j<kill.length;j++) a[kill[j]]=0; }
    }
  }
  return a;
}
/* walk the skeleton into polylines: start at every endpoint, then mop up loops */
function trace(a){
  var w=R, seen=new Uint8Array(w*w), out=[];
  function deg(i){ var r=(i/w)|0, c=i%w, n=0;
    for(var dr=-1;dr<=1;dr++) for(var dc=-1;dc<=1;dc++){
      if(!dr&&!dc) continue; var rr=r+dr, cc=c+dc;
      if(rr<0||cc<0||rr>=w||cc>=w) continue; if(a[rr*w+cc]) n++; } return n; }
  function neighbours(i){ var r=(i/w)|0, c=i%w, o=[];
    /* 4-neighbours first so the walk prefers straight over diagonal */
    var ord=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for(var k=0;k<8;k++){ var rr=r+ord[k][0], cc=c+ord[k][1];
      if(rr<0||cc<0||rr>=w||cc>=w) continue; if(a[rr*w+cc]) o.push(rr*w+cc); } return o; }
  function walk(start){
    var pts=[start]; seen[start]=1; var cur=start;
    for(;;){
      var ns=neighbours(cur).filter(function(n){ return !seen[n]; });
      if(!ns.length) break;
      var nx=ns[0];
      seen[nx]=1; pts.push(nx); cur=nx;
      if(deg(nx)>2) { /* junction: stop this run, another run picks up */ }
    }
    if(pts.length>3) out.push(pts.map(function(i){ return [(i%w), (i/w)|0]; }));
  }
  var i;
  for(i=0;i<w*w;i++) if(a[i] && !seen[i] && deg(i)===1) walk(i);
  for(i=0;i<w*w;i++) if(a[i] && !seen[i] && deg(i)>2) walk(i);
  for(i=0;i<w*w;i++) if(a[i] && !seen[i]) walk(i);
  return out;
}
/* Ramer-Douglas-Peucker, so a 90-pixel run becomes the few corners it really has */
function rdp(pts, eps){
  if(pts.length<3) return pts;
  var a=pts[0], b=pts[pts.length-1], dmax=0, idx=0;
  var dx=b[0]-a[0], dy=b[1]-a[1], len=Math.sqrt(dx*dx+dy*dy)||1;
  for(var i=1;i<pts.length-1;i++){
    var d=Math.abs(dy*(pts[i][0]-a[0]) - dx*(pts[i][1]-a[1]))/len;
    if(d>dmax){ dmax=d; idx=i; }
  }
  if(dmax<=eps) return [a,b];
  return rdp(pts.slice(0,idx+1), eps).slice(0,-1).concat(rdp(pts.slice(idx), eps));
}
var GL = ${JSON.stringify(GLYPHS)};
var res = {};
GL.forEach(function(ch){
  var sk = thin(raster(ch));
  var lines = trace(sk).map(function(p){ return rdp(p, 1.6); })
    .filter(function(p){ return p.length>1; })
    /* raster px -> 800-unit glyph space */
    .map(function(p){ return p.map(function(q){
      return [q[0]*${CELL}/R, q[1]*${CELL}/R]; }); });
  res[ch] = lines;
});
window.__poly = JSON.stringify(res);
</script></body>`;

const srv1 = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(pass1);
}).listen(8210);

let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
let pg = await br.newPage();
await pg.goto('http://127.0.0.1:8210/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.__poly, null, { timeout: 120000 });
const POLY = JSON.parse(await pg.evaluate(() => window.__poly));
srv1.close();
/* the skeletons cost a minute of thinning and never change, so hand them on to
   tools/pen-pick.mjs rather than making it repeat the whole first pass */
fs.writeFileSync(HERE + 'skeletons.json', JSON.stringify(POLY));
GLYPHS.forEach(g => console.log(g, POLY[g].length + ' strokes,',
  POLY[g].reduce((a, p) => a + p.length, 0) + ' points'));

// ---- pass 2: snap to the lattice and re-stroke ------------------------------
const stepOf = n => (CELL - INSET * 2) / (n - 1);
const penOf = n => Math.round(stepOf(n) / 2);
const snap1 = (v, n) => {
  const s = stepOf(n); let i = Math.round((v - INSET) / s);
  if (i < 0) i = 0; if (i > n - 1) i = n - 1;
  return Math.round(INSET + i * s);
};
const snapLine = (pts, n) => {
  const out = [];
  pts.forEach(p => {
    const q = [snap1(p[0], n), snap1(p[1], n)];
    const last = out[out.length - 1];
    if (!last || last[0] !== q[0] || last[1] !== q[1]) out.push(q);
  });
  return out;
};
// Snapping a curve to a lattice turns it into a polygon: the dots the curve passes
// between are gone, so every remaining vertex becomes a corner. The editor already
// has curve points, so mark the interior vertices as curved and the pen rounds the
// corners back off -- same dots, same snap, only the interpretation differs.
const curved = pts => pts.map((p, i) =>
  (i === 0 || i === pts.length - 1) ? [p[0], p[1]] : [p[0], p[1], 'c']);

const strokesFor = (g, n, curve) => POLY[g]
  .map(p => { const s = snapLine(p, n); return { pts: curve ? curved(s) : s }; })
  .filter(s => s.pts.length > 1);
const rawStrokes = g => POLY[g].map(p => ({ pts: p.map(q => [Math.round(q[0]), Math.round(q[1])]) }))
  .filter(s => s.pts.length > 1);

const pathOf = (strokes, pen) => LF.glyphContours({ strokes }, { width: pen, angleDeg: 0, contrast: 1.0 })
  .filter(c => c.length > 2)
  .map(c => 'M' + c.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z')
  .join('');

const PATHS = {};
GLYPHS.forEach(g => {
  PATHS['raw/' + g] = pathOf(rawStrokes(g), 40);
  [5, 7, 9, 10, 11, 13].forEach(n => {
    PATHS[n + '/' + g] = pathOf(strokesFor(g, n, false), penOf(n));
    PATHS[n + 'c/' + g] = pathOf(strokesFor(g, n, true), penOf(n));
    // measurement copies, all at the same pen so the number is about the lattice
    // and not about how thick each row happens to be drawn
    PATHS[n + 'm/' + g] = pathOf(strokesFor(g, n, true), 40);
    PATHS[n + 'ms/' + g] = pathOf(strokesFor(g, n, false), 40);
  });
});

// The pen does not have to be half the step. Half a step is the width at which two
// strokes on adjacent dots still leave white between them -- a rule that only binds
// for a glyph dense enough to use adjacent dots, which 鬱 is and a hand-made letter
// is not. The cost of obeying it everywhere is weight: pen 60 was measured against a
// real face in the font-spike README and already reads light, and a finer lattice
// makes the pen finer still. So measure both together: how dark the text is at body
// size, per lattice, per pen.
const WN = [7, 10, 11], WPEN = [36, 40, 48, 60];
GLYPHS.forEach(g => WN.forEach(n => WPEN.forEach(w => {
  PATHS['w' + n + '_' + w + '/' + g] = pathOf(strokesFor(g, n, true), w);
})));

const dots = n => {
  const st = stepOf(n); let d = '';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    d += `<circle cx="${INSET + i * st}" cy="${INSET + j * st}" r="8" fill="#463c30"/>`;
  return d;
};
const cellSvg = (key, size, n) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 ${CELL} ${CELL}">${n ? dots(n) : ''}
   <path d="${PATHS[key]}" fill="#efe7d8"/></svg>`;

const rowFor = (label, sub, keyf, n, big) => `
<tr><th>${label}<i>${sub}</i></th>
${GLYPHS.map(g => `<td>${cellSvg(keyf(g), g === '鬱' ? big : big, g === '鬱' ? n : n)}</td>`).join('')}
</tr>`;

const page2 = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1640px;background:#0d0b09;color:#efe7d8;
  font-family:"Helvetica Neue",Arial,"Noto Sans CJK JP",sans-serif;padding:44px}
.done{font-size:24px;line-height:1.8;color:#c9bda6;margin-bottom:30px}
.done b{color:#e8c979;font-weight:600}
.q{font-size:29px;color:#e8c979;font-weight:600;margin-bottom:6px}
.qs{font-size:20px;color:#8d8375;margin-bottom:20px}
table{border-collapse:collapse;width:100%}
th{width:200px;text-align:left;font-size:23px;color:#c9bda6;font-weight:500;
   padding:12px 18px 12px 0;vertical-align:middle}
th i{display:block;font-style:normal;font-size:17px;color:#7d7466;margin-top:5px;line-height:1.5}
td{text-align:center;padding:6px 0;border-top:1px solid #221d17}
.sc{font-size:34px;color:#e8c979;font-weight:600;width:130px}
.nt{font-family:"Noto Sans CJK JP";font-size:170px;line-height:1.05;display:block}
</style><body>
<div class="done">
決まったこと: <b>ペンは格子の間隔の半分</b>、そして <b>7×7では足りない</b>（鬱の上は3つ横に並ぶので9列いる）。
字は僕が描いていません — 実在フォントを細らせて骨にし、その骨を格子に吸い付かせて同じペンで描き直しています。
</div>
<div class="q">決めたいこと</div>
<div class="qs">格子の細かさ。2段目「骨だけ」が格子を使わない場合で、下の3段はそれを格子に吸い付かせたもの。
右の数字は骨だけの形とどれだけ残っているか（同じペン40で測定、100%＝格子で形が変わっていない）。
点が偶数だと真ん中に点が来ないので、縦棒をセルの中央に引けません。</div>
<table>
<tr><th>元の字<i>Noto Sans CJK JP</i></th>
${GLYPHS.map(g => `<td><span class="nt">${g}</span></td>`).join('')}<td></td></tr>
<tr><th>骨だけ<i>格子なし・ペン40</i></th>
${GLYPHS.map(g => `<td>${cellSvg('raw/' + g, 178, 0)}</td>`).join('')}<td class="sc">100%</td></tr>
${[9, 10, 11].map(n => `
<tr><th>${n}×${n} に乗せる<i>${n * n}点・ペン${penOf(n)}・間隔${Math.round(stepOf(n))}<br>
  ${n % 2 ? '真ん中に点あり' : '<span style="color:#d98a6a">真ん中に点なし</span>'}</i></th>
${GLYPHS.map(g => `<td>${cellSvg(n + 'c/' + g, 178, n)}</td>`).join('')}
<td class="sc" id="s${n}m">…</td></tr>`).join('')}
</table>
<canvas id="ca" width="240" height="240" style="display:none"></canvas>
<canvas id="cb" width="240" height="240" style="display:none"></canvas>
<script>
var PATHS = ${JSON.stringify(PATHS)}, GL = ${JSON.stringify(GLYPHS)};
function mask(cid, key){
  var c=document.getElementById(cid), x=c.getContext('2d'), px=240;
  x.clearRect(0,0,px,px); x.save(); x.scale(px/800, px/800);
  x.fillStyle='#fff'; x.fill(new Path2D(PATHS[key])); x.restore();
  var d=x.getImageData(0,0,px,px).data, m=new Uint8Array(px*px), i;
  for(i=0;i<px*px;i++) m[i]= d[i*4+3]>128 ? 1:0;
  return m;
}
/* overlap of the snapped glyph with the unsnapped one: how much of the letter the
   lattice kept. Same pen on both sides, so only the snap is being measured. */
function iou(key){
  var tot=0, n=0;
  GL.forEach(function(g){
    var a=mask('ca','raw/'+g), b=mask('cb',key+'/'+g), inter=0, uni=0, i;
    for(i=0;i<a.length;i++){ if(a[i]||b[i]) uni++; if(a[i]&&b[i]) inter++; }
    tot += inter/uni; n++;
  });
  return Math.round(tot/n*100);
}
[9,10,11].forEach(function(n){
  document.getElementById('s'+n+'m').textContent = iou(n+'m') + '%';
});
/* ink at body size: how dark the text actually is, against a real font */
function ink(key, px){
  /* its own canvas: 'ca'/'cb' are sized for the overlap masks and must not be
     resized out from under them */
  var c=document.createElement('canvas'), x=c.getContext('2d');
  c.width=px; c.height=px; x.clearRect(0,0,px,px); x.save(); x.scale(px/800, px/800);
  x.fillStyle='#fff'; x.fill(new Path2D(PATHS[key])); x.restore();
  var d=x.getImageData(0,0,px,px).data, n=0, i;
  for(i=0;i<px*px;i++) if(d[i*4+3]>110) n++;
  return n/(px*px);
}
function notoInk(ch, px){
  var c=document.createElement('canvas'), x=c.getContext('2d');
  c.width=px; c.height=px; x.clearRect(0,0,px,px);
  x.fillStyle='#fff'; x.font=Math.round(px*0.92)+'px "Noto Sans CJK JP"';
  x.textBaseline='alphabetic'; x.fillText(ch, px*0.04, px*0.92);
  var d=x.getImageData(0,0,px,px).data, n=0, i;
  for(i=0;i<px*px;i++) if(d[i*4+3]>110) n++;
  return n/(px*px);
}
var KANA=['あ','い','う','え','お'];
var wlines=[];
[7,10,11].forEach(function(n){
  [36,40,48,60].forEach(function(w){
    var k=KANA.map(function(g){ return ink('w'+n+'_'+w+'/'+g,14); });
    var ka=Math.round(k.reduce(function(a,b){return a+b},0)/5*100);
    var u=Math.round(ink('w'+n+'_'+w+'/鬱',14)*100);
    wlines.push('  '+n+'x'+n+' pen '+w+'  kana '+ka+'%  鬱 '+u+'%');
  });
});
var nk=KANA.map(function(g){ return notoInk(g,14); });
wlines.push('  Noto (the reference)  kana '
  + Math.round(nk.reduce(function(a,b){return a+b},0)/5*100) + '%  鬱 '
  + Math.round(notoInk('鬱',14)*100) + '%');
window.__weight = wlines.join('\\n');
window.__iou = [5,7,9,10,11,13].map(function(n){
  var st=(800-80)/(n-1);
  return n+'x'+n+'  step '+st+'  pen '+Math.round(st/2)
    + '  centre dot ' + (n%2 ? 'yes':'NO')
    + '  keeps ' + iou(n+'m') + '%';
}).join('\\n');
</script>
</body>`;

const srv2 = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); rs.end(page2);
}).listen(8211);
pg = await br.newPage({ viewport: { width: 1640, height: 1000 }, deviceScaleFactor: 2 });
await pg.goto('http://127.0.0.1:8211/', { waitUntil: 'load' });
await pg.waitForFunction(() => window.__iou, null, { timeout: 60000 });
console.log('\n' + await pg.evaluate(() => window.__iou));
console.log('\nink at body size (14px), same skeleton, curves on:');
console.log(await pg.evaluate(() => window.__weight));
await pg.screenshot({ path: HERE + 'lattice-truth.png', fullPage: true });
await br.close();
srv2.close();
console.log('\ntools/lattice-truth.png written');
