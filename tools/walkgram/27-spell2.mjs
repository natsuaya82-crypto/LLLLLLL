import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const w=()=>pg.evaluate(()=>({ stored:JSON.parse(JSON.stringify((findWord('kano')||{}).sp||null)),
  edit:(wEdit&&wEdit.sp)?JSON.parse(JSON.stringify(wEdit.sp)):null, where:here().r+':'+here().a }));
try{
await fresh(pg,'pro');
await pg.evaluate(()=>{ openEdit('kano'); }); await pg.waitForTimeout(60);
log('word sheet:', JSON.stringify(await w()));
log('sheet says:', JSON.stringify((await txt(pg)).slice(0,60)));
await pg.evaluate(()=>{ go('spell'); render(); }); await pg.waitForTimeout(80);
await clickA('spAdd','["t"]'); await pg.waitForTimeout(120);
log('after one press on the Reading page:', JSON.stringify(await w()));
await clickA('back'); await pg.waitForTimeout(140);
log('back on the sheet:', JSON.stringify(await w()));
log('sheet says:', JSON.stringify((await txt(pg)).slice(0,60)));
log('press Save ->', await clickA('keepPress')); await pg.waitForTimeout(200);
log('after Save:', JSON.stringify(await w()));
log('page:', JSON.stringify((await txt(pg)).slice(0,160)));
await shot(pg,'73-spell-saved');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
