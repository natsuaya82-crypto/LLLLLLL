/* ---------------------------------------------------------------------------
   tools/verify-script.mjs — does the writing system actually work in a browser?

   The font writer is already proved correct on its own by
   tools/font-spike/verify-otf5.mjs. This is the other half: the app itself.
   It drives www/index.html the way a person would — draw a few letters, save
   them, turn the toggle on — and then asks the page questions that only the
   real thing can answer:

     1. the editor      points land where they were tapped, a tap on a dot
                        that is already there deletes it or joins the line up,
                        the ring is round and hollow, the canvas is not blank
     2. the font        it is built on the device, installed, and really used
                        (not a silent fallback to a system serif)
     3. the square      every letter is one cell wide at 17px, a word is
                        exactly its letter count in cells, a digraph is one
     4. the storage     what is saved is still plain ASCII — the toggle
                        changes the display and nothing else
     5. the palettes    dark and light both read, and neither throws

   Screenshot: tools/script-proof.png
   --------------------------------------------------------------------------- */
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); }
catch (e) { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'www');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PORT = 8197;

/* The app is several files now, and a browser will refuse to run a script
   served as text/plain when it is told not to sniff. Say what things are. */
const mime = (f) => f.endsWith('.html') ? 'text/html; charset=utf-8'
  : f.endsWith('.js') ? 'application/javascript; charset=utf-8'
  : f.endsWith('.css') ? 'text/css; charset=utf-8'
  : 'text/plain; charset=utf-8';

const srv = http.createServer((rq, rs) => {
  const f = path.join(ROOT, rq.url === '/' ? 'index.html' : rq.url.split('?')[0]);
  let d = null;
  try { d = fs.readFileSync(f); } catch (e) {}
  if (!d) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': mime(f) });
  rs.end(d);
});
await new Promise(r => srv.listen(PORT, r));

const br = await pw.chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3 });
/* Two different kinds of "error" arrive on the console and only one of them is
   ours. This sandbox has no route to fonts.googleapis.com, so the page's web
   fonts fail to load here and say so; that is the network, not the app. Anything
   the app itself throws, and any resource it asks OUR server for and does not
   get, is a real failure. */
const errs = [], net = [];
pg.on('console', m => {
  if (m.type() !== 'error') return;
  (/Failed to load resource/.test(m.text()) ? net : errs).push(m.text());
});
pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
pg.on('requestfailed', r => net.push(r.url() + ' — ' + (r.failure() || {}).errorText));
pg.on('response', r => { if (r.status() >= 400) net.push(r.status() + ' ' + r.url()); });
await pg.goto('http://127.0.0.1:' + PORT + '/');
/* index.html holds #splash over everything for the later of 900 ms and boot,
   and it is a real element with real hit-testing. A quarter of a second was
   not enough for it and had not been for a long time: every mouse click below
   was landing on the splash, so the point editor was never touched and the
   first thing it asked about -- did a tap place a point -- read as no. Every
   other check in tools/ waits for this exact selector; this one was written
   before it existed. */
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });
await pg.waitForTimeout(250);

let fail = 0;
const ok = (name, cond, detail) => {
  if (!cond) fail++;
  console.log('  ' + (cond ? 'ok  ' : 'FAIL') + '  ' + name.padEnd(44)
    + (detail === undefined ? '' : detail));
};

/* A vocabulary that uses s, h and the digraph sh, so the ligature is exercised,
   and headwords that start with a capital, because that is how they are stored. */
const seed = await pg.evaluate(() => {
  SET.done = true; SET.plan = 'free'; SET.ui = 'en'; SET.script = false;
  WORDS = [
    { hw: 'Ashi', mn: 'star', pos: 'n' },
    { hw: 'Kilt', mn: 'water', pos: 'n' },
    { hw: 'Shata', mn: 'to go', pos: 'v' },
  ];
  LINES = [{ ws: ['Ashi', 'Kilt', 'Shata'], mn: 'the star goes to the water' }];
  langName = 'Ashilta';
  SCRIPT = { g: {}, extra: [] };
  save(); render();
  return scriptLetters();
});
console.log('\nalphabet the app asked for: ' + seed.join(' '));

/* ---- 1. the editor -------------------------------------------------------- */
console.log('\n1. the point editor');
await pg.evaluate(() => { editGlyph('a'); });
await pg.waitForTimeout(60);
const box = await pg.locator('#gcanv').boundingBox();
/* Where in the page a point of the square's own 0-800 is.
   This is geXY() run backwards, and it has to be: the canvas is laid out in
   CSS pixels with a padding round it and the drawing is not, so the square
   covers the middle (1 - 2*GEPAD) of the element and nothing else. This used
   to divide the whole element by 800, which put every tap about 12% too far
   from the middle -- near the edges far enough to clamp, which is why the
   snap looked broken and every gesture after it landed somewhere else.
   Read out of the app rather than written down here, so a change to the
   padding moves the taps with it. */
const GEPAD = await pg.evaluate(() => GEPAD);
const at = (x, y) => ({
  x: box.x + box.width * (GEPAD + (1 - 2 * GEPAD) * x / 800),
  y: box.y + box.height * (GEPAD + (1 - 2 * GEPAD) * y / 800),
});

/* Read the lattice out of the app, then aim the taps at it from here. The test
   used to hard-code 7x7 coordinates, which meant changing the dot count broke the
   test rather than testing it. Nearest-dot is recomputed independently below, so
   this checks the app's snap against a second implementation, not against itself. */
const lattice = await pg.evaluate(() => {
  const s = geStep(), out = [];
  for (let i = 0; i < GGRID.n; i++) out.push(Math.round(GGRID.inset + i * s));
  return out;
});
const last = lattice.length - 1;
const step = lattice[1] - lattice[0];
const mid = Math.floor(last / 2);
const jit = Math.round(step * 0.3);   // never half a step, so the nearest dot is unambiguous
const nearest = v => lattice.reduce((b, x) => Math.abs(x - v) < Math.abs(b - v) ? x : b, lattice[0]);

/* three taps: a stroke down the middle and a bar across it, every one of them
   deliberately off the lattice. A point must not land where the finger stopped —
   it must land on the nearest dot, or two letters drawn on different days will
   not line up with each other. */
