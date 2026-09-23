/* THREE GUIDE LINES over the letter editor's dots, and nothing else.
   ------------------------------------------------------------------------
   「aやね」 OWNER 2026-09-23 -- a comment asked for guide lines, and the
   owner chose the fixed kind: bottom, middle and top drawn faintly over the
   dots, to look at, with NOTHING stored.

   What can go wrong here throws nothing. A line one row off still draws, and
   a line as strong as the dots still draws -- it is simply a height that is
   not the font's, or a line that reads as somewhere a point may land. So
   this asks four things of the real app:

   1. WHERE. The rows are not read off geGuideRows() -- a check that asks the
      function under test what it answers is a copy of it, and a copy always
      agrees. The font is BUILT instead, one horizontal stroke on each row of
      the lattice, through LinguaFont.build() with the options the app builds
      its own font with, and the rows are measured out of the outlines: the
      lowest row whose ink does not go under the baseline, the row whose ink
      reaches the ascender, and the row whose ink is centred between those
      two. Then geDraw() is watched, and the lines it strokes are converted
      back into rows.
   2. ON THE DOTS, magnified too. Every line's height is a height a dot was
      drawn at, at z=1 and pinched in.
   3. QUIETER THAN THE DOTS, in both themes: contrast against the panel,
      composited the way the screen shows it.
   4. NOTHING STORED. localStorage, every slice in memory, the letters and
      the built font are byte for byte what they were.
   --------------------------------------------------------------------------- */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.walked = true;
  var out = {}, o = GGRID.inset, D = geStep(), N = GGRID.n;

  /* ---- 1. which rows the FONT says, measured out of built outlines ---- */
  var defs = [], i;
  for (i = 0; i < N; i++)
    defs.push({ name:'r'+i, roman:null, strokes:[{ pts:[[o, o+i*D],[o+(N-1)*D, o+i*D]] }] });
  var asc = geInkTop();
  var f = LinguaFont.build(defs, { mode:'center', pen:GPEN, side:geSide(),
                                   asc:asc, desc:asc-geInkSpan()-D, family:'GuideProbe' });
  var ext = [];
  for (i = 0; i < N; i++) {
    var lo = Infinity, hi = -Infinity;
    f.metrics['r'+i].contours.forEach(function(c){ c.forEach(function(p){
      if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; }); });
    ext.push([lo, hi]);
  }
  var base = -1, top = -1, mid = -1, bestLo = Infinity;
  for (i = 0; i < N; i++) {
    if (ext[i][0] >= 0 && ext[i][0] < bestLo) { bestLo = ext[i][0]; base = i; }
    if (ext[i][1] === asc) top = i;
  }
  if (base >= 0 && top >= 0) {
    var want = (ext[base][0] + ext[top][1]) / 2;
    for (i = 0; i < N; i++) if (Math.abs((ext[i][0]+ext[i][1])/2 - want) < 1) mid = i;
  }
  out.font = { base: base, mid: mid, top: top, asc: asc,
               baseLo: base >= 0 ? ext[base][0] : null, topHi: top >= 0 ? ext[top][1] : null };

  /* ---- 4. a snapshot of everything that is kept, taken before the editor
     is opened at all, so a write made on the first draw is counted too ---- */
  function kept(){
    var ls = {}, k; for (k = 0; k < localStorage.length; k++) ls[localStorage.key(k)] = localStorage.getItem(localStorage.key(k));
    return JSON.stringify([ls, LSL, LETTERS, SFONT.b64 || '']);
  }
  installScriptFont();
  var before = kept();

  /* ---- what geDraw() actually strokes, and where it puts its dots ---- */
  editGlyph('k'); window.route = 'glyph'; NAV = [{ r:'glyph', a:GE.lid }]; render();
  var c = document.getElementById('gcanv');
  var x = c.getContext('2d');
  var probe = document.createElement('canvas').getContext('2d');
  function norm(v){ probe.strokeStyle = '#000'; probe.strokeStyle = v; return probe.strokeStyle; }
  function watch(){
    var lineCol = norm(cssVar('--line')), dotCol = (function(){
      probe.fillStyle = '#000'; probe.fillStyle = cssVar('--dot'); return probe.fillStyle; })();
    var seg = [], lines = [], dots = {}, mv0 = x.moveTo, lt0 = x.lineTo, st0 = x.stroke, ar0 = x.arc;
    x.moveTo = function(a,b){ seg = [[a,b]]; return mv0.apply(this, arguments); };
    x.lineTo = function(a,b){ seg.push([a,b]); return lt0.apply(this, arguments); };
    x.arc = function(a,b){ if (this.fillStyle === dotCol) dots[b.toFixed(3)] = 1; seg = []; return ar0.apply(this, arguments); };
    x.stroke = function(){
      if (this.strokeStyle === lineCol && seg.length === 2 && seg[0][1] === seg[1][1])
        lines.push({ y: seg[0][1], x0: seg[0][0], x1: seg[1][0] });
      return st0.apply(this, arguments);
    };
    geDraw();
    x.moveTo = mv0; x.lineTo = lt0; x.stroke = st0; x.arc = ar0;
    return { lines: lines, dots: dots };
  }
  function rowsOf(w){
    var S = c.width;
    return w.lines.map(function(l){
      return Math.round((l.y - geTo(S, o, 1)) / (geTo(S, o + D, 1) - geTo(S, o, 1)) * 1000) / 1000; });
  }
  function onDots(w){ return w.lines.every(function(l){ return w.dots[l.y.toFixed(3)] === 1; }); }

  var w1 = watch();
  out.drawn = rowsOf(w1);
  out.onDots1 = onDots(w1) && w1.lines.length > 0;
  var S0 = c.width;
  out.span = w1.lines.length > 0 && w1.lines.every(function(l){
    return Math.abs(l.x0 - geTo(S0, o, 0)) < 0.01 && Math.abs(l.x1 - geTo(S0, o+(N-1)*D, 0)) < 0.01; });

  /* ---- 2. pinched in: the lines move with the dots ---- */
  GE.z = 2; GE.cx = 400; GE.cy = 580;
  var w2 = watch();
  out.drawnZ = rowsOf(w2);
  out.onDotsZ = onDots(w2) && w2.lines.length > 0;
  GE.z = 1; GE.cx = 400; GE.cy = 400;

  /* ---- 3. contrast, in both themes, composited over the panel ---- */
  function lum(c3){ return c3.map(function(v){ v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); })
                             .reduce(function(a,v,j){ return a + v*[0.2126,0.7152,0.0722][j]; }, 0); }
  function ratio(a,b){ var A = lum(a), B = lum(b); return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05); }
  function measure(theme){
    SET.theme = theme; applyTheme(); render();
    c = document.getElementById('gcanv'); x = c.getContext('2d');
    GE.st = []; GE.si = -1; GE.pi = -1; geDraw();
    var S = c.width, pane = getComputedStyle(c).backgroundColor.match(/\d+(\.\d+)?/g).slice(0,3).map(Number);
    var img = x.getImageData(0, 0, S, S).data;
    function px(a,b){ var q = (Math.round(b)*S + Math.round(a))*4, al = img[q+3]/255;
      return [0,1,2].map(function(j){ return img[q+j]*al + pane[j]*(1-al); }); }
    function most(x0,x1,y0,y1){ var best = pane, bd = 0, a, b, p, d;
      for (a = Math.floor(x0); a <= x1; a++) for (b = Math.floor(y0); b <= y1; b++) {
        p = px(a,b); d = ratio(p, pane); if (d > bd) { bd = d; best = p; } }
      return best; }
    var mx = geTo(S, o + 4.5*D, 0), my = geTo(S, o + 10*D, 1);   /* on the middle line, between two dots */
    var dx = geTo(S, o + 4*D, 0), dy = geTo(S, o + 7*D, 1);      /* a dot nowhere near a line */
    var gy = geTo(S, o + 6.5*D, 1);                                /* between rows, between columns */
    var line = most(mx, mx, my-2, my+2), dot = most(dx-3, dx+3, dy-3, dy+3), gap = px(mx, gy);
    return { line: ratio(line, gap), dot: ratio(dot, gap) };
  }
  var theme0 = SET.theme;
  out.light = measure('light');
  out.dark = measure('dark');
  SET.theme = theme0; applyTheme(); render();

  out.same = (kept() === before);
  if (!out.same) { var A = JSON.parse(before), B = JSON.parse(kept()); out.diff = [0,1,2,3].filter(function(j){ return JSON.stringify(A[j]) !== JSON.stringify(B[j]); }).map(function(j){ return j === 0 ? Object.keys(Object.assign({}, A[0], B[0])).filter(function(k){ return A[0][k] !== B[0][k]; }) : j; }); }
  return out;
}, { s: seed.toString() });
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

