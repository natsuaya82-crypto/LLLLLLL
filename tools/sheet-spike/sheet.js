/* Lingua — the sheet somebody writes on (chapter 26)
   ES5 only. tools/es5-check.mjs enforces it.

   THE SHEET NAMES ITSELF. A number printed on paper is a pointer into the
   app's memory, and paper cannot follow a pointer -- a sheet somebody else
   picked up, or one imported after a new phone, would point at nothing. So the
   twenty names ride ON the sheet, in a strip of black and white cells, and a
   returned sheet needs no memory anywhere to be read.

   Four marks at the corners of the PAGE. Three would give an affine transform,
   which is a parallelogram; four give a real perspective one, and a photograph
   taken by a hand is always a trapezoid. The price is the one Calligraphr also
   pays and states: all four have to be in the picture.

   The name is also printed faintly INSIDE its box, so a person can see what
   each box is for. It is light enough that the threshold does not pick it up.

   This file is in two halves, the same as www/import.js and for the same
   reason. THIS one knows nothing about the app -- given names and a small
   picture of each, it builds PDF bytes; given a page of samples, it reads the
   strip back. No global, no document, so tools/sheet-check.mjs can drive it. */

/* ---- the paper --------------------------------------------------------- */
var SH_W = 595.276, SH_H = 841.89;          /* A4, in points */
var SH_COLS = 4, SH_ROWS = 5;               /* twenty boxes */
var SH_BOX = 106;                           /* 37mm */
var SH_GAPX = 16, SH_GAPY = 22;
var SH_TOP = 58;                            /* room for the corner marks */
var SH_MARK = 14;                           /* the side of a corner mark */
var SH_INSET = 26;                          /* how far in from the page edge */
/* How tall the name over a box is, and how far above the box it sits. The two
   together must stay inside SH_GAPY or the name climbs into the box ABOVE --
   shSane() at the foot of this file is what holds it. */
var SH_LABEL = 14, SH_LABEL_UP = 4;
/* The dots inside a box, and they are the app's own lattice -- GGRID is 21
   across with an inset of 40 in a square of 800, so the same dots a finger
   traces on the canvas are the dots a pen traces on paper.
   「その代わり四角の中に点線めっちゃ入れてあげたら？」
   This is what replaced printing the name faintly inside the box. A name in
   the box is a shape to trace, and somebody inventing their own script for 水
   would have traced the Japanese one. A dot says nothing about what to draw.
   Light, and small: a person sees them, and the reader's clean-up drops them
   twice over -- once because they are pale, once because a dot is a smaller
   island than any stroke. */
var SH_DOT = 0.5, SH_DOT_GREY = 0.72;
var SH_LAT_N = 21, SH_LAT_INSET = 40;       /* GGRID, in the 800 square */
/* the strip that carries the names */
var SH_CELL = 4.54;                         /* 1.6mm, ~19 pixels at 300dpi */
var SH_CW = 96, SH_CH = 22;                 /* cells across and down */
var SH_BITS = SH_CW * SH_CH;

function shPerPage(){ return SH_COLS * SH_ROWS; }
function shNum(n){ return String(Math.round(n * 100) / 100); }

/* Where box i sits on its page, in PDF points, y UP. The ONE place that knows;
   printing a sheet and reading one back both ask this. */
function shBoxAt(i){
  var k = i % shPerPage();
  var w = SH_COLS * SH_BOX + (SH_COLS - 1) * SH_GAPX;
  var x0 = (SH_W - w) / 2, yTop = SH_H - SH_TOP;
  var c = k % SH_COLS, r = Math.floor(k / SH_COLS);
  return { page: Math.floor(i / shPerPage()),
           x: x0 + c * (SH_BOX + SH_GAPX),
           y: yTop - r * (SH_BOX + SH_GAPY) - SH_BOX,
           side: SH_BOX };
}
/* The four marks, in a fixed order: top-left, top-right, bottom-right,
   bottom-left. Their CENTRES, because that is what a reader finds. */
