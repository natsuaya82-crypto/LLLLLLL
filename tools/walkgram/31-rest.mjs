import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const btns=()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]'))
  .map(e=>e.getAttribute('data-do')+' '+(e.getAttribute('data-a')||'')+' :: '+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,26)));
try{
await fresh(pg,'pro');
for (const a of ['month','wday','verb','noun','have','polite','desc','part']){
  await fresh(pg,'pro'); await goTo(pg,'gram',a); await pg.waitForTimeout(50);
  log(`\n### gram:${a}`);
  log('  ', JSON.stringify((await txt(pg)).slice(0,300)));
  const b=await btns(); log('  btns('+b.length+'):'); b.slice(0,8).forEach(x=>log('    '+x));
  await shot(pg,'80-stage-'+a);
}
log('\n### gram:v2:n and gram:v2:st and gram:v2:order');
for (const a of ['v2:n','v2:st','v2:order']){
  await fresh(pg,'pro'); await goTo(pg,'gram',a); await pg.waitForTimeout(50);
  log(`  [${a}]`, JSON.stringify((await txt(pg)).slice(0,300)));
  const b=await btns(); b.forEach(x=>log('    '+x));
  await shot(pg,'81-chap-'+a.replace(':','-'));
}
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
