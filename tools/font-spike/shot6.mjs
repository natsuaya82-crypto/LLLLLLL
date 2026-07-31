// Render index6.html to proof6.png and assert the page is showing what it claims:
// six real faces loaded (not the fallback UI font), the kana reference face present,
// the cell grid still exact at 17px, and no console errors.
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;
const HERE = new URL('.', import.meta.url).pathname;

const html = fs.readFileSync(HERE + 'index6.html');
const srv = http.createServer((rq, rs) => {
  if (rq.url !== '/') { rs.writeHead(204); rs.end(); return; }
  rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  rs.end(html);
}).listen(8194);

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 2 });
const errs = [];
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
await pg.goto('http://127.0.0.1:8194/', { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: HERE + 'proof6.png', fullPage: true });

const IDS = ['asdrawn-60', 'asdrawn-90', 'center-60', 'center-90', 'fit-60', 'fit-90'];
const probe = await pg.evaluate(async (IDS) => {
  await Promise.all(IDS.map(id => document.fonts.load('17px "V6-' + id + '"', 'ashiklt')));
  const cnv = document.createElement('canvas');
  const cx = cnv.getContext('2d');
  const wid = (fam, s, px) => { cx.font = px + 'px "' + fam + '"'; return cx.measureText(s).width; };
  const rows = IDS.map(id => {
    const f = 'V6-' + id;
    const cell = wid(f, 'a', 17);
    const letters = ['a', 'i', 'k', 'l', 's', 't'];
    let worst = 0;
    for (const p of letters) for (const q of letters) {
      const d = Math.abs(wid(f, p + q, 17) - 2 * cell);
      if (d > worst) worst = d;
    }
    return {
      id,
      loaded: document.fonts.check('17px "' + f + '"', 'ashiklt'),
      cell17: +cell.toFixed(3),
      uniform: new Set(letters.map(c => wid(f, c, 17).toFixed(3))).size === 1,
      worstPairErr: +worst.toFixed(3),
      lig: wid(f, 'sh', 17) < wid(f, 's', 17) + wid(f, 'h', 17) - 0.5,
    };
  });
  return {
    rows,
    faces: [...document.fonts].length,
    unloaded: [...document.fonts].filter(f => f.status !== 'loaded').map(f => f.family),
    kana: document.fonts.check('17px "Noto Sans CJK JP"', 'あしき'),
    sections: document.querySelectorAll('.sec').length,
    optRows: document.querySelectorAll('.opt').length,
  };
}, IDS);

console.log('faces: ' + probe.faces
  + (probe.unloaded.length ? '   NOT LOADED: ' + probe.unloaded.join(',') : '   all loaded'));
console.log('kana reference present: ' + probe.kana);
console.log('sections: ' + probe.sections + '   compared lines: ' + probe.optRows);
console.log('\n  face             cell @17px   uniform   worst pair err   sh liga');
for (const r of probe.rows) {
  console.log('  ' + r.id.padEnd(14) + String(r.cell17).padStart(10)
    + String(r.uniform ? 'yes' : 'NO').padStart(10)
    + String(r.worstPairErr + 'px').padStart(17) + String(r.lig).padStart(10)
    + (r.loaded ? '' : '   FALLBACK'));
}
console.log('\nconsole errors: ' + (errs.length ? errs.join(' | ') : 'none'));
fs.writeFileSync(HERE + 'shot6.json', JSON.stringify({ probe, errs }, null, 1));
console.log('proof6.png ' + (fs.statSync(HERE + 'proof6.png').size / 1024).toFixed(0) + ' KB');
await br.close();
srv.close();