function shMarks(){
  var a = SH_INSET + SH_MARK / 2, b = SH_W - a, c = SH_H - a;
  return [[a, c], [b, c], [b, a], [a, a]];
}
/* Where the strip's cell [x,y] sits. y counts DOWN from the strip's top. */
function shCellAt(x, y){
  var w = SH_CW * SH_CELL, h = SH_CH * SH_CELL;
  var x0 = (SH_W - w) / 2, y0 = SH_INSET + SH_MARK + 10 + h;
  return [x0 + x * SH_CELL, y0 - (y + 1) * SH_CELL];
}

/* ---- what the strip carries -------------------------------------------- */
/* UTF-8, without TextEncoder: this has to run in an old WKWebView. */
function shUtf8(s){ return unescape(encodeURIComponent(String(s))); }
function shUnUtf8(b){ try{ return decodeURIComponent(escape(b)); }catch(e){ return null; } }
/* Fletcher-16 over the bytes. Not a hash -- it is here to REFUSE a strip that
   did not come back whole, so that a misread sheet is turned away rather than
   half-imported. */
function shSum(bytes){
  var a = 0, b = 0, i;
  for (i = 0; i < bytes.length; i++){
    a = (a + bytes.charCodeAt(i)) % 255;
    b = (b + a) % 255;
  }
  return (b << 8) | a;
}
/* names -> the bits of the strip, or null when they will not fit.
   The packet is written as many times as the strip has room for, and the last
   copy is cut short rather than padded. Twenty short names come to about
   eighty bytes of a strip that holds two hundred and sixty, so the spare cells
   were zeroes; a second and third copy costs nothing and repairs a strip a
   smudge or a bad angle spoiled in one place. Measured: at 18 degrees of tilt
   with a lighting gradient over it, exactly one cell of 2112 came back wrong
   -- one copy refused the sheet, three read it. */
function shPacket(names){
  var body = shUtf8(names.join('\n')), n = body.length, sum = shSum(body);
  return String.fromCharCode(n >> 8, n & 255, sum >> 8, sum & 255) + body;
}
function shPack(names){
  var all = shPacket(names), out = [], i, j, v;
  if (all.length * 8 > SH_BITS) return null;
  while (out.length < SH_BITS){
    for (i = 0; i < all.length && out.length < SH_BITS; i++){
      v = all.charCodeAt(i);
      for (j = 7; j >= 0 && out.length < SH_BITS; j--) out.push((v >> j) & 1);
    }
  }
  return out;
}
/* and back. Null when NO copy checks out -- never a guess, never a repair
   somebody did not ask for. */
function shUnpack(bits){
  var by = [], i, j, v, at, one;
  for (i = 0; i + 7 < bits.length; i += 8){
    v = 0;
    for (j = 0; j < 8; j++) v = (v << 1) | (bits[i + j] ? 1 : 0);
    by.push(String.fromCharCode(v));
  }
  var s = by.join('');
  for (at = 0; at + 4 <= s.length; ){
    one = shOne(s, at);
    if (one.names) return one.names;
    if (!one.len) return null;              /* a length nothing could believe */
    at += 4 + one.len;
  }
  return null;
}
/* One copy of the packet, starting at `at`. Answers the names when it checks
   out, and how long it claimed to be either way, so the next copy can be
   found even when this one did not read. */
function shOne(s, at){
  var n = (s.charCodeAt(at) << 8) | s.charCodeAt(at + 1);
  var sum = (s.charCodeAt(at + 2) << 8) | s.charCodeAt(at + 3);
  if (n <= 0 || at + 4 + n > s.length) return { len: 0 };
  var body = s.slice(at + 4, at + 4 + n);
  if (shSum(body) !== sum) return { len: n };
  var txt = shUnUtf8(body);
  if (txt === null) return { len: n };
  return { len: n, names: txt.split('\n') };
}

