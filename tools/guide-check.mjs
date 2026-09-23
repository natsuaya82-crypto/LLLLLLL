/* 田 OVER THE LETTER EDITOR'S DOTS -- a 口 and a 十 -- and nothing else.
   ------------------------------------------------------------------------
   「線がわかりにくい」「十時に引いて口と十で引けばいいんじゃない？」
   OWNER 2026-09-23. The guides are the square round the lattice (the first
   and last row, the first and last column) and the cross through its middle
   (the centre row and the centre column), across AND down. Drawn to look at,
   with NOTHING stored.

   What can go wrong here throws nothing. A line one row off still draws, a
   missing line leaves a picture that is merely less, and a line too faint to
   see is the fault this was rewritten after -- it measured 1.1:1. So this
   asks four things of the real app:

   1. THE SHAPE. geDraw() is watched and every straight line it strokes in
      the guide colour is turned back into a row or a column of dots. The
      rows and columns wanted are the lattice's own edges and middle, worked
      out from GGRID.n -- never asked of geGuideRows(), because a check that
      asks the function under test what it answers is a copy of it.
   2. ON THE DOTS, pinched in too, and each runs from the first dot to the
      last.
   3. SEEN, in both themes: the line composited over the panel, between two
      dots, measured against the gap beside it, clears 3:1 -- the bar the dots
      themselves are held to (tools/mock/contrast). And it is not the dots'
      colour, so it cannot read as somewhere a point may land.
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
  out.want = [0, (N-1)/2, N-1];

  function kept(){
    var ls = {}, k; for (k = 0; k < localStorage.length; k++) ls[localStorage.key(k)] = localStorage.getItem(localStorage.key(k));
    return JSON.stringify([ls, LSL, LETTERS, SFONT.b64 || '']);
  }
  installScriptFont();
  var before = kept();

  editGlyph('k'); window.route = 'glyph'; NAV = [{ r:'glyph', a:GE.lid }]; render();
  var c = document.getElementById('gcanv');
  var x = c.getContext('2d');
  var probe = document.createElement('canvas').getContext('2d');
  function col(v){ probe.strokeStyle = '#000'; probe.strokeStyle = v; return probe.strokeStyle; }
  var G = null;   /* the guide colour: whatever geDraw() strokes a straight line across the lattice in */
  function watch(){
    var dotCol = (function(){ probe.fillStyle = '#000'; probe.fillStyle = cssVar('--dot'); return probe.fillStyle; })();
    var seg = [], lines = [], dots = {}, mv0 = x.moveTo, lt0 = x.lineTo, st0 = x.stroke, ar0 = x.arc;
    x.moveTo = function(a,b){ seg = [[a,b]]; return mv0.apply(this, arguments); };
    x.lineTo = function(a,b){ seg.push([a,b]); return lt0.apply(this, arguments); };
    x.arc = function(a,b){ if (this.fillStyle === dotCol) dots[a.toFixed(3)+','+b.toFixed(3)] = 1; seg = []; return ar0.apply(this, arguments); };
    x.stroke = function(){
      if (seg.length === 2 && (seg[0][1] === seg[1][1] || seg[0][0] === seg[1][0]))
        lines.push({ a: seg[0], b: seg[1], col: this.strokeStyle });
      return st0.apply(this, arguments);
    };
    geDraw();
    x.moveTo = mv0; x.lineTo = lt0; x.stroke = st0; x.arc = ar0;
    return { lines: lines, dots: dots, dotCol: dotCol };
  }
  /* a row or column of dots, from a canvas coordinate */
  function idx(S, v, ax){ return Math.round((v - geTo(S, o, ax)) / (geTo(S, o + D, ax) - geTo(S, o, ax)) * 1000) / 1000; }
  function shape(w){
    var S = c.width, rows = [], cols = [], onDots = true, span = true;
    w.lines.forEach(function(l){
      var hz = l.a[1] === l.b[1];
      var i = idx(S, hz ? l.a[1] : l.a[0], hz ? 1 : 0);
      var e0 = idx(S, hz ? l.a[0] : l.a[1], hz ? 0 : 1), e1 = idx(S, hz ? l.b[0] : l.b[1], hz ? 0 : 1);
      if (Math.abs(e0) > 0.001 || Math.abs(e1 - (N-1)) > 0.001) span = false;
      (hz ? rows : cols).push(i);
      /* both ends are dots */
      [l.a, l.b].forEach(function(p){ if (!w.dots[p[0].toFixed(3)+','+p[1].toFixed(3)]) onDots = false; });
    });
    return { rows: rows.sort(function(a,b){return a-b;}), cols: cols.sort(function(a,b){return a-b;}), onDots: onDots, span: span };
  }
  /* the lattice's frame and the ink are not guides: keep the lines that run
     between two lattice dots in the one colour most of them share */
  function guides(w){
    var S = c.width, by = {};
    w.lines.forEach(function(l){ var hz = l.a[1] === l.b[1];
      var e0 = idx(S, hz ? l.a[0] : l.a[1], hz ? 0 : 1);
      if (Math.abs(e0) < 0.001) (by[l.col] = by[l.col] || []).push(l); });
    var best = null; Object.keys(by).forEach(function(k){ if (!best || by[k].length > by[best].length) best = k; });
    G = best; w.lines = best ? by[best] : []; return w;
  }

  var w1 = guides(watch());
  out.one = shape(w1);
  out.sameAsDot = (G === w1.dotCol);
  GE.z = 2; GE.cx = 400; GE.cy = 580;
  out.zoom = shape(guides(watch()));
  GE.z = 1; GE.cx = 400; GE.cy = 400;

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
    var m = (N-1)/2;
    var hx = geTo(S, o + 4.5*D, 0), hy = geTo(S, o + m*D, 1);    /* on the centre row, between two dots */
    var vx = geTo(S, o + m*D, 0), vy = geTo(S, o + 4.5*D, 1);    /* on the centre column, between two dots */
    var ex = geTo(S, o + 4.5*D, 0), ey = geTo(S, o, 1);          /* on the 口's top edge, between two dots */
    var dx = geTo(S, o + 4*D, 0), dy = geTo(S, o + 7*D, 1);      /* a dot nowhere near a line */
    var gap = px(geTo(S, o + 6.5*D, 0), geTo(S, o + 6.5*D, 1));   /* between rows, between columns */
    return { h: ratio(most(hx, hx, hy-2, hy+2), gap), v: ratio(most(vx-2, vx+2, vy, vy), gap),
             e: ratio(most(ex, ex, ey-2, ey+2), gap), dot: ratio(most(dx-3, dx+3, dy-3, dy+3), gap) };
  }
  var theme0 = SET.theme;
  out.light = measure('light');
  out.dark = measure('dark');
  SET.theme = theme0; applyTheme(); render();

  out.same = (kept() === before);
  return out;
}, { s: seed.toString() });
await br.close();

