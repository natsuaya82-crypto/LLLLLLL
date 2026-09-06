import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
try{
for (const plan of ['free','plus','pro']){
  await fresh(pg,plan);
  await pg.evaluate(()=>{ go('words'); render(); }); await pg.waitForTimeout(60);
  await clickA('openWord','["kano"]'); await pg.waitForTimeout(80);
  const hasEdit = await pg.evaluate(()=>!!document.querySelector('[data-do="openEdit"]'));
  await clickA('openEdit'); await pg.waitForTimeout(90);
  const rd = await pg.evaluate(()=>{ const b=[].slice.call(document.querySelectorAll('#app [data-do="go"]'))
    .filter(e=>/spell/.test(e.getAttribute('data-a')||'')); return b.length? b[0].innerText.replace(/\s+/g,' ').trim():'no Reading row'; });
  log(`[${plan}] edit reachable=${hasEdit}  Reading row: ${JSON.stringify(rd)}`);
  if (rd!=='no Reading row'){
    await clickA('go','["spell"]'); await pg.waitForTimeout(90);
    const before = await pg.evaluate(()=>document.getElementById('app').innerHTML);
    const p = await clickA('spAdd','["t"]'); await pg.waitForTimeout(150);
    const after = await pg.evaluate(()=>document.getElementById('app').innerHTML);
    log(`   spAdd -> ${p}  page identical: ${before===after}  sp now: ${JSON.stringify(await pg.evaluate(()=>wEdit&&wEdit.sp))}`);
    log(`   where: ${await pg.evaluate(()=>here().r+':'+here().a)}`);
  }
}
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
