import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const typeIn = (sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
try{
for (const plan of ['free','plus','pro']){
  await fresh(pg,plan);
  await goTo(pg,'gram');
  const row = await pg.evaluate(()=>{ const b=[].slice.call(document.querySelectorAll('#app [data-do="stOpen"]'));
    let t=null; for(const e of b) if(/greet/.test(e.getAttribute('data-a')||'')) t=e;
    if(!t) return 'no greet row';
    t.click(); return t.getAttribute('data-a'); });
  await pg.waitForTimeout(60);
  log(`[${plan}] row=${row} where=${await where()}`);
  const os = await click('#app [data-do="openSlot"]'); await pg.waitForTimeout(100);
  log(`   openSlot -> ${os} where=${await where()}`);
  const ty = await typeIn('#wd-ln','vess'); await pg.waitForTimeout(80);
  const s = await pg.evaluate(()=>({ addOn:(typeof wdAddOn==='function'&&wEdit)?wdAddOn():'no wEdit',
    spelled:(wEdit&&typeof spWord==='function')?spWord(wEdit.sp):null,
    hasAdd: !!document.querySelector('[data-do="addOne"]'),
    hasSave: !!document.querySelector('[data-do="keepPress"]'),
    keepKeys: Object.keys(KEEP) }));
  log(`   type->${ty} `, JSON.stringify(s));
  await click('[data-do="back"]'); await pg.waitForTimeout(150);
  log(`   after back: where=${await where()} words=${await pg.evaluate(()=>WORDS.length)} pop=${await pg.evaluate(()=>{const p=document.getElementById('pop');return p?p.className:null;})}`);
}
await shot(pg,'24-slot-sheet-no-add');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
