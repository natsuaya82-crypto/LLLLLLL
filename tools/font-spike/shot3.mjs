import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

const html = fs.readFileSync('./index3.html');
const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(html);
}).listen(8188);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 980, height: 1400 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://127.0.0.1:8188/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);

await pg.screenshot({ path: './proof3.png', fullPage: true });
const probe = await pg.evaluate(async () => {
  await Promise.all(['LS-light','LS-regular','LS-bold','LS-broadnib','LS-over'].map(f => document.fonts.load('100px "'+f+'"')));
  const c = document.createElement('canvas').getContext('2d');
  const m = (f,s) => { c.font = '100px "'+f+'"'; return Math.round(c.measureText(s).width); };
  return {
    loaded: [...document.fonts].map(f => f.family + ':' + f.status),
    widthLight: m('LS-light','kalisht'),
    widthRegular: m('LS-regular','kalisht'),
    widthBold: m('LS-bold','kalisht'),
    ligFired: m('LS-regular','sh') < m('LS-regular','s') + m('LS-regular','h'),
    inputAscii: /^[\x20-\x7e]+$/.test(document.querySelector('input').value),
  };
});
console.log(JSON.stringify(probe, null, 1));
const errs2 = errs; console.log('console errors:', errs2.length ? errs2 : 'none');
await br.close();
srv.close();
