/* A letter drawn on paper comes back as the letter that was drawn.
   ---------------------------------------------------------------------
   The app hands out a sheet, somebody writes on it, and hands it back. Every
   step between those two is arithmetic on a photograph, and NONE of it can
   throw. A sheet read slightly wrong gives a letter that is merely a bit
   thicker, or a bit smaller, or the right shapes against the wrong names --
   on a screen that renders, in a font that installs, with every other check
   in this gate green. There is no error state to catch. There is only a
   different letter.

   So a whole sheet is put through, end to end, through the REAL reading side:
   the page is drawn from the same shBoxAt/shMarks/shCellAt the PDF is written
   from, three boxes are written in, and then it is PHOTOGRAPHED BADLY --
   rotated, sheared, blurred, with a lighting gradient across it and noise on
   top. What comes back is asked for by name.

   The two that matter most and are easiest to get green with the bug in:

   - **Nothing is redrawn.** OWNER DECISION 2026-08-25
     「画像データをそのまま取り込みたいのよ」. What arrives has to be the size
     and the position that was drawn, not the app's pen laid over it, so the
     shape is measured against the shape that went in.
   - **A sheet that cannot name itself is REFUSED, not half-read.** Guessing
     the order would put somebody's 水 on the letter called `a`, and no screen
     would ever look wrong.

   Run: node tools/sheet-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
import { chromium, LAUNCH } from './browser.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const NAMES = ['7','2','25','人','愛','a','a','a','mountain','水',
               '火','木','金','土','日','月','ka','yo','!','?'];
/* Which of the twenty are written in, and 20 - 3 = 17 are not. The empty ones
   are half the test: the app prints its own lattice inside every box, and a
   reader that takes those dots for ink turns a blank sheet into seventeen
   letters made of nothing. */
