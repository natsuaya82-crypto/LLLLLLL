import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const state = () => pg.evaluate(()=>({fm:(STG.fm||[]).map(r=>({id:r.id,pos:r.pos,fm:r.fm,at:r.at,drop:r.drop,when:r.when,add:(r.add||[]).map(x=>x.u).join('')})), words:WORDS.length}));
const where = () => pg.evaluate(()=>({r:here().r,a:here().a,form:(typeof FORM!=='undefined'&&FORM)?FORM:null}));
const scr = () => pg.evaluate(()=>{const s=document.getElementById('sheet'),a=document.getElementById('app');
  return {sheet:(s&&s.innerText||'').replace(/\n{2,}/g,'\n').trim().slice(0,500), app:(a&&a.innerText||'').replace(/\n{2,}/g,'\n').trim().slice(0,500)};});
try{
await fresh(pg,'pro');
await goTo(pg,'gram','v2:pl');
log('pl page  :', JSON.stringify(await txt(pg)));
log('buttons  :', JSON.stringify(await buttons(pg)));
log('state    :', JSON.stringify(await state()));
await pg.evaluate(()=>{ const b=document.querySelector('#app [data-do="fmrNew"]'); if(b) b.click(); });
await pg.waitForTimeout(80);
log('\nafter fmrNew where:', JSON.stringify(await where()));
log('  screen:', JSON.stringify(await scr()));
log('  state :', JSON.stringify(await state()));
log('  btns  :', JSON.stringify(await buttons(pg)));
await shot(pg,'01-fmr-new');
} catch(e){ log('THREW', e && e.stack || e); }
finally { if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION/.test(x)))); await S.close(); process.exit(0); }