const taps = [
  [lattice[mid] + jit, lattice[1] + jit],
  [lattice[mid] + jit, lattice[last - 1] - jit],
  [lattice[1] - jit, lattice[mid] - jit],
];
for (const p of taps) {
  const c = at(p[0], p[1]);
  await pg.mouse.click(c.x, c.y);
}
const placed = await pg.evaluate(() => GE.st[0].pts.map(p => [p[0], p[1]]));
const want = taps.map(p => [nearest(p[0]), nearest(p[1])]);
ok('a tap places a point', placed.length === 3, placed.length + ' points');
ok('a point snaps to the nearest dot, not to the finger',
  JSON.stringify(placed) === JSON.stringify(want),
  'tapped ' + JSON.stringify(taps) + ' -> ' + JSON.stringify(placed)
    + ' (nearest dots: ' + JSON.stringify(want) + ')');
ok('every coordinate is on the lattice',
  placed.every(p => lattice.indexOf(p[0]) >= 0 && lattice.indexOf(p[1]) >= 0),
  lattice.join(' '));

/* drag the last point somewhere else — it snaps on the way, too */
const dragTo = [lattice[last - 1] - jit, lattice[mid]];
const from = at(want[2][0], want[2][1]), to = at(dragTo[0], dragTo[1]);
await pg.mouse.move(from.x, from.y);
await pg.mouse.down();
await pg.mouse.move(to.x, to.y, { steps: 6 });
await pg.mouse.up();
const dragged = await pg.evaluate(() => GE.st[0].pts[GE.pi].slice());
ok('a dragged point snaps too',
  dragged[0] === nearest(dragTo[0]) && dragged[1] === nearest(dragTo[1]),
  'dragged to ' + JSON.stringify(dragTo) + ' -> ' + JSON.stringify(dragged));

const inkedPx = () => pg.evaluate(() => {
  const c = document.getElementById('gcanv');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
  return n;
});
ok('canvas has real ink on it', (await inkedPx()) > 3000);

/* ---- the two answers a dot gives ------------------------------------------
   Neither is a tool. Both are what a tap on a dot that is already there
   means, which makes them worth driving through the mouse rather than through
   the function: the whole claim is that the gesture, and no button, does it.

   Tapping the dot just placed used to DELETE it. It does not any more --
   www/glyph.js: "Tapping the dot just placed says the stroke is finished. It
   used to delete that dot; undo does that now, and a whole stroke at a time."
   So the claim tested here is the one the editor actually makes. */
const p2 = await pg.evaluate(() => { GE.pi = 2; geDraw(); return GE.st[0].pts[2].slice(); });
const c2 = at(p2[0], p2[1]);
await pg.mouse.click(c2.x, c2.y);
const gone = await pg.evaluate(() => ({ n: GE.st[0].pts.length, pi: GE.pi, seal: !!GE.seal }));
ok('tapping the dot you just placed finishes the stroke',
  gone.n === 3 && gone.pi === -1 && gone.seal === true,
  gone.n + ' points, held ' + gone.pi + ', sealed ' + gone.seal);

/* and a finished stroke is finished: the next tap is the next mark, not a
   fourth point on this one */
await pg.mouse.click(c2.x, c2.y);
const after = await pg.evaluate(() => ({ n: GE.st.length, first: GE.st[0].pts.length,
                                         next: GE.st[1] ? GE.st[1].pts.length : 0 }));
ok('and the tap after that begins the next stroke',
  after.n === 2 && after.first === 3 && after.next === 1,
  after.n + ' strokes, ' + after.first + ' then ' + after.next + ' points');

/* Back to one unfinished stroke, because joining a line to its own start is
   only a question you can ask of the stroke you are drawing. */
const p0 = await pg.evaluate(() => {
  GE.st = [GE.st[0]]; GE.si = 0; GE.pi = -1; GE.seal = false; geDraw(); geTools();
  return GE.st[0].pts[0].slice();
});
const c0 = at(p0[0], p0[1]);
await pg.mouse.click(c0.x, c0.y);
const shut = await pg.evaluate(() => !!GE.st[0].closed);
await pg.evaluate(() => { GE.seal = false; GE.pi = -1; });
await pg.mouse.click(c0.x, c0.y);
const open = await pg.evaluate(() => !!GE.st[0].closed);
ok('tapping the dot you started from joins the line, and again unjoins it',
  shut === true && open === false, 'shut ' + shut + ', open again ' + !open);

/* ---- going back ------------------------------------------------------------
   One direction, because a five-tap drawing has no use for a future. What it
   does need is that the one step it has is never a step to nowhere: choosing
   a point is not a change, so it must not land on the stack. */
const p1 = await pg.evaluate(() => {
  GE.si = 0; GE.pi = -1; GE.seal = false; geDraw();
  return GE.st[0].pts[1].slice();
});
const c1 = at(p1[0], p1[1]);
const stack = await pg.evaluate(() => GE.undo.length);
await pg.mouse.click(c1.x, c1.y);
const sel = await pg.evaluate(() => ({ len: GE.undo.length, pi: GE.pi }));
ok('choosing a point is not a step you can undo',
  sel.len === stack && sel.pi === 1, stack + ' -> ' + sel.len + ' steps');

const hist = await pg.evaluate(() => {
  const sig = () => JSON.stringify(GE.st);
  const start = sig(), depth = GE.undo.length;
  geCircle();                      /* one real change */
  const edited = sig();
  geUndo();
  const undone = sig();
  const rail = [].slice.call(document.querySelectorAll('.gtools button'));
  const b0 = rail[0], cs = getComputedStyle(b0);
  /* read the style off the live element before render() replaces it */
  const look = { svg: !!b0.querySelector('svg'), bg: cs.backgroundColor,
                 bw: cs.borderTopWidth, radius: cs.borderTopLeftRadius };
  const named = rail.map(b => b.getAttribute('data-g')).join(' ');
  const labelled = rail.every(b => !!b.getAttribute('aria-label'));
  const quiet = [].slice.call(document.querySelectorAll('.gclearwrap button'))
                  .every(b => !b.querySelector('svg'));
  GE.st = JSON.parse(start); GE.undo.length = depth; GE.si = 0; GE.pi = 1; render();
  return { moved: edited !== start, back: undone === start,
           named, labelled, quiet, gone: typeof window.geRedo === 'undefined',
           svg: look.svg, bg: look.bg, bw: look.bw, radius: look.radius };
});
ok('undo puts the letter back', hist.moved && hist.back);
ok('there is no redo left to maintain', hist.gone);
/* Four marks. NEW is gone -- a stroke ends when the finger lifts, so there
   was nothing left for it to start -- and undo and clear, which used to be
   words in a corner underneath, are marks on the rail at the size a thumb
   has to hit. www/glyph.js: geRail. */
