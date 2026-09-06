import { open, fresh, goTo, txt, buttons } from './lib.mjs';
const S = await open();
const { pg } = S;
await fresh(pg,'free');
const info = await pg.evaluate(()=>({
  gramArgs: gramArgs(),
  stAll: stAll().map(p=>({id:p.id, own:!!p.own, title:stTitle(p), slots:(p.slots||[]).slice()})),
  chaps: (typeof g2Chaps==='function')? g2Chaps().map(c=>({id:c.id, ...c})) : null,
  routes: Object.keys(PAGES),
}));
console.log(JSON.stringify(info,null,1).slice(0,6000));
await S.close();
