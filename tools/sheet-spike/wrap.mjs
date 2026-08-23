/* スキャナの代わり。画像を一枚、PDF に包む。
     node tools/sheet-spike/wrap.mjs <画像> <出力.pdf>
   本物のスキャンと同じ形にする ── ページの JPEG がそのまま入り、その横に
   小さいプレビューが入る。プレビューを間違って読んでいないかを見たいので、
   わざと入れる。 */
import fs from 'fs';
import { chromium, LAUNCH } from '/home/user/LLLLLLL/tools/browser.mjs';

const src = process.argv[2], out = process.argv[3];
if (!src || !out){ console.error('使い方: node tools/sheet-spike/wrap.mjs <画像> <出力.pdf>'); process.exit(1); }
const ext = src.split('.').pop().toLowerCase();
const b64 = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' +
            fs.readFileSync(src).toString('base64');

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:400, height:300 } });
const got = await pg.evaluate(async (img) => {
  var im = new Image();
  await new Promise(function(ok,no){ im.onload=ok; im.onerror=no; im.src=img; });
  function jpeg(w, h, q){
    var c = document.createElement('canvas'); c.width=w; c.height=h;
    var g = c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,w,h);
    g.drawImage(im, 0,0, w,h);
    return c.toDataURL('image/jpeg', q).split(',')[1];
  }
  return { w: im.width, h: im.height,
           page: jpeg(im.width, im.height, 0.9),
           thumb: jpeg(Math.round(im.width/8), Math.round(im.height/8), 0.6) };
}, b64);
await br.close();

const page  = Buffer.from(got.page,  'base64');
const thumb = Buffer.from(got.thumb, 'base64');
const PW = 595.276, PH = 841.89;

/* 最小の、しかし本物の PDF。xref も入れる ── 開けない PDF で試しても意味がない */
const parts = [], offs = [];
let len = 0;
const put = (s) => { const b = Buffer.isBuffer(s) ? s : Buffer.from(s, 'latin1');
                     parts.push(b); len += b.length; };
const obj = (n, body, stream) => {
  offs[n] = len;
  put(n + ' 0 obj\n' + body + '\n');
  if (stream){ put('stream\n'); put(stream); put('\nendstream\n'); }
  put('endobj\n');
};
put('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n');
obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW.toFixed(3) + ' ' + PH.toFixed(3) + ']' +
       ' /Resources << /XObject << /Im0 4 0 R /Im1 5 0 R >> >> /Contents 6 0 R >>');
const imDict = (w, h, n) => '<< /Type /XObject /Subtype /Image /Width ' + w + ' /Height ' + h +
       ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + n + ' >>';
obj(4, imDict(got.w, got.h, page.length), page);
obj(5, imDict(Math.round(got.w/8), Math.round(got.h/8), thumb.length), thumb);
const ops = 'q ' + PW.toFixed(3) + ' 0 0 ' + PH.toFixed(3) + ' 0 0 cm /Im0 Do Q\n';
obj(6, '<< /Length ' + ops.length + ' >>', Buffer.from(ops, 'latin1'));
const xref = len;
let x = 'xref\n0 7\n0000000000 65535 f \n';
for (let i = 1; i <= 6; i++) x += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
put(x + 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
fs.writeFileSync(out, Buffer.concat(parts));
console.log('  ' + out + '  ' + Buffer.concat(parts).length + ' バイト' +
            '   ページ ' + got.w + 'x' + got.h + ' (' + page.length + 'B)' +
            '   プレビュー ' + Math.round(got.w/8) + 'x' + Math.round(got.h/8) + ' (' + thumb.length + 'B)');
