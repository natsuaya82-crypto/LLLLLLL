import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const typeIn=(sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
const bar=()=>pg.evaluate(()=>{const n=document.querySelector('#app .navtop, #app .nav, #app .top'); 
  return [].slice.call(document.querySelectorAll('#app [data-do]')).slice(0,4).map(e=>e.getAttribute('data-do')+'|'+(e.innerText||'').trim().slice(0,14));});
const where=()=>pg.evaluate(()=>here().r+':'+(here().a||''));
try{
await fresh(pg,'pro'); await goTo(pg,'gram');
await clickA('openOwnPhase'); await pg.waitForTimeout(80);
await typeIn('#st-t','Evidentials'); await typeIn('#st-w','seen\nheard\ntold');
await clickA('stAddOwn'); await pg.waitForTimeout(140);
const id = await pg.evaluate(()=>STG.extra[0].id);
log('standing on my own stage at pro');
await pg.evaluate(({id})=>{ stOpen(id); },{id}); await pg.waitForTimeout(80);
log('  where=', await where(), ' first btns=', JSON.stringify(await bar()));
log('  page=', JSON.stringify((await txt(pg)).slice(0,200)));
log('\nthe plan ends while standing there');
await pg.evaluate(()=>{ SET.plan='free'; render(); }); await pg.waitForTimeout(90);
log('  where=', await where());
log('  first btns=', JSON.stringify(await bar()));
log('  page=', JSON.stringify((await txt(pg)).slice(0,200)));
await shot(pg,'60-own-stage-lapsed');
log('  KEEP keys=', JSON.stringify(await pg.evaluate(()=>Object.keys(KEEP))));
log('  press that Save ->', await clickA('keepPress')); await pg.waitForTimeout(150);
log('  where=', await where(), ' page=', JSON.stringify((await txt(pg)).slice(0,140)));
await shot(pg,'61-own-lapsed-saved');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
