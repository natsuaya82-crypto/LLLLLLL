/* A stroke's width, the layer it is on, and the line a letter stands on.
   ---------------------------------------------------------------------
   OWNER 2026-09-30 「字を描く画面にベースライン、線ごとの太さ」 and its 追記
   (docs/FEATURE_RULES.md § Owner decision log).

   None of it can throw. A width dropped on the way to the font gives a letter
   that is merely the old weight; a stroke of another layer moved by the rope
   gives a letter that still renders; a baseline drawn at the wrong height is
   a line on a canvas. So each is asked of what the real code DID:

     the width    -- a stroke drawn after the width is chosen carries it, it
                     survives the Save, and it is the width of the ink the
                     font writer was handed, of a post's ink and of a key's
                     outline; a stroke with no width draws to the pixel what
                     it drew before strokes could carry one, and the font of
                     the fixture's letters is the same bytes it was; a post
                     written before keeps the ink it carried; a width off a
                     post is held to the range; a width changed moves what
                     the keyboard is sent.
     the layers   -- on layer 1, a stroke of layer 2 is not lit by the rope,
                     not taken by the bin or by clear, not taken back by a
                     step back, not moved by a finger on its dot, and comes
                     back whole in what is saved.
     the baseline -- both faces are built on geBase(), and the paper draws a
                     line there across the whole canvas.
     the pad      -- the square drawn again small under the rail is gone, and
                     the layers stand where it was.

   Run: node tools/layer-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

/* What the code drew before a stroke could carry a width, measured on
   integ-0905 at 0e0a4826 with the same five strokes and the same seed:
   inked pixels : a hash of the red channel, and the fixture's font as
   base64 length : hash. A stroke with no `w` has to give exactly these. */
