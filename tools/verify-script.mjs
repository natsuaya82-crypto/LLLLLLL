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
const at = (x, y) => ({ x: box.x + box.width * x / 800, y: box.y + box.height * y / 800 });

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

/* ---- the two actions that stopped being buttons ----------------------------
   Deleting a point and joining a line back to its start are not tools; they
   are answers to a tap on a dot that is already there. That makes them worth
   testing through the mouse rather than through the function, because the
   whole claim is that the gesture — not a button — is what does it. */
const p2 = await pg.evaluate(() => { GE.pi = 2; geDraw(); return GE.st[0].pts[2].slice(); });
const c2 = at(p2[0], p2[1]);
await pg.mouse.click(c2.x, c2.y);
const gone = await pg.evaluate(() => ({ n: GE.st[0].pts.length, pi: GE.pi }));
ok('tapping the point you just placed takes it back',
  gone.n === 2 && gone.pi === -1, gone.n + ' points left');

await pg.mouse.click(c2.x, c2.y);           /* nothing selected now, so it lands again */
const backAgain = await pg.evaluate(() => GE.st[0].pts.length);
ok('and tapping the empty dot puts it back', backAgain === 3, backAgain + ' points');

const p0 = await pg.evaluate(() => GE.st[0].pts[0].slice());
const c0 = at(p0[0], p0[1]);
await pg.mouse.click(c0.x, c0.y);
const shut = await pg.evaluate(() => !!GE.st[0].closed);
await pg.mouse.click(c0.x, c0.y);
const open = await pg.evaluate(() => !!GE.st[0].closed);
ok('tapping the dot you started from joins the line, and again unjoins it',
  shut === true && open === false);

/* ---- going back ------------------------------------------------------------
   One direction, because a five-tap drawing has no use for a future. What it
   does need is that the one step it has is never a step to nowhere: choosing
   a point is not a change, so it must not land on the stack. */
const p1 = await pg.evaluate(() => GE.st[0].pts[1].slice());
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
ok('the rail is two marks, and nothing else', hist.named === 'circle new', hist.named);
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

const ring = await pg.evaluate(() => {
  const keep = JSON.stringify(GE.st);
  /* two dots 576 apart: the circle on them as a diameter is centred halfway
     between, at 400,400, with radius 288 */
  GE.st = [{ pts: [[400, 112], [400, 688]] }]; GE.si = 0; GE.pi = -1;
  geCircle();
  const st = GE.st[0], poly = LinguaFont.toPolyline(st);
  geDraw();
  const c = document.getElementById('gcanv'), g = c.getContext('2d');
  const px = (x, y) => g.getImageData(Math.round(x / 800 * c.width),
                                      Math.round(y / 800 * c.width), 1, 1).data[3];
  /* well inside the hole and well out on the rim, both clear of a lattice dot
     and of the gold handles the editor draws on the two tapped points */
  const hole = px(400, 220), rim = px(604, 196), extra = st.pts.length;
  const shut = Math.abs(poly[0][0] - poly[poly.length - 1][0]) < 1e-9 &&
               Math.abs(poly[0][1] - poly[poly.length - 1][1]) < 1e-9;
  GE.st = JSON.parse(keep); GE.si = 0; GE.pi = 1; geDraw();
  return { kind: st.k, poly, hole, rim, extra, shut };
});
const rg = geom(ring.poly, 400, 400);
ok('two dots and the round button make a whole circle',
  ring.kind === 'o' && ring.extra === 2 && ring.shut && Math.abs(rg.R - 288) < 1e-9,
  ring.poly.length + ' segments, radius ' + rg.R.toFixed(3));
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
  GE.st = [{ pts: [A.slice(), B.slice(), C.slice()] }]; GE.si = 0; GE.pi = -1;
  geCircle();
  const st = GE.st[0], up = LinguaFont.toPolyline(st);
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
  arc.kept === 3 && arc.ends < 1e-9, 'ends land exactly on the dots you tapped');
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

/* ---- one line, or one corner -----------------------------------------------
   A stroke carries a single decision: a line between two dots, or one corner
   between three. Past that there is nothing left to decide about it, so the
   canvas stops rewriting it and starts the next one on its own — beginning at
   the dot the last one ended on, so what is drawn stays joined without anyone
   having to say join. This is driven through the mouse rather than through the
   functions, because the claim is precisely that no button is involved. */
const keptStance = await pg.evaluate(() => {
  const keep = { st: JSON.stringify(GE.st), depth: GE.undo.length };
  GE.st = [{ pts: [] }]; GE.si = 0; GE.pi = -1; geDraw(); geTools();
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
  n: GE.st.length, first: GE.st[0].pts.length, si: GE.si,
  next: GE.st[1] ? GE.st[1].pts.map(p => p.slice()) : null
}));
ok('a fourth tap does not grow the corner — it begins the next stroke',
  nextUp.n === 2 && nextUp.first === 3 && nextUp.si === 1,
  nextUp.n + ' strokes, the first still ' + nextUp.first + ' points');
