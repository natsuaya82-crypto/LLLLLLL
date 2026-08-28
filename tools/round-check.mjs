/* ROUND is done to a stroke you have already drawn, and it never invents one.
   ------------------------------------------------------------------------
   It used to be armed before drawing: press the button, then draw, and what
   came out was bent. 「線は先に引いてその後にそれをラウンドにするかどうか
   選べる仕様にしない？」 So a new stroke always starts straight and the
   button acts on the last one.

   Two things it must never do, and neither throws when it does them -- a
   letter simply comes back a different shape from the one drawn, on a canvas
   that renders and in a font that installs.

   A straight stroke stays straight. 「縦線はラウンド押してもラウンドになる
   わけがない」 The ring guess further down keeps three points of a stroke and
   closes them, and closing an arc is a full circle, so a line drawn straight
   down could come back a ring. 「縦線引いただけで円になるんだって」

   And pressing twice gives back exactly what was drawn. The old button only
   turned its mode off and left the stroke bent.

   Run: node tools/round-check.mjs                                       */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
/* playwright the way the other browser checks load it. A bare
   `import { chromium } from 'playwright'` fails at module load on a machine
   where playwright is installed globally rather than into node_modules, and
   because npm test is an && chain, everything after this check stops running
   too -- this file and round-check were the only two not doing it, and they
   took press down with them. */
import fs from 'fs';
import { chromium, LAUNCH } from './browser.mjs';
/* and the browser itself, which may not be at the container's path either */

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true;
  var o = GGRID.inset, D = geStep(), P = function(i,j){ return [o+i*D, o+j*D]; };
  var l = LETTERS[0], out = {};

  /* how wide and tall the ink of one stroke is, through the real writer */
  function box(st){
    var L = LinguaFont.glyphContours({ strokes:[st] }, GPEN),
        x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    L.forEach(function(c){ c.forEach(function(p){
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }); });
    return [Math.round(x1 - x0), Math.round(y1 - y0)];
  }
  function press(pts){
    GE = newGE(l.id, 'x');
    GE.st = [{ pts: JSON.parse(JSON.stringify(pts)) }];
    GE.si = 0; GE.seal = true;
    var drawn = JSON.stringify(GE.st[0]);
    geCircle();
    var once = JSON.stringify(GE.st[0]), w = box(GE.st[0]);
    geCircle();
    return { drawn: drawn, once: once, twice: JSON.stringify(GE.st[0]), box: w };
  }

  var down = [P(10,3),P(10,5),P(10,7),P(10,9),P(10,11),P(10,13),P(10,16)];
  var a = press(down);
  out.lineSame = (a.once === a.drawn);
  out.lineBox  = a.box;
  var bent = press([P(4,4), P(10,10), P(4,16)]);
  out.bendMoves = (bent.once !== bent.drawn);
  out.bendBack  = (bent.twice === bent.drawn);

  /* nothing drawn, nothing to bend */
  GE = newGE(l.id, 'x'); GE.st = []; GE.si = -1;
  out.coldOff = !geBendable();
  GE.st = [{ pts: [P(4,4), P(10,10), P(4,16)] }]; GE.si = 0;
  out.warmOn = geBendable();

  /* ---- and the step forward gives the bend back ----------------------
     「進むはキーボードと同じで！」 OWNER 2026-08-27, so what is asked here
     is what kb-check asks of kbRedo: what came off comes back EXACTLY, not
     a shape bent a second time. Bending is not a pure function of the dots
     -- geCircle reads GE.flat and GE.flatBy, which a step back throws away
     -- so a step forward that re-ran the bend instead of putting the drawing
     back would come out a different letter, on a canvas that renders and in
     a font that installs. */
  function steps(pts){
    GE = newGE(l.id, 'x');
    GE.st = [{ pts: JSON.parse(JSON.stringify(pts)) }];
    GE.si = 0; GE.seal = true;
    var drawn = JSON.stringify(GE.st);
    geCircle();
    var bent = JSON.stringify(GE.st);
    geUndo();
    var back = JSON.stringify(GE.st);
    var midU = GE.undo.length, midR = GE.redo.length;
    geRedo();
    return { drawn:drawn, bent:bent, back:back, fwd:JSON.stringify(GE.st),
             midU:midU, midR:midR, endU:GE.undo.length, endR:GE.redo.length };
  }
  var b = steps([P(4,4), P(10,10), P(4,16)]);
  out.undoUnbends = (b.back === b.drawn);
  out.redoRebends = (b.fwd === b.bent);
  out.stackMid    = [b.midU, b.midR];
  out.stackEnd    = [b.endU, b.endR];

  /* a straight line is untouched by ROUND, so a step either way over it is
     the same drawing three times -- and NOT a ring */
  var d2 = [P(10,3),P(10,7),P(10,11),P(10,16)];
  var st2 = steps(d2);
  out.lineSteps = (st2.drawn === st2.bent && st2.bent === st2.back &&
                   st2.back === st2.fwd);

  /* every dot, over a drawing of more than one stroke: what a step back
     gives up, a step forward gives back, to the number */
  GE = newGE(l.id, 'x');
  GE.st = [{ pts: [P(3,3), P(3,10)] }]; GE.si = 0; GE.seal = true;
  geMark();
  GE.st.push({ pts: [P(8,4), P(14,4), P(14,14)] }); GE.si = 1;
  var two = JSON.stringify(GE.st);
  geUndo();
  out.oneStroke = (GE.st.length === 1);
  geRedo();
  out.bothBack = (JSON.stringify(GE.st) === two);

  /* and drawing something new empties the forward stack -- kbNoted()'s own
     `KBU.r = []`. A step forward that survived would put back a drawing this
     one was never in front of. */
  geUndo();
  out.hasFwd = (GE.redo.length === 1);
  geMark();
  GE.st.push({ pts: [P(6,17), P(16,17)] }); GE.si = GE.st.length - 1;
  out.fwdGone = (GE.redo.length === 0);

  /* the buttons themselves: down when there is nowhere to go. Read off the
     rail the screen actually draws, not off the stacks -- the stacks being
     right and the button being up are two statements. */
  GE = newGE(l.id, 'x');
  out.coldRail = geRail(GE.st[GE.si], 0, 'top');
  GE.undo = ['[]']; GE.redo = ['[]'];
  out.warmRail = geRail(GE.st[GE.si], 0, 'top');
  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.lineSame, 'a line drawn straight down is untouched by ROUND');