ok('the rail is the four marks, and nothing else',
  hist.named === 'circle fill undo clear', hist.named);
ok('repair is words off to the side, not a third and fourth icon', hist.quiet);
ok('they are icons on a rail, not chips',
  hist.svg && hist.labelled && hist.bg === 'rgba(0, 0, 0, 0)' &&
  hist.bw === '0px' && hist.radius === '0px',
  'background ' + hist.bg + ', border ' + hist.bw + ', radius ' + hist.radius);

/* ---- round -----------------------------------------------------------------
   A circle is the one shape a lattice of dots cannot be tapped into, so it has
   to be a primitive. The claim being checked is that its points stay on the ink
   like every other point in the editor — two are the ends of a diameter, a
   third is one the curve must pass through — and that what comes out is
   measurably round, hollow rather than filled, and passes through the dots that
   were tapped rather than near them. */
const geom = (poly, cx, cy) => {
  const d = (x, y) => Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
  const R = d(poly[0][0], poly[0][1]);
  let worst = 0, sag = 0;
  for (let i = 0; i < poly.length; i++) {
    worst = Math.max(worst, Math.abs(d(poly[i][0], poly[i][1]) - R));
    if (i) sag = Math.max(sag, R - d((poly[i][0] + poly[i - 1][0]) / 2,
                                     (poly[i][1] + poly[i - 1][1]) / 2));
  }
  return { R, worst, sag };
};

/* A ring is DRAWN and then rounded, not tapped out of two dots. Two dots and
   the button used to make one; geShape returns a plain line under three
   points now, and what makes a ring is that the gesture came back to where it
   started -- judged against the loop's own span, so a bowl left a third of a
   turn open still closes. www/glyph.js: geShape.
   Which means the only honest way to ask for one is to draw it: the finger
   goes round, the finger lifts, ROUND is pressed. */
const RING_R = 216, RING_CX = 400, RING_CY = 400;
await pg.evaluate(() => {
  GE.st = [{ pts: [] }]; GE.si = 0; GE.pi = -1; GE.seal = false;
  GE.round = false; GE.flat = null; GE.flatBy = ''; GE.raw = null;
  geDraw(); geTools();
});
const onRing = (deg) => {
  const a = deg * Math.PI / 180;
  return at(RING_CX + RING_R * Math.cos(a), RING_CY + RING_R * Math.sin(a));
};
{
  const s0 = onRing(0);
  await pg.mouse.move(s0.x, s0.y);
  await pg.mouse.down();
  for (let d = 12; d <= 348; d += 12) { const q = onRing(d); await pg.mouse.move(q.x, q.y); }
  await pg.mouse.up();
}
const ring = await pg.evaluate(() => {
  const keep = JSON.stringify(GE.st);
  const drawn = GE.st[0].pts.length;
  geCircle();                       /* the button, on the loop just drawn */
  const st = GE.st[0], poly = LinguaFont.toPolyline(st);
  geDraw();
  const c = document.getElementById('gcanv'), g = c.getContext('2d');
  /* The canvas is bigger than the square: the drawing sits in the middle
     (1 - 2*GEPAD) of it, same as geXY says on the way in. */
  const px = (x, y) => g.getImageData(
    Math.round((GEPAD + (1 - 2 * GEPAD) * x / 800) * c.width),
    Math.round((GEPAD + (1 - 2 * GEPAD) * y / 800) * c.height), 1, 1).data[3];
  /* the middle of the hole, and a point on the rim -- read off the ring the
     app actually made rather than off a radius written down here */
  const three = [poly[0], poly[Math.floor(poly.length / 3)],
                 poly[Math.floor(2 * poly.length / 3)]];
  const sq = (q) => q[0] * q[0] + q[1] * q[1];
  const dd = 2 * (three[0][0] * (three[1][1] - three[2][1]) +
                  three[1][0] * (three[2][1] - three[0][1]) +
                  three[2][0] * (three[0][1] - three[1][1]));
  const cx = (sq(three[0]) * (three[1][1] - three[2][1]) +
              sq(three[1]) * (three[2][1] - three[0][1]) +
              sq(three[2]) * (three[0][1] - three[1][1])) / dd;
  const cy = (sq(three[0]) * (three[2][0] - three[1][0]) +
              sq(three[1]) * (three[0][0] - three[2][0]) +
              sq(three[2]) * (three[1][0] - three[0][0])) / dd;
  const far = poly.reduce((b, q) =>
    Math.hypot(q[0] - cx, q[1] - cy) > Math.hypot(b[0] - cx, b[1] - cy) ? q : b, poly[0]);
  const hole = px(cx, cy), rim = px(far[0], far[1]);
  const shut = Math.abs(poly[0][0] - poly[poly.length - 1][0]) < 1e-9 &&
               Math.abs(poly[0][1] - poly[poly.length - 1][1]) < 1e-9;
  GE.st = JSON.parse(keep); GE.si = 0; GE.pi = -1; GE.seal = true; geDraw();
  return { kind: st.k, poly, hole, rim, kept: st.pts.length, drawn, closed: !!st.closed,
           shut, cx, cy };
});
const rg = geom(ring.poly, ring.cx, ring.cy);
ok('a loop drawn and then rounded comes back a whole circle',
  ring.kind === 'o' && ring.closed && ring.kept === 3 && ring.shut,
  ring.drawn + ' dots drawn -> ' + ring.kept + ' kept, k=' + ring.kind
    + ', ' + ring.poly.length + ' segments, radius ' + rg.R.toFixed(1));
ok('every point of it is the same distance from the centre', rg.worst < 1e-9,
  'worst radius error ' + rg.worst.toFixed(12) + ' units');
/* under a unit out of 800 is under a screen pixel in the editor, so it reads as
   round rather than as a polygon with a lot of sides */
ok('no chord sags far enough to see', rg.sag <= 0.6001,
  'worst sagitta ' + rg.sag.toFixed(3) + ' of 0.6 units allowed');
ok('the pen sweeps it hollow, not solid', ring.hole < 20 && ring.rim > 200,
  'centre alpha ' + ring.hole + ', rim alpha ' + ring.rim);

/* An arc is the same button with a third dot. The dot is not a suggestion: the
   curve has to touch it, which is what keeps a round line on the same lattice
   as a straight one, and it is what says which way round the arc goes. */
