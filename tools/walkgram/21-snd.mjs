import { open, fresh, goTo, txt, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log=(...a)=>console.log(...a);
const click=(sel,n)=>pg.evaluate(({sel,n})=>{const e=document.querySelectorAll(sel); if(!e[n||0]) return 'missing '+sel+'#'+(n||0); e[n||0].click(); return null;},{sel,n});
const clickA=(name,arg)=>pg.evaluate(({name,arg})=>{const e=[].slice.call(document.querySelectorAll('[data-do="'+name+'"]'))
  .filter(x=>!arg||x.getAttribute('data-a')===arg); if(!e[0]) return 'missing '+name+' '+arg; e[0].click(); return null;},{name,arg});
const snap=()=>pg.evaluate(()=>({SND:SND.slice(), l1:JSON.parse(JSON.stringify(LETTERS[0].snd||[])), where:here().r+':'+here().a}));
const toast=()=>pg.evaluate(()=>{const t=document.getElementById('toast');return t?(t.innerText||'').trim():null;});
try{
await fresh(pg,'pro');
await goTo(pg,'letters');
await pg.evaluate(()=>openSnd(LETTERS[0].id)); await pg.waitForTimeout(80);
log('start:', JSON.stringify(await snap()));
log('press the sound already on it (k)');
log('  ->', await clickA('ltTakeSnd','["k"]')); await pg.waitForTimeout(100);
log('  ', JSON.stringify(await snap()), 'toast=', JSON.stringify(await toast()));
await fresh(pg,'pro'); await goTo(pg,'letters');
await pg.evaluate(()=>openSnd(LETTERS[0].id)); await pg.waitForTimeout(80);
log('press a sound NOT in this language: open the plosive group');
log('  ->', await clickA('openIpaG')); await pg.waitForTimeout(100);
log('  where:', await pg.evaluate(()=>here().r+':'+here().a));
log('  text :', JSON.stringify((await txt(pg)).slice(0,300)));
await shot(pg,'41-ipa-group');
// find the group toggle rows on the sheet itself
await fresh(pg,'pro'); await goTo(pg,'letters');
await pg.evaluate(()=>openSnd(LETTERS[0].id)); await pg.waitForTimeout(80);
const groups = await pg.evaluate(()=>[].slice.call(document.querySelectorAll('[data-do="ipaToggle"]')).map(e=>e.getAttribute('data-a')));
log('groups:', JSON.stringify(groups));
log('open plosive');
log('  ->', await clickA('ipaToggle','["m.plosive"]')); await pg.waitForTimeout(100);
const syms = await pg.evaluate(()=>[].slice.call(document.querySelectorAll('[data-do="ltTakeSnd"]')).map(e=>e.getAttribute('data-a')).slice(0,40));
log('  symbols now:', JSON.stringify(syms));
const pick = syms.find(s=>!/"k"|"t"|"m"|"n"|"s"|"r"|"a"|"i"|"u"|"e"|"o"/.test(s));
log('  pick', pick, '->', await clickA('ltTakeSnd',pick)); await pg.waitForTimeout(120);
log('  ', JSON.stringify(await snap()), 'toast=', JSON.stringify(await toast()));
await shot(pg,'42-snd-taken');
} catch(e){ log('THREW', e&&e.stack||e); }
finally{ if(errs.length) log('ERRS', JSON.stringify(errs.filter(x=>!/ERR_TUNNEL|ERR_CONNECTION|404/.test(x)))); await S.close(); process.exit(0);}