const DREW = [0, 1, 2];

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{ width:390, height:844 } });
await pg.goto('file://' + path.join(dir, '..', 'www', 'index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:20000 });

/* ---- 1. the page, drawn and then photographed badly ---------------------
   The strokes stand in for somebody's hand. They are the app's own glyph
   contours, which is honest about what this is NOT: real ink bleeds into
   paper and goes dry, and a brush has never been through here. The owner is
   testing that with a real sheet. What this holds is everything else. */
const build = ({ names, s, DPI, deg, blur, grain, lit, damage }) => {
  if (typeof shBlank === 'undefined') return null;
  eval('(' + s + ')()');
  SET.done = true;

  /* ---- the page IS the file --------------------------------------------
     This used to draw the page itself, out of shBoxAt/shMarks/shCellAt --
     the same functions the PDF is written from, so the geometry agreed. What
     it never touched was shSheet()'s BYTES, and that is the half the owner
     met: a sheet that goes out and cannot come back in. A page drawn beside
     the writer is a copy of the writer, and a copy always agrees.

     So the real PDF is built and then PLAYED: its cross-reference table is
     read, its page found, its content stream tokenised, and its operators
     run onto the canvas. Nothing here asks the app where a box is. If the
     bytes say something the reader does not expect, this is where it shows.

     Only the operators shPageOps() emits are understood -- `re f`, `re S`,
     `g`, `G`, `w`, `q`/`Q`/`cm`, `Do`, and a line of text. An operator that
     turns up and is not one of these is a FAILURE rather than a shrug: it
     means the sheet grew something this cannot see, and a page rendered with
     a piece missing is exactly the silent wrong answer this file exists to
     refuse. */
  function shdPlay(pdf, want, ctx, S, PH, seen){
    /* the cross-reference table, which is how a reader finds an object. Not
       a scan for `N 0 obj`: a gray image stream is arbitrary bytes and may
       spell anything. */
    var sx = pdf.lastIndexOf('startxref');
    if (sx < 0) return 'no startxref';
    var xat = parseInt(String(pdf.slice(sx + 9)).replace(/^\s+/, ''), 10);
    if (!(xat > 0) || pdf.slice(xat, xat + 4) !== 'xref') return 'no xref at ' + xat;
    var hd = /^\s*(\d+)\s+(\d+)\s*/.exec(pdf.slice(xat + 4, xat + 44));
    if (!hd) return 'xref head';
    var first = +hd[1], count = +hd[2], at = xat + 4 + hd[0].length, off = [], i;
    for (i = 0; i < count; i++){ off[first + i] = parseInt(pdf.substr(at, 10), 10); at += 20; }

    function body(k){
      var a = off[k];
      if (!(a > 0)) return '';
      var h = pdf.indexOf('obj', a);
      if (h < 0) return '';
      /* objects are written in order, so the next one's offset is this one's
         end -- and the last one ends where the table starts. */
      var b = (off[k + 1] > 0) ? off[k + 1] : xat;
      return pdf.slice(h + 3, b);
    }
    function stream(k){
      var t = body(k), a = t.indexOf('stream\n'), b = t.lastIndexOf('\nendstream');
      return (a < 0 || b < a) ? '' : t.slice(a + 7, b);
    }
    var kids = (body(2).match(/\d+ 0 R/g) || []).map(function(r){ return parseInt(r, 10); });
    if (!kids[want]) return 'no page ' + want;
    var page = body(kids[want]);
    var cm = /\/Contents (\d+) 0 R/.exec(page);
    if (!cm) return 'no contents';
    var ims = {}, xo = /\/XObject <<([^>]*)>>/.exec(page), mm, re = /\/(Im\d+) (\d+) 0 R/g;
    if (xo) while ((mm = re.exec(xo[1]))) ims[mm[1]] = +mm[2];

    /* an image as a canvas of its own: DeviceGray, 8 bits, one byte a pixel,
       row 0 at the TOP -- which is the opposite way up from the unit square
       a PDF draws it into, and the flip is done once, below. */
    function pic(k){
      var d = body(k), w = +(/\/Width (\d+)/.exec(d) || [0, 0])[1],
          h = +(/\/Height (\d+)/.exec(d) || [0, 0])[1], by = stream(k);
      if (!(w > 0 && h > 0) || by.length < w * h) return null;
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var q = c.getContext('2d'), id = q.createImageData(w, h), j, v;
      for (j = 0; j < w * h; j++){
        v = by.charCodeAt(j) & 255;
        id.data[j*4] = id.data[j*4+1] = id.data[j*4+2] = v; id.data[j*4+3] = 255;
      }
      q.putImageData(id, 0, 0);
      return c;
    }

    /* PDF points straight onto the canvas: y runs UP on paper and DOWN here,
       and this is the one place the two meet. */
    ctx.save();
    ctx.setTransform(S, 0, 0, -S, 0, PH);
    var st = [], fill = '#000', strk = '#000', tf = 8, tx = 0, ty = 0, bad = null;
    function gray(v){ var n2 = Math.round(v * 255); return 'rgb(' + n2 + ',' + n2 + ',' + n2 + ')'; }
    var toks = String(stream(cm[1])).match(/\([^)]*\)|\/[^\s/<>\[\]()]+|[^\s]+/g) || [];
    for (i = 0; i < toks.length; i++){
      var tk = toks[i];
      if (/^[-+]?[\d.]+$/.test(tk)){ st.push(parseFloat(tk)); continue; }
      if (tk.charAt(0) === '/' || tk.charAt(0) === '('){ st.push(tk); continue; }
      switch (tk){
        case 'g': fill = gray(st.pop()); break;
        case 'G': strk = gray(st.pop()); break;
        case 'w': ctx.lineWidth = st.pop(); break;
        case 're': st = st.slice(-4); break;             /* x y w h, kept for f/S */
        case 'f': case 'S': {
          if (st.length < 4){ bad = bad || 'rect with ' + st.length; break; }
          var h4 = st.pop(), w4 = st.pop(), y4 = st.pop(), x4 = st.pop();
          if (tk === 'f'){ ctx.fillStyle = fill; ctx.fillRect(x4, y4, w4, h4);
                           seen.push(['f', x4, y4, w4, h4]); }
          else            { ctx.strokeStyle = strk; ctx.strokeRect(x4, y4, w4, h4);
                           seen.push(['S', x4, y4, w4, h4]); }
          st = [];
          break;
        }
        case 'q': ctx.save(); break;
        case 'Q': ctx.restore(); st = []; break;
        case 'cm': {
          var f6 = st.pop(), e6 = st.pop(), d6 = st.pop(), c6 = st.pop(), b6 = st.pop(), a6 = st.pop();
          ctx.transform(a6, b6, c6, d6, e6, f6);
          st = [];
          break;
        }
        case 'Do': {
          var nm = String(st.pop()).slice(1), c7 = ims[nm] ? pic(ims[nm]) : null;
          if (!c7){ bad = bad || 'no image ' + nm; break; }
          ctx.save(); ctx.transform(1, 0, 0, -1, 0, 1);   /* row 0 is the top */
          ctx.drawImage(c7, 0, 0, 1, 1); ctx.restore();
          seen.push(['Do', nm]);
          st = [];
          break;
        }
        case 'BT': st = []; break;
        case 'Tf': tf = st.pop(); st.pop(); break;
        case 'Td': ty = st.pop(); tx = st.pop(); break;
        case 'Tj': {
          var s8 = String(st.pop()); s8 = s8.slice(1, s8.length - 1);
          ctx.save(); ctx.translate(tx, ty); ctx.scale(1, -1);
          ctx.fillStyle = fill; ctx.font = tf + 'px Helvetica, sans-serif';
          ctx.textBaseline = 'alphabetic'; ctx.fillText(s8, 0, 0); ctx.restore();
          st = [];
          break;
        }
        case 'ET': st = []; break;
        case 'gs': st = []; break;
        default: bad = bad || 'unknown operator ' + tk;
      }
      if (bad) break;
    }
    ctx.restore();
    return bad;
  }

  var S = DPI/72, PW = Math.round(SH_W*S), PH = Math.round(SH_H*S);
  var pc = document.createElement('canvas'); pc.width = PW; pc.height = PH;
  var g = pc.getContext('2d'), Y = function(y){ return PH - y*S; };
  g.fillStyle = '#fff'; g.fillRect(0, 0, PW, PH);
  var i, x, y, b, at;

  var pdf = shSheet(names, shPics(names));
  if (!pdf) return { fail: 'shSheet refused the names' };
  var seen = [], why = shdPlay(pdf, 0, g, S, PH, seen);
  if (why) return { fail: 'the page could not be played: ' + why };

  var bits = shPack(names.slice(0, shPerPage()));
  /* `damage` is somebody's thumb over the strip, or a fold, or a scanner that
     lost a band. The packet is written three and a bit times over and the
     first copy that checksums wins, so a few bad cells REPAIR -- what this
     asks for is enough of them that no copy checks out, and then the sheet
     has to be turned away rather than read with the names guessed.
     It is done to the PHOTOGRAPH now and not to the packet before printing:
     the page came off the real PDF, so this is a cell painted over rather
     than a sheet printed wrong. */
  if (damage) for (i = 0; i < damage; i++){
    var di = (i*37 + 11) % (SH_CW*SH_CH);
    at = shCellAt(di % SH_CW, (di / SH_CW) | 0);
    g.fillStyle = bits[di] ? '#fff' : '#000';
    g.fillRect(at[0]*S, Y(at[1]+SH_CELL), SH_CELL*S, SH_CELL*S);
  }
  var KA = [[[175,265],[330,250],[440,275],[470,350],[450,470],[390,570],[300,640],[225,655],[205,610],[240,585]],
            [[300,175],[275,340],[230,500],[175,640],[140,700]],
            [[600,235],[625,330],[615,420]]];
  var YO = [[[300,215],[520,200]],
            [[430,120],[420,300],[410,430],[380,530],[300,600],[240,555],[275,485],[365,500],[455,570],[530,650]]];
  var RING = [[[400,200],[600,400],[400,600],[200,400]]];
  /* what went in, in the 800 square, so what comes out can be held to it */
  var drawn = {};
  function put(idx, strokes, closed){
    var b2 = shBoxAt(idx), sts = strokes.map(function(k){
      var o = { pts: k.map(function(q, j){
        return (j > 0 && j < k.length-1) ? [q[0], q[1], 'c'] : q.slice(); }) };
      if (closed){ o.closed = true; o.pts = k.map(function(q){ return [q[0], q[1], 'c']; }); }
      return o;
    });
    var L = LinguaFont.glyphContours({ strokes: sts }, GPEN);
    var lo = [1e9, 1e9], hi = [-1e9, -1e9];
    g.fillStyle = '#000'; g.beginPath();
    L.forEach(function(ct){
      ct.forEach(function(p, k2){
        /* y is UP in a glyph and DOWN in a box, and this is the one place the
           two systems meet. The box's TOP is the far edge of the page from
           the reader's origin -- shBoxInk's row 0 sits at b.y + side -- so a
           glyph's y=800 goes at the top of the box and not the bottom.
           tools/sheet-spike/fake.mjs had this the other way round and drew
           every letter upside down; nothing there notices, because what it
           measures is how many pixels came back and what the names were. */
        var bx = p[0], by = 800 - p[1];
        if (bx < lo[0]) lo[0] = bx;  if (by < lo[1]) lo[1] = by;
        if (bx > hi[0]) hi[0] = bx;  if (by > hi[1]) hi[1] = by;
        var ux = (b2.x + p[0]/800*SH_BOX)*S, uy = Y(b2.y + p[1]/800*SH_BOX);
        if (k2 === 0) g.moveTo(ux, uy); else g.lineTo(ux, uy);
      });
      g.closePath();
    });
    g.fill('nonzero');
    /* and every point of it, so what comes back can be held to the OUTLINE
       and not merely to a box round it. A bounding box survives almost any
       amount of redrawing: Douglas-Peucker never moves the extremes, so a
       letter thinned until it is a triangle still measures the same width. */
    drawn[idx] = { lo: lo, hi: hi, rings: L.length,
                   pts: L.map(function(ct){
                     return ct.map(function(p){ return [p[0], 800 - p[1]]; }); }) };
  }
  put(0, KA); put(1, YO); put(2, RING, true);

  /* and now it is a photograph: rotated, sheared, blurred, lit from one side
     and grainy. Every one of those was measured in tools/sheet-spike. */
  var rad = Math.abs(deg)*Math.PI/180, warp = deg/200;
  var W = Math.round((PW*Math.cos(rad)+PH*Math.sin(rad))*1.1 + PH*warp);
  var H = Math.round((PH*Math.cos(rad)+PW*Math.sin(rad))*1.1 + PW*warp);
  var sc = document.createElement('canvas'); sc.width = W; sc.height = H;
  var h = sc.getContext('2d');
  h.fillStyle = '#fff'; h.fillRect(0, 0, W, H);
  h.save(); h.translate(W/2, H/2); h.rotate(rad*(deg < 0 ? -1 : 1));
  h.transform(1, warp, warp*0.55, 1, 0, 0); h.translate(-PW/2, -PH/2);
  if (blur) h.filter = 'blur(' + blur + 'px)';
  h.drawImage(pc, 0, 0); h.restore();
  if (lit || grain){
    var id = h.getImageData(0, 0, W, H), p = id.data, k3;
    for (k3 = 0; k3 < W*H; k3++){
      var ry = (k3/W)|0, rx = k3%W, sh2 = lit ? (1 - 0.28*(rx/W) - 0.16*(ry/H)) : 1;
      var n = Math.sin(k3*7.13)*43758.5453; n = (n - Math.floor(n))*2 - 1;
      var v = p[k3*4]*sh2 + n*grain; v = v < 0 ? 0 : (v > 255 ? 255 : v);
      p[k3*4] = p[k3*4+1] = p[k3*4+2] = v;
    }
    h.putImageData(id, 0, 0);
  }
  window.__SHEET = sc.toDataURL('image/png');
  /* the same photograph as a JPEG, which is what a phone that had rendered a
     page would hand back. Section 8 is the only thing that reads it. */
  window.__SHEETJPG = sc.toDataURL('image/jpeg', 0.9);
  window.__DREW = drawn;
  /* the claim shSane held: a name printed over a box may not reach the box
     ABOVE it, and the strip may not sit on the bottom row. It was wrong once,
     by four points, and what it produced was a word printed inside a square
     somebody was about to draw their own letter in. */
  return {
    /* off the bytes, and only the bytes can say it: a name printed over
       every box, and a box drawn under every name. A page that goes out with
       one label missing is a box nobody can tell from its neighbour, and it
       renders, prints and photographs perfectly. */
    drew: { pics: seen.filter(function(o){ return o[0] === 'Do'; }).length,
            boxes: seen.filter(function(o){ return o[0] === 'S'; }).length },
    label: SH_LABEL + SH_LABEL_UP < SH_GAPY,
    strip: shCellAt(0, 0)[1] + SH_CELL < shBoxAt(shPerPage()-1).y,
    before: LETTERS.length,
    /* absent means make: not one letter that exists today carries `via`,
       and not one carries `sh` */
    oldVia: LETTERS.filter(function(l){ return l.via !== undefined; }).length,
    oldSh:  LETTERS.filter(function(l){ return l.sh !== undefined; }).length
  };
};
const shot = await pg.evaluate(build, { names: NAMES, s: seed.toString(), DPI: 250, deg: 6, blur: 1.6, grain: 18, lit: true });
/* The page is the PDF now, so a PDF that cannot be built or cannot be played
   is the end of the run rather than twenty confusing lines about ink. Said
   here, with the reason, because everything below reads `shot`. */
if (!shot || shot.fail){
  console.log('  FAILED  ' + ((shot && shot.fail) || 'the app did not load'));
  await br.close();
  process.exit(1);
}

/* ---- 2. hand it back, through the road a person's finger takes ---------- */
await pg.evaluate(() => { SH = shBlank(); shTakeFile(window.__SHEET, 'sheet.png'); });
await pg.waitForFunction(() => window.SH && (SH.got || SH.why), null, { timeout: 60000 });

const read = await pg.evaluate(({ drew }) => {
  var s = SH, out = { why: s.why, names: null, boxes: [] };
  if (!s.got) return out;
  out.names = s.got.map(function(g){ return g.nm; });
  s.got.forEach(function(g, i){
    var lo = [1e9, 1e9], hi = [-1e9, -1e9], area = [], j, k, L, a;
    for (j = 0; j < g.sh.length; j++){
      L = g.sh[j]; a = 0;
      for (k = 0; k < L.length; k++){
        if (L[k][0] < lo[0]) lo[0] = L[k][0];  if (L[k][1] < lo[1]) lo[1] = L[k][1];
        if (L[k][0] > hi[0]) hi[0] = L[k][0];  if (L[k][1] > hi[1]) hi[1] = L[k][1];
        var n2 = L[(k+1) % L.length];
        a += L[k][0]*n2[1] - n2[0]*L[k][1];
      }
      area.push(a/2);
    }
    out.boxes.push({ nm: g.nm, rings: g.sh.length, pts: g.sh.reduce(function(t, L2){ return t + L2.length; }, 0),
                     lo: lo, hi: hi, area: area, sh: g.sh, want: drew[i] || null });
  });
  return out;
}, { drew: await pg.evaluate(() => window.__DREW) });

/* ---- 3. and the moment it becomes letters ------------------------------- */
const took = await pg.evaluate(({ before }) => {
  var was = LETTERS.map(function(l){ return JSON.stringify(l); });
  shTakeIn();
  var made = LETTERS.slice(before), still = LETTERS.slice(0, before), i, moved = 0;
  for (i = 0; i < still.length; i++) if (JSON.stringify(still[i]) !== was[i]) moved++;
  return {
    made: made.length,
    moved: moved,
    names: made.map(function(l){ return l.nm; }),
    allSh:  made.filter(function(l){ return l.sh && l.sh.length; }).length,
    anySt:  made.filter(function(l){ return l.st && l.st.length; }).length,
    allVia: made.filter(function(l){ return l.via === 'write'; }).length,
    /* it ADDS. `a` is already in the free alphabet and a box called `a` must
       not land on it -- a letter with a name somebody already has is a NEW
       letter, which is what 「a,a,a は三枠」 means. */
    keptA: still.filter(function(l){
      var n2 = ltName(l);
      return n2 === 'a' || n2 === '7' || n2 === '2';
    }).length,
    stored: (function(){
      try { return JSON.parse(localStorage.getItem(langKey('letters')) || '[]').length; }
      catch(e){ return -1; }
    })()
  };
}, { before: shot.before });

/* ---- 4. and a picture that is not a sheet is refused whole -------------- */
const refused = await pg.evaluate(() => {
  var n = LETTERS.length;
  var c = document.createElement('canvas'); c.width = 900; c.height = 1200;
  var g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 1200);
  g.fillStyle = '#000'; g.fillRect(300, 400, 250, 250);
  SH = shBlank();
  shTakeFile(c.toDataURL('image/png'), 'holiday.png');
  return { n: n };
});
await pg.waitForFunction(() => window.SH && (SH.got || SH.why), null, { timeout: 60000 });
const after = await pg.evaluate(({ n }) => ({
  why: SH.why, got: !!SH.got, grew: LETTERS.length - n
}), refused);