/* ---- the file ---------------------------------------------------------- */
function shPageOps(from, count, pics, bits, page, pages){
  var o = [], i, b, p, wide, x, y, at;
  /* the four marks */
  o.push('0 g');
  shMarks().forEach(function(m){
    o.push(shNum(m[0] - SH_MARK/2) + ' ' + shNum(m[1] - SH_MARK/2) + ' ' +
           SH_MARK + ' ' + SH_MARK + ' re f');
  });
  o.push('BT /F1 8 Tf 0.55 g ' + shNum(SH_INSET + SH_MARK + 10) + ' ' + shNum(SH_H - 30) +
         ' Td (Lingua  ' + (page + 1) + '/' + pages + ') Tj ET');
  for (i = 0; i < count; i++){
    b = shBoxAt(from + i);
    p = pics[i];
    /* The name goes OVER the box and nowhere else.
       It was also printed faintly inside, large, as something to trace --
       copied from Calligraphr, where it is right: there you are collecting
       somebody's handwriting of a letter that already exists, so a shape to
       trace is the whole point. Here it is backwards. Somebody drawing their
       own script for the word 水 would find 水 waiting in the box and trace
       the Japanese one. 「四角の中に文字入ってない？それ。水とか」
       The box stays empty. What it is called is written above it, which says
       which box this is without saying what to draw in it. */
    /* SH_LABEL tall, sat SH_LABEL_UP above its own box -- and the two together
       have to fit inside SH_GAPY, or the name of one box climbs into the box
       ABOVE it. It did: 6 + 20 against a gap of 22, so `mountain` was printed
       four points inside 愛's square. Nothing throws; somebody just finds
       another language's word sitting in the box they are about to draw in.
       There is an assertion below rather than a comment saying to be careful. */
    if (p && p.w && p.h){
      wide = SH_LABEL * p.w / p.h;
      if (wide > SH_BOX){ wide = SH_BOX; }
      o.push('q ' + shNum(wide) + ' 0 0 ' + shNum(SH_LABEL) + ' ' + shNum(b.x) + ' ' +
             shNum(b.y + SH_BOX + SH_LABEL_UP) + ' cm /Im' + i + ' Do Q');
    }
    o.push('0.82 G 0.5 w ' + shNum(b.x) + ' ' + shNum(b.y) + ' ' +
           SH_BOX + ' ' + SH_BOX + ' re S');
    /* the lattice, as squares rather than circles -- 441 dots a box and twenty
       boxes, so the cheap operator is the right one */
    o.push(shNum(SH_DOT_GREY) + ' g');
    var lin = SH_LAT_INSET / 800 * SH_BOX, lst = (SH_BOX - 2 * lin) / (SH_LAT_N - 1), lx, ly;
    for (ly = 0; ly < SH_LAT_N; ly++) for (lx = 0; lx < SH_LAT_N; lx++){
      o.push(shNum(b.x + lin + lx * lst - SH_DOT / 2) + ' ' +
             shNum(b.y + lin + ly * lst - SH_DOT / 2) + ' ' +
             shNum(SH_DOT) + ' ' + shNum(SH_DOT) + ' re f');
    }
    o.push('0 g');
  }
  /* the strip */
  o.push('0 g');
  for (y = 0; y < SH_CH; y++) for (x = 0; x < SH_CW; x++){
    if (!bits[y * SH_CW + x]) continue;
    at = shCellAt(x, y);
    o.push(shNum(at[0]) + ' ' + shNum(at[1]) + ' ' + shNum(SH_CELL) + ' ' +
           shNum(SH_CELL) + ' re f');
  }
  return o.join('\n');
}

