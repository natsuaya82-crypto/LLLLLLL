import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
try{
for (const plan of ['free','pro']){
  await fresh(pg,plan);
  await goTo(pg,'gram');
  log('['+plan+'] list rows:');
  const rows = await pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]'))
    .map(e=>e.getAttribute('data-do')+' '+(e.getAttribute('data-a')||'')+' :: '+(e.innerText||'').replace(/\s+/g,' ').trim().slice(0,40)));
  rows.forEach(r=>log('   '+r));
  log('   text:', JSON.stringify(await txt(pg)));
  await shot(pg,'30-gram-list-'+plan);
}
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ await S.close(); process.exit(0);}
