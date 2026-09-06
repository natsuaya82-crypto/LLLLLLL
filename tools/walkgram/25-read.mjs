import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const where=()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const toast=()=>pg.evaluate(()=>{const t=document.getElementById('toast');return t?(t.innerText||'').trim():null;});
try{
log('# the reading of a word (pro): openEdit kano -> the reading page');
await fresh(pg,'pro');
await pg.evaluate(()=>{ openEdit('kano'); render(); }); await pg.waitForTimeout(80);
log('  where:', await where());
const rd = await pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]'))
  .map(e=>e.getAttribute('data-do')+' '+(e.getAttribute('data-a')||'')).slice(0,20));
log('  btns:', JSON.stringify(rd));
await goTo(pg,'spell'); await pg.waitForTimeout(60);
log('\n# the spell page');
log('  where:', await where(), 'page:', JSON.stringify((await txt(pg)).slice(0,200)));
log('  before:', JSON.stringify(await pg.evaluate(()=>({sp:(typeof spSeq!=="undefined")?spSeq:null, w:wEdit?wEdit.seq:null}))));
log('  press spAdd k ->', await clickA('spAdd','["k"]')); await pg.waitForTimeout(90);
log('  page:', JSON.stringify((await txt(pg)).slice(0,140)));
log('  press spAdd a ->', await clickA('spAdd','["a"]')); await pg.waitForTimeout(90);
log('  page:', JSON.stringify((await txt(pg)).slice(0,140)));
const btns = await pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]')).map(e=>e.getAttribute('data-do')).filter((v,i,a)=>a.indexOf(v)===i));
log('  distinct names on the page:', JSON.stringify(btns));
await shot(pg,'70-spell');
log('\n# voice: pressing Play');
const played = await pg.evaluate(()=>{ var calls=[]; var old=window.speechSynthesis;
  window.__spoke=[];
  if(window.speechSynthesis){ const s=window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak=function(u){ window.__spoke.push(u&&u.text); }; }
  return !!window.speechSynthesis; });
log('  speechSynthesis present:', played);
await clickA('sayPh'); await pg.waitForTimeout(300);
log('  spoke:', JSON.stringify(await pg.evaluate(()=>window.__spoke)));
log('  SET.voice:', JSON.stringify(await pg.evaluate(()=>SET.voice)));
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
