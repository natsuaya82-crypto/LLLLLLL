/* nl-measure — r160: where a newline goes in every field. Not a gate check.
   For every textarea/input on every route and every face the fixture holds:
   (1) what the Lingua keyboard sends: insertText("\n") at the end
   (2) what a real Enter key press does (Playwright keyboard)
   and records the value, the IN receiver's arguments, and KD. */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed, halfDone } from './fixture.mjs';
import { chromium, LAUNCH } from './browser.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const PORT = 8391;
const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'text/plain; charset=utf-8';
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  let d = null; try { d = fs.readFileSync(f); } catch (e) {}
  if (d === null) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': mime(f) }); res.end(d);
});
await new Promise(r => srv.listen(PORT, r));
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport: { width: 390, height: 844 } });
pg.on('pageerror', () => {});
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.evaluate('window.__seed = ' + seed.toString());
await pg.evaluate('window.__halfDone = ' + halfDone.toString());
await pg.evaluate(() => {
  window.__seed(); SET.walked = true; SET.ui = 'en';
  window.pageWait = function (r, a, done) { done(true); };
  window.__faces = [];
  Object.keys(PAGES).forEach((r) => window.__faces.push(['route', r]));
  window.__halfDone().forEach(([label], i) => window.__faces.push(['face', label, i]));
  window.__show = (k) => {
    const f = window.__faces[k], app = document.getElementById('app');
    window.__seed(); SET.walked = true;
    if (f[0] === 'route') { window.route = f[1]; NAV = [{ r: f[1] }]; render(); }
    else { app.innerHTML = window.__halfDone()[f[2]][1](); }
  };
  window.__got = [];
  window.__real = {};
  Object.keys(ACT_IN).forEach((k) => { window.__real[k] = ACT_IN[k];
    ACT_IN[k] = function () { window.__got.push([k, [].slice.call(arguments)]); }; });
  window.__kd = [];
  Object.keys(ACT_KEY).forEach((k) => { ACT_KEY[k] = function () { window.__kd.push(k); }; });
});
const nFaces = await pg.evaluate(() => window.__faces.length);
const rows = {};
for (let k = 0; k < nFaces; k++) {
  let fields;
  try {
    fields = await pg.evaluate((k) => {
      try { window.__show(k); } catch (e) { return []; }
      return [...document.getElementById('app').querySelectorAll('textarea,input')]
        .filter((el) => !['range','file','checkbox','radio','hidden','button','submit'].includes(el.type))
        .map((el, i) => ({ i, tag: el.tagName.toLowerCase(), id: el.id, cls: el.className,
          in: el.getAttribute('data-in') || (el.closest('[data-in]') || {getAttribute(){return ''}}).getAttribute('data-in'),
          kd: el.getAttribute('data-kd') || '', ch: el.getAttribute('data-ch') || '',
          ekh: el.getAttribute('enterkeyhint') || '', face: window.__faces[k].slice(0, 2).join(':') }));
    }, k);
  } catch (e) { continue; }
  for (const f of fields) {
    const key = f.tag + '#' + (f.id || '?') + ' .' + f.cls;
    if (rows[key]) { rows[key].faces++; continue; }
    /* (1) insertText "\n" */
    const ins = await pg.evaluate(([k, i]) => {
      window.__show(k);
      const el = [...document.getElementById('app').querySelectorAll('textarea,input')]
        .filter((el) => !['range','file','checkbox','radio','hidden','button','submit'].includes(el.type))[i];
      if (!el) return null;
      window.__got = []; window.__kd = [];
      el.focus(); el.value = 'ab'; try{ el.setSelectionRange(2, 2); }catch(e){}
      let bi = null;
      el.addEventListener('beforeinput', (e) => { bi = e.inputType + (e.defaultPrevented ? '(prevented)' : ''); }, { once: true });
      document.execCommand('insertText', false, '\n');
      document.execCommand('insertText', false, 'c');
      const inArg = window.__got.length ? JSON.stringify(window.__got[window.__got.length - 1][1][0]) : '-';
      return { v: JSON.stringify(el.value), bi, inArg, kd: window.__kd.join(',') };
    }, [k, f.i]);
    /* (2) real Enter */
    await pg.evaluate(([k, i]) => {
      window.__show(k);
      const el = [...document.getElementById('app').querySelectorAll('textarea,input')]
        .filter((el) => !['range','file','checkbox','radio','hidden','button','submit'].includes(el.type))[i];
      window.__got = []; window.__kd = [];
      el.setAttribute('data-nl', '1'); el.focus(); el.value = 'ab'; try{ el.setSelectionRange(2, 2); }catch(e){}
    }, [k, f.i]);
    let ent = null;
    try {
      await pg.keyboard.press('Enter');
      await pg.keyboard.type('c');
      ent = await pg.evaluate(() => {
        const el = document.querySelector('[data-nl]');
        const inArg = window.__got.length ? JSON.stringify(window.__got[window.__got.length - 1][1][0]) : '-';
        return { v: el ? JSON.stringify(el.value) : '(gone)', inArg, kd: window.__kd.join(',') };
      });
    } catch (e) { ent = { v: 'ERR ' + e.message.slice(0, 40) }; }
    rows[key] = { ...f, faces: 1, ins, ent };
  }
}
await br.close(); srv.close();
const out = Object.values(rows);
fs.writeFileSync(process.argv[2] || '/dev/stdout', JSON.stringify(out, null, 1));
console.log('faces', nFaces, 'distinct fields', out.length);
