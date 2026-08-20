/* A look at what a FONT would do to the same drawing.

   Not a check and not part of the gate. The strokes somebody draws are the
   skeleton; what a brush does to that skeleton is a separate thing that could
   be chosen. This renders one set of sample strokes under several such
   choices, side by side, so the choice can be looked at rather than
   described.

   node tools/font-mock.mjs   ->  shots/font-mock.png                        */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';

const SAMPLE = [
  /* a stem and two arms */
  [{pts:[[200,80],[200,720]]},{pts:[[200,400],[640,80]]},{pts:[[200,400],[640,720]]}],
  /* a closed box */
  [{pts:[[140,140],[660,140],[660,660],[140,660],[140,140]]}],
  /* a bowl on a stem */
  [{pts:[[200,80],[200,720]]},{pts:[[200,180],[560,180],[640,300],[560,420],[200,420]]}],
  /* a triangle */
  [{pts:[[112,112],[688,112],[400,688]]}],
  /* a cross and a sweep -- the one with a free end going down-left */
  [{pts:[[120,300],[680,300]]},{pts:[[400,80],[400,720]]},{pts:[[660,660],[400,500],[200,700]]}],
];

const STYLES = [
  { key:'kaku', ja:'角',   w:60 },
  { key:'fude', ja:'筆',   w:74, brush:1 },
];

mkdirSync('shots', { recursive: true });
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewportSize:{ width: 1240, height: 700 },
                              deviceScaleFactor: 2 });
await pg.setContent('<body style="margin:0;background:#0d0d10"><canvas id=c></canvas></body>');

