import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const typeIn=(sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
const toast=()=>pg.evaluate(()=>{const t=document.getElementById('toast');return t?(t.innerText||'').trim():null;});
const pop=()=>pg.evaluate(()=>{const p=document.getElementById('pop'); return p&&/\bon\b/.test(p.className)?(p.innerText||'').replace(/\n{2,}/g,'\n').trim():null;});
const where=()=>pg.evaluate(()=>here().r+':'+(here().a||''));
try{
log('# base 12 then the Numerals stage');
await fresh(pg,'pro'); await goTo(pg,'ltset','num');
for(let i=0;i<2;i++){ await clickA('numStepBase','[1]'); await pg.waitForTimeout(70); }
await goTo(pg,'gram','count');
log('  base:', await pg.evaluate(()=>numBase()));
log('  page:', JSON.stringify((await txt(pg)).slice(0,400)));
await shot(pg,'53-count-base12');

log('\n# a stage of my own (pro)');
await fresh(pg,'pro'); await goTo(pg,'gram');
log('  fab ->', await clickA('openOwnPhase'));
await pg.waitForTimeout(90);
log('  where:', await where(), 'text:', JSON.stringify((await txt(pg)).slice(0,300)));
await shot(pg,'54-own-form');
await typeIn('#st-t','Evidentials');
await typeIn('#st-w','seen\nheard\ntold');
log('  add ->', await clickA('stAddOwn')); await pg.waitForTimeout(140);
log('  toast:', JSON.stringify(await toast()), 'where:', await where());
log('  STG.extra:', JSON.stringify(await pg.evaluate(()=>STG.extra)));
log('  list tail:', JSON.stringify((await txt(pg)).slice(-260)));
await shot(pg,'55-own-added');
log('\n  open it');
const id = await pg.evaluate(()=>STG.extra[0].id);
await goTo(pg,'gram',id); await pg.waitForTimeout(60);
log('  page:', JSON.stringify(await txt(pg)));
await shot(pg,'56-own-stage');
log('\n  now drop to free and look at the list');
await pg.evaluate(()=>{ SET.plan='free'; render(); }); await goTo(pg,'gram'); await pg.waitForTimeout(60);
log('  free list tail:', JSON.stringify((await txt(pg)).slice(-300)));
log('  stHidden:', await pg.evaluate(()=>stHidden()));
await shot(pg,'57-own-hidden-free');
log('  and going straight to the hidden stage on free:');
const e2 = await goTo(pg,'gram',id); await pg.waitForTimeout(60);
log('   err=', e2, 'where=', await where(), 'page=', JSON.stringify((await txt(pg)).slice(0,300)));
await shot(pg,'58-own-hidden-direct');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
