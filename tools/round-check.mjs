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
  /* asked of the two buttons by name and not by counting `disabled` across
     the rail -- the bin is down too when nothing is drawn, so a count is
     answering about a third button as well as these two */
  function railBtn(html, g){
    var i = html.indexOf('data-g="' + g + '"');
    if (i < 0) return null;
    return html.slice(i, html.indexOf('</button>', i));
  }
  GE = newGE(l.id, 'x');
  var coldRail = geRail(GE.st[GE.si], 0);
  GE.undo = ['[]']; GE.redo = ['[]'];
  var warmRail = geRail(GE.st[GE.si], 0);
  out.hasRedo  = !!railBtn(coldRail, 'redo');
  out.coldDown = ['undo','redo'].every(function(g){
    return (railBtn(coldRail, g) || '').indexOf('disabled') !== -1; });
  out.warmUp   = ['undo','redo'].every(function(g){
    return (railBtn(warmRail, g) || '').indexOf('disabled') === -1; });
  /* and it is ONE rail with all five on it. 「名前無くしたなら1列でいいよ全部」 */
  out.railRows = (coldRail.match(/class="gtools"/g) || []).length;
  out.railBtns = (coldRail.match(/data-g="/g) || []).length;

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
  /* how much ink is actually on the canvas, read off the canvas */
  function pxOf(c){
    var x = c.getContext('2d'),
        d = x.getImageData(0, 0, c.width, c.height).data, n = 0, i;
    for (i = 0; i < d.length; i += 4) if (d[i] < 100 && d[i+3] > 200) n++;
    return n;
  }
  fresh();
  geDraw();
  out.pinBare = pxOf(C);                         /* the finished stroke alone */
  gePtDown(at(1, M, M));
  gePtMove(at(1, M, M+40));
  out.pinDrew = GE.st.length;                    /* the half-drawn one exists */
  out.pinBusy = pxOf(C);
  gePtDown(at(2, M+60, M));
  out.pinLeft = GE.st.length;
  out.pinKept = JSON.stringify(GE.st[0].pts);
  out.pinWant = JSON.stringify([P(4,4), P(4,12)]);
  /* AND THE PAPER SAYS SO. The drawing being right and the drawing being
     ON THE SCREEN are two statements, and only the second is what somebody
     doing this can see: gePinStart() takes the stroke out of GE.st, and
     nothing else draws until the fingers have moved enough to decide a
     mode -- so a pinch that never decides left the thrown-away line painted
     on the paper for the whole gesture. Photographed before and after the
     second finger, the two pictures were the same picture, with every claim
     above this line green. So the canvas is counted, not GE.st. */
  out.pinPaint = pxOf(C);
  gePtUp(at(1, M, M+40));
  gePtUp(at(2, M+60, M));
  out.pinAfter = GE.st.length;
  out.pinRest = pxOf(C);

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

  /* ---- a long stroke keeps every dot the finger went over --------------
     OWNER 2026-09-04 「160で止めないで」. A stroke used to stop taking dots
     at GE_MAXPTS and from there the drag only pushed its last point about,
     so the middle of a long line was simply not drawn -- and nothing threw:
     the letter rendered, the font installed, and it was a different letter.
     Nobody chose the number; the comment over it said it was higher than any
     real stroke.

     The path is a serpentine over the whole lattice, one dot at a time, one
     event each, the way a phone sends them -- 441 dots and never a doubling
     back onto the dot before, which geMove takes off again. It is asked
     WHILE THE FINGER IS DOWN, because that is where the dots were being
     dropped; what geShape does to them on the lift is thinning and is a
     different statement, held below. */
  fresh();
  var serp = [], si2, sj2, sd;
  for (sj2 = 0; sj2 <= 20; sj2++) {
    for (sd = 0; sd <= 20; sd++) {
      si2 = (sj2 % 2 === 0) ? sd : 20 - sd;
      serp.push([si2, sj2]);
    }
  }
  var g0 = glass(P(serp[0][0], serp[0][1]));
  gePtDown(at(1, g0[0], g0[1]));
  for (sd = 1; sd < serp.length; sd++) {
    var gp = glass(P(serp[sd][0], serp[sd][1]));
    gePtMove(at(1, gp[0], gp[1]));
  }
  var lst = GE.st[GE.st.length - 1];
  out.longWant = serp.length;
  out.longPts  = lst.pts.length;
  /* and the dots themselves, not only how many: a dot the finger crossed
     well past the old ceiling is either in the stroke or it is not. Row 15
     is dot 315 of 441. */
  function has(pt){
    var k;
    for (k = 0; k < lst.pts.length; k++)
      if (lst.pts[k][0] === pt[0] && lst.pts[k][1] === pt[1]) return true;
    return false;
  }
  out.longMid  = has(P(20, 15));
  out.longMid2 = has(P(0, 16));
  out.longEnd  = has(P(20, 20));
  /* the lift, and what the thinning leaves. The turn at the end of a row is
     four dots off the line between its neighbours, so it survives -- which
     is what says the shape is still a serpentine and not a line from the top
     of the drawing to the bottom of it. */
  var gz = glass(P(serp[serp.length - 1][0], serp[serp.length - 1][1]));
  gePtUp(at(1, gz[0], gz[1]));
  out.longKept = lst.pts.length;
  out.longTurn = has(P(20, 15)) && has(P(0, 16));
  /* every row turns at both ends, so a serpentine of 21 rows keeps 40 corners
     however hard the thinning works. A count is a weak thing to ask on its
     own -- it is asked here beside the two turns named above, because what
     went wrong was the shape collapsing into one long drag and not any one
     dot going missing. */
  out.longCorners = 0;
  for (sd = 1; sd < lst.pts.length - 1; sd++) {
    var q0 = lst.pts[sd - 1], q1 = lst.pts[sd], q2 = lst.pts[sd + 1];
    if ((q1[0] - q0[0]) * (q2[1] - q1[1]) !== (q1[1] - q0[1]) * (q2[0] - q1[0]))
      out.longCorners++;
  }

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
say(r.hasRedo, 'the rail carries a step forward');
say(r.coldDown, 'with nowhere to go both steps are down');
say(r.warmUp, 'and with somewhere to go both are up');
say(r.railRows === 1 && r.railBtns === 5,
    'and it is one rail of five -- ' + r.railRows + ' row(s), ' + r.railBtns + ' marks');

/* two fingers -- 「2本指を上下に開いたらズーム、スライドさせたら移動」 */
say(r.pinDrew === 2, 'one finger down and moving is drawing a stroke');
say(r.pinLeft === 1, 'the second finger landing throws that stroke away');
say(r.pinKept === r.pinWant, 'and the stroke that was already finished is untouched');
say(r.pinAfter === 1, 'and lifting both leaves it that way -- no dot left behind');
say(r.pinBusy > r.pinBare, 'the half-drawn stroke is ON the paper while it is drawn -- ' +
    r.pinBare + ' -> ' + r.pinBusy + 'px of ink');
say(r.pinPaint === r.pinBare,
    'and the paper says so the moment the second finger lands, not when it lifts -- ' +
    r.pinPaint + 'px');
say(r.pinRest === r.pinBare, 'and it is still that when the glass is clear -- ' + r.pinRest + 'px');
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

/* a long stroke -- 「160で止めないで」 OWNER 2026-09-04 */
say(r.longPts === r.longWant,
    'a stroke drawn over ' + r.longWant + ' dots holds every one of them -- ' +
    r.longPts);
say(r.longMid, 'the dot at the end of row 15 is in it, 315 dots in');
say(r.longMid2, 'and the one the finger turned onto after it');
say(r.longEnd, 'and the dot it finished on');
say(r.longTurn, 'and the two turns are still there after the finger lifts -- ' +
    r.longKept + ' points kept of ' + r.longWant);
say(r.longCorners >= 40,
    'and it is still a serpentine and not one long drag -- ' + r.longCorners +
    ' corners over 21 rows');

if (bad.length) { console.error('\nround: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nround: done to a stroke, reversible both ways, and it never bends a straight one.');