/* ---- 5. and the same sheet with a clean eye ----------------------------
   The pass above is a PHOTOGRAPH: blurred, tilted, lit from one side and
   grainy, and it answers "does this survive a phone in somebody's hand". It
   cannot answer "is anything being redrawn", because a 1.6px blur at 250dpi
   rounds off a sharp stroke tip by about 20 units of 800 all on its own --
   a threshold that caught the app's pen would fail on a slightly worse
   photograph, and one that did not would catch nothing.

   So the page is scanned again with none of that on it, flat and sharp. Every
   unit of deviation left is the READER's, and that is where the owner's
   decision lives: 「取り込んだやつを上から描き直してるからそうなるんでしょ？」
   Put the thinning back to 6 of 800 and this is what goes red. */
await pg.evaluate(() => { SH = shBlank(); });
await pg.evaluate(build, { names: NAMES, s: seed.toString(), DPI: 250,
                           deg: 0, blur: 0, grain: 0, lit: false });
await pg.evaluate(() => { SH = shBlank(); shTakeFile(window.__SHEET, 'scan.png'); });
await pg.waitForFunction(() => window.SH && (SH.got || SH.why), null, { timeout: 60000 });
const clean = await pg.evaluate(({ drew, DREW }) => {
  if (!SH.got) return { why: SH.why, boxes: [] };
  /* Both shapes into the same 800 square, and the pixels that disagree.
     A distance from the drawn CONTOURS is not the measure: a nib sweep is
     one contour per segment and they overlap, so a perfectly good point of
     one sits deep inside the ink and a long way from any boundary. What
     both sides genuinely have is an inked AREA. */
    var N = 800;
  function ink(paint){
    var c = document.createElement('canvas'); c.width = N; c.height = N;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N);
    x.fillStyle = '#000'; x.beginPath(); paint(x);
    return { x: x, c: c };
  }
  function mask(o, rule){
    o.x.fill(rule);
    var d = o.x.getImageData(0, 0, N, N).data, m = [], i;
    for (i = 0; i < N*N; i++) m[i] = d[i*4] < 128 ? 1 : 0;
    return m;
  }
  var out = [], grid = { on: 0, all: 0 };
  DREW.forEach(function(i){
    var g = SH.got[i], w = drew[i], k = N/800, j;
    if (!g || !w){ out.push({ nm:(g&&g.nm)||'?', diff: 1, ink: 0 }); return; }
    var A = mask(ink(function(x){ w.pts.forEach(function(ct){
          ct.forEach(function(p, n2){ if (n2===0) x.moveTo(p[0]*k, p[1]*k);
                                      else x.lineTo(p[0]*k, p[1]*k); }); x.closePath(); }); }), 'nonzero');
    var B = mask(ink(function(x){ g.sh.forEach(function(L){
          L.forEach(function(p, n2){ if (n2===0) x.moveTo(p[0]*k, p[1]*k);
                                     else x.lineTo(p[0]*k, p[1]*k); }); x.closePath(); }); }), 'evenodd');
    var same = 0, only = 0, drawnN = 0, backN = 0;
    for (j = 0; j < N*N; j++){
      if (A[j]) drawnN++;
      if (B[j]) backN++;
      if (A[j] && B[j]) same++;
      else if (A[j] || B[j]) only++;
    }
    /* And whether it landed on the app's own lattice, which is the OTHER way
       a letter gets redrawn and the one an area cannot see: the road this
       replaced was GE.raw -> geShape(), and everything out of the glyph
       editor sits on GGRID -- 21 across with an inset of 40, so a step of 36.
       A shape that went through it has every point on that grid; a shape that
       came off a photograph has almost none. */
    g.sh.forEach(function(L){ L.forEach(function(p){
      var gx = (p[0]-GGRID.inset)/geStep(), gy = (p[1]-GGRID.inset)/geStep();
      grid.all++;
      if (Math.abs(gx-Math.round(gx)) < 0.02 && Math.abs(gy-Math.round(gy)) < 0.02) grid.on++;
    }); });
    out.push({ nm: g.nm, ink: drawnN, back: backN,
               bias: drawnN ? (backN - drawnN)/drawnN : -1,
               diff: drawnN ? only/drawnN : 1,
               pts: g.sh.reduce(function(t, L){ return t + L.length; }, 0) });
  });
  return { why: '', boxes: out, grid: grid };
}, { drew: await pg.evaluate(() => window.__DREW), DREW });

