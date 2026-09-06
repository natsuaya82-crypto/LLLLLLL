import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const clickDo = (name,n)=>click('[data-do="'+name+'"]', n);
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const nav = ()=>pg.evaluate(()=>NAV.map(x=>x.r+':'+(x.a||'')).join(' > '));
const pop = ()=>pg.evaluate(()=>{const p=document.getElementById('pop'); return p?{cls:p.className,txt:(p.innerText||'').replace(/\n{2,}/g,'\n').trim()}:null;});
const typeIn = (sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
try{
await fresh(pg,'pro');
await goTo(pg,'gram','neg');
log('nav:', await nav());
await clickDo('openStRules'); await pg.waitForTimeout(60);
log('after openStRules  where=', await where(), ' nav=', await nav());
log('type');
await typeIn('#app textarea','NEG before the verb');
await clickDo('keepPress'); await pg.waitForTimeout(100);
log('after Save  where=', await where(), ' pop=', JSON.stringify(await pop()));
log('press back');
log('  back btn ->', await clickDo('back'));
await pg.waitForTimeout(150);
log('  where=', await where(), ' nav=', await nav(), ' pop=', JSON.stringify(await pop()));
log('  page=', JSON.stringify(await txt(pg)));
await shot(pg,'13-after-save-back');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
