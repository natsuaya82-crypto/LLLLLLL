import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const clickDo = (name,n)=>click('[data-do="'+name+'"]', n);
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const toast = ()=>pg.evaluate(()=>{const t=document.getElementById('toast'); return t?(t.innerText||'').trim():null;});
const pop = ()=>pg.evaluate(()=>{const p=document.getElementById('pop'); return p&&p.className.indexOf('on')>=0?(p.innerText||'').replace(/\n{2,}/g,'\n').trim():null;});
const typeIn = (sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
try{
await fresh(pg,'pro');
log('# A. the rule field: type, Save, back, reopen');
await goTo(pg,'gram','neg'); await clickDo('openStRules'); await pg.waitForTimeout(50);
log('  type ->', await typeIn('#app textarea','NEG goes before the verb'));
log('  STG.rules.neg (before Save):', JSON.stringify(await pg.evaluate(()=>STG.rules.neg)));
await clickDo('keepPress'); await pg.waitForTimeout(80);
log('  after Save: toast=', JSON.stringify(await toast()), 'STG.rules.neg=', JSON.stringify(await pg.evaluate(()=>STG.rules.neg)), 'where=', await where());
await clickDo('back'); await pg.waitForTimeout(60);
log('  back to:', await where(), JSON.stringify(await txt(pg)));
await clickDo('openStRules'); await pg.waitForTimeout(60);
log('  reopened, textarea says:', JSON.stringify(await pg.evaluate(()=>{const e=document.querySelector('#app textarea'); return e?e.value:null;})));

log('\n# B. type and DO NOT save, then back');
log('  type ->', await typeIn('#app textarea','something else entirely'));
await clickDo('back'); await pg.waitForTimeout(120);
log('  pop:', JSON.stringify(await pop()), 'where:', await where());
log('  page:', JSON.stringify(await txt(pg)));
await shot(pg,'12-rule-unsaved-back');
log('  STG.rules.neg:', JSON.stringify(await pg.evaluate(()=>STG.rules.neg)));
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