/* ---- 6. and a real sheet whose strip is damaged ------------------------
   The pass above is a holiday photograph: the four marks are not there, so it
   never reaches the strip at all. This one IS a sheet -- marks found, boxes
   found, letters in them -- and only the strip is ruined. That is the case
   that matters, because everything else about it looks right: the shapes are
   all there and only the question "which box is which" has no answer. Reading
   it anyway would put somebody's 水 on the letter called `a`, and no screen
   would ever look wrong. */
await pg.evaluate(build, { names: NAMES, s: seed.toString(), DPI: 250,
                           deg: 0, blur: 0, grain: 0, lit: false, damage: 700 });
const before6 = await pg.evaluate(() => LETTERS.length);
await pg.evaluate(() => { SH = shBlank(); shTakeFile(window.__SHEET, 'creased.png'); });
await pg.waitForFunction(() => window.SH && (SH.got || SH.why), null, { timeout: 60000 });
const torn = await pg.evaluate(({ n }) => ({
  why: SH.why, got: !!SH.got, grew: LETTERS.length - n
}), { n: before6 });

/* ---- 7. and the sheet itself, handed straight back ---------------------
   The one road nobody had walked. A person who has just written the file out
   and hands it back has not scanned anything, and what they get told has to
   be about THAT and not about some other file: there is no photograph in
   here, which is a different sentence from "the picture in here cannot be
   taken out". It is refused either way -- an unwritten sheet has nothing on
   it, and a sheet written on with a pencil on a screen needs a renderer this
   file does not have -- so what is held is the answer, not the refusal. */
