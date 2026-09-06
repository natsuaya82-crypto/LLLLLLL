import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const snap=()=>pg.evaluate(()=>({
  sp:(wEdit&&wEdit.sp)?JSON.parse(JSON.stringify(wEdit.sp)):null,
  head:(document.querySelector('#app .whd')||{innerText:''}).innerText.trim(),
  sub:(document.querySelector('#app .wsub')||{innerText:''}).innerText.trim(),
  htmlLen:document.getElementById('app').innerHTML.length }));
try{
await fresh(pg,'pro');
await pg.evaluate(()=>{ openEdit('kano'); }); await pg.waitForTimeout(60);
await pg.evaluate(()=>{ go('spell'); render(); }); await pg.waitForTimeout(80);
log('before:', JSON.stringify(await snap()));
await clickA('spAdd','["t"]'); await pg.waitForTimeout(120);
log('after t:', JSON.stringify(await snap()));
await clickA('spAdd','["s"]'); await pg.waitForTimeout(120);
log('after s:', JSON.stringify(await snap()));
await shot(pg,'71-spell-pressed');
log('back to the word sheet');
await clickA('back'); await pg.waitForTimeout(120);
log('  where:', await pg.evaluate(()=>here().r+':'+here().a));
log('  page:', JSON.stringify((await txt(pg)).slice(0,220)));
await shot(pg,'72-word-after-spell');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
