import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const typeIn=(sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
const toast=()=>pg.evaluate(()=>{const t=document.getElementById('toast');return t?(t.innerText||'').trim():null;});
try{
await fresh(pg,'pro');
log('# make a REAL word through the dictionary, then edit its reading');
await pg.evaluate(()=>{ go('words'); render(); }); await pg.waitForTimeout(60);
await clickA('openAdd'); await pg.waitForTimeout(90);
await typeIn('#wd-ln','vess'); await pg.waitForTimeout(60);
await typeIn('#wd-mn','oath'); await pg.waitForTimeout(60);
log('  addOne ->', await clickA('addOne')); await pg.waitForTimeout(200);
log('  toast:', JSON.stringify(await toast()));
log('  word:', JSON.stringify(await pg.evaluate(()=>findWord('vess'))));
await pg.evaluate(()=>{ openEdit('vess'); }); await pg.waitForTimeout(80);
log('  sheet:', JSON.stringify((await txt(pg)).slice(0,70)));
log('  wEdit.sp:', JSON.stringify(await pg.evaluate(()=>wEdit.sp)));
await pg.evaluate(()=>{ go('spell'); render(); }); await pg.waitForTimeout(80);
const b1 = await pg.evaluate(()=>document.getElementById('app').innerHTML);
log('  Reading page:', JSON.stringify((await txt(pg)).slice(0,60)));
await clickA('spAdd','["t"]'); await pg.waitForTimeout(150);
const b2 = await pg.evaluate(()=>document.getElementById('app').innerHTML);
log('  page identical after the press:', b1===b2);
log('  wEdit.sp now:', JSON.stringify(await pg.evaluate(()=>wEdit.sp)));
log('  spWord:', JSON.stringify(await pg.evaluate(()=>spWord(wEdit.sp))), ' spPh:', JSON.stringify(await pg.evaluate(()=>spPh(wEdit.sp))));
await clickA('back'); await pg.waitForTimeout(120);
log('  sheet says:', JSON.stringify((await txt(pg)).slice(0,80)));
await clickA('keepPress'); await pg.waitForTimeout(250);
log('  after Save, word vess:', JSON.stringify(await pg.evaluate(()=>findWord('vess'))));
await pg.evaluate(()=>{ go('words'); render(); }); await pg.waitForTimeout(80);
log('  dictionary:', JSON.stringify((await txt(pg)).slice(0,200)));
await shot(pg,'75-real-word-reading');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
