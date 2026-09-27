/* The rope on the drawing surface: what is encircled lights, what is lit
   moves together, and the bin takes what is lit and nothing else.
   ------------------------------------------------------------------------
   「ロープボタンで囲った範囲の字は動かせるとか？」「そうしよ」 OWNER
   2026-09-27 (docs/FEATURE_RULES.md § Owner decision log).

   Nothing about this can throw when it is wrong. A drag that moved one dot
   too many, a bin that took the whole stroke rather than the stretch that
   touched the lit dot, a step back that put back the wrong drawing -- each
   is a letter that renders, a font that installs, and not the letter
   somebody made. So every claim here is asked PER DOT, of the drawing as
   it stands after a real press of a real button and real pointer events on
   the real canvas, and never as a count: the counts agreeing while the
   dots are shifted is the only way this breaks.

   Run: node tools/lasso-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.walked = true;
  var o = GGRID.inset, D = geStep(), P = function(i,j){ return [o+i*D, o+j*D]; };
  var l = LETTERS[0], out = {}, kept = JSON.stringify(ltById(l.id) || {});
  var J = function(v){ return JSON.stringify(v); };

  /* the real button, pressed the way a finger presses it: a click on the
     element, through act.js */
  function btn(g){ return document.querySelector('.gtools button[data-g="' + g + '"]'); }
  function tap(g){ var b = btn(g); if (b && !b.disabled) b.click(); return !!b; }
  /* the canvas is built again by every render, so it is asked for each time */
  function cv(){ return document.getElementById('gcanv'); }
  function glass(u){
    var c = cv(), B = c.getBoundingClientRect();
    return [B.left + geTo(B.width, u[0], 0), B.top + geTo(B.height, u[1], 1)];
  }
  function ev(type, u){
    var g = glass(u);
    cv().dispatchEvent(new PointerEvent(type, { pointerId:1, clientX:g[0], clientY:g[1],
                                                bubbles:true, cancelable:true }));
  }
  /* a finger thrown round the paper points of `ring`, in small steps */
  function rope(ring){
    var i, k, a, b;
    ev('pointerdown', ring[0]);
    for (i = 0; i < ring.length; i++){
      a = ring[i]; b = ring[(i + 1) % ring.length];
      for (k = 1; k <= 8; k++) ev('pointermove', [a[0] + (b[0]-a[0])*k/8, a[1] + (b[1]-a[1])*k/8]);
    }
    ev('pointerup', ring[0]);
  }
  /* a box of lattice cells, a half step outside the dots it is meant to hold */
  function box(i0, j0, i1, j1){
    var h = D/2;
    return [[o+i0*D-h, o+j0*D-h], [o+i1*D+h, o+j0*D-h], [o+i1*D+h, o+j1*D+h], [o+i0*D-h, o+j1*D+h]];
  }
  function drag(from, to){
    ev('pointerdown', from);
    var k;
    for (k = 1; k <= 6; k++) ev('pointermove', [from[0] + (to[0]-from[0])*k/6, from[1] + (to[1]-from[1])*k/6]);
    ev('pointerup', to);
  }
  function fresh(st){
    editLetter(l.id);
    GE.st = JSON.parse(J(st)); GE.si = GE.st.length - 1; GE.seal = true;
    GE.undo = []; GE.redo = [];
    render();
  }
  var A = [P(4,4), P(4,8), P(4,12), P(4,16)], B = [P(10,4), P(14,4), P(14,10)];

  /* ---- the rope is a mark on the rail, and it changes the rail ----------- */
  fresh([{pts:A}, {pts:B}]);
  out.railDraw = [].map.call(document.querySelectorAll('.gtools button'), function(b){ return b.getAttribute('data-g'); }).join(' ');
  tap('lasso');
  out.lsOn = GE.ls === true;
  out.railLs = [].map.call(document.querySelectorAll('.gtools button'), function(b){ return b.getAttribute('data-g'); }).join(' ');
  out.binColdDown = !!btn('bin') && btn('bin').disabled;
  out.lassoLit = /\bon\b/.test(btn('lasso').className);

  /* ---- a ring lights what is inside it and nothing else ------------------ */
  rope(box(3, 7, 5, 13));
  out.sel = J(GE.lsSel);
  out.binUp = !!btn('bin') && !btn('bin').disabled;
  out.ropeDrew = J(GE.st) === J([{pts:A}, {pts:B}]);

  /* ---- a trace lights the dots it passed, and stops where it stopped -----
     「投げ縄なぞったとこで止めて欲しいのに全部一直線で選ばれるけど。囲ったとこ
     とかも関係ない。」 OWNER 2026-09-27, on a phone. One button: what the
     finger did says which, and a finger on glass is not the finger in the
     first version of this check -- its samples come far apart and a ring
     it throws seldom closes. So the finger here is handed over as coarse
     samples, and the ring below is one a thumb makes: nine points round
     three hundred degrees, ending three steps short of where it began. */
  function trace(pts){
    ev('pointerdown', pts[0]);
    for (var i = 1; i < pts.length; i++) ev('pointermove', pts[i]);
    ev('pointerup', pts[pts.length - 1]);
  }
  var LONG = [], yy;
  for (yy = 2; yy <= 18; yy += 2) LONG.push(P(10, yy));
  var C = [P(4,14)];
  fresh([{pts:LONG}, {pts:C}]);
  tap('lasso');
  trace([P(10,7), P(10,8), P(10,9), P(10,10), P(10,11), P(10,12), P(10,13)]);
  out.traceMid = J(GE.lsSel);
  trace([P(6,10), P(14,10)]);      /* across it, once, fast: two samples */
  out.traceAcross = J(GE.lsSel);
  var thumb = [], a;
  for (a = 0; a <= 8; a++){
    var th = (30 + a*300/8) * Math.PI/180;
    thumb.push([P(10,10)[0] + 3*D*Math.cos(th), P(10,10)[1] + 3*D*Math.sin(th)]);
  }
  trace(thumb);
  out.thumbRing = J(GE.lsSel);
  /* four sides round the dot C, shut and then left open: shut is a ring
     round C, open is a trace that passes no dot */
  var U = [P(3,13), P(3,15), P(5,15), P(5,13)];
  tap('lasso'); tap('lasso');
  rope(U);
  out.shutU = J(GE.lsSel);
  tap('lasso'); tap('lasso');
  trace([U[0], P(3,14), U[1], P(4,15), U[2], P(5,14), U[3]]);
  out.openU = J(GE.lsSel);
  /* and what a trace lit is pulled like anything lit: those dots, no others */
  tap('lasso'); tap('lasso');
  trace([P(10,7), P(10,8), P(10,9), P(10,10), P(10,11), P(10,12), P(10,13)]);
  drag(P(10,10), P(12,10));
  out.traceMoved = LONG.every(function(p, i){
    var want = (i >= 3 && i <= 5) ? [p[0]+2*D, p[1]] : p;
    return J(GE.st[0].pts[i]) === J(want);
  }) && J(GE.st[1].pts) === J(C);
  fresh([{pts:A}, {pts:B}]);
  tap('lasso');
  rope(box(3, 7, 5, 13));

  /* ---- a lit dot pulled takes the lit dots, and only them ---------------- */
  var u0 = GE.undo.length;
  drag(P(4,8), P(6,6));
  var dx = 2*D, dy = -2*D;
  out.moveLit = J(GE.st[0].pts[1]) === J([A[1][0]+dx, A[1][1]+dy]) &&
                J(GE.st[0].pts[2]) === J([A[2][0]+dx, A[2][1]+dy]);
  out.moveRest = J(GE.st[0].pts[0]) === J(A[0]) && J(GE.st[0].pts[3]) === J(A[3]) &&
                 J(GE.st[1].pts) === J(B);
  out.moveOneStep = GE.undo.length === u0 + 1;
  var moved = J(GE.st);
  tap('undo');
  out.undoMove = J(GE.st) === J([{pts:A}, {pts:B}]);
  tap('redo');
  out.redoMove = J(GE.st) === moved;

  /* ---- the whole letter, lifted and set down again ----------------------- */
  fresh([{pts:A}, {pts:B}]);
  tap('lasso');
  rope(box(0, 0, 20, 20));
  out.selAll = GE.lsSel.length === A.length + B.length;
  drag(P(4,4), P(5,6));
  var allOk = true;
  [A, B].forEach(function(src, si){
    src.forEach(function(p, pi){
      if (J(GE.st[si].pts[pi]) !== J([p[0]+D, p[1]+2*D])) allOk = false;
    });
  });
  out.moveAll = allOk;
  /* and against the edge it stops whole: every dot the same distance */
  drag(P(5,6), P(20,6));
  var sx = GE.st[0].pts[0][0] - A[0][0], same = true;
  [A, B].forEach(function(src, si){
    src.forEach(function(p, pi){
      if (GE.st[si].pts[pi][0] - p[0] !== sx) same = false;
      if (GE.st[si].pts[pi][0] > 800 - o) same = false;
    });
  });
  out.edgeWhole = same && GE.st[1].pts[1][0] === 800 - o;

  /* ---- the bin takes the lit dot and the stretches that touch it --------- */
  var L5 = [P(2,2), P(2,5), P(2,8), P(2,11), P(2,14)];
  var Q = [P(8,8), P(12,8), P(12,12), P(8,12)];
  fresh([{pts:L5}, {pts:B}, {pts:Q, closed:true, fill:true}]);
  tap('lasso');
  rope(box(1, 7, 3, 9));           /* the middle dot of L5 */
  out.binSel = J(GE.lsSel) === J([[0,2]]);
  var before = J(GE.st), u1 = GE.undo.length;
  tap('bin');
  out.binSplit = GE.st.length === 4 &&
                 J(GE.st[0].pts) === J([L5[0], L5[1]]) &&
                 J(GE.st[1].pts) === J([L5[3], L5[4]]);
  out.binRest = J(GE.st[2]) === J({pts:B}) && J(GE.st[3]) === J({pts:Q, closed:true, fill:true});
  out.binOneStep = GE.undo.length === u1 + 1;
  out.binSelGone = GE.lsSel.length === 0 && btn('bin').disabled;
  var binned = J(GE.st);
  tap('undo');
  out.binUndo = J(GE.st) === before;
  tap('redo');
  out.binRedo = J(GE.st) === binned;

  /* a closed stroke opened by the bin runs on round its join */
  fresh([{pts:Q, closed:true}]);
  tap('lasso');
  rope(box(11, 7, 13, 9));         /* Q[1] */
  tap('bin');
  out.binRing = GE.st.length === 1 && !GE.st[0].closed &&
                J(GE.st[0].pts) === J([Q[2], Q[3], Q[0]]);

  /* ---- the rope put down, the pen is the pen again ----------------------- */
  fresh([{pts:A}]);
  tap('lasso');
  rope(box(3, 3, 5, 9));
  tap('lasso');
  out.lsOff = GE.ls === false && GE.lsSel.length === 0;
  out.railBack = [].map.call(document.querySelectorAll('.gtools button'), function(b){ return b.getAttribute('data-g'); }).join(' ');
  drag(P(10,10), P(10,16));
  out.drawAgain = GE.st.length === 2 && J(GE.st[0].pts) === J(A) && GE.st[1].pts.length > 1;

  /* and none of it is written to the letter */
  out.stored = J(ltById(l.id) || {}) === kept;
  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(!errs.length, 'nothing thrown' + (errs.length ? ' -- ' + errs.join(' | ') : ''));