const own = await pg.evaluate(({ names }) => {
  var pdf = shSheet(names, shPics(names));
  var n = LETTERS.length;
  SH = shBlank();
  shTakeFile('data:application/pdf;base64,' + btoa(pdf), 'my sheet.pdf');
  return { why: shPdfWhy(pdf), jpeg: !!shPdfJpeg(pdf), n: n,
           /* and a scanner's PDF, which is the road that works, and one whose
              page is a picture behind a filter this file cannot undo. Both
              are made here rather than carried as fixtures: what is being
              asked is which of the three sentences comes out. */
           scan: shPdfWhy('%PDF-1.4\n<< /Subtype /Image /Filter /DCTDecode >>'),
           flat: shPdfWhy('%PDF-1.4\n<< /Subtype /Image /Filter /FlateDecode >>'),
           not:  shPdfWhy('hello') };
}, { names: NAMES });
const ownBack = await pg.evaluate(({ n }) => ({
  why: SH.why, got: !!SH.got, grew: LETTERS.length - n
}), { n: own.n });

/* ---- 8. and a page the phone had to draw --------------------------------
   OWNER 2026-08-27「pdfkitのレンダラやろう」. A page whose ink was DRAWN --
   somebody who wrote on the sheet with a pencil on a screen -- has no
   photograph inside it to take out, and reading it needs a renderer. That
   renderer is Swift, and there is no Swift on a Linux runner, so what is held
   here is everything on this side of that call: that it is MADE, that it is
   made with the right file and the right size, that what comes back is put
   through the same reading side as a scan, and that a refusal is a refusal
   rather than a blank screen. backup-check draws the same line for keep().

   The file handed over is the sheet itself and the picture handed back is the
   photograph section 1 already took of it -- which is what an annotated page
   IS: the same twenty boxes, with ink on three of them. */
