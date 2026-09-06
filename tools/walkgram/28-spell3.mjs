import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
try{
await fresh(pg,'pro');
await pg.evaluate(()=>{ openEdit('kano'); }); await pg.waitForTimeout(60);
await pg.evaluate(()=>{ go('spell'); render(); }); await pg.waitForTimeout(80);
const before = await pg.evaluate(()=>document.getElementById('app').innerHTML);
await clickA('spAdd','["t"]'); await pg.waitForTimeout(150);
const after = await pg.evaluate(()=>document.getElementById('app').innerHTML);
log('the page is byte-identical after the press:', before===after, '(', before.length, 'chars )');
log('wEdit.sp:', JSON.stringify(await pg.evaluate(()=>wEdit.sp)));
await clickA('back'); await pg.waitForTimeout(120);
await clickA('keepPress'); await pg.waitForTimeout(250);
log('the word after Save:', JSON.stringify(await pg.evaluate(()=>findWord('kano'))));
log('and the dictionary row:');
await pg.evaluate(()=>{ go('words'); render(); }); await pg.waitForTimeout(80);
log('  ', JSON.stringify((await txt(pg)).slice(0,120)));
await shot(pg,'74-words-after');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
