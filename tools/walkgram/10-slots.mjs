import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const clickDo = (name,n)=>click('[data-do="'+name+'"]', n);
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const toast = ()=>pg.evaluate(()=>{const t=document.getElementById('toast'); return t?(t.innerText||'').trim():null;});
const typeIn = (sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
try{
await fresh(pg,'pro');
log('# filling a slot: greet -> yes');
await goTo(pg,'gram','greet');
log('  page:', JSON.stringify(await txt(pg)));
log('  btns:', JSON.stringify(await buttons(pg)));
await clickDo('openSlot'); await pg.waitForTimeout(80);
log('  where:', await where());
log('  form :', JSON.stringify(await txt(pg)));
await shot(pg,'20-slot-yes');
log('  btns :', JSON.stringify(await buttons(pg)));
log('  type a headword');
log('   ->', await typeIn('#app #wd-hw, #app input, #app textarea','vess'));
await pg.waitForTimeout(60);
const kp = await clickDo('keepPress');
log('  keepPress ->', kp, ' where=', await where(), ' toast=', JSON.stringify(await toast()));
log('  WORDS:', JSON.stringify(await pg.evaluate(()=>WORDS.map(w=>w.hw+(w.slot?'['+w.slot+']':'')).join(' '))));
log('  page now:', JSON.stringify(await txt(pg)));
await shot(pg,'21-greet-after');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
