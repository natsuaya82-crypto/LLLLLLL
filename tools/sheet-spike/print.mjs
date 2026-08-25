import fs from 'fs';
import { chromium, LAUNCH } from '/home/user/LLLLLLL/tools/browser.mjs';
const SRC = fs.readFileSync('/home/user/LLLLLLL/www/sheet.js','utf8');
const NAMES = ['7','2','25','人','愛','a','a','a','mountain','水','火','木','金','土','日','月','ka','yo','!','?'];
const br = await chromium.launch(LAUNCH);
/* 1. 名前を絵にして、PDF を作る（アプリ側の仕事） */
const pg = await br.newPage({ viewport:{width:400,height:200} });
const pdf = await pg.evaluate(({src, names})=>{
  eval(src);
  var pics = names.map(function(nm){
    var H=64, c=document.createElement('canvas'), g=c.getContext('2d');
    g.font='600 '+Math.round(H*0.8)+'px system-ui, "Noto Sans JP", sans-serif';
    var w=Math.max(8, Math.ceil(g.measureText(nm).width));
    c.width=w; c.height=H; g=c.getContext('2d');
    g.fillStyle='#fff'; g.fillRect(0,0,w,H);
    g.fillStyle='#000'; g.font='600 '+Math.round(H*0.8)+'px system-ui, "Noto Sans JP", sans-serif';
    g.textBaseline='middle'; g.fillText(nm, 0, H*0.54);
    var d=g.getImageData(0,0,w,H).data, out=[], i;
    for(i=0;i<w*H;i++) out.push(String.fromCharCode(d[i*4]));
    return {w:w, h:H, gray:out.join('')};
  });
  return shSheet(names, pics);
}, {src:SRC, names:NAMES});
await pg.close();
if (!pdf) { console.log('用紙が作れない（名前が長すぎる）'); process.exit(1); }
fs.writeFileSync('/tmp/sheet2/sheet.pdf', pdf, 'latin1');
console.log('用紙: ' + pdf.length + ' バイト');
/* 2. その PDF を実際に開いて、画素にする */
const v = await br.newPage({ viewport:{width:2000,height:2800} });
await v.goto('file:///tmp/sheet2/sheet.pdf');
await v.waitForTimeout(3000);
await v.screenshot({ path:'/tmp/sheet2/shot.png' });
await v.close();
await br.close();
console.log('刷ったものを画素にした');