const OLD_PX = '8209:1020599707';
const OLD_FONT = '2524:3483642185';

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
const errs = [];
pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(async ({s}) => {
  eval('(' + s + ')()');
  SET.walked = true; SET.theme = 'light'; SET.myfont = true;
  makeNeed = function(){ return true; };
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  async function saved(){ for (var i = 0; i < 250 && KEEP_BUSY; i++) await wait(20); }
  window.__SENT = [];
  netSend = function(method, p, body, tok, ok){
    window.__SENT.push(method + ' ' + p + ' ' + (typeof body === 'string' ? body : JSON.stringify(body || '')));
    setTimeout(function(){
      ok(method === 'POST' && p.indexOf('/rest/v1/language') === 0 ? [{ id:'srv1' }] : []);
    }, 0);
  };
  var out = {}, J = function(v){ return JSON.stringify(v); };
  var o = GGRID.inset, D = geStep(), P = function(i,j){ return [o+i*D, o+j*D]; };

  /* every font the app builds, and what it was handed */
  var BUILT = [], build0 = LinguaFont.build;
  LinguaFont.build = function(defs, opt){
    var f = build0.apply(this, arguments);
    BUILT.push({ defs: defs, base: opt && opt.base, f: f });
    return f;
  };
  function ink(st){
    var c = document.createElement('canvas'); c.width = 200; c.height = 200;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 200, 200);
    inkStrokes(x, st, 200/800, 0, 0, '#000');
    var d = x.getImageData(0, 0, 200, 200).data, n = 0, h = 0, i;
    for (i = 0; i < d.length; i += 4){ if (d[i] < 128) n++; h = (h*31 + d[i]) >>> 0; }
    return n + ':' + h;
  }
  function hash(b){ var h = 0, i; for (i = 0; i < b.length; i++) h = (h*31 + b.charCodeAt(i)) >>> 0; return b.length + ':' + h; }

  /* ---- a stroke with no width is the stroke it always was --------------- */
  var OLD = [{pts:[[184,184],[184,616]]},{pts:[[184,400],[616,184],[616,616,'c']]},
             {pts:[[256,256],[544,256],[544,544],[256,544]], closed:true, fill:true},
             {pts:[[400,400]]},{pts:[[328,184],[472,184]], k:'o'}];
  out.oldPx = ink(OLD);
  installScriptFont();
  out.oldFont = hash(SFONT.b64);
  out.w24 = ink(OLD.map(function(x){ var c = JSON.parse(J(x)); c.w = 24; return c; })) === out.oldPx;
  out.thinPx = parseInt(ink([{pts:[[184,184],[184,616]], w:6}]), 10);
  out.fullPx = parseInt(ink([{pts:[[184,184],[184,616]]}]), 10);

  /* ---- a width off somebody else's post is held to the range ------------ */
  var big = inkAdv([{pts:[[400,184],[400,616]], w:5000}], 36);
  out.bigW = big ? big.x1 - big.x0 : -1;

  /* ---- the editor: a width chosen is on the next stroke drawn ----------- */
  var l = LETTERS[0];
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
  function drag(from, to){
    ev('pointerdown', from);
    for (var k = 1; k <= 8; k++) ev('pointermove', [from[0] + (to[0]-from[0])*k/8, from[1] + (to[1]-from[1])*k/8]);
    ev('pointerup', to);
  }
  GE = null; editLetter(l.id); GE.st = []; GE.si = -1; GE.seal = false; GE.rest = []; GE.lys = 1; render();
  /* the pad is gone, and the layers stand where it was */
  out.noPad = !document.getElementById('ghint') && !document.querySelector('.ghintwrap');
  var rail = document.querySelector('.gtools'), after = [];
  for (var nx = rail && rail.nextElementSibling; nx; nx = nx.nextElementSibling) after.push(nx.className);
  out.after = after.join(' ');
  /* the dot for 6, pressed as a finger presses it */
  var dot = document.querySelector('.gwidth button[data-a="[6]"]');
  out.dot = !!dot;
  if (dot) dot.click();
  drag(P(4,4), P(4,16));
  var drawn = GE.st[GE.st.length - 1];
  out.drawnW = drawn ? drawn.w : null;
  /* the slider is the same act: the value it hands over is the width */
  geWidth('10');
  drag(P(10,4), P(10,16));
  out.slideW = (GE.st[GE.st.length - 1] || {}).w;
  geWidth(24);
  drag(P(16,4), P(16,16));
  out.defaultNoW = GE.st.length === 3 && !('w' in GE.st[2]);
  /* a width chosen with a stroke lit goes on that stroke */
  GE.ls = true; GE.lsSel = [2]; geWidth(14);
  out.litW = GE.st[2].w; GE.ls = false; GE.lsSel = [];
  /* and the Save keeps it */
  var sig0 = scriptSig();
  BUILT = [];
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  var back = (ltById(l.id) || {}).st || [];
  out.keptW = back.map(function(x){ return x.w === undefined ? '-' : x.w; }).join(',');
  out.sentW = __SENT.some(function(x){ return x.indexOf('\\"w\\":6') >= 0 || x.indexOf('"w":6') >= 0; });
  /* and the font writer was handed it, and inked it: a stroke straight down
     is as wide as its width */
  var nm = glyphName(l.id), got = null;
  BUILT.forEach(function(b){ if (b.f.metrics[nm]) got = b; });
  out.fontHad = !!got;
  if (got) {
    var cs = LinguaFont.glyphContours({strokes:[back[0]]}, GPEN), e = LinguaFont.profile(cs);
    out.fontStrokeW = Math.round(e.xMax - e.xMin);
    out.fontBase = BUILT.every(function(b){ return b.base === geBase(); });
    /* the glyph's own ink in the font: narrower than the same letter at 24 */
    var m = got.f.metrics[nm];
    out.fontWide = Math.round(m.xMax - m.xMin);
    var m24 = build0([{name:'x', roman:'x', strokes: back.map(function(x){ var c = JSON.parse(J(x)); delete c.w; return c; })}],
                     {mode:'center', pen:GPEN, side:36}).metrics.x;
    out.font24Wide = Math.round(m24.xMax - m24.xMin);
  }
  /* what the keyboard is sent moves with it */
  var st1 = ltById(l.id).st; var keepW = st1[0].w;
  var before = scriptSig(); st1[0].w = 12; var s12 = scriptSig(); st1[0].w = 16; var s16 = scriptSig();
  st1[0].w = keepW;
  out.sigMoves = s12 !== s16 && before !== s12;
  out.sigMovedOnSave = sig0 !== scriptSig();
  /* a post written now carries the width; one written before keeps its own */
  var pink = postInkOf([{ id: l.id }]);
  out.postW = pink && pink.g[0] && pink.g[0][0] ? pink.g[0][0].w : null;
  var a6 = pink ? inkAdv([pink.g[0][0]], postSide(pink)) : null;
  out.postInkW = a6 ? Math.round(a6.x1 - a6.x0) : -1;
  var oldPost = { g: [[{pts:[[184,184],[184,616]]}]], s: [0] };
  var a24 = inkAdv(oldPost.g[0], postSide(oldPost));
  out.oldPostW = a24 ? Math.round(a24.x1 - a24.x0) : -1;
  /* and a key's outline, which is what the keyboard extension is handed */
  out.keyW = (function(){
    var one = { id: 'x', st: [back[0]] }, cs2 = shareInk(one);
    if (!cs2) return -1;
    var p2 = LinguaFont.profile(cs2);
    return Math.round(p2.xMax - p2.xMin);
  })();

  /* ---- the layers -------------------------------------------------------- */
  inkSet(l, [{pts:[P(4,4), P(4,16)]}, {pts:[P(12,4), P(12,16)], ly:2}]);
  GE = null; editLetter(l.id); render();
  out.opensOn1 = GE.ly === 1 && GE.st.length === 1 && GE.rest.length === 1 && GE.lys === 2;
  var two = J(GE.rest[0]);
  var still = function(){ return geAll().some(function(x){ return J(x) === two; }); };
  /* a finger on layer 2's dot draws on layer 1 and moves nothing of 2 */
  drag(P(12,4), P(14,4));
  out.fingerLeft = still();
  out.fingerOn1 = inkLy(GE.st[GE.st.length - 1]) === 1;
  /* the rope round the whole paper lights only layer 1's strokes */
  GE.ls = true; GE.lsSel = []; render();
  GE.lsPath = [[20,20],[780,20],[780,780],[20,780],[20,20]]; geLsUp({});
  out.ropeLit = GE.lsSel.length === GE.st.length && GE.lsSel.length > 0;
  geLsBin();
  out.binLeft = still();
  GE.ls = false; render();
  /* clear is this layer's */
  drag(P(6,4), P(6,16));
  geClear();
  out.clearLeft = still() && GE.st.length === 0;
  /* a step back on layer 1 does not reach a step drawn on layer 2 */
  geLayer(2);
  out.onTwo = GE.ly === 2 && GE.st.length === 1 && J(GE.st[0]) === two;
  drag(P(18,4), P(18,16));
  var drawnOn2 = J(GE.st[GE.st.length - 1]);
  out.twoStamped = inkLy(GE.st[GE.st.length - 1]) === 2;
  geLayer(1);
  /* each step is asked, not only where they end: a step back that put
     layer 2's drawing on layer 1's paper and the next one that took it off
     again end where layer 1 began, and the harm was in between */
  var twice = function(v){ return geAll().filter(function(x){ return J(x) === v; }).length; };
  var undos = 0, each = true;
  while (GE.undo.length && undos < 80) {
    geUndo(); undos++;
    each = each && still() && twice(two) === 1 && twice(drawnOn2) === 1 &&
           GE.st.every(function(x){ return inkLy(x) === 1; });
  }
  out.undoLeft = each && undos > 0;
  /* and saved, every layer comes back */
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  var kept = (ltById(l.id) || {}).st || [];
  out.savedLy = kept.map(function(x){ return inkLy(x); }).join(',');
  /* the + makes a third and puts you on it */
  GE = null; editLetter(l.id); render();
  var plus = document.querySelector('.glayers button[data-do="geLayerAdd"]');
  if (plus) plus.click();
  out.plus = GE.lys === 3 && GE.ly === 3 && GE.st.length === 0;
  out.rowSays = [].map.call(document.querySelectorAll('.glayers button'), function(b){
    return (/\bon\b/.test(b.className) ? '*' : '') + (b.textContent || '+'); }).join(' ');

  /* ---- the baseline on the paper ---------------------------------------- */
  GE = null; editLetter(l.id); GE.st = []; GE.rest = []; render(); geDraw();
  var c = cv(), S = c.width, x = c.getContext('2d');
  var yB = Math.round(geTo(S, geBase(), 1)), row = x.getImageData(0, yB, S, 1).data, lit = 0, i;
  for (i = 0; i < S; i++) if (row[i*4 + 3] > 0) lit++;
  out.baseRow = lit / S;
  var yOff = Math.round(geTo(S, geBase() - D/2, 1)), row2 = x.getImageData(0, yOff, S, 1).data, lit2 = 0;
  for (i = 0; i < S; i++) if (row2[i*4 + 3] > 0) lit2++;
  out.offRow = lit2 / S;
  GE = null;
  LinguaFont.build = build0;
  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.oldPx === OLD_PX, 'a stroke with no width draws what it always drew: ' + r.oldPx + ' (was ' + OLD_PX + ')');