say(r.railDraw === 'undo redo fill circle clear lasso', 'drawing, the rail is what it was with the rope on the end -- ' + r.railDraw);
say(r.lsOn && r.lassoLit, 'pressing the rope puts it down, and the mark says so');
say(r.railLs === 'undo redo bin clear lasso', 'and the bin stands where fill and ROUND were -- ' + r.railLs);
say(r.binColdDown, 'with nothing lit the bin is down');
say(r.sel === '[[0,1],[0,2]]', 'a ring lights the dots inside it and no other -- ' + r.sel);
say(r.ropeDrew, 'and throwing it draws nothing');
say(r.binUp, 'with something lit the bin is up');
say(r.traceMid === '[[0,3],[0,4],[0,5]]', 'a trace down the middle of a long line lights the dots it passed and stops there -- ' + r.traceMid);
say(r.traceAcross === '[[0,4]]', 'a fast trace across it lights the one dot it crossed -- ' + r.traceAcross);
say(r.thumbRing === '[[0,3],[0,4],[0,5]]', 'a thumb\'s ring -- coarse, three hundred degrees, not closed -- is a ring: the dots inside light -- ' + r.thumbRing);
say(r.shutU === '[[1,0]]', 'shut round a dot, it is a ring: the dot lights -- ' + r.shutU);
say(r.openU === '[]', 'the same shape left open is a trace, and it passed no dot -- ' + r.openU);
say(r.traceMoved, 'what a trace lit is pulled, and not one other dot of the line moves');
say(r.moveLit, 'pulling a lit dot moves every lit dot the same distance, on the lattice');
say(r.moveRest, 'and not one dot that is not lit moves');
say(r.moveOneStep, 'the pull is one step on the one history');
say(r.undoMove, 'a step back puts every dot back');
say(r.redoMove, 'and a step forward pulls them again');
say(r.selAll, 'a ring round the whole letter lights every dot of it');
say(r.moveAll, 'and the whole letter moves by the same distance, dot for dot');
say(r.edgeWhole, 'pulled against the edge, it stops there whole');
say(r.binSel, 'one dot lit in the middle of a stroke');
say(r.binSplit, 'the bin takes it and the two stretches touching it: the stroke is two');
say(r.binRest, 'and every other stroke is exactly as it was');
say(r.binOneStep, 'the bin is one step on the one history');
say(r.binSelGone, 'and afterwards nothing is lit and the bin is down');
say(r.binUndo, 'a step back gives every dot back');
say(r.binRedo, 'and a step forward takes them again');
say(r.binRing, 'a closed stroke opened by the bin runs on round its join');
say(r.lsOff, 'pressing the rope again picks it up and puts the light out');
say(r.railBack === 'undo redo fill circle clear lasso', 'and the rail is the drawing rail again -- ' + r.railBack);
say(r.drawAgain, 'and a finger draws a new stroke, touching nothing already drawn');
say(r.stored, 'and nothing about any of it is written to the letter');

if (bad.length) { console.error('\nlasso: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nlasso: what is encircled lights, what is lit moves together, and the bin takes only what touches it.');
