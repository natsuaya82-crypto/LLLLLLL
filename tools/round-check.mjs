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

  /* ---- two fingers -------------------------------------------------
     「2本指を上下に開いたらズーム、スライドさせたら移動」 OWNER 2026-08-27.

     It lives in this file because the thing that can go wrong with it is
     this file's subject: a gesture that reaches into strokes somebody
     already drew. Nothing about that throws -- the letter simply comes back
     with a stroke missing, or with a dot the pinch left behind, on a canvas
     that renders and in a font that installs.

     Driven through the canvas's own handlers with the events a phone would
     send: ONE FINGER PER EVENT, because that is what a phone sends and it is
     what the first version of this got wrong. Positions are in glass pixels
     and not in paper units -- a paper unit is a different place on the glass
     after every magnification, so a check that names them in paper is
     measuring against a ruler the thing under test is bending. */
  editLetter(l.id);
  var C = document.getElementById('gcanv');
  var B = C.getBoundingClientRect();
  function at(id, px, py){
    return { pointerId:id, clientX:B.left+px, clientY:B.top+py,
             currentTarget:C, preventDefault:function(){} };
  }
  /* what paper is under a place on the glass, asked of the app's own mapping */
  function under(px, py){
    return [geFrom(B.width, px, 0), geFrom(B.height, py, 1)];
  }
  /* a paper point to a place on the glass, the same way round */
  function glass(u){ return [geTo(B.width, u[0], 0), geTo(B.height, u[1], 1)]; }
  function fresh(){
    GE = newGE(l.id, 'x');
    GE.st = [{ pts: [P(4,4), P(4,12)] }];       /* a stroke already finished */
    GE.si = 0; GE.seal = true; GE.z = 1; GE.cx = 400; GE.cy = 400;
    gePinReset();
  }
  var W = B.width, M = W/2;

  /* the stroke still under the finger is thrown away; the finished one is
     not. 「人が作ったものを消さない」 */
  fresh();
  gePtDown(at(1, M, M));
  gePtMove(at(1, M, M+40));
  out.pinDrew = GE.st.length;                    /* the half-drawn one exists */
  gePtDown(at(2, M+60, M));
  out.pinLeft = GE.st.length;
  out.pinKept = JSON.stringify(GE.st[0].pts);
  out.pinWant = JSON.stringify([P(4,4), P(4,12)]);
  gePtUp(at(1, M, M+40));
  gePtUp(at(2, M+60, M));
  out.pinAfter = GE.st.length;

  /* opening the fingers magnifies, and it does not step. Both fingers move,
     one event each, which is what a phone sends. */
  fresh();
  gePtDown(at(1, M-30, M));
  gePtDown(at(2, M+30, M));
  gePtMove(at(1, M-60, M)); gePtMove(at(2, M+60, M));
  out.zOpen = geZ();
  gePtMove(at(1, M-90, M)); gePtMove(at(2, M+90, M));
  out.zOpen2 = geZ();
  /* and open them PAST it -- the gap here is five times the one they landed
     with, so a missing ceiling shows as 5 and not as 3. Asking at exactly
     three proves nothing: the ratio is three there whether or not anything
     is holding it. */
  gePtMove(at(1, M-150, M)); gePtMove(at(2, M+150, M));
  out.zWide = geZ();
  out.zCeil = geZ() <= 3.0000001;

  /* and closing them again comes back down, never under 1 */
  gePtMove(at(1, M-10, M)); gePtMove(at(2, M+10, M));
  out.zShut = geZ();
  gePtUp(at(1, M-10, M)); gePtUp(at(2, M+10, M));

  /* a finger that stays put keeps it undecided, however far the other one
     goes. That is deliberate and it is the whole reason a slide works: one
     finger's travel is the same numbers whichever gesture this is. */
  fresh();
  gePtDown(at(1, M-20, M));
  gePtDown(at(2, M+20, M));
  gePtMove(at(2, M+90, M));
  out.zSolo = (geZ() === 1);
  gePtUp(at(1, M-20, M)); gePtUp(at(2, M+90, M));

  /* sliding the two moves the paper and leaves the zoom where it was, and
     what was under the fingers is still under them. THE FINGERS MOVE ONE AT
     A TIME: half way through, one has travelled the whole way and the other
     has not moved, which is the instant every slide used to read as a pinch. */
  fresh();
  GE.z = 2;
  gePtDown(at(1, M-30, M-10));
  gePtDown(at(2, M+30, M-10));
  var mid0 = under(M, M-10);
  gePtMove(at(1, M-30+34, M-10+22));
  out.mHalf = geZ();                    /* nothing has been decided yet */
  gePtMove(at(2, M+30+34, M-10+22));
  out.mZoom = geZ();
  var back = glass(mid0);
  out.mHold = Math.abs(back[0]-(M+34)) + Math.abs(back[1]-(M-10+22));

  /* decided once: it is a move, so opening them now does not magnify */
  var zWas = geZ();
  gePtMove(at(1, M-30+34-40, M-10+22));
  gePtMove(at(2, M+30+34+40, M-10+22));
  out.mStill = (geZ() === zWas);
  gePtUp(at(1, M-30+34-40, M-10+22));
  gePtUp(at(2, M+30+34+40, M-10+22));
  out.mOff = !GEPIN.on;

  /* one finger is the drawing, untouched */
  fresh();
  var n0 = GE.st.length;
  gePtDown(at(1, M-40, 30));
  gePtMove(at(1, M-40, 30+70));
  gePtUp(at(1, M-40, 30+70));
  out.oneNew = (GE.st.length === n0 + 1);
  out.onePts = GE.st[GE.st.length-1].pts.length;
  out.oneZoom = geZ();

  /* and none of it is written to the letter */
  out.stored = JSON.stringify(ltById(l.id) || {}).indexOf('"z"') === -1;
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

/* two fingers -- 「2本指を上下に開いたらズーム、スライドさせたら移動」 */
say(r.pinDrew === 2, 'one finger down and moving is drawing a stroke');
say(r.pinLeft === 1, 'the second finger landing throws that stroke away');
say(r.pinKept === r.pinWant, 'and the stroke that was already finished is untouched');
say(r.pinAfter === 1, 'and lifting both leaves it that way -- no dot left behind');
say(r.zOpen > 1, 'opening the fingers magnifies: ' + r.zOpen.toFixed(3));
say(r.zOpen2 > r.zOpen, 'opening them further magnifies further: ' + r.zOpen2.toFixed(3));
say(r.zCeil, 'and a gap five times the one they landed with still gives 3 -- ' + r.zWide.toFixed(3));
say(r.zShut === 1, 'closing them comes back down and stops at 1 -- ' + r.zShut);
say(r.zSolo, 'a finger that stays put keeps it undecided -- one finger is never enough');
say(r.mHalf === 2, 'one finger having moved and the other not decides nothing -- ' + r.mHalf);
say(r.mZoom === 2, 'and sliding both leaves the zoom where it was -- ' + r.mZoom);
say(r.mHold < 1,
    'the paper under them is still under them, ' + r.mHold.toFixed(2) + 'px out');
say(r.mStill, 'once it is a move, opening the fingers does not start magnifying');
say(r.mOff, 'and the glass being clear ends it');
say(r.oneNew, 'one finger still draws a new stroke');
say(r.onePts > 1, 'and it is a line, not a dot -- ' + r.onePts + ' points');
say(r.oneZoom === 1, 'and one finger never magnifies');
say(r.stored, 'and nothing about any of it is written to the letter');

if (bad.length) { console.error('\nround: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nround: done to a stroke, reversible both ways, and it never bends a straight one.');