say(r.oldFont === OLD_FONT, 'and the fixture\'s font is the same bytes it was: ' + r.oldFont + ' (was ' + OLD_FONT + ')');
say(r.w24, 'and no width is 24, to the pixel');
say(r.thinPx > 0 && r.thinPx * 2 < r.fullPx, 'a stroke of 6 inks ' + r.thinPx + 'px where the pen inks ' + r.fullPx);
say(r.bigW > 0 && r.bigW <= 24, 'a width of 5000 off a post is held to the pen: ' + r.bigW + ' wide');
say(r.dot, 'the width is a row of dots to press');
say(r.drawnW === 6, 'a stroke drawn after the dot for 6 is pressed carries 6 (' + r.drawnW + ')');
say(r.slideW === 10, 'the slider hands over the same act: 10 (' + r.slideW + ')');
say(r.defaultNoW, 'a stroke at 24 writes no width, as every stroke before it');
say(r.litW === 14, 'a width chosen with a stroke lit goes on that stroke (' + r.litW + ')');
say(r.keptW === '6,10,14', 'and the Save keeps each one: ' + r.keptW);
say(r.sentW, 'and what went up to the server carries it');
say(r.fontHad && r.fontStrokeW === 6, 'the font writer was handed the letter, and its stroke of 6 is ' + r.fontStrokeW + ' wide');
say(r.fontWide < r.font24Wide, 'the glyph in the font is ' + r.fontWide + ' wide where the same letter at 24 is ' + r.font24Wide);
say(r.fontBase, 'every face is built on geBase()');
say(r.sigMoves && r.sigMovedOnSave, 'a width changed moves what the keyboard is sent (12 -> 16 too)');
say(r.postW === 6 && r.postInkW === 6, 'a post written now carries the width and its ink is ' + r.postInkW + ' wide');
say(r.oldPostW === 24, 'a post written before keeps what it carried: ' + r.oldPostW + ' wide while the letter is thin');
say(r.keyW === 6, 'a key\'s outline, which the keyboard extension is handed, is ' + r.keyW + ' wide');