ok('and the next stroke starts where the last one ended, so the ink stays joined',
  JSON.stringify(nextUp.next) === JSON.stringify([corner[2], fourth]),
  JSON.stringify(nextUp.next));

/* A circle has no end, and neither does a line joined back to its start, so
   there is nothing there for the next stroke to continue from: it starts bare
   instead of being dragged out of a shape that was finished. */
const rounded = await pg.evaluate(() => {
  GE.st = [{ pts: [[184, 400], [616, 400]] }]; GE.si = 0; GE.pi = -1;
  geCircle(); geDraw(); geTools();
  return GE.st[0].k;
});
const cFree = at(lattice[2], lattice[1]);
await pg.mouse.click(cFree.x, cFree.y);
const fresh = await pg.evaluate(() => ({
  n: GE.st.length, pts: GE.st[1] ? GE.st[1].pts.length : 0 }));
ok('a circle has no end to carry on from, so the next mark starts on its own',
  rounded === 'o' && fresh.n === 2 && fresh.pts === 1,
  fresh.n + ' strokes, the new one holding ' + fresh.pts + ' point');

/* Nothing in the editor can build a longer stroke any more, but a letter saved
   by an older build can hold one. Round stays refused there rather than
   quietly dropping points to fit. */
const over = await pg.evaluate(() => {
  GE.st = [{ pts: [[184, 184], [400, 184], [400, 400], [616, 400]] }];
  GE.si = 0; GE.pi = -1; geDraw(); geTools();
  const b = document.querySelector('.gtools button[data-g="circle"]');
  const dim = b.getAttribute('aria-disabled') === 'true' && / off\b|^off$/.test(b.className);
  geCircle();
  return { dim, k: GE.st[0].k, n: GE.st[0].pts.length };
});
ok('round is not offered past a corner, and refuses if asked anyway',
  over.dim && typeof over.k === 'undefined' && over.n === 4,
  'button dim ' + over.dim + ', still ' + over.n + ' plain points');
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
  const dim = b.className.indexOf('off') >= 0 && b.disabled === false &&
              b.getAttribute('aria-disabled') === 'true' &&
              b.getAttribute('onclick').indexOf("geHintShow('circle')") >= 0;
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
  Object.keys(S).forEach(r => {
    if (SCRIPT.extra.indexOf(r) < 0 && scriptLetters().indexOf(r) < 0) SCRIPT.extra.push(r);
    SCRIPT.g[r] = S[r];
  });
  save(); installScriptFont(); render();
  const back = JSON.parse(localStorage.getItem('lingua.script') || '{}');
  /* scriptDrawn() counted the units with ink in them and went out in
     9226dd6, when the font stopped being built from anything but the
     letters. What the font is made of is now the one list, so ask that
     list how long it is. */
  return { letters: scriptLetters(), drawn: scriptGlyphDefs().defs.length, font: SFONT.built,
           kept: back && back.g && back.g.i && back.g.i[1] && back.g.i[1].k };
});
ok('the font was built on the device', built.font,
  built.drawn + ' of ' + built.letters.length + ' letters drawn');
ok('a ring survives being written down and read back', built.kept === 'o');

/* ---- 2 & 3. the font, and the square cell -------------------------------- */
console.log('\n2. the font in the page');
const font = await pg.evaluate(async () => {
  await document.fonts.load('17px "LinguaScript"', 'ashiklt');
  const cnv = document.createElement('canvas'), cx = cnv.getContext('2d');
  const wid = (fam, s, px) => { cx.font = px + 'px "' + fam + '"'; return cx.measureText(s).width; };
  const L = ['a', 'i', 'k', 'l', 's', 't', 'h'];
  const cell = wid('LinguaScript', 'a', 17);
  /* sh is a letter of this alphabet, so the pair s+h is supposed to come out as
     ONE cell — it is the ligature doing its job, not a spacing error. Every
     other pair must be two. */
  const DI = scriptLetters().filter(r => r.length > 1);
  let worst = 0;
  for (const p of L) for (const q of L) {
    if (DI.indexOf(p + q) >= 0) continue;
    worst = Math.max(worst, Math.abs(wid('LinguaScript', p + q, 17) - 2 * cell));
  }
  const uniq = {};
  L.forEach(c => { uniq[wid('LinguaScript', c, 17).toFixed(3)] = 1; });
  /* the same string in the app's own serif, for comparison: if the two agree to
     the pixel the face never loaded and we are measuring the fallback */
  return {
    loaded: document.fonts.check('17px "LinguaScript"', 'ashiklt'),
    faces: [...document.fonts].map(f => f.family + ':' + f.status),
    cell17: +cell.toFixed(3),
    uniform: Object.keys(uniq).length === 1,
    worstPairErr: +worst.toFixed(3),
    lineErr: +(wid('LinguaScript', 'kalitas', 17) - 7 * cell).toFixed(3),
    ligCells: +((wid('LinguaScript', 's', 17) + wid('LinguaScript', 'h', 17)
               - wid('LinguaScript', 'sh', 17)) / cell).toFixed(3),
    capSameAsLower: wid('LinguaScript', 'A', 17) === cell
                 && wid('LinguaScript', 'Ashi', 17) === wid('LinguaScript', 'ashi', 17),
    spaceCells: +(( wid('LinguaScript', 'a a', 17) - 2 * cell) / cell).toFixed(3),
    notFallback: wid('LinguaScript', 'ashi', 17) !== wid('serif', 'ashi', 17),
  };
});
ok('LinguaScript is installed and loaded', font.loaded, font.faces.join(' '));
ok('it is the drawn face, not a fallback', font.notFallback);
console.log('\n3. the square cell');
ok('every letter is one cell wide', font.uniform, font.cell17 + 'px at 17px');
ok('a pair is exactly two cells', font.worstPairErr === 0, font.worstPairErr + 'px');
ok('a 7-letter word is 7 cells', font.lineErr === 0, font.lineErr + 'px');
ok('the digraph sh costs one cell', Math.abs(font.ligCells - 1) < 0.02, font.ligCells + ' cells');
ok('a capital is the same drawing', font.capSameAsLower);
ok('a space is one cell too', Math.abs(font.spaceCells - 1) < 0.02, font.spaceCells + ' cells');

