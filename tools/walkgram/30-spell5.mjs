import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const typeIn=(sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
try{
await fresh(pg,'pro');
await pg.evaluate(()=>{ go('words'); render(); }); await pg.waitForTimeout(60);
await clickA('openAdd'); await pg.waitForTimeout(90);
await typeIn('#wd-ln','vess'); await typeIn('#wd-mn','oath'); await pg.waitForTimeout(60);
await clickA('addOne'); await pg.waitForTimeout(200);
await pg.evaluate(()=>{ openEdit('vess'); }); await pg.waitForTimeout(80);
await pg.evaluate(()=>{ go('spell'); render(); }); await pg.waitForTimeout(80);
await clickA('spAdd','["t"]'); await pg.waitForTimeout(150);
await clickA('back'); await pg.waitForTimeout(120);
await clickA('keepPress'); await pg.waitForTimeout(300);
log('after Save where=', await pg.evaluate(()=>here().r+':'+here().a));
log('reopen the word:');
await pg.evaluate(()=>{ openEdit('vess'); render(); }); await pg.waitForTimeout(120);
log('  sheet:', JSON.stringify((await txt(pg)).slice(0,90)));
log('  stored sp:', JSON.stringify(await pg.evaluate(()=>findWord('vess').sp)));
log('  spPh:', JSON.stringify(await pg.evaluate(()=>spPh(findWord('vess').sp))));
log('  phIpa:', JSON.stringify(await pg.evaluate(()=>phIpa(spPh(findWord('vess').sp)))));
log('  wPh:', JSON.stringify(await pg.evaluate(()=>wPh(findWord('vess')))));
await shot(pg,'76-reading-reopened');
await pg.evaluate(()=>{ go('words'); render(); }); await pg.waitForTimeout(90);
const row = await pg.evaluate(()=>{ const b=[].slice.call(document.querySelectorAll('#app [data-do="openWord"]'))
  .filter(e=>/vess/.test(e.getAttribute('data-a')||'')); return b[0]?b[0].innerText.replace(/\s+/g,' ').trim():'no row'; });
log('  dictionary row:', JSON.stringify(row));
await shot(pg,'77-dict-row');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
