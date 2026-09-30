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
     the panel    -- OWNER 2026-09-30, the last 追記 (r148): a row per layer
                     with the eye, the picture and the name, and the pencil;
                     the pictures bigger than r147's 32px and every press 44;
                     a name typed on the pencil's page is on the letter after
                     the Save, went up with the letters slice, and is there
                     after the app is closed and the slice brought down again
                     (netLangFill); a layer nobody named stores nothing; the
                     eye takes a layer off the PAPER and nowhere else -- the
                     letter, the font writer, a key and a post still have it
                     -- and a tab off the letter forgets it.
     the baseline -- both faces are built on geBase(), and the paper draws a
                     line there across the whole canvas.
     the pad      -- the square drawn again small under the rail is gone, and
                     the layers stand where it was.
     the dots     -- OWNER 2026-09-30, the 追記 after r148 (r154): no slider; a
                     letter opens on the middle dot and a stroke drawn before
                     any is pressed carries 14, while a stroke with no width
                     stays 24 and is saved with none; a dot pressed with
                     strokes lit changes those and no other, and the step back
                     puts it back; over the rows a heading with the + at its
                     end, the only +, under a line, and the last row scrolls
                     clear of the tab bar.

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
  window.__SENT = []; window.__SENTO = []; window.__DOWN = null;
  netSend = function(method, p, body, tok, ok){
    window.__SENTO.push({ method: method, p: p, body: body });
    /* a read of a language's slices, answered with what __DOWN says the
       server holds -- the relaunch in the names section below */
    if (method === 'GET' && p.indexOf('/rest/v1/slice?') === 0 && window.__DOWN) {
      var d = window.__DOWN; setTimeout(function(){ ok(d); }, 0); return;
    }
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
  /* before any dot is pressed, the middle one is lit and a stroke begins
     at it 「基本が真ん中」 OWNER 2026-09-30 */
  out.midLit = [].map.call(document.querySelectorAll('.gwidth button.on'), function(b){ return b.getAttribute('data-a'); }).join(' ');
  drag(P(4,4), P(4,16));
  out.newW = (GE.st[GE.st.length - 1] || {}).w;
  GE.st = []; GE.si = -1; GE.seal = false; GE.undo = []; GE.redo = []; render();
  /* the dot for 6, pressed as a finger presses it */
  var dot = document.querySelector('.gwidth button[data-a="[6]"]');
  out.dot = !!dot;
  if (dot) dot.click();
  drag(P(4,4), P(4,16));
  var drawn = GE.st[GE.st.length - 1];
  out.drawnW = drawn ? drawn.w : null;
  function press(w){ var b = document.querySelector('.gwidth button[data-a="[' + w + ']"]'); if (b) b.click(); return !!b; }
  out.slide = !!document.querySelector('.gwidth input, .gwslide');
  press(10);
  drag(P(10,4), P(10,16));
  out.tenW = (GE.st[GE.st.length - 1] || {}).w;
  press(24);
  drag(P(16,4), P(16,16));
  out.defaultNoW = GE.st.length === 3 && !('w' in GE.st[2]);
  /* a dot pressed with a stroke lit goes on that stroke, and the step back
     puts back the width it had -- the same dot, the same road */
  GE.ls = true; GE.lsSel = [2]; render();
  var others = J([GE.st[0], GE.st[1]]);
  press(14);
  out.litW = GE.st[2].w;
  out.litOthers = J([GE.st[0], GE.st[1]]) === others;
  geUndo();
  out.undoW = GE.st.length === 3 && !('w' in GE.st[2]) && J([GE.st[0], GE.st[1]]) === others;
  geRedo();
  out.redoW = GE.st[2].w;
  GE.ls = false; GE.lsSel = [];
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

  /* ---- a stroke with no width, opened and saved beside a new one --------- */
  inkSet(l, [{pts:[P(4,4), P(4,16)]}]);
  GE = null; editLetter(l.id); render();
  out.oldOnPaper = inkW(GE.st[0]);
  drag(P(12,4), P(12,16));
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  out.oldKept = ((ltById(l.id) || {}).st || []).map(function(x){ return x.w === undefined ? '-' : x.w; }).join(',');

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
  out.rowSays = [].map.call(document.querySelectorAll('.glayers .glysel, .glayers .glyadd'), function(b){
    return (/\bon\b/.test(b.parentNode.className) ? '*' : '') + (b.getAttribute('data-a') || '+'); }).join(' ');
  /* the + is in the heading, at its right end, and nowhere else; the
     heading is the first thing of the panel, with a line over it and
     nothing round it */
  var hd = document.querySelector('.glayers > .glyhd');
  out.hdFirst = !!hd && hd === document.querySelector('.glayers').firstElementChild;
  out.hdSays = hd ? hd.textContent : '';
  out.hdPlus = !!hd && !!hd.lastElementChild && hd.lastElementChild.getAttribute('data-do') === 'geLayerAdd' &&
    hd.lastElementChild.textContent === '' && !!hd.lastElementChild.querySelector('svg');
  out.plusCount = document.querySelectorAll('[data-do="geLayerAdd"]').length;
  if (hd) {
    var cs0 = getComputedStyle(hd);
    out.hdLine = cs0.borderTopStyle === 'solid' && cs0.borderBottomStyle === 'none' &&
      cs0.borderLeftStyle === 'none' && cs0.borderRightStyle === 'none' && cs0.borderTopLeftRadius === '0px';
  }
  /* and the last row can be scrolled clear of the tab bar -- with eight
     layers, so the panel runs past the foot of the phone */
  for (var ad = 0; ad < 5; ad++) geLayerAdd();
  out.lysMany = document.querySelectorAll('.glayers .glyr').length;
  window.scrollTo(0, 1e6);
  for (var sc = document.querySelector('.glayers'); sc; sc = sc.parentElement) sc.scrollTop = 1e6;
  var rowsNow = document.querySelectorAll('.glayers .glyr'), lastRow = rowsNow[rowsNow.length - 1],
      tb = document.querySelector('.tabbar');
  out.lastClear = lastRow && tb ? Math.round(tb.getBoundingClientRect().top - lastRow.getBoundingClientRect().bottom) : null;
  window.scrollTo(0, 0);

  /* ---- each layer is a small picture of its own strokes ----------------- */
  inkSet(l, [{pts:[P(4,4), P(4,16)]}, {pts:[P(12,4), P(12,16)], ly:2}]);
  GE = null; editLetter(l.id); render(); geLayerAdd(); geLayer(2); geDraw();
  /* ink inside the frame, left and right of the line half-way between the
     two strokes -- layer 1's is left of it and layer 2's right */
  function pic(n){
    var c = document.querySelector('canvas.glyc[data-ly="' + n + '"]');
    if (!c) return null;
    var S = c.width, d = c.getContext('2d').getImageData(0, 0, S, S).data, cut = (P(4,0)[0] + P(12,0)[0]) / 2 / 800 * S;
    var o = { left:0, right:0 }, m = Math.ceil(S / 12), px, py;
    for (py = m; py < S - m; py++) for (px = m; px < S - m; px++)
      if (d[(py*S + px)*4 + 3] > 0) { if (px < cut) o.left++; else o.right++; }
    return o;
  }
  out.pic = [pic(1), pic(2), pic(3)];
  /* a row each: the eye, the picture and the name, the pencil */
  out.rows = [].map.call(document.querySelectorAll('.glayers .glyr'), function(r){
    return [].map.call(r.querySelectorAll('button'), function(b){
      return b.getAttribute('data-do') + (b.querySelector('canvas') ? '[pic]' : '') +
             (b.textContent ? '"' + b.textContent + '"' : ''); }).join(' ');
  });
  out.picOn = !!document.querySelector('.glayers .glyr.on canvas.glyc[data-ly="2"]');
  /* and it moves with the finger, with nothing rendered in between */
  geLayer(1); var b1 = pic(1);
  drag(P(10,4), P(10,16));
  var a1 = pic(1);
  out.picMoves = b1 && a1 && a1.right > b1.right;

  /* ---- the pictures are bigger than r147's 32px, and every press is 44 --- */
  GE = null; editLetter(l.id); render();
  var pc0 = document.querySelector('canvas.glyc');
  out.picPx = pc0 ? Math.round(pc0.getBoundingClientRect().width) : 0;
  out.small = [].filter.call(document.querySelectorAll('.glayers button'), function(b){
    var R = b.getBoundingClientRect(); return R.width < 44 || R.height < 44; }).length;

  /* ---- the name: the pencil, a page of the app's own, and the Save ------- */
  inkSet(l, [{pts:[P(4,4), P(4,16)]}, {pts:[P(12,4), P(12,16)], ly:2}]);
  delete l.lyn;
  GE = null; editLetter(l.id); render();
  function row(n){ var c = document.querySelector('canvas.glyc[data-ly="' + n + '"]'); return c && c.parentNode.textContent; }
  out.nameDefault = [row(1), row(2)];
  /* saved with nobody renaming anything, a letter carries no names */
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  out.noNameStored = !('lyn' in ltById(l.id));
  GE = null; editLetter(l.id); render();
  var pen = document.querySelector('.glayers button[data-do="geLayerName"][data-a="[2]"]');
  out.pen = !!pen && !!pen.querySelector('svg') && pen.textContent === '' && !!pen.getAttribute('aria-label');
  if (pen) pen.click();
  out.formOn = here().r === 'form' && !!document.getElementById('ly-nm');
  var fld = document.getElementById('ly-nm');
  if (fld) fld.value = 'Stem';
  var done = document.querySelector('[data-do="geLayerNamed"]');
  if (done) done.click();
  out.backOn = here().r === 'glyph';
  out.nameRow = row(2);
  out.nameDirty = keepDirty(keepKey());
  __SENTO = [];
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  out.nameKept = J((ltById(l.id) || {}).lyn);
  /* what went up to the server is the letters slice with the name on it */
  var up = null;
  __SENTO.forEach(function(x){
    if (x.p.indexOf('/rest/v1/rpc/slice_put') === 0 && x.body && x.body.p_kind === 'letters') up = x.body.p_body;
  });
  out.nameUp = !!up && up.indexOf('"lyn"') >= 0;
  /* and the app closed and opened: memory gone, the slice brought down from
     what went up, through the road a launch takes (netLangFill -> langLoad) */
  var lk = langKey('letters');
  delete LSL[lk]; try { localStorage.removeItem(slGotKey(lk)); } catch (e) {}
  LETTERS = [];
  window.__DOWN = [{ kind:'letters', body: up, no: 2, at: '', ed: null }];
  await new Promise(function(f){ netLangFill(langId, f, f); });
  window.__DOWN = null;
  l = ltById(l.id);
  GE = null; editLetter(l.id); render();
  out.nameBack = J((ltById(l.id) || {}).lyn) + ' / ' + row(2);
  /* emptied, it is the number again and nothing is stored */
  geLayerName(2);
  fld = document.getElementById('ly-nm'); if (fld) fld.value = '';
  geLayerNamed(2);
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  GE = null; editLetter(l.id); render();
  out.nameGone = !('lyn' in ltById(l.id)) && row(2) === t('glyph.layer', [2]);
  /* a named layer with nothing on it is still a layer */
  l.lyn = { '3': 'Dot' }; saveLetters();
  GE = null; editLetter(l.id); render();
  out.namedEmpty = GE.lys === 3 && row(3) === 'Dot';
  delete l.lyn; saveLetters();

  /* ---- the eye: off the paper, and nowhere else -------------------------- */
  inkSet(l, [{pts:[P(4,4), P(4,16)]}, {pts:[P(12,4), P(12,16)], ly:2}]);
  GE = null; editLetter(l.id); render(); geDraw();
  /* ink on the paper along layer 2's stroke */
  function on2(){
    var c = cv(), S = c.width, xx = c.getContext('2d');
    var X = Math.round(geTo(S, P(12,0)[0], 0)), y0 = Math.round(geTo(S, P(0,6)[1], 1)), y1 = Math.round(geTo(S, P(0,14)[1], 1));
    var d = xx.getImageData(X - 2, y0, 5, y1 - y0).data, n = 0, i;
    for (i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
    return n;
  }
  out.shown2 = on2();
  var rest0 = GE.rest; GE.rest = []; geDraw(); out.none2 = on2(); GE.rest = rest0; geDraw();
  var eye1 = document.querySelector('.glayers button[data-do="geLayerEye"][data-a="[1]"]');
  out.eye1Down = !!eye1 && eye1.disabled;
  /* what the Save compares, before the eye is touched */
  var nowOpen = J(keepNow(keepKey()));
  var eye2 = document.querySelector('.glayers button[data-do="geLayerEye"][data-a="[2]"]');
  if (eye2) eye2.click();
  geDraw();
  out.hid2 = on2();
  out.eyeShut = !!document.querySelector('.glayers button[data-do="geLayerEye"][data-a="[2]"]') &&
    document.querySelector('.glayers button[data-do="geLayerEye"][data-a="[2]"]').getAttribute('aria-label') === t('glyph.layer.show');
  out.hidNotDirty = J(keepNow(keepKey())) === nowOpen;
  /* the font: drawn with the eye shut, and the strokes of 2 are what it was handed */
  var sigShown = scriptSig();
  BUILT = [];
  GE.st.push({pts:[P(6,4), P(6,16)]}); GE.si = GE.st.length - 1; GE.seal = true; render();
  document.querySelector('[data-do="keepPress"]').click();
  await saved();
  var nm2 = glyphName(l.id), def2 = null;
  BUILT.forEach(function(b){ b.defs.forEach(function(d){ if (d.name === nm2) def2 = d; }); });
  out.fontHas2 = !!def2 && (def2.strokes || []).some(function(x){ return inkLy(x) === 2; });
  out.letterHas2 = (ltById(l.id).st || []).some(function(x){ return inkLy(x) === 2; });
  /* the keyboard is sent the same letter as with the eye open */
  var st2 = ltById(l.id).st;
  out.keyHas2 = (function(){
    var one = shareInk({ id:'x', st: st2 }), two = shareInk({ id:'x', st: st2.filter(function(x){ return inkLy(x) === 1; }) });
    return !!one && !!two && J(one) !== J(two);
  })();
  var pk = postInkOf([{ id: l.id }]);
  out.postHas2 = !!(pk && pk.g[0] && pk.g[0].some(function(x){ return inkLy(x) === 2; }));
  out.sigAll = sigShown !== scriptSig();
  /* the layer put on the paper is in sight, and walking off forgets the rest */
  GE = null; editLetter(l.id); render();
  geLayerEye(2); out.hidOn = !!GE.hid[2];
  geLayer(2); out.onShows = !GE.hid[2];
  /* a letter this run has not saved, so nothing stands in the way out. The
     first letter's buffer is let go of: after its Save landed, keepLevel()
     wrote down what it opened with while GE was already null, so it reads as
     changed and the tab would stop to ask about it -- which is so on integ
     before this branch too, and is reported rather than fixed here. */
  keepDrop(keepKeyOf('glyph', l.id));
  var l2 = LETTERS[1];
  inkSet(l2, [{pts:[P(4,4), P(4,16)]}, {pts:[P(12,4), P(12,16)], ly:2}]);
  GE = null; editLetter(l2.id); render(); geLayerEye(2);
  geLayerName(1);
  out.deeperKeeps = here().r === 'form' && !!GE.hid[2];
  window.back();
  out.backKeeps = here().r === 'glyph' && !!GE.hid[2];
  goTab('words');
  out.leftForgets = here().r === 'words' && !!GE && !GE.hid[2];
  GE = null;

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
say(r.midLit === '[14]', 'a letter opens with the middle dot lit: ' + r.midLit);
say(r.newW === 14, 'a stroke drawn before any dot is pressed carries the middle one, 14 (' + r.newW + ')');
say(r.dot && !r.slide, 'the width is a row of dots to press, and there is no slider');
say(r.drawnW === 6, 'a stroke drawn after the dot for 6 is pressed carries 6 (' + r.drawnW + ')');
say(r.tenW === 10, 'the dot for 10 gives 10 (' + r.tenW + ')');
say(r.defaultNoW, 'a stroke at 24 writes no width, as every stroke before it');
say(r.litW === 14 && r.litOthers, 'a dot pressed with a stroke lit goes on that stroke and no other (' + r.litW + ')');
say(r.undoW && r.redoW === 14, 'and the step back puts back the width it had, the step forward the new one');
say(r.keptW === '6,10,14', 'and the Save keeps each one: ' + r.keptW);
say(r.sentW, 'and what went up to the server carries it');
say(r.fontHad && r.fontStrokeW === 6, 'the font writer was handed the letter, and its stroke of 6 is ' + r.fontStrokeW + ' wide');
say(r.fontWide < r.font24Wide, 'the glyph in the font is ' + r.fontWide + ' wide where the same letter at 24 is ' + r.font24Wide);
say(r.fontBase, 'every face is built on geBase()');
say(r.sigMoves && r.sigMovedOnSave, 'a width changed moves what the keyboard is sent (12 -> 16 too)');
say(r.postW === 6 && r.postInkW === 6, 'a post written now carries the width and its ink is ' + r.postInkW + ' wide');
say(r.oldPostW === 24, 'a post written before keeps what it carried: ' + r.oldPostW + ' wide while the letter is thin');
say(r.keyW === 6, 'a key\'s outline, which the keyboard extension is handed, is ' + r.keyW + ' wide');

say(r.oldOnPaper === 24 && r.oldKept === '-,14', 'a stroke with no width is 24 on the paper and saved beside a new one still has none: ' + r.oldKept);

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
say(r.hdFirst && r.hdSays === 'Layers' && r.hdPlus && r.plusCount === 1,
    'over the rows a heading, "' + r.hdSays + '", with the + as a mark at its right end, and ' + r.plusCount + ' + in all');
say(r.hdLine, 'a line over the heading parts it from the dots, and nothing round it');
say(r.lastClear !== null && r.lastClear >= 0, 'scrolled to the foot, the last of ' + r.lysMany + ' layer rows stands ' + r.lastClear + 'px clear of the tab bar');

var pc = r.pic;
say(pc[0] && pc[1] && pc[2] && pc[0].left > 0 && pc[1].right > 0 && pc[0].left + pc[0].right > pc[2].left + pc[2].right,
    'each layer is a picture of what is on it: 1 inks ' + (pc[0] && pc[0].left) + ', 2 inks ' + (pc[1] && pc[1].right) +
    ', the empty 3 inks ' + (pc[2] && pc[2].left + pc[2].right));
say(pc[0] && pc[1] && pc[0].right === 0 && pc[1].left === 0,
    'and only what is on it: layer 2\'s stroke in 1\'s picture ' + (pc[0] && pc[0].right) + ', 1\'s in 2\'s ' + (pc[1] && pc[1].left));
say(r.rows.length === 3 && r.rows.every(function(x, k){
      return new RegExp('^geLayerEye geLayer\\[pic\\]"Layer ' + (k+1) + '" geLayerName$').test(x); }) && r.picOn,
    'a row per layer -- the eye, the picture and its name, the pencil -- and the chosen one marked: ' + r.rows.join(' | '));
say(r.picMoves, 'the picture of the layer being drawn on moves with the finger');
say(r.picPx > 32, 'the pictures are bigger than r147\'s 32px: ' + r.picPx + 'px');
say(r.small === 0, 'every press in the layers panel is 44pt both ways (' + r.small + ' short)');
say(r.nameDefault[0] === 'Layer 1' && r.nameDefault[1] === 'Layer 2', 'a layer nobody named is its number: ' + r.nameDefault.join(', '));
say(r.noNameStored, 'and saved like that, the letter carries no names');
say(r.pen && r.formOn && r.backOn, 'the pencil is a mark, opens a page of the app\'s own to type the name on, and Done comes back');
say(r.nameRow === 'Stem' && r.nameDirty, 'the row says the new name, and the Save lights for it: ' + r.nameRow);
say(r.nameKept === '{"2":"Stem"}', 'the Save puts it on the letter: ' + r.nameKept);
say(r.nameUp, 'and what went up to the server carries it');
say(r.nameBack === '{"2":"Stem"} / Stem', 'closed and brought down again from the server, it is still there: ' + r.nameBack);
say(r.nameGone, 'emptied and saved, it is the number again and nothing is stored');
say(r.namedEmpty, 'a named layer with nothing on it is still a layer');
say(r.shown2 > r.none2 && r.hid2 === r.none2, 'the eye takes layer 2 off the paper: ' + r.shown2 + ' inked px along it shown, ' +
    r.hid2 + ' hidden, ' + r.none2 + ' (the lattice) with no layer 2 at all');
say(r.eye1Down && r.eyeShut, 'the layer on the paper cannot be hidden, and the shut eye says show');
say(r.hidNotDirty, 'hiding is not a change to the letter: the Save stays grey');
say(r.fontHas2 && r.letterHas2, 'saved with 2 hidden, 2 is on the letter and in what the font writer was handed');
say(r.keyHas2 && r.postHas2, 'and in a key\'s outline and a post\'s ink');
say(r.sigAll, 'and what the keyboard is sent moved with the save');
say(r.hidOn && r.onShows, 'putting a hidden layer on the paper shows it');
say(r.deeperKeeps && r.backKeeps, 'the page that renames a layer is deeper: what was hidden stays hidden there and back');
say(r.leftForgets, 'a tab off the letter forgets what was hidden');
say(r.noPad, 'the square drawn again small under the rail is gone');
say(/^gwidth.* glayers$/.test(r.after), 'and under the rail are the width and the layers: ' + r.after);
say(r.baseRow > 0.95 && r.offRow < 0.5, 'the paper draws the baseline across the whole canvas at geBase() (' +
    Math.round(r.baseRow*100) + '% lit there, ' + Math.round(r.offRow*100) + '% half a step up)');
say(!errs.length, 'nothing threw' + (errs.length ? ': ' + errs.join(' | ') : ''));

if (bad.length) { console.log('\nlayer: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nlayer: a stroke carries its width to the font, a post and a key, one with none is what it was; ' +
            'a layer is out of reach of everything done on another, keeps its name through the server, ' +
            'and hides from the paper only; the baseline is the font\'s.');