const arc = await pg.evaluate(() => {
  const keep = JSON.stringify(GE.st);
  const A = [184, 616], B = [400, 184], C = [616, 616];
  /* The primitive itself, asked for directly. It used to be reached by
     putting three dots down and pressing the button, and that is not what the
     button does any more: ROUND is a mode now, and on tapped dots it marks the
     middle ones 'c', which is a CONTROL point -- the curve bows towards it and
     does not touch it. The true arc is k:'o', and it is what a drawn ring is
     made of, so it is asked for the way the ring asks for it. */
  const st = { pts: [A.slice(), B.slice(), C.slice()], k: 'o' };
  const up = LinguaFont.toPolyline(st);
  /* the same three dots with the middle one below instead of above: the arc has
     to bend the other way, from nothing but where that dot moved to */
  const down = LinguaFont.toPolyline({ pts: [A, [400, 616 + (616 - 184)], C], k: 'o' });
  /* joined up, the three dots stop being ends and become a whole circle */
  const shutPoly = LinguaFont.toPolyline({ pts: [A, B, C], k: 'o', closed: true });
  const hits = (poly, p) => {
    let best = Infinity;
    for (let i = 0; i < poly.length; i++)
      best = Math.min(best, Math.sqrt((poly[i][0] - p[0]) ** 2 + (poly[i][1] - p[1]) ** 2));
    return best;
  };
  const mid = up[Math.floor(up.length / 2)];
  GE.st = JSON.parse(keep); GE.si = 0; GE.pi = 1; geDraw();
  return {
    kept: st.pts.length,
    ends: hits([up[0]], A) + hits([up[up.length - 1]], C),
    through: hits(up, B),
    bows: mid[1] < 400, dips: down[Math.floor(down.length / 2)][1] > 400,
    up, shutPoly,
    shut: Math.abs(shutPoly[0][0] - shutPoly[shutPoly.length - 1][0]) < 1e-6 &&
          Math.abs(shutPoly[0][1] - shutPoly[shutPoly.length - 1][1]) < 1e-6,
    straight: LinguaFont.toPolyline({ pts: [[112, 400], [400, 400], [688, 400]], k: 'o' }).length
  };
});
/* work the centre out from the curve itself rather than trusting a number typed
   here: three points off the arc, and the circumcentre they imply */
const circum = (a, b, c) => {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  const s = p => p[0] * p[0] + p[1] * p[1];
  return [(s(a) * (b[1] - c[1]) + s(b) * (c[1] - a[1]) + s(c) * (a[1] - b[1])) / d,
          (s(a) * (c[0] - b[0]) + s(b) * (a[0] - c[0]) + s(c) * (b[0] - a[0])) / d];
};
const ac = circum(arc.up[0], arc.up[Math.floor(arc.up.length / 2)],
                  arc.up[arc.up.length - 1]);
const ag = geom(arc.up, ac[0], ac[1]);
ok('a third dot turns the circle into an arc, and is not thrown away',
  arc.kept === 3 && arc.ends < 1e-9,
  arc.kept + ' dots kept, ends ' + arc.ends.toExponential(1) + ' units off');
ok('the arc passes through the middle dot, not near it', arc.through < 1e-9,
  arc.through.toFixed(12) + ' units off');
ok('which way it bends is decided by that dot alone', arc.bows && arc.dips,
  'middle up bows up, middle down bows down');
ok('an arc is as round as a circle', ag.worst < 1e-9 && ag.sag <= 0.6001,
  'radius error ' + ag.worst.toFixed(12) + ', sagitta ' + ag.sag.toFixed(3));
ok('joining the ends gives the whole circle those three dots sit on', arc.shut,
  arc.shutPoly.length + ' segments, closed');
/* three dots in a row have no circle through them; rather than divide by zero
   or invent one, the stroke stays the straight line it already looks like */
ok('three dots in a line stay a line', arc.straight === 3,
  arc.straight + ' points out');

/* ---- tapping a stroke out ---------------------------------------------------
   A stroke is not capped at one decision any more. www/glyph.js: "A stroke
   ends when the finger lifts from a drag, or when the dot just placed is
   tapped again. Not at three points -- taps go on adding to the same curve for
   as long as they are wanted." And when one does end, the next starts bare:
   "A new stroke starts where the finger lands and is joined to nothing. It
   used to begin at the end of the stroke before it, so every line after the
   first came out welded to the last whether that was wanted or not."
   Both are driven through the mouse, because the claim is that no button is
   involved in either. */
const keptStance = await pg.evaluate(() => {
  const keep = { st: JSON.stringify(GE.st), depth: GE.undo.length };
  GE.st = [{ pts: [] }]; GE.si = 0; GE.pi = -1;
  GE.seal = false; GE.round = false; GE.flat = null; GE.flatBy = ''; GE.raw = null;
  geDraw(); geTools();
  return keep;
});
const corner = [[lattice[2], lattice[2]], [lattice[5], lattice[2]], [lattice[5], lattice[5]]];
for (const p of corner) { const c = at(p[0], p[1]); await pg.mouse.click(c.x, c.y); }
const three = await pg.evaluate(() => ({ n: GE.st.length, pts: GE.st[0].pts.length }));
ok('three taps make one corner, and it is still one stroke',
  three.n === 1 && three.pts === 3, three.n + ' stroke, ' + three.pts + ' points');

const fourth = [lattice[8], lattice[5]];
const c4 = at(fourth[0], fourth[1]);
await pg.mouse.click(c4.x, c4.y);
const nextUp = await pg.evaluate(() => ({
  n: GE.st.length, first: GE.st[0].pts.map(p => p.slice()), si: GE.si }));
ok('a fourth tap goes on the same stroke — a curve is as long as it is wanted',
  nextUp.n === 1 && nextUp.first.length === 4 && nextUp.si === 0,
  nextUp.n + ' stroke, ' + nextUp.first.length + ' points');
ok('and it is the dot that was tapped, not one near it',
  JSON.stringify(nextUp.first[3]) === JSON.stringify(fourth),
  JSON.stringify(nextUp.first));

/* Tapping the dot just placed says this one is finished, and then the next
   mark starts where the finger lands and is welded to nothing. */
