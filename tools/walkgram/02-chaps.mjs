import { open, fresh, goTo, txt, buttons, shot } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const log = (...a)=>console.log(...a);

/* --- adjective chapter: two chips, press one then the other --- */
for (const chap of ['adj','adp']){
  await fresh(pg,'pro'); await goTo(pg,'gram','v2:'+chap);
  log(`\n### v2:${chap}`);
  log('  start :', JSON.stringify(await txt(pg)));
  log('  gpos  :', JSON.stringify(await pg.evaluate(({k})=>({stored:STG.gpos||null, now:gPos(k)}),{k:chap})));
  let bs = await buttons(pg); log('  btns  :', JSON.stringify(bs));
  // press first chip
  await pg.evaluate(()=>{ const e=document.querySelectorAll('#app .segs .seg'); if(e[0]) e[0].click(); });
  log('  after press#0 :', JSON.stringify(await txt(pg)), JSON.stringify(await pg.evaluate(({k})=>({stored:STG.gpos||null,now:gPos(k),lift:g2Lift}),{k:chap})));
  await pg.evaluate(()=>{ const e=document.querySelectorAll('#app .segs .seg'); if(e[1]) e[1].click(); });
  log('  after press#1 :', JSON.stringify(await txt(pg)), JSON.stringify(await pg.evaluate(({k})=>({stored:STG.gpos||null,now:gPos(k),lift:g2Lift}),{k:chap})));
  // again
  await pg.evaluate(()=>{ const e=document.querySelectorAll('#app .segs .seg'); if(e[0]) e[0].click(); });
  await pg.evaluate(()=>{ const e=document.querySelectorAll('#app .segs .seg'); if(e[1]) e[1].click(); });
  log('  after 2nd swap:', JSON.stringify(await txt(pg)), JSON.stringify(await pg.evaluate(({k})=>({stored:STG.gpos||null,now:gPos(k)}),{k:chap})));
  // leave and come back
  await goTo(pg,'words'); await goTo(pg,'gram','v2:'+chap);
  log('  back again    :', JSON.stringify(await txt(pg)), JSON.stringify(await pg.evaluate(({k})=>({stored:STG.gpos||null,now:gPos(k)}),{k:chap})));
}
if(errs.length) log('ERRS', errs);
await S.close();
