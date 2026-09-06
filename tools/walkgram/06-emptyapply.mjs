import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const st = () => pg.evaluate(()=>({fm:(STG.fm||[]).map(r=>r.id+'/'+r.fm+'/'+(r.add||[]).map(x=>x.u).join('')||'(none)'), words:WORDS.length, hws:WORDS.map(w=>w.hw).join(' ')}));
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const toast = ()=>pg.evaluate(()=>{const t=document.getElementById('toast'); return t?(t.innerText||'').trim():null;});
try{
await fresh(pg,'pro');
// make an empty rule via the real button, back out
await goTo(pg,'gram','v2:pl');
await click('#app [data-do="fmrNew"]'); await pg.waitForTimeout(50);
await click('#app [data-do="back"]'); await pg.waitForTimeout(60);
log('two rules now:', JSON.stringify(await st()));
log('page:', JSON.stringify(await txt(pg)));
log('press the words button');
await click('#app [data-do="fmrAddAll"]'); await pg.waitForTimeout(120);
log('  toast:', JSON.stringify(await toast()));
log('  state:', JSON.stringify(await st()));
log('  page :', JSON.stringify(await txt(pg)));
await shot(pg,'06-pl-after-empty-make');
log('press it again');
await click('#app [data-do="fmrAddAll"]'); await pg.waitForTimeout(120);
log('  toast:', JSON.stringify(await toast()));
log('  state:', JSON.stringify(await st()));
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