/* A fresh sheet, and a picture of it with NO CAMERA IN IT -- flat, sharp, at
   the size the renderer answers -- because that is what a phone that drew the
   page hands back. Every other pass in this file is a photograph, and a
   photograph is the easy half here: it washes the printed lattice out on its
   own. A page drawn by the phone gives those dots back at exactly the grey
   they were printed at, and a reader that takes them for ink turns a sheet
   with three letters on it into twenty. Nothing about that throws.
   (Sections 5 and 6 each built a sheet of their own over the top, and section
   6's is the torn one, so this is built again rather than reused.) */
await pg.evaluate(build, { names: NAMES, s: seed.toString(), DPI: 250,
                           deg: 0, blur: 0, grain: 0, lit: false });
await pg.evaluate(({ names }) => {
  var pdf = shSheet(names, shPics(names)), asked = [];
  /* a real promise, not a hand-rolled thenable: share.js's sharePush() runs
     on every render and calls .catch on whatever this hands back. */
  window.Capacitor = { nativePromise: function(plug, method, args){
    asked.push({ plug: plug, method: method, args: args });
    var j = String(window.__SHEETJPG);
    return Promise.resolve({ jpeg: j.slice(j.indexOf(',') + 1) });
  } };
  SH = shBlank();
  shTakeFile('data:application/pdf;base64,' + btoa(pdf), 'written on.pdf');
  window.__ASKED = asked;
  window.__WANT = { b64: btoa(pdf), edge: SH_LOOK };
}, { names: NAMES });
await pg.waitForFunction(() => window.SH && (SH.got || SH.why), null, { timeout: 60000 });
const drawn = await pg.evaluate(() => {
  var all = window.__ASKED.filter(function(c){ return c.method === 'renderPdf'; });
  var a = all[0] || {}, w = window.__WANT;
  return {
    asked: all.length, other: window.__ASKED.length - all.length,
    plug: a.plug, method: a.method,
    same: !!a.args && a.args.b64 === w.b64,
    edge: !!a.args && a.args.edge === w.edge, look: w.edge,
    why: SH.why, from: SH.from,
    names: SH.got ? SH.got.map(function(g){ return g.nm; }) : null,
    ink: SH.got ? SH.got.filter(function(g){ return g.sh.length; }).length : 0
  };
});
/* and the other end of it: a phone that cannot draw the page says so, and the
   screen is a sentence rather than nothing at all. */
await pg.evaluate(() => {
  window.Capacitor = { nativePromise: function(plug, method){
    return method === 'renderPdf' ? Promise.reject(new Error('cannot draw it'))
                                  : Promise.resolve({});
  } };
  SH = shBlank();
  shTakeFile('data:application/pdf;base64,' + btoa('%PDF-1.4\nnot a page\n'), 'torn.pdf');
});
await pg.waitForFunction(() => window.SH && (SH.got || SH.why), null, { timeout: 60000 });
const drewNo = await pg.evaluate(() => ({ why: SH.why, got: !!SH.got }));
await pg.evaluate(() => { try { delete window.Capacitor; } catch (e) { window.Capacitor = undefined; } });

/* ---- 9. written, then OFFERED -- and nothing claimed in between ---------
   OWNER 2026-08-27「普通に共有画面みたいなやつから保存してそこでファイルに
   保存させてくれ」「保存できてないのに保存しましたとかやめてくんない？」,
   on a build where the write had worked four times over and the person still
   could not get at the file. Writing into Documents and saying nothing is not
   a download, so the press does two things: the phone files the bytes and
   answers with the name it filed them under, and THAT name goes to iOS's own
   share sheet.

   Two ways this breaks and neither throws. The share sheet can be opened on
   the name the app ASKED for rather than the one the phone gave back -- a
   sheet is never overwritten, so those differ the moment there are two, and
   somebody would be handed last week's sheet with every screen looking
   right. And the app can announce a save it knows nothing about: once the
   sheet is up, save/send/cancel never comes back here. It is
   www/wordsheet.js's CSV again, where `<a download>` did nothing in WKWebView
   and threw nothing either, so every run reached the line that said it had
   exported. */
await pg.evaluate(({ names }) => {
  window.__ASKED2 = [];
  window.Capacitor = { nativePromise: function(plug, method, args){
    window.__ASKED2.push({ plug: plug, method: method, args: args });
    /* the name it was actually filed under, which is not the one asked for:
       a sheet is never overwritten, so the second of a name is `<name> 2.pdf` */
    if (method === 'sheet') return Promise.resolve({ file: 'Test sheet 2.pdf' });
    if (method === 'shareFile') return Promise.resolve({ shown: true });
    return Promise.resolve({});
  } };
  document.getElementById('toast').textContent = '';
  SH = shBlank(); SH.names = names.join(', ');
  shMake();
}, { names: NAMES });
await pg.waitForFunction(() => window.__ASKED2.filter(c => c.method === 'shareFile').length === 1,
                         null, { timeout: 60000 });
