import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const state = () => pg.evaluate(()=>({fm:(STG.fm||[]).map(r=>r.id+':'+(r.add||[]).map(x=>x.u).join('')), words:WORDS.length, sel:(typeof G2SEL!=='undefined'&&G2SEL)?Object.keys(G2SEL):null}));
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const pop = ()=>pg.evaluate(()=>{const p=document.getElementById('pop'); return p?(p.innerText||'').replace(/\n{2,}/g,'\n').trim().slice(0,300):null;});
const bar = ()=>pg.evaluate(()=>{const b=document.querySelector('.bar'); return b?(b.innerText||'').trim():null;});
const allbtn = ()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('[data-do]')).map(e=>e.getAttribute('data-do')+'|'+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,28)));
try{
await fresh(pg,'pro');
await goTo(pg,'gram','v2:pl');
await click('#app [data-do="g2SelOn"]');
await pg.waitForTimeout(50);
log('all buttons in select mode (whole page incl bar):'); log('  '+JSON.stringify(await allbtn()));
log('  bar:', JSON.stringify(await bar()));
log('tick fr1');
await click('#app [data-do="g2SelTap"]');
await pg.waitForTimeout(60);
log('  state:', JSON.stringify(await state()));
log('  all buttons:', JSON.stringify(await allbtn()));
log('  bar:', JSON.stringify(await bar()));
await shot(pg,'04-pl-selected');
log('press the bin if there is one');
const r = await click('[data-do="g2SelDel"]');
log('  ->', r);
await pg.waitForTimeout(80);
log('  pop:', JSON.stringify(await pop()));
log('  state:', JSON.stringify(await state()));
await shot(pg,'05-pl-del-ask');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
