import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const all = ()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('[data-do]')).map(e=>e.getAttribute('data-do')+'('+(e.getAttribute('data-a')||'')+')|'+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,26)));
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const typeIn = (sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
try{
await fresh(pg,'pro');
await goTo(pg,'gram','greet');
await click('[data-do="openSlot"]'); await pg.waitForTimeout(80);
log('where:', await where());
log('ALL buttons on the slot sheet:'); (await all()).forEach(x=>log('   '+x));
log('inputs:', JSON.stringify(await pg.evaluate(()=>[].slice.call(document.querySelectorAll('input,textarea')).map(e=>e.tagName+'#'+e.id+'.'+e.className+' data-in='+(e.getAttribute('data-in')||'')))));
log('\nnow type and see if a Save appears');
await typeIn('#wd-hw','vess');
await pg.waitForTimeout(80);
log('ALL buttons after typing:'); (await all()).forEach(x=>log('   '+x));
await shot(pg,'22-slot-no-save');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
