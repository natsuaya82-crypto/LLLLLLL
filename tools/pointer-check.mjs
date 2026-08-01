import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:3, colorScheme:'dark', hasTouch:true, isMobile:true });
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,180)));
await p.goto('http://127.0.0.1:8910/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(700);
await p.evaluate(()=>{ SET.done=true; save(); editGlyph('k'); });
await p.waitForTimeout(400);

// Every pointermove a real finger sends must come back defaultPrevented,
// including the ones that land on the lattice point they are already on.
const r = await p.evaluate(()=>{
  const c=document.getElementById('gcanv'); if(!c) return 'no canvas';
  const box=c.getBoundingClientRect();
  const ev=(type,x,y)=>{ const e=new PointerEvent(type,{clientX:x,clientY:y,bubbles:true,cancelable:true,pointerId:1,pointerType:'touch'});
    c.dispatchEvent(e); return e.defaultPrevented; };
  const x0=box.left+box.width*0.3, y0=box.top+box.height*0.3;
  const down = ev('pointerdown', x0, y0);
  const tiny = [];
  for(let i=1;i<=6;i++) tiny.push(ev('pointermove', x0+i*1.5, y0+i*1.5));   // inside one lattice cell
  const far  = ev('pointermove', x0, y0+box.height*0.4);                    // several cells away
  const up   = ev('pointerup', x0, y0+box.height*0.4);
  return JSON.stringify({down, tinyMovesPrevented:tiny, far, up, stroke:GE.st});
});
console.log(r);
console.log('pageerrors:', errs.length?errs:'none');
await b.close();
