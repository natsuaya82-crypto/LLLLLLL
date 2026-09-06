import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const state = () => pg.evaluate(()=>({fm:(STG.fm||[]).map(r=>({id:r.id,pos:r.pos,fm:r.fm,at:r.at,add:(r.add||[]).map(x=>x.u).join('')}))}));
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
try{
await fresh(pg,'pro');
await goTo(pg,'gram','v2:pl');
log('A. add a rule, then press back without typing anything');
await click('#app [data-do="fmrNew"]');
await pg.waitForTimeout(60);
log('  in the form. back:', await click('#app [data-do="back"]'));
await pg.waitForTimeout(80);
log('  where:', JSON.stringify(await pg.evaluate(()=>({r:here().r,a:here().a}))));
log('  page :', JSON.stringify(await txt(pg)));
log('  state:', JSON.stringify(await state()));
log('  btns :', JSON.stringify(await buttons(pg)));
await shot(pg,'02-pl-empty-rule');

log('\nB. Select -> tick the empty rule -> bin');
await click('#app [data-do="g2SelOn"]');
await pg.waitForTimeout(50);
log('  select mode page:', JSON.stringify(await txt(pg)));
log('  btns :', JSON.stringify(await buttons(pg)));
await shot(pg,'03-pl-select');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