const filed = await pg.evaluate(() => {
  const c = window.__ASKED2.filter(function(a){ return a.method === 'sheet'; });
  const h = window.__ASKED2.filter(function(a){ return a.method === 'shareFile'; });
  return {
    said: document.getElementById('toast').textContent,
    calls: c.length,
    bytes: !!(c[0] && c[0].args && c[0].args.b64),
    plug: c[0] && c[0].plug,
    shares: h.length,
    shared: (h[0] && h[0].args && h[0].args.file) || '',
    asked: (c[0] && c[0].args && c[0].args.name) || '',
    no: t('wr.nobridge')
  };
});
/* and the same press with a phone that answers, but names no file. Nothing
   rejects and nothing throws -- it is a resolved promise with nothing in it,
   which is what an older build of the app answers, and there is no file
   anywhere. */
await pg.evaluate(({ names }) => {
  window.__ASKED3 = [];
  window.Capacitor = { nativePromise: function(plug, method){
    window.__ASKED3.push(method);
    return Promise.resolve({});
  } };
  document.getElementById('toast').textContent = '';
  SH = shBlank(); SH.names = names.join(', ');
  shMake();
}, { names: NAMES });
await pg.waitForFunction(() => document.getElementById('toast').textContent !== '',
                         null, { timeout: 60000 });
const unnamed = await pg.evaluate(() => ({
  said: document.getElementById('toast').textContent,
  shares: window.__ASKED3.filter(function(m){ return m === 'shareFile'; }).length
}));
await pg.evaluate(() => { try { delete window.Capacitor; } catch (e) { window.Capacitor = undefined; } });

await br.close();

/* ---- what came back ----------------------------------------------------- */
const bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

/* what the file itself drew, read back off the file */
say(shot.drew.pics === Math.min(NAMES.length, 20) && shot.drew.boxes === Math.min(NAMES.length, 20),
  'the file draws a name over every box and a box under every name: ' +
  shot.drew.pics + ' names, ' + shot.drew.boxes + ' boxes');
say(shot.label && shot.strip,
    'the name over a box stays out of the box above it, and the strip clears the bottom row');
say(shot.oldVia === 0 && shot.oldSh === 0,
    'absent means make: none of the ' + shot.before + ' letters already here carries `via` or `sh`');

const namesOK = read.names && read.names.length === NAMES.length &&
                read.names.every((n, i) => n === NAMES[i]);
say(namesOK, 'all ' + NAMES.length + ' names came off a sheet photographed at 6°' +
             (read.names ? '' : ' — got ' + (read.why || 'nothing')));

const drewOK = DREW.every(i => read.boxes[i] && read.boxes[i].rings > 0);
say(drewOK, 'the three boxes somebody wrote in came back drawn: ' +
            DREW.map(i => (read.boxes[i] ? read.boxes[i].pts : 0) + ' points').join(', '));

const blank = read.boxes.filter((b, i) => DREW.indexOf(i) < 0);
const blankOK = blank.length === NAMES.length - DREW.length && blank.every(b => b.rings === 0);
say(blankOK, 'the other ' + blank.length + ' came back empty — the printed lattice is not ink');

/* the ring's hole. A circle that fills in is a blot, not a letter, and the
   winding is how the hole is KNOWN: the outer ring and the hole have to go
   round opposite ways. */
const ring = read.boxes[2] || { rings: 0, area: [] };
const wound = ring.rings === 2 && (ring.area[0] > 0) !== (ring.area[1] > 0);
say(wound, 'the ring came back with its hole, wound the other way: ' +
           ring.rings + ' rings, areas ' + ring.area.map(a => Math.round(a)).join(' and '));

/* NOTHING IS REDRAWN, and this is the claim the whole chapter turns on:
   OWNER DECISION 2026-08-25「画像データをそのまま取り込みたいのよ」. What
   arrives is the shape that was drawn -- not the app's pen laid over it, not
   snapped to the lattice, not smoothed.

   Held as the OUTLINE and not as a box round it. A bounding box survives
   almost any amount of redrawing: Douglas-Peucker never moves the extremes,
   so putting the thinning back to 6 of 800 -- which moved a point 5.81, four
   tenths of the width of the stroke it was moving -- leaves every edge where
   it was. What is measured is every point of what went on the paper against
   the polyline that came back: the furthest any of them had to travel to land
   on it, on the CLEAN pass, where nothing else could have moved it. */
/* The bar is 20% and both sides of it were measured. With the thinning at 1 of
   800 the three boxes come back 12.5%, 17.4% and 17.0% different from the ink
   that went on the paper -- which is resampling: a stroke 24 of 800 wide is
   about seven pixels once the page has been scaled down to the 2200 the reader
   looks at, so half a pixel of edge on each side is already a sixth of it.
   Put the thinning back to 6 and they are 21.7%, 26.1% and 21.3%.

   The weight is PRINTED and not asserted. -1.2% to -1.8% here, against the
   -1.1% to -3.2% measured on the real sheet -- and how heavy an imported
   letter should be is open and is the owner's, so a check has no business
   fixing it to a number. What it is here for is that it can be seen moving. */
let worst = 0, worstAt = '';
clean.boxes.forEach(b => { if (b.diff > worst){ worst = b.diff; worstAt = b.nm; } });
say(clean.boxes.length === DREW.length && worst <= 0.20,
    'nothing is redrawn: on a clean scan the ink that came back differs from the ink ' +
    'that went on the paper by ' + Math.round(worst*1000)/10 + '% at worst (' + worstAt + ')');