await pg.evaluate(({ SAMPLE, STYLES }) => {
  const CELL = 800, PAD = 30, SZ = 210;
  const c = document.getElementById('c');
  c.width = 150 + SAMPLE.length * (SZ + PAD);
  c.height = 40 + STYLES.length * (SZ + PAD);
  const x = c.getContext('2d');
  x.fillStyle = '#0d0d10'; x.fillRect(0, 0, c.width, c.height);

  const dist = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]);

  /* Resampled by arc length, so everything after this is in fractions of the
     stroke and not in however many points a finger happened to put down. */
  const walk = (pts, n) => {
    const at=[0]; let tot=0;
    for (let i=1;i<pts.length;i++){ tot += dist(pts[i-1],pts[i]); at.push(tot); }
    if (!tot) return { pts: [pts[0]], tot: 0 };
    const out=[]; let j=0;
    for (let k=0;k<=n;k++){
      const d = tot*k/n;
      while (j < at.length-2 && at[j+1] < d) j++;
      const f = (d - at[j]) / Math.max(1e-6, at[j+1]-at[j]);
      out.push([pts[j][0] + (pts[j+1][0]-pts[j][0])*f,
                pts[j][1] + (pts[j+1][1]-pts[j][1])*f]);
    }
    return { pts: out, tot };
  };

  /* ---- which of the three endings a stroke gets -------------------------
     留 tome — it stops. The brush is pressed and lifted straight up, so the
        end is blunt and a shade heavier than the body.
     羽 hane — it flicks. The brush turns and leaves, so a small hook shoots
        off the end.
     払 harai — it sweeps. The brush is drawn away and lifted, so the ink runs
        out to a point.

     Nobody says which; it is read off the drawing, because nobody is going to
     answer three questions per stroke about a letter they have just drawn.
     A stroke that ENDS ON another stroke has been stopped by it and is 留. A
     stem that ends in the air is 羽. Anything else still running downhill
     when it ends is 払 -- which is what a left-fall and a right-fall both
     are. A horizontal, and anything going upwards, is 留. */
  const ending = (st, others) => {
    const p = st[st.length-1], q = st[st.length-2] || st[0];
    let touches = false;
    others.forEach(o => o.forEach((r,i) => {
      if (i && dist(p, r) < 90) touches = true;
      if (i && dist(p, o[i-1]) < 90) touches = true;
    }));
    if (touches) return 'tome';
    const dx = p[0]-q[0], dy = p[1]-q[1], L = Math.hypot(dx,dy) || 1;
    /* A stem that ends in the air hooks; anything else running downhill
       sweeps; a horizontal, and anything going up, stops. */
    if (dy/L > 0.55 && Math.abs(dx)/L < 0.35) return 'hane';
    if (dy/L > 0.15) return 'harai';
    return 'tome';
  };

  /* The width along the stroke: a head where the brush lands, a body, and
     whichever of the three ends it has. */
  const widthAt = (t, w, end) => {
    let k = 1;
    /* 起筆 -- the brush is pressed as it lands, then settles */
    k *= 1 + 0.18 * Math.max(0, 1 - t/0.12);
    if (end === 'harai') k *= Math.max(0.05, 1 - Math.pow(t, 2.4));
    if (end === 'tome')  k *= 1 + 0.12 * Math.max(0, (t-0.86)/0.14);
    if (end === 'hane')  k *= 1 - 0.22 * Math.max(0, (t-0.78)/0.22);
    return w * k;
  };

  /* 反り. A brush does not travel in a straight line: a horizontal stroke
     lifts a little in the middle, a vertical one leans. Only a stroke that
     was drawn as ONE straight run is bowed -- bending a drawn corner would
     be redrawing somebody's letter rather than inking it. */
  const bow = (pts, straight) => {
    if (!straight) return pts;
    const a = pts[0], b = pts[pts.length-1];
    const dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy) || 1;
    const horiz = Math.abs(dx) > Math.abs(dy);
    const amp = L * (horiz ? 0.016 : 0.008) * (horiz ? -1 : 1);
    const nx = -dy/L, ny = dx/L;
    return pts.map((p,i) => {
      const t = i/(pts.length-1), s = Math.sin(Math.PI*t);
      return [p[0] + nx*amp*s, p[1] + ny*amp*s];
    });
  };

  const fill = (poly, k, ox, oy) => {
    x.beginPath();
    poly.forEach((p,i) => i ? x.lineTo(ox+p[0]*k, oy+p[1]*k)
                            : x.moveTo(ox+p[0]*k, oy+p[1]*k));
    x.closePath(); x.fill();
  };

  const brush = (pts, w, end, straight, k, ox, oy) => {
    const N = 90;
    let line = walk(pts, N).pts;
    line = bow(line, straight);
    /* 羽 -- the hook. A few more points leaving the end, turning back up and
       against the direction of travel, with the ink running out as it goes. */
    let hookFrom = line.length;
    if (end === 'hane') {
      /* The brush stops, turns back on itself and leaves. Back is -u; the
         turn is towards the left-hand side of the direction of travel, which
         for a stem drawn downwards is up and to the left. */
      const p = line[line.length-1], q = line[line.length-8] || line[0];
      const dx = p[0]-q[0], dy = p[1]-q[1], L = Math.hypot(dx,dy) || 1;
      const ux = dx/L, uy = dy/L;
      const hx = -ux - uy*0.85, hy = -uy + ux*0.85;
      const hL = Math.hypot(hx,hy) || 1;
      const len = w * 1.15;
      for (let i=1;i<=12;i++){
        const t = i/12;
        /* it leaves along the travel for an instant before turning */
        const mx = ux*(1-t)*0.35 + (hx/hL)*t;
        const my = uy*(1-t)*0.35 + (hy/hL)*t;
        const mL = Math.hypot(mx,my) || 1;
        line.push([p[0] + mx/mL*len*t, p[1] + my/mL*len*t]);
      }
    }
    const L = [], R = [];
    for (let i=0;i<line.length;i++){
      const a = line[Math.max(0,i-1)], b = line[Math.min(line.length-1,i+1)];
      const dx = b[0]-a[0], dy = b[1]-a[1], d = Math.hypot(dx,dy) || 1;
      const nx = -dy/d, ny = dx/d;
      let ww;
      if (i >= hookFrom) {
        const t = (i - hookFrom + 1) / (line.length - hookFrom);
        ww = widthAt(1, w, end) * Math.max(0.03, 1 - t);
      } else {
        ww = widthAt(i/(hookFrom-1), w, end);
      }
      L.push([line[i][0] + nx*ww/2, line[i][1] + ny*ww/2]);
      R.push([line[i][0] - nx*ww/2, line[i][1] - ny*ww/2]);
    }
    fill(L.concat(R.reverse()), k, ox, oy);
  };

  const square = (pts, w, k, ox, oy) => {
    for (let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1];
      const dx=b[0]-a[0], dy=b[1]-a[1], L=Math.hypot(dx,dy);
      if (!L) continue;
      const nx=-dy/L*w/2, ny=dx/L*w/2;
      fill([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]], k, ox, oy);
      if (i) fill([[a[0]-w/2,a[1]-w/2],[a[0]+w/2,a[1]-w/2],
                   [a[0]+w/2,a[1]+w/2],[a[0]-w/2,a[1]+w/2]], k, ox, oy);
    }
  };

  x.font = '600 22px system-ui, sans-serif';
  x.textBaseline = 'middle';
  STYLES.forEach((s, r) => {
    const oy = 20 + r*(SZ+PAD);
    x.fillStyle = '#8d8d96';
    x.fillText(s.ja, 26, oy + SZ/2);
    SAMPLE.forEach((g, col) => {
      const ox = 120 + col*(SZ+PAD);
      x.fillStyle = '#f2f0ea';
      g.forEach(st => {
        if (!s.brush) return square(st.pts, s.w, SZ/CELL, ox, oy);
        const others = g.filter(o => o !== st).map(o => o.pts);
        brush(st.pts, s.w, ending(st.pts, others), st.pts.length === 2,
              SZ/CELL, ox, oy);
      });
    });
  });
}, { SAMPLE, STYLES });

await pg.locator('#c').screenshot({ path: 'shots/font-mock.png' });
await br.close();
console.log('shots/font-mock.png');