function shSheet(names, pics){
  var n = names.length, per = shPerPage();
  var pages = Math.max(1, Math.ceil(n / per));
  var obj = [], i, j, kids = [], body, cid, pid, ims, count, mine, bits;
  function add(s){ obj.push(s); return obj.length; }
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  var gid = add('<< /Type /ExtGState /ca 0.14 >>');     /* the faint guide */
  for (i = 0; i < pages; i++){
    count = Math.min(per, n - i * per);
    bits = shPack(names.slice(i * per, i * per + count));
    if (!bits) return null;                              /* too long: refuse */
    mine = []; ims = [];
    for (j = 0; j < count; j++){
      var p = pics[i * per + j] || null;
      mine.push(p);
      if (p && p.w && p.h){
        ims.push('/Im' + j + ' ' + add('<< /Type /XObject /Subtype /Image /Width ' +
          p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceGray /BitsPerComponent 8' +
          ' /Length ' + p.gray.length + ' >>\nstream\n' + p.gray + '\nendstream') + ' 0 R');
      }
    }
    body = shPageOps(i * per, count, mine, bits, i, pages);
    cid = add('<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream');
    pid = add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + shNum(SH_W) + ' ' +
              shNum(SH_H) + '] /Resources << /Font << /F1 3 0 R >> /ExtGState << /G1 ' +
              gid + ' 0 R >>' + (ims.length ? ' /XObject << ' + ims.join(' ') + ' >>' : '') +
              ' >> /Contents ' + cid + ' 0 R >>');
    kids.push(pid + ' 0 R');
  }
  obj[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages + ' >>';
  var out = '%PDF-1.4\n', off = [], s;
  for (i = 0; i < obj.length; i++){
    off.push(out.length);
    out += (i + 1) + ' 0 obj\n' + obj[i] + '\nendobj\n';
  }
  var xref = out.length;
  out += 'xref\n0 ' + (obj.length + 1) + '\n0000000000 65535 f \n';
  for (i = 0; i < off.length; i++){
    s = '0000000000' + off[i];
    out += s.slice(s.length - 10) + ' 00000 n \n';
  }
  out += 'trailer\n<< /Size ' + (obj.length + 1) + ' /Root 1 0 R >>\nstartxref\n' +
         xref + '\n%%EOF\n';
  return out;
}

/* ---- reading a page back ----------------------------------------------- */
/* The transform from the four marks. A photograph of a flat page is a
   perspective map, so this is the eight-unknown one and not an affine: three
   points would only ever give a parallelogram.
   `found` is the four mark centres in the picture, in the order shMarks()
   gives them. Returns a function from PAGE points to picture pixels. */
function shWarp(found){
  var src = shMarks(), A = [], b = [], i, j, k;
  for (i = 0; i < 4; i++){
    var X = src[i][0], Y = src[i][1], u = found[i][0], v = found[i][1];
    A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y]); b.push(u);
    A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y]); b.push(v);
  }
  /* Gauss with partial pivoting; eight equations, eight unknowns. */
  for (i = 0; i < 8; i++){
    var p = i;
    for (j = i + 1; j < 8; j++) if (Math.abs(A[j][i]) > Math.abs(A[p][i])) p = j;
    var t = A[i]; A[i] = A[p]; A[p] = t;
    var tb = b[i]; b[i] = b[p]; b[p] = tb;
    if (Math.abs(A[i][i]) < 1e-12) return null;
    for (j = i + 1; j < 8; j++){
      var f = A[j][i] / A[i][i];
      for (k = i; k < 8; k++) A[j][k] -= f * A[i][k];
      b[j] -= f * b[i];
    }
  }
  var h = [];
  for (i = 7; i >= 0; i--){
    var sum = b[i];
    for (j = i + 1; j < 8; j++) sum -= A[i][j] * h[j];
    h[i] = sum / A[i][i];
  }
  return function(X, Y){
    var w = h[6] * X + h[7] * Y + 1;
    return [(h[0] * X + h[1] * Y + h[2]) / w, (h[3] * X + h[4] * Y + h[5]) / w];
  };
}
/* Read the strip. `dark(px,py)` says whether the picture is dark there.
   Five points per cell and a majority, not the middle one: a cell is about
   sixteen pixels across at 260dpi, and one pixel of it is a dust speck away
   from being the answer. Watched at 18 degrees of tilt -- one point refused
   the sheet, five read it. */
function shReadStrip(warp, dark){
  var bits = [], x, y, at, q, k, n, d = SH_CELL / 4;
  var off = [[0, 0], [-d, 0], [d, 0], [0, -d], [0, d]];
  for (y = 0; y < SH_CH; y++) for (x = 0; x < SH_CW; x++){
    at = shCellAt(x, y);
    n = 0;
    for (k = 0; k < off.length; k++){
      q = warp(at[0] + SH_CELL / 2 + off[k][0], at[1] + SH_CELL / 2 + off[k][1]);
      if (dark(q[0], q[1])) n++;
    }
    bits[y * SH_CW + x] = n >= 3 ? 1 : 0;
  }
  return shUnpack(bits);
}