clean.boxes.forEach(b => console.log('      ' + b.nm + '  xor ' +
    Math.round(b.diff*1000)/10 + '%  weight ' + (b.bias>=0?'+':'') + Math.round(b.bias*1000)/10 +
    '%  ' + b.pts + ' points over ' + b.ink + ' inked'));

const onGrid = clean.grid || { on:0, all:0 };
say(onGrid.all > 0 && onGrid.on * 20 < onGrid.all,
    'and nothing snapped it to the app\'s lattice: ' + onGrid.on + ' of ' +
    onGrid.all + ' points sit on GGRID');

/* The size and the place, which need no decision -- they are already what was
   drawn -- measured through the BAD photograph, because that is the half the
   tilt and the trapezoid could move. */
let box = 0, boxAt = '';
DREW.forEach(i => {
  const b = read.boxes[i];
  if (!b || !b.want){ box = 999; boxAt = 'box ' + i + ' came back with nothing'; return; }
  [[b.lo[0], b.want.lo[0], 'left'], [b.lo[1], b.want.lo[1], 'top'],
   [b.hi[0], b.want.hi[0], 'right'], [b.hi[1], b.want.hi[1], 'bottom']].forEach(([got, want, side]) => {
    const d = Math.abs(got - want);
    if (d > box){ box = d; boxAt = b.nm + "'s " + side; }
  });
});
say(box <= 8, 'photographed at 6° it is still the size it was drawn: every edge within ' +
              Math.round(box) + ' of 800 (worst: ' + boxAt + ')');

say(took.made === DREW.length,
    'taking it in made ' + took.made + ' letters and not ' + read.boxes.length);
say(took.moved === 0,
    'and moved none of the ' + shot.before + ' that were already there');
say(took.allSh === took.made && took.anySt === 0,
    'each carries the picture as it came and no strokes: ' + took.allSh + ' with `sh`, ' +
    took.anySt + ' with `st`');
say(took.allVia === took.made,
    "and says how it got here: " + took.allVia + " marked 'write'");
/* The free alphabet already holds letters called `a`, `7` and `2`, and two of
   those are boxes on this sheet. A box called `7` is a NEW letter -- it does
   not land on the digit already there, and nothing is renamed to make room.
   That is what 「a,a,a は三枠」 means: on Pro a name is a label, not a key. */
say(took.keptA === 3 && took.names.join(',') === DREW.map(i => NAMES[i]).join(','),
    'a box whose name the alphabet already has is a NEW letter: ' +
    took.keptA + ' of `a` `7` `2` untouched, brought in ' + took.names.join(', '));
say(took.stored === shot.before + DREW.length,
    'and they are in storage, not only in memory: ' + took.stored + ' letters filed');

say(!after.got && !!after.why && after.grew === 0,
    'a photograph that is not a sheet is refused whole: ' + after.grew +
    ' letters added, and it says why');
say(own.why === 'drawn' && !own.jpeg && own.scan === 'photo' &&
    own.flat === 'packed' && own.not === 'not-pdf',
    'the app knows which kind of PDF arrived: its own sheet is `' + own.why +
    '`, a scan `' + own.scan + '`, a page behind a filter `' + own.flat + '`');
say(ownBack.grew === 0 && !ownBack.got &&
    ownBack.why === 'There is no photograph inside this PDF.',
    'and its own sheet handed straight back is turned away with the true ' +
    'reason rather than a guess about another file: "' + ownBack.why + '"');
say(drawn.asked === 1 && drawn.plug === 'LinguaShare' && drawn.method === 'renderPdf' &&
    drawn.same && drawn.edge,
    'a page with no photograph in it is handed to the phone to draw: ' +
    drawn.asked + ' call to ' + drawn.plug + '.' + drawn.method +
    ', the file itself, at the size the reader looks at (' + drawn.look + ')');
say(!!drawn.names && drawn.names.length === NAMES.length && drawn.ink === DREW.length &&
    drawn.from === 'written on.pdf',
    'and what the phone drew goes through the same reading side as a scan: ' +
    (drawn.names ? drawn.names.length : 0) + ' names, ' + drawn.ink + ' written in, ' +
    ((drawn.names ? drawn.names.length : 0) - drawn.ink) + ' empty — with no camera ' +
    'to wash the printed lattice out, it is still not ink');
say(!drewNo.got && !!drewNo.why,
    'and a page the phone cannot draw is a sentence, not a screen that never ' +
    'changes: "' + drewNo.why + '"');
say(filed.calls === 1 && filed.bytes && filed.plug === 'LinguaShare',
    'pressing save hands the sheet to the phone as a file, once: ' +
    filed.calls + ' call to ' + filed.plug + '.sheet with the bytes on it');
say(filed.shares === 1 && filed.shared === 'Test sheet 2.pdf' &&
    filed.shared !== filed.asked,
    'and then the file the PHONE filed is the one offered to the share sheet, ' +
    'not the name that was asked for: offered "' + filed.shared + '", asked for "' +
    filed.asked + '"');
say(filed.said === '',
    'and nothing claims it was saved — once the share sheet is up, save, send ' +
    'and cancel never come back here: the screen said "' + filed.said + '"');
say(unnamed.shares === 0 && unnamed.said === filed.no,
    'and a phone that answers but names no file opens NO share sheet and says ' +
    'so — there is nothing to offer: ' + unnamed.shares + ' offered, "' +
    unnamed.said + '"');
say(!torn.got && !!torn.why && torn.grew === 0,
    'and a real sheet whose strip is damaged is refused too, not read with the ' +
    'names guessed: ' + torn.grew + ' letters added');

if (bad.length){ console.error('\nsheet: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nsheet: a sheet names itself, a photograph of one comes back as the letters');
console.log('       that were drawn on it, at the size they were drawn, and a picture that');
console.log('       is not a sheet is turned away rather than half-imported.');
