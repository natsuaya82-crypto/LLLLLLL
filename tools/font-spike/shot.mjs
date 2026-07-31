import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;

const html = fs.readFileSync('/tmp/fontspike/index.html');
const srv = http.createServer((rq, rs) => {
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(html);
}).listen(8177);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 900, height: 1250 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('http://127.0.0.1:8177/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);

// Prove the font really loaded and the glyphs really have outlines.
const probe = await pg.evaluate(() => {
  const loaded = [...document.fonts].map(f => f.family + ':' + f.status);
  const el = document.querySelector('.script');
  const r = el.getBoundingClientRect();
  // measure PUA char width vs a fallback char to confirm the font is in use
  const c = document.createElement('canvas').getContext('2d');
  c.font = '100px LinguaScript';
  const w = c.measureText('').width;
  c.font = '100px serif';
  const wf = c.measureText('').width;
  return { loaded, firstLineHeight: Math.round(r.height), puaWidth: Math.round(w), fallbackWidth: Math.round(wf) };
});
console.log(JSON.stringify(probe, null, 1));
console.log('console errors:', errs.length ? errs : 'none');
await pg.screenshot({ path: '/tmp/fontspike/proof.png', fullPage: true });
await br.close();
srv.close();