await pg.mouse.click(c4.x, c4.y);
const bare = [lattice[2], lattice[8]];
const cBare = at(bare[0], bare[1]);
await pg.mouse.click(cBare.x, cBare.y);
const started = await pg.evaluate(() => ({
  n: GE.st.length, next: GE.st[1] ? GE.st[1].pts.map(p => p.slice()) : null }));
ok('the next stroke starts where the finger landed, joined to nothing',
  started.n === 2 && JSON.stringify(started.next) === JSON.stringify([bare]),
  started.n + ' strokes, the new one ' + JSON.stringify(started.next));

/* A circle has no end, and neither does a line joined back to its start, so
   there is nothing there for the next stroke to continue from: it starts bare
   instead of being dragged out of a shape that was finished. */
const rounded = await pg.evaluate(() => {
  /* the three points a drawn ring comes back as, which is the state this is
     about -- two dots and the button do not make one any more */
  GE.st = [{ pts: [[184, 400], [616, 400], [400, 616]], k: 'o', closed: true }];
  GE.si = 0; GE.pi = -1; GE.seal = false; geDraw(); geTools();
  return GE.st[0].k;
});
const cFree = at(lattice[2], lattice[1]);
await pg.mouse.click(cFree.x, cFree.y);
const fresh = await pg.evaluate(() => ({
  n: GE.st.length, pts: GE.st[1] ? GE.st[1].pts.length : 0 }));
ok('a circle has no end to carry on from, so the next mark starts on its own',
  rounded === 'o' && fresh.n === 2 && fresh.pts === 1,
  fresh.n + ' strokes, the new one holding ' + fresh.pts + ' point');

/* Round is offered on anything with a bend in it, however long. It used to be
   refused past three points, because a stroke could not be longer than that;
   taps go on adding now, so the button goes on being offered and bends every
   middle dot of what it is given. */
const over = await pg.evaluate(() => {
  GE.st = [{ pts: [[184, 184], [400, 184], [400, 400], [616, 400]] }];
  GE.si = 0; GE.pi = -1; GE.seal = false;
  GE.round = false; GE.flat = null; GE.flatBy = ''; GE.raw = null;
  geDraw(); geTools();
  const b = document.querySelector('.gtools button[data-g="circle"]');
  const live = b.getAttribute('aria-disabled') !== 'true' && !/(^| )off( |$)/.test(b.className);
  geCircle();
  const st = GE.st[0];
  const bent = st.pts.slice(1, -1).every(p => p[2] === 'c');
  const ends = st.pts[0].length === 2 && st.pts[st.pts.length - 1].length === 2;
  geCircle();                       /* and off again, because it is a mode */
  const flat = GE.st[0].pts.every(p => p.length === 2);
  return { live, bent, ends, flat, n: st.pts.length };
});
ok('round is offered on a longer stroke, and bends every dot but the ends',
  over.live && over.bent && over.ends && over.n === 4,
  'button live ' + over.live + ', ' + over.n + ' points, middles bent ' + over.bent);
ok('and pressing it again takes the bend back off', over.flat);
await pg.evaluate((keep) => {
  GE.st = JSON.parse(keep.st); GE.si = 0; GE.pi = 1;
  GE.undo.length = keep.depth; geDraw(); geTools();
}, keptStance);

/* ---- the hint --------------------------------------------------------------
   The paragraph that used to sit under the toolbar is now a silent loop. A
   loop can fail in a way a paragraph cannot — by standing still — so that is
   what is checked: that it moves, and that by the end of the cycle it has
   actually shown the thing it is there to show — the fifth tap landing back on
   the first dot, and the line joining up because of it. That gesture has no
   button any more, so this loop is the only place it is taught. */
const hint = await pg.evaluate(async () => {
  const c = document.getElementById('ghint');
  if (!c) return { none: true };
  const shot = () => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0, sum = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 40) { n++; sum += i; }
    return { n, sum };
  };
  const frames = [];
  for (const t of [0.5, 1.4, 2.1, 2.9, 4.4]) { geHintDraw(c, t); frames.push(shot()); }
  const keys = frames.map(f => f.n + ':' + f.sum);
  /* four sides at 4.2s, and at 5.2s the fourth corner has been joined back to
     the first: one more side of ink than before */
  geHintDraw(c, 3.0); const openLoop = shot().n;
  geHintDraw(c, 4.4); const shutLoop = shot().n;
  return { running: !!GE_HINT.raf, distinct: new Set(keys).size, openLoop, shutLoop };
});
ok('the hint is a loop, not a paragraph', !hint.none && hint.running === true);
ok('it is moving, not a still picture', hint.distinct === 5,
  hint.distinct + ' of 5 sampled frames differ');
ok('it gets as far as joining the line up', hint.shutLoop > hint.openLoop,
  hint.openLoop + ' inked px open -> ' + hint.shutLoop + ' joined');

/* leave the demo where the editor found it before the rest of the run */
/* ---- and what each button does ---------------------------------------------
   The square answers "what is this button" by showing the before and the
   after. That is only an answer if the two differ, so both are played and the
   ink is counted on either side of the flip. The dim case is checked too,
   because the button you most need explained is the one the drawing is not yet
   far enough along to allow. */
const demo = await pg.evaluate(() => {
  const c = document.getElementById('ghint');
  const ink = () => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    return n;
  };
  const out = {};
  for (const k of ['circle', 'new']) {
    geHintDemo(c, 0.6, k); const before = ink();
    geHintDemo(c, 2.4, k); const after = ink();
    out[k] = before !== after;
  }
  /* a button with nothing left to draw is dim, but still tappable and still
     wired to its own demonstration */
  const keep = JSON.stringify(GE.st);
  GE.st = []; GE.si = -1; GE.pi = -1; render();
  const b = document.querySelector('.gtools button[data-g="circle"]');
  /* The press is not an inline onclick any more: every screen names an
     action in www/act-map.js and the press is looked up there. A button that
     acts and then explains itself carries the second name in data-do2, with
     its arguments as JSON in data-b. www/act.js. */
  const dim = b.className.indexOf('off') >= 0 && b.disabled === false &&
              b.getAttribute('aria-disabled') === 'true' &&
              b.getAttribute('data-do2') === 'geHintShow' &&
              b.getAttribute('data-b') === '["circle"]';
  GE.st = JSON.parse(keep); GE.si = 0; GE.pi = -1; render();
  GE_HINT.mode = ''; geHintShow('circle');
  return { ...out, dim, switched: GE_HINT.mode === 'circle' };
});
ok('both buttons can show their before and after', demo.circle && demo.new,
  ['circle', 'new'].filter(k => !demo[k]).join(' ') || 'both differ');