/* ---- a PDF that came back ---------------------------------------------- */
/* A scanner does not hand back a photograph, it hands back a PDF: iOS Notes,
   Adobe Scan and every flatbed do. Inside one, the page IS a photograph --
   one JPEG per page, stored byte for byte, because /DCTDecode means "these
   bytes are already a JPEG". So the picture comes out without rendering
   anything, and this file needs no PDF renderer to read a scanned sheet.

   `bytes` is a byte string, one character per byte. It answers the LARGEST
   JPEG in the file, or null. Largest and not first: a PDF often carries a
   small preview of its own page beside the page, and taking that one instead
   gives a picture where a corner mark is eight pixels across -- which does not
   fail, it reads the sheet badly.

   What it cannot do is a PDF whose ink was DRAWN rather than photographed --
   somebody who wrote on the sheet on a screen. That is a renderer, and the
   phone has one (PDFKit, native) while this file does not. shPdfWhy() says
   which of the two arrived so the app can say which, instead of "could not
   read this file". */
function shPdfJpeg(bytes){
  var best = null, at = 0, s, e, d, end, one;
  while (true){
    at = bytes.indexOf('/DCTDecode', at);
    if (at < 0) break;
    at += 10;
    s = bytes.indexOf('stream', at);
    if (s < 0) break;
    e = bytes.indexOf('endstream', s);
    if (e < 0) break;
    /* Read between the JPEG's own markers rather than trusting /Length, which
       is very often an indirect reference this file would have to resolve a
       cross-reference table to follow. SOI is FF D8 FF and EOI is FF D9. */
    d = bytes.indexOf('\xff\xd8\xff', s);
    if (d >= 0 && d < e){
      end = bytes.lastIndexOf('\xff\xd9', e);
      if (end > d){
        one = bytes.slice(d, end + 2);
        if (!best || one.length > best.length) best = one;
      }
    }
    at = e;
  }
  return best;
}
/* Which kind of file arrived. Four answers and they are four different
   sentences to a person, which is the whole reason this is not a boolean. */
function shPdfWhy(bytes){
  if (bytes.slice(0, 5) !== '%PDF-') return 'not-pdf';
  if (bytes.indexOf('/DCTDecode') >= 0) return 'photo';
  if (bytes.indexOf('/Subtype /Image') >= 0 ||
      bytes.indexOf('/Subtype/Image') >= 0) return 'packed';
  return 'drawn';
}

/* ---- what somebody drew in a box --------------------------------------- */
/* The ink inside box i, as a mask in the app's own 800 square.
   `ink(px,py)` says whether the picture is ink at that pixel; `warp` is the
   one shWarp() built from the four marks. Sampled at `res` across, because
   the app's square is 800 and a photograph of a 37mm box is nowhere near that
   many pixels -- asking for 800 would be inventing detail. */
function shBoxInk(warp, ink, i, res){
  var b = shBoxAt(i), m = [], x, y, q, u, v;
  for (y = 0; y < res; y++) for (x = 0; x < res; x++){
    /* the middle of this cell of the box, in PDF points. The box's y runs UP
       and the app's square runs DOWN, so it is flipped here and once only. */
    u = b.x + (x + 0.5) / res * b.side;
    v = b.y + b.side - (y + 0.5) / res * b.side;
    q = warp(u, v);
    m[y * res + x] = ink(q[0], q[1]) ? 1 : 0;
  }
  return m;
}
/* Dust, and the box's own printed edge.
   Two different things and both have to go. A speck is a small island; the
   printed edge is a line that hugs the border, and it is not always dropped by
   the threshold -- a photograph taken at an angle darkens one side of a page,
   and the edge on that side can come through. So: forget a margin of the box,
   then drop every island smaller than `least`.
   The margin is FORGOTTEN and not used as a reason to drop what touches it.
   It read "an island that reaches the border is the printed box" once, and the
   first real sheet somebody wrote on had a letter whose stroke ran out past the
   edge of its square -- one island, touching, so the whole letter went. 3998
   pixels found and 3998 thrown away, which reads on the table as a box drawn in
   and lost rather than a box left empty. The printed edge is at a place we
   know, because this file drew it; where a stroke happens to end is not.
   It returns what it kept AND what it threw away, because "the box was empty"
   and "the box was nothing but dust" have to be tellable apart. */