say(r.lineBox[0] <= 30, 'and its ink is still ' + r.lineBox[0] + ' wide by ' + r.lineBox[1] + ' -- not a ring');
say(r.bendMoves, 'a stroke with a corner in it does bend');
say(r.bendBack, 'and pressing again gives back exactly what was drawn');
say(r.coldOff, 'with nothing drawn there is nothing to bend and the button is down');
say(r.warmOn, 'with a stroke drawn it is up again');

/* the step forward -- 「進むはキーボードと同じで！」 */
say(r.undoUnbends, 'a step back over ROUND gives back the stroke as drawn');
say(r.redoRebends, 'and the step forward gives back the bent one EXACTLY');
say(r.stackMid[0] === 0 && r.stackMid[1] === 1,
    'after the step back there is nothing behind and one thing ahead -- ' +
    r.stackMid.join('/'));
say(r.stackEnd[0] === 1 && r.stackEnd[1] === 0,
    'and after the step forward it is the other way round -- ' + r.stackEnd.join('/'));
say(r.lineSteps, 'a straight line is the same drawing through both steps -- still not a ring');
say(r.oneStroke, 'a step back over a second stroke leaves one');
say(r.bothBack, 'and the step forward gives every dot of both back');
say(r.hasFwd, 'there is somewhere forward to go after a step back');
say(r.fwdGone, 'and drawing something new empties it');
say(r.coldRail.indexOf('data-g="redo"') !== -1, 'the rail carries a step forward');
say((r.coldRail.match(/disabled/g) || []).length === 2,
    'with nowhere to go both steps are down');
say((r.warmRail.match(/disabled/g) || []).length === 0,
    'and with somewhere to go both are up');

if (bad.length) { console.error('\nround: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nround: done to a stroke, reversible both ways, and it never bends a straight one.');
