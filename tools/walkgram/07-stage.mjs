import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const clickDo = (name,n)=>click('#app [data-do="'+name+'"]', n);
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const toast = ()=>pg.evaluate(()=>{const t=document.getElementById('toast'); return t?(t.innerText||'').trim():null;});
const type = (id,v)=>pg.evaluate(({id,v})=>{const e=document.getElementById(id); if(!e) return 'no #'+id;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return null;},{id,v});
try{
await fresh(pg,'pro');
await goTo(pg,'gram','neg');
log('# stage neg');
log('  page:', JSON.stringify(await txt(pg)));
log('  btns:', JSON.stringify(await buttons(pg)));
await shot(pg,'10-stage-neg');

log('\n## the rules field (Lines / >>-)');
const r1 = await clickDo('openStRules');
log('  openStRules ->', r1, await where());
log('  screen:', JSON.stringify(await txt(pg)));
log('  btns:', JSON.stringify(await buttons(pg)));
await shot(pg,'11-neg-rules');
log('  type into it');
log('  ->', await type('st-rules','a rule I typed'));
await pg.waitForTimeout(50);
log('  STG.rules.neg now:', JSON.stringify(await pg.evaluate(()=>STG.rules.neg)));
log('  bar buttons:', JSON.stringify(await pg.evaluate(()=>[].slice.call(document.querySelectorAll('[data-do]')).map(e=>e.getAttribute('data-do')+'|'+(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,20)))));
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