ok('a dim button still explains itself', demo.dim && demo.switched);
await pg.evaluate(() => geHintMount());

/* save this letter, then draw two more the quick way */
await pg.evaluate(() => geSave());
await pg.waitForTimeout(60);
const built = await pg.evaluate(() => {
  const S = {
    s: [{ pts: [[600, 200], [250, 220, 'c'], [400, 400, 'c'], [560, 570, 'c'], [200, 600]] }],
    h: [{ pts: [[220, 120], [220, 680]] }, { pts: [[220, 400], [580, 400]] },
        { pts: [[580, 400], [580, 680]] }],
    /* the dot on the i is a ring, so a k:'o' stroke goes through save, reload,
       the font writer and the shaper rather than only through the canvas */
    i: [{ pts: [[400, 328], [400, 688]] }, { pts: [[328, 184], [472, 184]], k: 'o' }],
    t: [{ pts: [[400, 120], [400, 620], [600, 660, 'c']] }, { pts: [[220, 280], [580, 280]] }],
    k: [{ pts: [[220, 120], [220, 680]] }, { pts: [[580, 260], [220, 450], [580, 680]] }],
    l: [{ pts: [[300, 120], [300, 620], [560, 660, 'c']] }],
    sh: [{ pts: [[560, 200], [240, 240, 'c'], [400, 400, 'c'], [200, 600]] },
         { pts: [[620, 200], [620, 680]] }],
  };
  /* Onto the LETTERS, which is where a drawn shape lives. SCRIPT.g was the
     store before a letter existed apart from the sound it was for, and
     www/letters.js reads it exactly once, to bring an old language across --
     so writing there now writes somewhere nothing looks. */
  Object.keys(S).forEach(r => {
    let l = null;
    for (let i = 0; i < LETTERS.length; i++) if (String(ltName(LETTERS[i])) === r) { l = LETTERS[i]; break; }
    if (!l) { l = { id: ltId(), st: [], ch: '', nm: r, snd: [r] }; LETTERS.push(l); }
    l.st = S[r];
  });
  saveLetters(); save(); installScriptFont(); render();
  const back = JSON.parse(slRd(langKey('letters')) || '[]');
  /* scriptDrawn() counted the units with ink in them and went out in
     9226dd6, when the font stopped being built from anything but the
     letters. What the font is made of is now the one list, so ask that
     list how long it is. */
  let kept = null;
  for (let i = 0; i < back.length; i++)
    if (String(ltName(back[i])) === 'i' && back[i].st && back[i].st[1]) kept = back[i].st[1].k;
  return { letters: scriptLetters(), drawn: scriptGlyphDefs().defs.length, font: SFONT.built,
           kept: kept };
});
ok('the font was built on the device', built.font,
  built.drawn + ' of ' + built.letters.length + ' letters drawn');
ok('a ring survives being written down and read back', built.kept === 'o');

/* ---- 2 & 3. the font, and the line it sets ------------------------------
   NOT a square cell. The face was monospace once and is not any more: the app
   builds it with mode 'center', and www/otf5.js gives every glyph
   reach(xMin, xMax, side) as its advance -- its own ink, plus the step at
   each end -- where only the 'asdrawn' and 'fit' modes hand out a fixed CELL.
   That is the same line rule www/glyph.js inkAdv() states and the widgets
   draw by, so the thing worth proving is that the FONT and the RULE agree:
   two implementations of one sentence, measured against each other through
   the browser's own text engine. */
console.log('\n2. the font in the page');
const EM = 1000, CELL = 800;      /* www/otf5.js, the defaults the app builds with */
const font = await pg.evaluate(async ({ EM, CELL }) => {
  await document.fonts.load('17px "LinguaScript"', 'ashiklt');
  const cnv = document.createElement('canvas'), cx = cnv.getContext('2d');
  const wid = (fam, s, px) => { cx.font = px + 'px "' + fam + '"'; return cx.measureText(s).width; };
  const PX = 17;
  /* the letters this alphabet has AND has a drawing for, because a letter
     with no ink is not in the font and the browser sets it in something else */
  const inked = {};
  LETTERS.forEach((l) => {
    const r = String(ltName(l) || '');
    if (r && l.st && l.st.length && !inked[r]) inked[r] = l;
  });
  const L = Object.keys(inked).filter(r => r.length === 1).sort().slice(0, 8);
  /* what the rule says each of them should measure, in px at PX */
  const rule = (r) => { const a = inkAdv(inked[r].st); return a ? a.w * PX / EM : null; };
  let ruleErr = 0, pairErr = 0, uniq = {};
  L.forEach((r) => {
    const want = rule(r);
    if (want === null) return;
    ruleErr = Math.max(ruleErr, Math.abs(wid('LinguaScript', r, PX) - want));
    uniq[wid('LinguaScript', r, PX).toFixed(3)] = 1;
  });
  /* a pair is the two advances and nothing between them -- no kerning, no
     cell being padded out to. sh is a letter here, so s+h is one glyph and is
     asked separately below. */
  const DI = scriptLetters().filter(r => r.length > 1);
  for (const p of L) for (const q of L) {
    if (DI.indexOf(p + q) >= 0) continue;
    pairErr = Math.max(pairErr, Math.abs(wid('LinguaScript', p + q, PX)
                                       - wid('LinguaScript', p, PX)
                                       - wid('LinguaScript', q, PX)));
  }
  const word = L.join('');
  const sum = L.reduce((n, r) => n + wid('LinguaScript', r, PX), 0);
  /* sh is a letter of this alphabet, so the pair s+h comes out as ONE glyph.
     Its advance is its own ink's, so what is asked is that it is one glyph
     and not two -- narrower than the two letters set side by side. */
  const sh = wid('LinguaScript', 'sh', PX);
  return {
    loaded: document.fonts.check('17px "LinguaScript"', 'ashiklt'),
    faces: [...document.fonts].map(f => f.family + ':' + f.status),
    letters: L.join(''),
    widths: L.map(r => +wid('LinguaScript', r, PX).toFixed(2)).join(' '),
    ruleErr: +ruleErr.toFixed(4),
    proportional: Object.keys(uniq).length > 1,
    pairErr: +pairErr.toFixed(4),
    word, lineErr: +(wid('LinguaScript', word, PX) - sum).toFixed(4),
    lig: DI.indexOf('sh') >= 0 &&
         sh < wid('LinguaScript', 's', PX) + wid('LinguaScript', 'h', PX) - 0.5,
    ligPx: +sh.toFixed(2),
    capSame: wid('LinguaScript', 'A', PX) === wid('LinguaScript', 'a', PX)
          && wid('LinguaScript', 'Ashi', PX) === wid('LinguaScript', 'ashi', PX),
    /* a space has no ink to measure, so it keeps the cell -- www/otf5.js:
       spaceAdv = CELL, the one advance in the face that is not the rule's */
    spacePx: +(wid('LinguaScript', 'a a', PX) - wid('LinguaScript', 'aa', PX)).toFixed(3),
    wantSpace: +(CELL * PX / EM).toFixed(3),
    notFallback: wid('LinguaScript', 'ashi', PX) !== wid('serif', 'ashi', PX),
  };
}, { EM, CELL });
ok('LinguaScript is installed and loaded', font.loaded, font.faces.join(' '));
ok('it is the drawn face, not a fallback', font.notFallback);
console.log('\n3. the line the font sets');
ok('the face is proportional, not a row of squares', font.proportional,
  font.letters + ' -> ' + font.widths + ' px at 17px');