function shClean(m, res, least, edge){
  var lab = [], i, x, y, w = [], out = [], parts = [], q, hd, id, keep = 0, drop = 0;
  for (i = 0; i < res * res; i++){ lab[i] = -1; out[i] = 0; w[i] = m[i]; }
  /* the margin, forgotten. A stroke that crosses it is shortened by this much
     and no more; the printed edge lives entirely inside it. */
  for (y = 0; y < res; y++) for (x = 0; x < res; x++)
    if (x < edge || y < edge || x >= res - edge || y >= res - edge){
      if (w[y * res + x]) drop++;
      w[y * res + x] = 0;
    }
  for (y = 0; y < res; y++) for (x = 0; x < res; x++){
    if (!w[y * res + x] || lab[y * res + x] >= 0) continue;
    id = parts.length; q = [y * res + x]; lab[y * res + x] = id;
    hd = 0; var cells = [];
    while (hd < q.length){
      var p = q[hd++], py = Math.floor(p / res), px = p % res;
      cells.push(p);
      if (px + 1 < res && w[p + 1] && lab[p + 1] < 0){ lab[p + 1] = id; q.push(p + 1); }
      if (px > 0 && w[p - 1] && lab[p - 1] < 0){ lab[p - 1] = id; q.push(p - 1); }
      if (py + 1 < res && w[p + res] && lab[p + res] < 0){ lab[p + res] = id; q.push(p + res); }
      if (py > 0 && w[p - res] && lab[p - res] < 0){ lab[p - res] = id; q.push(p - res); }
    }
    parts.push(cells);
  }
  for (i = 0; i < parts.length; i++){
    if (parts[i].length < least){ drop += parts[i].length; continue; }
    keep += parts[i].length;
    for (var j = 0; j < parts[i].length; j++) out[parts[i][j]] = 1;
  }
  return { m: out, kept: keep, dropped: drop };
}

/* The name over a box may not reach the box above it. Checked here rather than
   remembered: it was wrong once, by four points, and what it produced was
   another language's word printed inside a square somebody was about to draw
   their own letter in. */
function shSane(){
  return (SH_LABEL + SH_LABEL_UP < SH_GAPY) &&
         (shCellAt(0, 0)[1] + SH_CELL < shBoxAt(shPerPage() - 1).y);
}

/* ---- looking at a photograph ------------------------------------------- */
/* Everything between "here are the pixels somebody sent" and "here is where
   the page is". `px` is RGBA, `W` x `H`.
   Returns { warp, dark, marks } or { fail }.

   Two windows, not one threshold. A fixed one does not survive a whole page:
   a lighting gradient takes the dark side of the paper under it and the sheet
   comes back black. A local one alone turns every noise pixel into ink --
   378,648 islands on a page that has about 170. So: a small window to smooth,
   a large one for the background, and ink where the small one is darker than
   0.85 of the large one. Both numbers were watched failing. */
