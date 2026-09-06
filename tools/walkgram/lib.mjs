/* my own walker — not a gate, not committed to tools/ proper */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed, halfDone } from '../fixture.mjs';
import { chromium, LAUNCH } from '../browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const WWW = path.join(ROOT, 'www');
export const OUT = path.join(ROOT, 'shots', 'walk-gram');
const PORT = 8153;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };

export async function open(){
  const srv = http.createServer((q,r)=>{
    const f = path.join(WWW, q.url==='/'?'index.html':q.url.split('?')[0]);
    let b; try{ b = fs.readFileSync(f); }catch(e){ r.writeHead(404); r.end(); return; }
    r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain','Cache-Control':'no-store'});
    r.end(b);
  }).listen(PORT);
  fs.mkdirSync(OUT,{recursive:true});
  const br = await chromium.launch(LAUNCH);
  const pg = await br.newPage({ viewport:{width:402,height:874}, deviceScaleFactor:3, hasTouch:true });
  const errs = [];
  pg.on('pageerror', e => errs.push('pageerror: ' + (e && e.message || e)));
  pg.on('console', m => { if (m.type()==='error') errs.push('console.error: ' + m.text()); });
  await pg.goto(`http://localhost:${PORT}/`);
  await pg.waitForSelector('#splash',{state:'detached',timeout:15000});
  await pg.evaluate('window.__seed = ' + seed.toString());
  await pg.evaluate('window.HALF = (' + halfDone.toString() + ')()');
  const cdp = await pg.context().newCDPSession(pg);
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  return { br, srv, pg, errs, cdp,
    close: async () => { await br.close(); srv.close(); } };
}

/* seed + silence the no-network popup + past the onboarding */
export async function fresh(pg, plan, opt){
  await pg.evaluate(({p,wire})=>{
    window.__seed();
    SET.done = true;
    if (p) SET.plan = p;
    window.netPop = function(){};
    /* AS IF THERE WERE A SIGNAL. There is no network in this container, so
       netSaveNow() answers false and every Save in the app correctly refuses
       to level its buffer or leave the screen (rule 11). That is the app being
       right, not a bug -- and it hides everything a save DOES. So the wire is
       stubbed to say it landed, and anything found here is the app's own. */
    if (wire !== false) window.netSaveNow = function(done){ if(done) done(true); };
    if (typeof applyTheme==='function') applyTheme();
  }, {p:plan||'free', wire:(opt&&opt.wire)});
}

export async function goTo(pg, r, a){
  return pg.evaluate(({r,a})=>{
    try{ go(r, a===undefined?undefined:a); render(); return null; }
    catch(e){ return String(e&&e.message||e); }
  },{r,a});
}

export async function shot(pg, name){
  const f = path.join(OUT, name.replace(/[:/#]+/g,'-') + '.png');
  await pg.screenshot({ path:f, fullPage:true });
  return path.relative(ROOT, f);
}

/* a real click on the nth element matching sel inside #app (or anywhere) */
export async function clickSel(pg, sel, n){
  return pg.evaluate(({sel,n})=>{
    const els = document.querySelectorAll(sel);
    if (!els[n||0]) return 'no such element: '+sel+' #'+(n||0);
    els[n||0].click();
    return null;
  },{sel,n:n||0});
}

/* a real browser touch drag through CDP */
export async function drag(cdp, pg, x1,y1,x2,y2, steps){
  steps = steps || 12;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
  await pg.waitForTimeout(60);
  for (let i=1;i<=steps;i++){
    const x = x1 + (x2-x1)*i/steps, y = y1 + (y2-y1)*i/steps;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
    await pg.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await pg.waitForTimeout(120);
}

export async function txt(pg){
  return pg.evaluate(()=>{
    const a = document.getElementById('app');
    return a ? a.innerText.replace(/\n{2,}/g,'\n').trim() : '(no #app)';
  });
}

export async function buttons(pg){
  return pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]'))
    .map((e,i)=>({i, do:e.getAttribute('data-do'), a:e.getAttribute('data-a')||'',
                  txt:(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,40)})));
}