/* a hundredth of a pixel: the browser reports a float, and the two paths
   round in different places */
/* One font unit, and not a hundredth of one: reach() rounds, inkAdv() reads
   the profile without the band the builder passes, and the two can land a
   single unit apart. A unit of 1000 at 17px is 0.017px -- under a thousandth
   of a letter, and nothing anybody can see. */
ok('every letter is as wide as its own ink plus the step at each end',
  font.ruleErr <= 17 / 1000 + 1e-6,
  'worst ' + font.ruleErr + 'px out from inkAdv(), one font unit is '
    + (17 / 1000).toFixed(3) + 'px');
ok('a pair is the two advances and nothing between them', font.pairErr < 0.01,
  font.pairErr + 'px');
ok('a word is the sum of its letters', Math.abs(font.lineErr) < 0.01,
  font.word + ': ' + font.lineErr + 'px out');
ok('the digraph sh is one glyph, not two', font.lig, font.ligPx + 'px');
ok('a capital is the same drawing', font.capSame);
ok('a space keeps the cell, having no ink to measure',
  Math.abs(font.spacePx - font.wantSpace) < 0.01,
  font.spacePx + 'px, cell is ' + font.wantSpace + 'px');

/* ---- the alphabet is the writing system's, and the font follows the ink ----
   A word used to bring its sounds into the alphabet with it. It does not any
   more: scriptLetters() IS wsUnits(), so what letters a language has is the
   writing system's answer and a word can only be written in the ones that are
   already there. www/glyph.js.
   What the font still has to do is follow the ink: a letter of that alphabet
   with nothing drawn for it is not in the face at all and the browser sets it
   in something else, and the moment somebody draws it the face is rebuilt and
   that letter comes out at its own width. That is the end-to-end path -- a
   shape on a canvas, through the font writer, to a measurable advance in the
   page -- and it is the one thing only the real browser can answer. */
console.log('\n4. drawing a letter the alphabet already had');
const grew = await pg.evaluate(async ({ EM }) => {
  const PX = 17;
  const was = scriptLetters().slice();
  WORDS.push({ hw: 'Nuro', mn: 'night', pos: 'n' });
  save(); render();
  const now = scriptLetters().slice();

  /* a letter of the alphabet with no drawing on it */
  let blank = null;
  for (let i = 0; i < LETTERS.length; i++) {
    const r = String(ltName(LETTERS[i]) || '');
    if (r.length === 1 && !(LETTERS[i].st && LETTERS[i].st.length)) { blank = LETTERS[i]; break; }
  }
  if (!blank) return { was: was.join(''), now: now.join(''), blank: null };
  const r = String(ltName(blank));

  const cnv = document.createElement('canvas'), cx = cnv.getContext('2d');
  const wid = (s) => { cx.font = PX + 'px "LinguaScript", serif'; return cx.measureText(s).width; };
  await document.fonts.load(PX + 'px "LinguaScript"', r);
  const before = wid(r);

  /* an L: two arms, so its ink is nothing like a square and a width that came
     from a cell rather than from the ink would be caught */
  blank.st = [{ pts: [[292, 184], [292, 616], [544, 616]] }];
  saveLetters(); installScriptFont();
  await document.fonts.load(PX + 'px "LinguaScript"', r);
  const after = wid(r);
  const a = inkAdv(blank.st);
  return { was: was.join(''), now: now.join(''), blank: r,
           before: +before.toFixed(3), after: +after.toFixed(3),
           want: a ? +(a.w * PX / EM).toFixed(3) : null };
}, { EM });
ok('a word does not add to the alphabet — the writing system says what letters there are',
  grew.now === grew.was, grew.was + ' -> ' + grew.now);
ok('a letter with nothing drawn for it is not in the face',
  grew.blank !== null, grew.blank === null ? 'every letter is drawn' : 'found ' + grew.blank);
ok('drawing it rebuilds the face, and it comes out at its own width',
  grew.want !== null && Math.abs(grew.after - grew.want) <= 17 / 1000 + 1e-6
    && Math.abs(grew.after - grew.before) > 0.1,
  grew.blank + ': ' + grew.before + 'px -> ' + grew.after + 'px, the rule says ' + grew.want + 'px');

/* ---- 5. the toggle changes the display and nothing else ------------------ */
console.log('\n5. the toggle');
const before = await pg.evaluate(() => JSON.stringify(WORDS.map(w => w.hw)));
await pg.evaluate(() => { setMyFont(true); });
await pg.waitForTimeout(80);
const on = await pg.evaluate(() => {
  go('words');
  const el = document.querySelector('.hw');
  return {
    attr: document.documentElement.getAttribute('data-script'),
    family: el ? getComputedStyle(el).fontFamily : '',
    text: el ? el.textContent : '',
    /* Per language now: lingua.<langId>.words, not the flat key a single
       language used to have. www/core.js: langKey(). */
    stored: JSON.stringify(JSON.parse(slRd(langKey('words')) || '[]').map(w => w.hw)),
    scriptStored: JSON.parse(slRd(langKey('letters')) || '[]')
      .some(l => l.st && l.st.length),
  };
});
ok('the display switches to your letters', on.attr === 'on' && /LinguaScript/.test(on.family),
  on.family);