function shScan(px, W, H){
  var i, x, y, ii = new Float64Array((W + 1) * (W ? (H + 1) : 1)), run;
  var gray = new Uint8Array(W * H);
  for (i = 0; i < W * H; i++) gray[i] = px[i * 4];
  for (y = 0; y < H; y++){
    run = 0;
    for (x = 0; x < W; x++){ run += gray[y * W + x];
      ii[(y + 1) * (W + 1) + (x + 1)] = ii[y * (W + 1) + (x + 1)] + run; }
  }
  function mean(cx, cy, r){
    var a = cx - r < 0 ? 0 : cx - r, b = cy - r < 0 ? 0 : cy - r;
    var c = cx + r > W - 1 ? W - 1 : cx + r, d = cy + r > H - 1 ? H - 1 : cy + r;
    return (ii[(d + 1) * (W + 1) + (c + 1)] - ii[b * (W + 1) + (c + 1)] -
            ii[(d + 1) * (W + 1) + a] + ii[b * (W + 1) + a]) / ((c - a + 1) * (d - b + 1));
  }
  /* the small window is a third of a strip cell, so a cell never blurs into
     its neighbour; the large one is a fourteenth of the picture */
  var SM = Math.round(W / 595.276 * SH_CELL / 3);
  if (SM < 1) SM = 1;
  var BG = Math.round(W / 14);
  /* The background is asked on a coarse grid and read between the answers.
     It is a fourteenth of the picture wide, so it does not change from one
     pixel to the next, and asking it seven million times was most of the
     minute this used to take. */
  var STEP = BG > 8 ? (BG >> 3) : 1;
  var GW = Math.ceil(W / STEP) + 1, GH = Math.ceil(H / STEP) + 1, bg = new Float64Array(GW * GH);
  for (y = 0; y < GH; y++) for (x = 0; x < GW; x++)
    bg[y * GW + x] = mean(x * STEP < W ? x * STEP : W - 1, y * STEP < H ? y * STEP : H - 1, BG);
  var m = new Uint8Array(W * H);
  for (y = 0; y < H; y++) for (x = 0; x < W; x++)
    m[y * W + x] = mean(x, y, SM) < bg[((y / STEP) | 0) * GW + ((x / STEP) | 0)] * 0.85 ? 1 : 0;
  /* the four marks: the squarest, best-sized island nearest each corner */
  var lab = new Int32Array(W * H), q = new Int32Array(W * H), blobs = [], k;
  for (i = 0; i < W * H; i++) lab[i] = -1;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++){
    if (!m[y * W + x] || lab[y * W + x] >= 0) continue;
    var id = blobs.length, hd = 0, tl = 0, sx = 0, sy = 0, n = 0;
    var ax = x, bx = x, ay = y, by = y;
    q[tl++] = y * W + x; lab[y * W + x] = id;
    while (hd < tl){
      var p = q[hd++], py = (p - (p % W)) / W, pxx = p % W;
      sx += pxx; sy += py; n++;
      if (pxx < ax) ax = pxx; if (pxx > bx) bx = pxx;
      if (py < ay) ay = py; if (py > by) by = py;
      if (pxx + 1 < W && m[p + 1] && lab[p + 1] < 0){ lab[p + 1] = id; q[tl++] = p + 1; }
      if (pxx > 0 && m[p - 1] && lab[p - 1] < 0){ lab[p - 1] = id; q[tl++] = p - 1; }
      if (py + 1 < H && m[p + W] && lab[p + W] < 0){ lab[p + W] = id; q[tl++] = p + W; }
      if (py > 0 && m[p - W] && lab[p - W] < 0){ lab[p - W] = id; q[tl++] = p - W; }
    }
    blobs.push({ cx: sx / n, cy: sy / n, n: n, w: bx - ax + 1, h: by - ay + 1 });
  }
  var want = W / SH_W * SH_MARK, cand = [], u;
  for (i = 0; i < blobs.length; i++){
    u = blobs[i];
    if (u.w > want * 0.5 && u.w < want * 2 && u.h > want * 0.5 && u.h < want * 2 &&
        Math.abs(u.w - u.h) < want * 0.5 && u.n > want * want * 0.5) cand.push(u);
  }
  var corners = [[0, 0], [W, 0], [W, H], [0, H]], found = [], j;
  for (k = 0; k < 4; k++){
    var best = null, bd = Infinity;
    for (j = 0; j < cand.length; j++){
      var dx = cand[j].cx - corners[k][0], dy = cand[j].cy - corners[k][1], D = dx * dx + dy * dy;
      if (D < bd){ bd = D; best = cand[j]; }
    }
    if (!best) return { fail: 'marks', cand: cand.length };
    found.push([best.cx, best.cy]);
  }
  /* the same island twice means three marks were in the picture, not four */
  for (k = 0; k < 4; k++) for (j = k + 1; j < 4; j++)
    if (found[k][0] === found[j][0] && found[k][1] === found[j][1])
      return { fail: 'marks', cand: cand.length };
  var warp = shWarp(found);
  if (!warp) return { fail: 'warp' };
  return { warp: warp, marks: found, ink: m, w: W, h: H,
           dark: function(qx, qy){
             var xi = Math.round(qx), yi = Math.round(qy);
             return xi >= 0 && yi >= 0 && xi < W && yi < H && m[yi * W + xi] === 1;
           } };
}

