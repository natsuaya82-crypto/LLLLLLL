import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const all = ()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]'))
  .map(e=>e.getAttribute('data-do')+' '+(e.getAttribute('data-a')||'')+' :: '+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,30)));
try{
await fresh(pg,'pro');
for (const r of ['letters','ltset','wsys','abugida','spell']){
  const e = await goTo(pg,r);
  log(`\n### ${r}  err=${e||'-'}`);
  log('  text:', JSON.stringify((await txt(pg)).slice(0,400)));
  const b = await all(); log('  btns('+b.length+'):'); b.slice(0,25).forEach(x=>log('    '+x));
}
log('\n### the sounds sheet for one letter (openSnd)');
await fresh(pg,'pro');
await goTo(pg,'letters');
await pg.evaluate(()=>{ openSnd(LETTERS[0].id); });
await pg.waitForTimeout(80);
log('  where:', await pg.evaluate(()=>here().r+':'+here().a));
log('  text:', JSON.stringify((await txt(pg)).slice(0,600)));
const b2 = await all(); log('  btns('+b2.length+') first 25:'); b2.slice(0,25).forEach(x=>log('    '+x));
await shot(pg,'40-snd-sheet');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