ok('the text on screen is still the word', on.text === 'Ashi', JSON.stringify(on.text));
ok('what is stored is unchanged ASCII', on.stored === before && /^[\x20-\x7e"\[\],]+$/.test(on.stored),
  on.stored);
ok('the drawings are saved too', on.scriptStored);
/* The sentence screen used to be asked the same question here -- the chips
   being woven and the line they read as, .wcw and .sww. Both classes are on
   no element in www/ any more and there is no 'sent' route to go to, so the
   two questions were being put to a screen nobody has: one failed and the
   other PASSED, on 'missing' not matching /LinguaScript/. A check that goes
   green because the thing is absent is worse than one that goes red, so they
   are gone rather than rewritten. What is left below asks the toggle the same
   thing where a headword really is shown. */
const off = await pg.evaluate(() => {
  setMyFont(false); go('words');
  const el = document.querySelector('.hw');
  return { attr: document.documentElement.getAttribute('data-script'),
           family: el ? getComputedStyle(el).fontFamily : '' };
});
ok('and switches back to roman', off.attr === 'off' && !/LinguaScript/.test(off.family), off.family);

/* There are two ways to see a language in its own writing, and the app now has
   both: characters borrowed from a script that already exists, which replace the
   text, and letters you drew yourself, which replace only the face it is set in.
   They must not fight over the same word — borrowed characters cannot be drawn
   by a font keyed to roman letters, so when your own letters are showing the
   text stays roman and the drawing does the work. */
const two = await pg.evaluate(() => {
  /* render(), not go(): www/shell.js returns from go() without drawing
     anything when the route asked for is the one already on screen, and the
     screen before this one was already 'words'. So the first reading was of a
     page rendered before any of this was set, and it said the word was still
     roman when the app had already changed it. */
  const read = () => { go('words'); render(); const el = document.querySelector('.hw');
    return { text: el ? el.textContent : '', fam: el ? getComputedStyle(el).fontFamily : '' }; };
  /* A borrowed character is on the LETTER now -- l.ch -- and it is exclusive
     with a drawing: www/letters.js gives a letter one or the other and clears
     whichever it replaces. SET.script was the store before a letter existed
     apart from the sound it was for, and is read once, to migrate. So the two
     states are set up one after the other rather than at once. */
  const keep = JSON.stringify(LETTERS);
  /* Onto the letter each UNIT of the writing system reads through -- ltMain()
     -- because that is what scriptHave() counts and what wsInScript() looks
     each piece of a word up in. Keyed by the letter's own name it reached
     letters no unit points at, and the count stayed nought, so the switch
     never came on and the word stayed roman. */
  const KANA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほ'.split('');
  setMyFont(false);
  invAll().forEach((u, i) => {
    const l = ltMain(u);
    if (l) { l.ch = KANA[i % KANA.length]; l.st = null; }
  });
  SET.showScript = true; saveLetters(); save(); installScriptFont();
  const borrowed = read();

  LETTERS.length = 0;
  JSON.parse(keep).forEach((l) => LETTERS.push(l));
  SET.showScript = false; saveLetters(); save(); installScriptFont();
  setMyFont(true);
  const drawn = read();
  setMyFont(false); render();
  return { borrowed, drawn };
});
ok('borrowed characters replace the word itself',
  two.borrowed.text !== 'Ashi' && /[ぁ-ん]/.test(two.borrowed.text), two.borrowed.text);
ok('but your own letters leave the word alone and only redraw it',
  two.drawn.text === 'Ashi' && /LinguaScript/.test(two.drawn.fam),
  two.drawn.text + ' in ' + two.drawn.fam.split(',')[0]);

/* ---- 6. both palettes ----------------------------------------------------- */
console.log('\n6. the screens, in both palettes');
const shots = [];
for (const theme of ['dark', 'light']) {
  /* 'ltset' and not 'letters': the letters route is a table of contents now,
     one row per kind, and the CELLS -- a shape, its name, and the canvas the
     shape is drawn on -- are one level in. The old route showed the grid
     itself, so this asked an index page whether its tiles were blank and got
     no tiles and no complaint. www/sound.js: vLtset, ltCell. */
  await pg.evaluate((th) => { setTheme(th); setMyFont(true); go('ltset'); }, theme);
  await pg.waitForTimeout(120);
  const tiles = await pg.evaluate(() => {
    /* canvas.tc, and not '.gtile canvas.tc': .gtile is on no element any more,
       so the old selector matched nothing and the check passed on an empty
       list in both palettes. www/letters.js writes the canvas, geTiles()
       fills it. */
    const els = document.querySelectorAll('canvas.tc');
    let blank = 0;
    els.forEach(c => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
      if (n < 50) blank++;
    });
    return { n: els.length, blank };
  });
  ok(theme + ': every drawn letter shows on its tile', tiles.blank === 0,
    tiles.n + ' tiles, ' + tiles.blank + ' blank');
  const a = path.join(HERE, 'shot-script-' + theme + '.png');
  await pg.screenshot({ path: a });
  shots.push(a);
  await pg.evaluate(() => { editGlyph('s'); });
  await pg.waitForTimeout(120);
  const b = path.join(HERE, 'shot-glyph-' + theme + '.png');
  await pg.screenshot({ path: b });
  shots.push(b);
}
ok('the app itself threw nothing', errs.length === 0, errs.join(' | '));
const mine = net.filter(u => u.indexOf('127.0.0.1') >= 0 && u.indexOf('favicon') < 0);
ok('every file the app asked us for was served', mine.length === 0, mine.join(' | '));
const offsite = net.filter(u => mine.indexOf(u) < 0);
if (offsite.length) console.log('  --    offsite requests this sandbox cannot make: '
  + offsite.length + ' (the page\'s web fonts; not the app)');

await br.close();
srv.close();

/* one proof sheet: four screens side by side */
try {
  execSync('command -v montage', { stdio: 'ignore' });
  execSync('montage ' + shots.join(' ') + ' -tile 4x1 -geometry +12+12 -background '
    + '"#1a1a1a" ' + path.join(HERE, 'script-proof.png'), { stdio: 'ignore' });
  console.log('\nscript-proof.png written');
} catch (e) {
  console.log('\nshots: ' + shots.map(s => path.basename(s)).join(' '));
}
console.log(fail ? '\n' + fail + ' FAILED' : '\nall checks passed');
process.exit(fail ? 1 : 0);
