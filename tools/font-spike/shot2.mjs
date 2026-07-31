import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

const html = fs.readFileSync('./index2.html');
const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(html);
}).listen(8178);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 980, height: 1400 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://127.0.0.1:8178/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);

const probe = await pg.evaluate(() => {
  const loaded = [...document.fonts].map(f => f.family + ':' + f.status);
  const c = document.createElement('canvas').getContext('2d');
  const m = (font, s) => { c.font = font; return Math.round(c.measureText(s).width); };
  // ligature check: with the font, "sh" should be narrower than s+h drawn apart
  const shScript = m('100px LinguaScript', 'sh');
  const sScript  = m('100px LinguaScript', 's');
  const hScript  = m('100px LinguaScript', 'h');
  const shSerif  = m('100px serif', 'sh');
  // toggle check: same text node, two font stacks
  const kalishScript = m('100px LinguaScript', 'kalish');
  const kalishSerif  = m('100px serif', 'kalish');
  const inp = document.querySelector('input');
  return {
    loaded,
    sScript, hScript, sPlusH: sScript + hScript, shScript, shSerif,
    ligatureApplied: shScript < sScript + hScript,
    expectedLigAdvance: 76,
    kalishScript, kalishSerif,
    inputValue: inp.value,
    inputIsAscii: /^[\x20-\x7e]+$/.test(inp.value),
  };
});
console.log(JSON.stringify(probe, null, 1));
console.log('console errors:', errs.length ? errs : 'none');
await pg.screenshot({ path: './proof2.png', fullPage: true });
await br.close();
srv.close();
