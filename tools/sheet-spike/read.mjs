/* 撮った用紙を読む。
     node tools/sheet-spike/read.mjs <画像> [出力.png]
   何が起きたかを表で出して、取り込んだ形を絵にする。 */
import fs from 'fs';
import path from 'path';
import { chromium, LAUNCH } from '/home/user/LLLLLLL/tools/browser.mjs';

const SRC = fs.readFileSync(new URL('../../www/sheet.js', import.meta.url), 'utf8');
const file = process.argv[2];
const out  = process.argv[3] || '/tmp/sheet-read.png';
if (!file){ console.error('使い方: node tools/sheet-spike/read.mjs <画像 or PDF> [出力.png]'); process.exit(1); }
const raw = fs.readFileSync(file);
let ext = path.extname(file).toLowerCase().replace('.', '') || 'png';
let bin = raw;
if (ext === 'pdf'){
  /* sheet.js knows how to open one, and it is DOM-free on purpose, so it can
     be asked here rather than inside the page */
  const S = new Function(SRC + ';return {shPdfJpeg:shPdfJpeg, shPdfWhy:shPdfWhy};')();
  const bytes = raw.toString('latin1');
  const why = S.shPdfWhy(bytes);
  const jpg = S.shPdfJpeg(bytes);
  if (!jpg){
    console.error(why === 'not-pdf' ? '  PDF ではありません' :
      why === 'drawn'
        ? '  画面の上で書かれた PDF です。中に写真は入っていないので、\n' +
          '  ページを画にするものが要ります ── 端末は PDFKit を持っていますが、これは持っていません。'
        : '  中の絵が JPEG ではない形で仕舞われています。取り出せません。');
    process.exit(1);
  }
  console.log('  PDF から写真を取り出しました: ' + jpg.length + ' バイト');
  bin = Buffer.from(jpg, 'latin1'); ext = 'jpeg';
}
const b64 = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' +
            bin.toString('base64');

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:1500, height:1000 } });
const r = await pg.evaluate(async ({src, img}) => {
  eval(src);
  var im = new Image();
  await new Promise(function(ok, no){ im.onload=ok; im.onerror=function(){no(new Error('読めない画像'));}; im.src=img; });
  /* 大きすぎる写真は縮める。四隅の印は紙の 1/40 ほどあるので、
     2000 画素あれば足りる ── 12MP をそのまま回すのは時間の無駄 */
  var sc = Math.min(1, 2200 / Math.max(im.width, im.height));
  var W = Math.round(im.width*sc), H = Math.round(im.height*sc);
  var c = document.createElement('canvas'); c.width=W; c.height=H;
  var g = c.getContext('2d');
  g.fillStyle='#fff'; g.fillRect(0,0,W,H);
  g.drawImage(im, 0,0, W,H);
  var px = g.getImageData(0,0,W,H).data;
  /* 白黒でない写真は先に灰色に */
  var i;
  for(i=0;i<W*H;i++){
    var v = (px[i*4]*0.299 + px[i*4+1]*0.587 + px[i*4+2]*0.114)|0;
    px[i*4]=px[i*4+1]=px[i*4+2]=v;
  }
  var scan = shScan(px, W, H);
  if (scan.fail) return { fail: scan.fail, cand: scan.cand, w:W, h:H };
  var names = shReadStrip(scan.warp, scan.dark);
  /* How finely to sample a box is the PHOTOGRAPH's to say, not a constant.
     Finer than the photograph invents detail that is not there; coarser throws
     some away. Ask how many pixels wide a box actually came out. */
  var bb = shBoxAt(0);
  var e0 = scan.warp(bb.x, bb.y + bb.side), e1 = scan.warp(bb.x + bb.side, bb.y + bb.side);
  var RES = Math.round(Math.sqrt((e1[0]-e0[0])*(e1[0]-e0[0]) + (e1[1]-e0[1])*(e1[1]-e0[1])));
  if (RES < 120) RES = 120; if (RES > 700) RES = 700;
  var rows = [], shapes = [];
  var n = names ? names.length : shPerPage();
  for (i = 0; i < n; i++){
    var mask = shBoxInk(scan.warp, scan.crisp, i, RES);
    var raw = 0, k; for(k=0;k<mask.length;k++) raw += mask[k];
    var cl = shClean(mask, RES, Math.round(RES*RES*0.0012), 3);
    /* The edge runs where the grey crosses half way between this paper and this
       ink, which is BETWEEN two samples -- following pixel corners instead
       gives a staircase nobody drew. And the thinning is 1 unit of 800, which
       at this sampling drops only points sitting exactly on the line between
       their neighbours: the same straight edge written down twice.
       Measured on the real sheet: 440 points of staircase become 123 points of
       the letter. It was 6, which moved a point 5.81 of 800 -- four tenths of
       the width of the stroke it was moving, and that is the app redrawing
       somebody's letter rather than keeping it.
       「画像データをそのまま取り込みたいのよ」 */
    var fld = shBoxField(scan.warp, scan.sign, i, RES);
    var loops = shEdge(fld, RES, cl.m).map(function(L){ return shThin(L, RES/800*1); });
    var pts = 0; loops.forEach(function(L){ pts += L.length; });
    rows.push({ name: names ? names[i] : '?', raw: raw, kept: cl.kept,
                dropped: cl.dropped, loops: loops.length, pts: pts });
    shapes.push(loops);
  }
  /* 取り込んだ形を並べて描く */
  var COLS=5, CELL=280, ROWSN=Math.ceil(n/COLS);
  document.body.innerHTML='<canvas id="V" width="'+(COLS*CELL)+'" height="'+(ROWSN*CELL+40)+'"></canvas>';
  document.body.style.margin='0'; document.body.style.background='#fff';
  var vc=document.getElementById('V'), vg=vc.getContext('2d');
  vg.fillStyle='#fff'; vg.fillRect(0,0,vc.width,vc.height);
  for(i=0;i<n;i++){
    var ox=(i%COLS)*CELL+20, oy=Math.floor(i/COLS)*CELL+52, S=(CELL-46)/RES;
    vg.strokeStyle='#e2e2e2'; vg.lineWidth=1;
    vg.strokeRect(ox, oy, RES*S, RES*S);
    vg.fillStyle='#111'; vg.beginPath();
    shapes[i].forEach(function(L){
      L.forEach(function(p,k2){ if(k2===0) vg.moveTo(ox+p[0]*S, oy+p[1]*S);
                                else vg.lineTo(ox+p[0]*S, oy+p[1]*S); });
      vg.closePath();
    });
    vg.fill('evenodd');
    vg.fillStyle='#666'; vg.font='600 17px system-ui, "Noto Sans JP", sans-serif';
    vg.fillText((rows[i].name||'?')+'   '+rows[i].pts+'点', ox, oy-12);
  }
  return { rows: rows, names: names, w:W, h:H, marks: scan.marks };
}, { src: SRC, img: b64 });
if (!r.fail) await pg.locator('#V').screenshot({ path: out });
await br.close();

if (r.fail === 'marks'){
  console.log('四隅の印が見つかりませんでした（それらしい塊 ' + r.cand + ' 個、写真 ' + r.w + 'x' + r.h + '）');
  console.log('四つとも写真に入っていますか。切れていると読めません。');
  process.exit(1);
}
if (r.fail){ console.log('だめでした: ' + r.fail); process.exit(1); }
console.log('  写真 ' + r.w + 'x' + r.h + '、四隅の印は見つかりました');
console.log('  名前: ' + (r.names ? r.names.join(', ') : '読めませんでした（帯が写っていないか、傷んでいる）'));
console.log('');
console.log('  枠        生の画素   残った   捨てた   輪   点');
r.rows.forEach(x=>console.log('  ' + String(x.name).padEnd(10) +
  String(x.raw).padStart(7) + String(x.kept).padStart(9) +
  String(x.dropped).padStart(9) + String(x.loops).padStart(6) + String(x.pts).padStart(6)));
console.log('\n  絵: ' + out);