say(r.opensOn1, 'a letter with a stroke on layer 2 opens on layer 1 with layer 2 waiting');
say(r.fingerLeft && r.fingerOn1, 'a finger on a dot of layer 2 draws on layer 1 and moves nothing of 2');
say(r.ropeLit, 'the rope round the whole paper lights only layer 1');
say(r.binLeft, 'and the bin leaves layer 2 where it was');
say(r.clearLeft, 'clear empties layer 1 and leaves layer 2');
say(r.onTwo && r.twoStamped, 'layer 2 on the paper is layer 2, and a stroke drawn there is on 2');
say(r.undoLeft, 'every step back on layer 1 leaves what was drawn on layer 2');
/* layer 1's own stroke is back by the steps back; layer 2 has the one it
   opened with and the one drawn on it */
say(r.savedLy === '1,2,2', 'saved, both layers come back, in layer order: ' + r.savedLy);
say(r.plus, 'the + makes a third layer and puts you on it: ' + r.rowSays);

say(r.noPad, 'the square drawn again small under the rail is gone');
say(/^gwidth.* glayers$/.test(r.after), 'and under the rail are the width and the layers: ' + r.after);
say(r.baseRow > 0.95 && r.offRow < 0.5, 'the paper draws the baseline across the whole canvas at geBase() (' +
    Math.round(r.baseRow*100) + '% lit there, ' + Math.round(r.offRow*100) + '% half a step up)');
say(!errs.length, 'nothing threw' + (errs.length ? ': ' + errs.join(' | ') : ''));

if (bad.length) { console.log('\nlayer: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nlayer: a stroke carries its width to the font, a post and a key, one with none is what it was; ' +
            'a layer is out of reach of everything done on another; the baseline is the font\'s.');
