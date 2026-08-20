/* A look at what a FONT would do to the same drawing.

   Not a check and not part of the gate. The strokes somebody draws are the
   skeleton; how thick the line is along its length, and what shape its end
   is, is a separate thing that could be chosen. This renders one alphabet of
   sample strokes under several such choices, side by side, so the choice can
   be looked at rather than described.

   node tools/font-mock.mjs   ->  shots/font-mock.png                        */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';

const SAMPLE = [
  /* a stem and two arms */
  [[{pts:[[200,80],[200,720]]},{pts:[[200,400],[640,80]]},{pts:[[200,400],[640,720]]}]],
  /* a closed box */
  [[{pts:[[140,140],[660,140],[660,660],[140,660],[140,140]]}]],
  /* a bowl on a stem */
  [[{pts:[[200,80],[200,720]]},{pts:[[200,180],[560,180],[640,300],[560,420],[200,420]]}]],
  /* a triangle */
  [[{pts:[[112,112],[688,112],[400,688]]}]],
  /* a cross and a sweep */
  [[{pts:[[120,300],[680,300]]},{pts:[[400,80],[400,720]]},{pts:[[200,700],[400,500],[660,660]]}]],
];

const STYLES = [
  { key:'kaku', ja:'角',   w:60, cap:'butt',  taper:0 },
  { key:'hoso', ja:'細',   w:32, cap:'butt',  taper:0 },
  { key:'futo', ja:'太',   w:96, cap:'butt',  taper:0 },
  { key:'maru', ja:'丸',   w:60, cap:'round', taper:0 },
  { key:'fude', ja:'筆',   w:88, cap:'butt',  taper:1 },
  { key:'hira', ja:'平筆', w:78, cap:'butt',  taper:0, angle:38, contrast:0.28 },
];

mkdirSync('shots', { recursive: true });
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const br = await chromium.launch(existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewportSize:{ width: 1180, height: 980 },
                              deviceScaleFactor: 2 });
await pg.setContent('<body style="margin:0;background:#0d0d10"><canvas id=c></canvas></body>');

await pg.evaluate(({ SAMPLE, STYLES }) => {
  const CELL = 800, PAD = 26, SZ = 150;
  const cols = SAMPLE.length, rows = STYLES.length;
  const c = document.getElementById('c');
  c.width = 240 + cols * (SZ + PAD);
  c.height = 40 + rows * (SZ + PAD) + 20;
  const x = c.getContext('2d');
  x.fillStyle = '#0d0d10';
  x.fillRect(0, 0, c.width, c.height);

  /* One segment of ink, cut square across its own direction, with a width at
     each end -- which is the whole of what a taper is. */
  const bar = (a, b, wa, wb) => {
    const dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy);
    if (!L) return null;
    const ux = -dy/L, uy = dx/L;
    return [[a[0]+ux*wa/2, a[1]+uy*wa/2], [b[0]+ux*wb/2, b[1]+uy*wb/2],
            [b[0]-ux*wb/2, b[1]-uy*wb/2], [a[0]-ux*wa/2, a[1]-uy*wa/2]];
  };
  const poly = (q, k, ox, oy) => {
    x.beginPath();
    q.forEach((p,i) => i ? x.lineTo(ox+p[0]*k, oy+p[1]*k) : x.moveTo(ox+p[0]*k, oy+p[1]*k));
    x.closePath(); x.fill();
  };

  const drawStroke = (pts, s, k, ox, oy) => {
    /* how far along the stroke each point is, so a taper is by LENGTH and not
       by how many points happen to have been put down */
    let tot = 0; const at = [0];
    for (let i=1;i<pts.length;i++){ tot += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); at.push(tot); }
    const wAt = (i) => {
      const t = tot ? at[i]/tot : 0;
      if (!s.taper) return s.w;
      /* thick where the brush lands, running out to almost nothing */
      return s.w * (1 - 0.86 * Math.pow(t, 0.72));
    };
    if (s.angle !== undefined) {
      /* a flat nib held at an angle: the ink is the swept hull of a slanted
         rectangle, so a stroke going one way is fat and the other way thin */
      const a = s.w/2, b = a*s.contrast, th = s.angle*Math.PI/180;
      const ca = Math.cos(th), sa = Math.sin(th);
      const nib = [[-a,-b],[a,-b],[a,b],[-a,b]].map(p =>
        [p[0]*ca - p[1]*sa, p[0]*sa + p[1]*ca]);
      for (let i=0;i<pts.length-1;i++){
        const pool = [];
        nib.forEach(d => { pool.push([pts[i][0]+d[0], pts[i][1]+d[1]]);
                           pool.push([pts[i+1][0]+d[0], pts[i+1][1]+d[1]]); });
        /* convex hull */
        pool.sort((u,v)=>u[0]-v[0]||u[1]-v[1]);
        const cr=(o,p,q)=>(p[0]-o[0])*(q[1]-o[1])-(p[1]-o[1])*(q[0]-o[0]);
        const lo=[],hi=[];
        for(const p of pool){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop(); lo.push(p); }
        for(let j=pool.length-1;j>=0;j--){ const p=pool[j];
          while(hi.length>=2&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop(); hi.push(p); }
        poly(lo.slice(0,-1).concat(hi.slice(0,-1)), k, ox, oy);
      }
      return;
    }
    if (s.cap === 'round') {
      x.lineWidth = s.w*k; x.lineCap='round'; x.lineJoin='round';
      x.beginPath();
      pts.forEach((p,i)=> i? x.lineTo(ox+p[0]*k, oy+p[1]*k) : x.moveTo(ox+p[0]*k, oy+p[1]*k));
      x.stroke();
      return;
    }
    for (let i=0;i<pts.length-1;i++){
      const q = bar(pts[i], pts[i+1], wAt(i), wAt(i+1));
      if (q) poly(q, k, ox, oy);
      /* fill the notch a corner leaves */
      if (i) { const w = wAt(i);
        poly([[pts[i][0]-w/2,pts[i][1]-w/2],[pts[i][0]+w/2,pts[i][1]-w/2],
              [pts[i][0]+w/2,pts[i][1]+w/2],[pts[i][0]-w/2,pts[i][1]+w/2]], k, ox, oy); }
    }
  };

  x.font = '600 20px system-ui, sans-serif';
  STYLES.forEach((s, r) => {
    const oy = 40 + r*(SZ+PAD);
    x.fillStyle = '#8d8d96';
    x.textBaseline = 'middle';
    x.fillText(s.ja, 24, oy + SZ/2);
    SAMPLE.forEach((g, col) => {
      const ox = 200 + col*(SZ+PAD);
      x.fillStyle = '#f2f0ea';
      x.strokeStyle = '#f2f0ea';
      g[0].forEach(st => drawStroke(st.pts, s, SZ/CELL, ox, oy));
    });
  });
}, { SAMPLE, STYLES });

await pg.locator('#c').screenshot({ path: 'shots/font-mock.png' });
await br.close();
console.log('shots/font-mock.png');
