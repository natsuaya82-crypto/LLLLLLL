import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click = (sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const all = ()=>pg.evaluate(()=>[].slice.call(document.querySelectorAll('[data-do]')).map(e=>e.getAttribute('data-do')+'|'+(e.innerText||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim().slice(0,24)));
const where = ()=>pg.evaluate(()=>here().r+':'+(here().a||''));
const pop = ()=>pg.evaluate(()=>{const p=document.getElementById('pop'); return p&&/\bon\b/.test(p.className)?(p.innerText||'').replace(/\n{2,}/g,'\n').trim():null;});
const toast = ()=>pg.evaluate(()=>{const t=document.getElementById('toast'); return t?(t.innerText||'').trim():null;});
const typeIn = (sel,v)=>pg.evaluate(({sel,v})=>{const e=document.querySelector(sel); if(!e) return 'no '+sel;
  e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); return null;},{sel,v});
const words = ()=>pg.evaluate(()=>WORDS.map(w=>w.hw).join(' '));
try{
await fresh(pg,'pro');
log('# A. slot sheet: type a word, press back');
await goTo(pg,'gram','greet');
await click('[data-do="openSlot"]'); await pg.waitForTimeout(80);
await typeIn('#wd-ln','vess'); await pg.waitForTimeout(80);
log('  addW:', JSON.stringify(await pg.evaluate(()=>({hw:addW&&addW.hw, slot:addSlot, ln:(wEdit&&wEdit.seq)?wEdit.seq.length:null}))));
await click('[data-do="back"]'); await pg.waitForTimeout(150);
log('  pop:', JSON.stringify(await pop()), 'where:', await where());
log('  WORDS:', await words());
await shot(pg,'23-slot-back');
log('  page:', JSON.stringify(await txt(pg)));

log('\n# B. the dictionary\'s own new word, for comparison');
await fresh(pg,'pro');
await goTo(pg,'words');
log('  words page btns:', JSON.stringify(await all()));
await click('[data-do="openAdd"]'); await pg.waitForTimeout(100);
log('  where:', await where());
log('  btns :', JSON.stringify(await all()));
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
