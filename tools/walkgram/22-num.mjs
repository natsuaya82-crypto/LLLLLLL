import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+(arg||''); e[0].click(); return null;},{name,arg});
const all = ()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('#app [data-do]'))
  .map(e=>e.getAttribute('data-do')+' '+(e.getAttribute('data-a')||'')+' :: '+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,24)));
const digs = ()=>pg.evaluate(()=>({base:numBase(), digits:numDigits().map(l=>l.val+(l.st&&l.st.length?'*':'')+(l.nm?'"'+l.nm+'"':'')).join(' '), letters:LETTERS.length}));
try{
await fresh(pg,'pro');
await goTo(pg,'ltset','num');
log('digits room:', JSON.stringify((await txt(pg)).slice(0,300)));
log('  state:', JSON.stringify(await digs()));
const b=await all(); log('  btns('+b.length+') last 10:'); b.slice(-10).forEach(x=>log('    '+x));
await shot(pg,'50-digits-base10');
log('\nraise the base twice');
for(let i=0;i<2;i++){ log('  ->', await clickA('numStepBase','[1]')); await pg.waitForTimeout(90); log('   ', JSON.stringify(await digs())); }
log('draw on the highest digit, then lower the base twice');
await pg.evaluate(()=>{ const d=numDigits(); const top=d[d.length-1]; top.st=[{pts:[[100,100],[600,600]]}]; saveLetters(); render(); });
log('  ', JSON.stringify(await digs()));
for(let i=0;i<2;i++){ log('  lower ->', await clickA('numStepBase','[-1]')); await pg.waitForTimeout(90); log('   ', JSON.stringify(await digs())); }
log('  page:', JSON.stringify((await txt(pg)).slice(0,300)));
await shot(pg,'51-digits-lowered');
log('\nlower all the way to base 2');
for(let i=0;i<12;i++){ await clickA('numStepBase','[-1]'); await pg.waitForTimeout(50); }
log('  ', JSON.stringify(await digs()));
log('  page:', JSON.stringify((await txt(pg)).slice(0,400)));
await shot(pg,'52-digits-base2');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