const F = r.font;
say(F.base >= 0 && F.mid >= 0 && F.top >= 0,
    'the font answers all three -- rows ' + F.top + ' / ' + F.mid + ' / ' + F.base +
    ' (ink reaches the ascender ' + F.topHi + ' on the top one, rests ' + F.baseLo + ' over the baseline on the bottom one)');
say(r.drawn.length === 3, 'the editor draws three lines -- ' + r.drawn.length);
say(JSON.stringify(r.drawn.slice().sort((a,b)=>a-b)) === JSON.stringify([F.top, F.mid, F.base]),
    'and they are the font\'s top, middle and bottom rows -- drawn on ' + r.drawn.join(', '));
say(r.span, 'each runs from the first column of dots to the last');
say(r.onDots1, 'every line is at a height a dot was drawn at');
say(r.onDotsZ && JSON.stringify(r.drawnZ) === JSON.stringify(r.drawn),
    'and pinched in they are still on the same rows of dots -- ' + r.drawnZ.join(', '));
for (const t of ['light', 'dark'])
  say(r[t].line > 1.02 && r[t].line < r[t].dot,
      t + ': the lines are there and quieter than the dots -- ' +
      r[t].line.toFixed(2) + ':1 against ' + r[t].dot.toFixed(2) + ':1');
say(r.same, 'and nothing kept moved -- localStorage, the slices, the letters, the font' + (r.diff ? ' -- moved: ' + JSON.stringify(r.diff) : ''));

if (bad.length) { console.error('\nguide: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nguide: three lines on the font\'s own rows, under the dots, and nothing stored.');
