import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;
const b64 = fs.readFileSync('./LinguaScript2.otf').toString('base64');
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:'LS';src:url(data:font/otf;base64,${b64}) format('opentype');}
</style><canvas id="c1" width="500" height="500"></canvas><canvas id="c2" width="500" height="500"></canvas>`;
const srv = http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)}).listen(8182);
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await br.newPage({ viewport:{width:520,height:560} });
await pg.goto('http://127.0.0.1:8182/'); await pg.evaluate(async()=>{ await document.fonts.load('400px LS'); await document.fonts.ready; });
const out = await pg.evaluate(() => {
  function draw(id, ch){
    const c = document.getElementById(id).getContext('2d');
    c.fillStyle = '#fff'; c.font = '400px LS'; c.fillText(ch, 20, 400);
    return c.getImageData(0, 0, 500, 500).data;
  }
  const A = draw('c1','a'), B = draw('c2','e');
  let diff = 0, maxd = 0, ink = 0;
  for (let i = 0; i < A.length; i += 4) {
    if (A[i+3]) ink++;
    const d = Math.abs(A[i+3] - B[i+3]);
    if (d) { diff++; if (d > maxd) maxd = d; }
  }
  return { inkPixels: ink, differingPixels: diff, maxAlphaDelta: maxd };
});
console.log(JSON.stringify(out));
await br.close(); srv.close();