/* ---- the alphabet grows with the dictionary ------------------------------ */
console.log('\n4. a word written after the font was built');
const grew = await pg.evaluate(async () => {
  const was = scriptLetters().slice();
  WORDS.push({ hw: 'Nuro', mn: 'night', pos: 'n' });      // brings n and r with it
  save(); render();
  await document.fonts.load('17px "LinguaScript"', 'nr');
  const cnv = document.createElement('canvas'), cx = cnv.getContext('2d');
  const wid = (s) => { cx.font = '17px "LinguaScript"'; return cx.measureText(s).width; };
  const cell = wid('a');
  return {
    was: was.join(''), now: scriptLetters().join(''),
    nCell: +(wid('n') / cell).toFixed(3), rCell: +(wid('r') / cell).toFixed(3),
    word: +(wid('Nuro') / cell).toFixed(3),
  };
});
ok('the new sounds joined the alphabet', grew.now.length > grew.was.length,
  grew.was + ' -> ' + grew.now);
ok('the font rebuilt itself for them',
  Math.abs(grew.nCell - 1) < 0.02 && Math.abs(grew.rCell - 1) < 0.02,
  'n ' + grew.nCell + ' cells, r ' + grew.rCell + ' cells');
ok('an undrawn letter still holds its cell', Math.abs(grew.word - 4) < 0.02,
  grew.word + ' cells for a 4-letter word');

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
    stored: JSON.stringify(JSON.parse(localStorage.getItem('lingua.words')).map(w => w.hw)),
    scriptStored: !!JSON.parse(localStorage.getItem('lingua.script')).g.a,
  };
});
ok('the display switches to your letters', on.attr === 'on' && /LinguaScript/.test(on.family),
  on.family);
ok('the text on screen is still the word', on.text === 'Ashi', JSON.stringify(on.text));
ok('what is stored is unchanged ASCII', on.stored === before && /^[\x20-\x7e"\[\],]+$/.test(on.stored),
  on.stored);
ok('the drawings are saved too', on.scriptStored);
/* One switch, so it has to reach every screen that shows a headword as itself —
   the sentence screen shows one twice, in the chips being woven and in the line
   they read as, and both used to stay roman while the word list changed. */
const reach = await pg.evaluate(() => {
  go('sent');
  const fam = (s) => { const el = document.querySelector(s);
    return el ? getComputedStyle(el).fontFamily : 'missing'; };
  return { chip: fam('.wcw'), read: fam('.sww'), ipa: fam('.out') };
});
ok('the sentence you are weaving is in your letters too',
  /LinguaScript/.test(reach.chip) && /LinguaScript/.test(reach.read),
  'chips ' + reach.chip.split(',')[0] + ', read-out ' + reach.read.split(',')[0]);
ok('but the pronunciation stays in letters everyone can read',
  !/LinguaScript/.test(reach.ipa), reach.ipa.split(',')[0]);
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
  const read = () => { go('words'); const el = document.querySelector('.hw');
    return { text: el ? el.textContent : '', fam: el ? getComputedStyle(el).fontFamily : '' }; };
  setMyFont(false);
  SET.script = { a: 'あ', s: 'さ', h: 'は', i: 'い' }; SET.showScript = true; save();
  const borrowed = read();
  setMyFont(true);
  const drawn = read();
  setMyFont(false); SET.showScript = false; SET.script = {}; save(); render();
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
  await pg.evaluate((th) => { setTheme(th); setMyFont(true); go('script'); }, theme);
  await pg.waitForTimeout(120);
  const tiles = await pg.evaluate(() => {
    const els = document.querySelectorAll('.gtile canvas.tc');
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
