import { open, fresh, goTo, txt } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing'; e[0].click(); return null;},{name,arg});
const row=(id)=>pg.evaluate(({id})=>{ const b=[].slice.call(document.querySelectorAll('#app [data-do="stOpen"]'))
  .filter(e=>(e.getAttribute('data-a')||'').indexOf(id)>=0); return b[0]?b[0].innerText.replace(/\s+/g,' ').trim():'no row'; },{id});
try{
await fresh(pg,'pro');
await goTo(pg,'gram'); log('base 10, list row:', JSON.stringify(await row('count')));
await goTo(pg,'ltset','num');
for(let i=0;i<2;i++){ await clickA('numStepBase','[1]'); await pg.waitForTimeout(70); }
await goTo(pg,'gram'); await pg.waitForTimeout(60);
log('base', await pg.evaluate(()=>numBase()), ' list row:', JSON.stringify(await row('count')));
log('  month row:', JSON.stringify(await row('month')), ' wday row:', JSON.stringify(await row('wday')));
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ await S.close(); process.exit(0);}