/* ---- ink into an outline ----------------------------------------------- */
/* Every boundary of the mask, outer rings and the insides of holes alike.
   A pictogram is full of holes -- a circle, a face -- and a hole is what
   separates a letter from a blot, so they are all kept.

   The boundary is followed along the CRACKS BETWEEN PIXELS, not along the
   pixels themselves, and that is not a detail: a walk over pixels can leave
   the loop it started and never come back, and the first version did. It ran
   to its guard of res*res*4 every time, handed 160,000-point loops to the
   thinner, and the thinner is O(n^2). Nothing threw; the page simply never
   came back. A crack walk closes by construction -- every crack is entered
   from one side and left on the other, so there is nowhere else to end up. */
function shTrace(m, res){
  function ink(x, y){ return x >= 0 && y >= 0 && x < res && y < res && m[y * res + x] === 1; }
  var DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  /* the pixels either side of the crack that leaves corner (cx,cy) in
     direction d. Ink is kept on the right all the way round. */
  function side(cx, cy, d, right){
    if (d === 0) return right ? [cx, cy] : [cx, cy - 1];
    if (d === 1) return right ? [cx - 1, cy] : [cx, cy];
    if (d === 2) return right ? [cx - 1, cy - 1] : [cx - 1, cy];
    return right ? [cx, cy - 1] : [cx - 1, cy - 1];
  }
  var used = new Uint8Array((res + 1) * (res + 1) * 4), loops = [], x, y, t;
  for (y = 0; y <= res; y++) for (x = 0; x <= res; x++){
    if (!(ink(x, y) && !ink(x, y - 1))) continue;          /* a crack going right */
    if (used[(y * (res + 1) + x) * 4]) continue;
    var loop = [], cx = x, cy = y, d = 0, guard = 0, nd, dd, L, R;
    while (guard++ < (res + 1) * (res + 1) * 4){
      loop.push([cx, cy]);
      used[(cy * (res + 1) + cx) * 4 + d] = 1;
      cx += DX[d]; cy += DY[d];
      if (cx === x && cy === y && d === 0) break;
      nd = -1;
      for (t = 1; t >= -1; t--){                 /* right turn, straight, left */
        dd = (d + t + 4) % 4;
        R = side(cx, cy, dd, true); L = side(cx, cy, dd, false);
        if (ink(R[0], R[1]) && !ink(L[0], L[1])){ nd = dd; break; }
      }
      if (nd < 0) break;
      d = nd;
      if (used[(cy * (res + 1) + cx) * 4 + d]) break;
    }
    if (loop.length > 7) loops.push(loop);
  }
  return loops;
}
/* Fewer points, same shape. A traced boundary is one point per pixel, and a
   letter is three or four hundred of them per loop; what a font wants is tens.
   Douglas-Peucker, with the tolerance in the same units as the mask. */
function shThin(loop, tol){
  if (loop.length < 4) return loop.slice();
  var keep = [], i, st = [[0, loop.length - 1]];
  for (i = 0; i < loop.length; i++) keep.push(0);
  keep[0] = keep[loop.length - 1] = 1;
  while (st.length){
    var seg = st.pop(), a = seg[0], b = seg[1];
    var A = loop[a], B = loop[b], vx = B[0] - A[0], vy = B[1] - A[1];
    var L = Math.sqrt(vx * vx + vy * vy) || 1, worst = tol, at = -1;
    for (i = a + 1; i < b; i++){
      var d = Math.abs(vx * (A[1] - loop[i][1]) - vy * (A[0] - loop[i][0])) / L;
      if (d > worst){ worst = d; at = i; }
    }
    if (at > 0){ keep[at] = 1; st.push([a, at]); st.push([at, b]); }
  }
  var out = [];
  for (i = 0; i < loop.length; i++) if (keep[i]) out.push(loop[i]);
  return out;
}
