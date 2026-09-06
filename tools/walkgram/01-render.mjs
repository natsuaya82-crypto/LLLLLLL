import { open, fresh, goTo, txt, buttons } from './lib.mjs';
const S = await open(); const { pg, errs } = S;
const args = await (async()=>{ await fresh(pg,'free'); return pg.evaluate(()=>gramArgs()); })();
for (const plan of ['free','plus','pro']){
  for (const a of [null].concat(args)){
    await fresh(pg, plan);
    errs.length = 0;
    const e = await goTo(pg,'gram', a===null?undefined:a);
    await pg.waitForTimeout(40);
    const body = await txt(pg);
    const bs = await buttons(pg);
    const head = body.split('\n').slice(0,3).join(' | ');
    console.log(`[${plan}] gram:${a} err=${e||'-'} btns=${bs.length} len=${body.length} :: ${head}`);
    if (errs.length) console.log('    !! ' + errs.join(' ;; '));
    if (body.length < 40) console.log('    ?? SHORT: ' + JSON.stringify(body));
  }
}
await S.close();