const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }
const W = JSON.stringify(r.want);

say(JSON.stringify(r.one.rows) === W, 'across: the 口\'s top and bottom and the 十\'s bar -- rows ' + r.one.rows.join(', ') + ' (want ' + r.want.join(', ') + ')');
say(JSON.stringify(r.one.cols) === W, 'down: the 口\'s two sides and the 十\'s stem -- columns ' + r.one.cols.join(', ') + ' (want ' + r.want.join(', ') + ')');
say(r.one.span, 'each runs from the first dot to the last');
say(r.one.onDots, 'every line starts and ends on a dot');
say(r.zoom.onDots && JSON.stringify(r.zoom.rows) === W && JSON.stringify(r.zoom.cols) === W,
    'and pinched in they are still on the same rows and columns of dots');
say(!r.sameAsDot, 'the lines are not in the dots\' colour');
for (const t of ['light', 'dark']) {
  const q = r[t], lo = Math.min(q.h, q.v, q.e);
  say(lo >= 3, t + ': the lines are seen -- across ' + q.h.toFixed(2) + ':1, down ' + q.v.toFixed(2) +
      ':1, the 口 ' + q.e.toFixed(2) + ':1 against the panel (a dot is ' + q.dot.toFixed(2) + ':1; the bar is 3:1)');
}
say(r.same, 'and nothing kept moved -- localStorage, the slices, the letters, the font');

if (bad.length) { console.error('\nguide: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nguide: 田 -- a 口 and a 十, across and down, seen in both themes, and nothing stored.');
