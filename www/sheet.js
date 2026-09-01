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
   tools/sheet-check.mjs is what holds it. */
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
/* How dark the printed edge of a box is. Pale on purpose: the reader forgets a
   margin of the box rather than trusting the threshold to drop this line, and
   a heavy edge is one more thing for a photograph to turn into ink. */
var SH_BOX_GREY = 0.82;
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
/* How wide the name over a box comes out, at SH_LABEL tall. A name wider than
   its own box is squashed to the box rather than allowed to run into its
   neighbour. The ONE place: the file prints the name here and the screen draws
   the same picture in the same spot, and a preview that worked this out again
   would be a second copy of the sheet -- a copy always agrees, so the day a
   box moves the picture would go on showing where it used to be. */
function shLabelW(p){
  var w = SH_LABEL * p.w / p.h;
  return w > SH_BOX ? SH_BOX : w;
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
      wide = shLabelW(p);
      o.push('q ' + shNum(wide) + ' 0 0 ' + shNum(SH_LABEL) + ' ' + shNum(b.x) + ' ' +
             shNum(b.y + SH_BOX + SH_LABEL_UP) + ' cm /Im' + i + ' Do Q');
    }
    o.push(shNum(SH_BOX_GREY) + ' G 0.5 w ' + shNum(b.x) + ' ' + shNum(b.y) + ' ' +
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
   sentences to a person, which is the whole reason this is not a boolean.

   `packed` used to be "there is an image and it is not a JPEG", and that was
   the app's own sheet: the twenty names over the boxes are images. So a
   person who handed back the very file this app had just written was told
   THE PICTURE INSIDE IT COULD NOT BE TAKEN OUT, which is not what happened
   -- there is no picture inside it. Nothing threw and no screen looked
   wrong; the sentence was simply about a different file.

   An image that is not a photograph and an image that cannot be opened are
   two things, and what tells them apart is a FILTER. A page a scanner made
   is always behind one -- DCTDecode, and when it is not a JPEG then Flate,
   JPX or CCITT, none of which this file can undo. What shSheet() writes is
   behind none: raw eight-bit grey, which no scanner has ever produced. */
function shPdfWhy(bytes){
  if (bytes.slice(0, 5) !== '%PDF-') return 'not-pdf';
  if (bytes.indexOf('/DCTDecode') >= 0) return 'photo';
  var at = 0, k, a, b, lo;
  while (true){
    k = shPdfImageAt(bytes, at);
    if (k < 0) break;
    /* the dictionary this /Subtype sits in: back to its `<<`, forward to the
       bytes it introduces. Bounded by the end of whatever stream came before
       it, so a `<<` that is really a pair of bytes inside a picture cannot
       drag the window somewhere else. */
    lo = bytes.lastIndexOf('endstream', k);
    a = bytes.lastIndexOf('<<', k);
    if (a < lo) a = lo;
    if (a < 0) a = k;
    b = bytes.indexOf('stream', k);
    if (b < 0) b = bytes.length;
    if (bytes.slice(a, b).indexOf('/Filter') >= 0) return 'packed';
    at = k + 10;
  }
  return 'drawn';
}
/* Where the next image dictionary says what it is. Written with a space and
   without, because a PDF may do either and both turn up in the wild. */
function shPdfImageAt(bytes, from){
  var a = bytes.indexOf('/Subtype /Image', from);
  var b = bytes.indexOf('/Subtype/Image', from);
  if (a < 0) return b;
  if (b < 0) return a;
  return a < b ? a : b;
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
/* The same box, as the SIGNED field rather than a yes/no -- see shScan's
   `sign`. Sampled the same way and at the same places, so the two line up. */
function shBoxField(warp, sign, i, res){
  var b = shBoxAt(i), f = [], x, y, q, u, v;
  for (y = 0; y < res; y++) for (x = 0; x < res; x++){
    u = b.x + (x + 0.5) / res * b.side;
    v = b.y + b.side - (y + 0.5) / res * b.side;
    q = warp(u, v);
    f[y * res + x] = sign(q[0], q[1]);
  }
  return f;
}
/* The edge, where the field crosses zero. Marching squares with the crossing
   placed BETWEEN two samples rather than at one of them, which is the whole
   point: a boundary that follows pixel corners is a staircase, and it is a
   staircase the person did not draw. Every crossing sits on one edge of the
   sample grid and each such edge is crossed at most once, so a segment's end is
   named by which edge it is on -- and stitching the segments into rings is then
   exact rather than a search by distance. Rings close by construction, the same
   property crack-following had and for the same reason.
   `drop` is the yes/no mask of what to KEEP (dust and the printed box edge
   already thrown out); ink outside it is pushed far negative so no edge is
   found around it. */
function shEdge(f, res, keep){
  var n = res, i, x, y, g = [], seg = [], at = {}, id;
  for (i = 0; i < n * n; i++) g[i] = (keep && !keep[i] && f[i] > 0) ? -1000 : f[i];
  function pt(ax, ay, bx, by){
    var fa = g[ay * n + ax], fb = g[by * n + bx];
    var t = fa / (fa - fb);
    if (!(t >= 0)) t = 0; if (t > 1) t = 1;
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  }
  function H(x2, y2){ return 2 * (y2 * n + x2); }        /* (x,y)-(x+1,y) */
  function V(x2, y2){ return 2 * (y2 * n + x2) + 1; }    /* (x,y)-(x,y+1) */
  function need(k, ax, ay, bx, by){
    if (at[k] === undefined) at[k] = pt(ax, ay, bx, by);
    return k;
  }
  /* Every segment is emitted so the INK is on one fixed side of the walk. That
     is not tidiness: it is what makes an outer ring and the ring of a hole come
     out wound opposite ways, and a hole that is wound the same way as its
     letter is a hole that fills in. Nothing about it throws -- the canvas is
     filled even-odd here and drew the holes correctly with five of the sixteen
     cases reversed, and the fault only appears where a winding is actually
     read. `wound()` in otf5.js forces one winding, so a font built from these
     would have had every hole solid: the ring of 火, the eye of a face.
     Found by adding the signed areas of one letter's rings and getting the
     outer PLUS the hole rather than the outer minus it. */
  for (y = 0; y < n - 1; y++) for (x = 0; x < n - 1; x++){
    var a = g[y * n + x] > 0, b = g[y * n + x + 1] > 0;
    var c = g[(y + 1) * n + x + 1] > 0, d = g[(y + 1) * n + x] > 0;
    var code = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
    if (code === 0 || code === 15) continue;
    var T = function(){ return need(H(x, y), x, y, x + 1, y); };
    var R = function(){ return need(V(x + 1, y), x + 1, y, x + 1, y + 1); };
    var B = function(){ return need(H(x, y + 1), x, y + 1, x + 1, y + 1); };
    var L = function(){ return need(V(x, y), x, y, x, y + 1); };
    var mid, join;
    switch (code){
      case 1:  seg.push([L(), T()]); break;
      case 2:  seg.push([T(), R()]); break;
      case 3:  seg.push([L(), R()]); break;
      case 4:  seg.push([R(), B()]); break;
      case 6:  seg.push([T(), B()]); break;
      case 7:  seg.push([L(), B()]); break;
      case 8:  seg.push([B(), L()]); break;
      case 9:  seg.push([B(), T()]); break;
      case 11: seg.push([B(), R()]); break;
      case 12: seg.push([R(), L()]); break;
      case 13: seg.push([R(), T()]); break;
      case 14: seg.push([T(), L()]); break;
      /* the two the four corners do not settle: opposite corners are ink and
         the other two are not, so the middle decides whether they are one thing
         or two. Asked of the middle rather than picked, which is what turns a
         cross-stroke into two shapes that touch nowhere. */
      case 5:
        mid = (g[y*n+x] + g[y*n+x+1] + g[(y+1)*n+x+1] + g[(y+1)*n+x]) / 4;
        if (mid > 0){ seg.push([R(), T()]); seg.push([L(), B()]); }
        else { seg.push([L(), T()]); seg.push([R(), B()]); }
        break;
      case 10:
        mid = (g[y*n+x] + g[y*n+x+1] + g[(y+1)*n+x+1] + g[(y+1)*n+x]) / 4;
        if (mid > 0){ seg.push([T(), L()]); seg.push([B(), R()]); }
        else { seg.push([T(), R()]); seg.push([B(), L()]); }
        break;
    }
  }
  /* stitch: every crossing belongs to at most two segments */
  var nb = {}, k, sA, sB;
  for (i = 0; i < seg.length; i++){
    sA = seg[i][0]; sB = seg[i][1];
    if (!nb[sA]) nb[sA] = []; nb[sA].push(i);
    if (!nb[sB]) nb[sB] = []; nb[sB].push(i);
  }
  var used = [], loops = [];
  for (i = 0; i < seg.length; i++) used[i] = false;
  for (i = 0; i < seg.length; i++){
    if (used[i]) continue;
    var ring = [], cur = i, from = seg[i][0], guard = 0;
    while (cur >= 0 && !used[cur] && guard++ < seg.length + 4){
      used[cur] = true;
      var to = seg[cur][0] === from ? seg[cur][1] : seg[cur][0];
      ring.push(at[from]);
      var list = nb[to] || [], nx = -1;
      for (k = 0; k < list.length; k++) if (!used[list[k]]){ nx = list[k]; break; }
      from = to; cur = nx;
    }
    if (ring.length >= 3) loops.push(ring);
  }
  return loops;
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

/* `shTrace` and `shSane` were here and are in git.

   shTrace followed the boundary along the cracks between pixels of a yes/no
   mask. shEdge above replaced it: the same closes-by-construction property,
   with the crossing placed BETWEEN two samples instead of at a pixel corner,
   which is the difference between 440 points of staircase and 122 points of
   the letter. Nothing anywhere called it any more -- not the app, not
   tools/sheet-spike/read.mjs.

   shSane answered one claim about the page: that the name printed over a box
   cannot reach the box above it, and that the strip clears the bottom row. It
   was true and it was worth holding -- it was wrong once, by four points, and
   what it produced was a word printed inside a square somebody was about to
   draw their own letter in. It is held by tools/sheet-check.mjs now, which
   runs in the gate, rather than by a function in www/ that only a spike tool
   in tools/ ever named. */

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
  /* A SECOND answer, and it is for a different job.
     `m` above smooths with a box MEAN and then calls a pixel ink when it is
     15% darker than the paper around it. Both halves of that are right for
     finding four square marks and reading a strip of cells, and both are wrong
     for cutting out a letter.
     A mean MOVES AN EDGE: a white pixel SM away from a black stroke has its
     mean dragged down, so every stroke comes back SM pixels fatter on each
     side. And 0.85 of white paper is 217, which is very nearly white -- so the
     soft ramp at the side of a stroke, which a camera and a resize both make,
     counts as ink for most of its width. Measured against the drawn widths on
     the first real sheet: the strokes came back between 81% and 96% heavier
     than they were drawn.
     「なんか俺が送ったやつ文字の太さが違うなまちまちになってる」
     And the second word of that is the sharper half. Both faults add a roughly
     fixed number of PIXELS, so a thin stroke gains a far bigger share of itself
     than a thick one: a hand that varies comes back flattened, which is what a
     person sees before they see the weight.
     So, two changes and each is one half of it. A MEDIAN throws away the same
     grain a mean does and leaves the edge where it is -- that is the whole
     difference between them. And the edge goes at the MIDPOINT between this
     paper and the darkest ink near here, rather than at a fixed fraction of the
     paper. Where there is no ink near here, paper and darkest are the same and
     nothing is ink, so a blank box stays blank; the 15% is kept, as the floor
     that says whether there is any ink to find at all. That floor is what
     decides whether a pencil is seen, and it has not moved. */
  var gm = new Uint8Array(W * H);
  var v9 = new Uint8Array(9);
  for (y = 0; y < H; y++) for (x = 0; x < W; x++){
    var dx, dy, xi, yi, a9, b9, t9, c9 = 0;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++){
      xi = x + dx; yi = y + dy;
      if (xi < 0) xi = 0; if (yi < 0) yi = 0;
      if (xi > W - 1) xi = W - 1; if (yi > H - 1) yi = H - 1;
      v9[c9++] = gray[yi * W + xi];
    }
    for (a9 = 1; a9 < 9; a9++){
      t9 = v9[a9];
      for (b9 = a9 - 1; b9 >= 0 && v9[b9] > t9; b9--) v9[b9 + 1] = v9[b9];
      v9[b9 + 1] = t9;
    }
    gm[y * W + x] = v9[4];
  }
  /* the darkest thing within LO, off the median picture so one bad pixel
     cannot drag it. Separable: along, then down. */
  var LO = SM * 2 + 1;
  var lo = new Uint8Array(W * H), tmp = new Uint8Array(W * H), a2, b2, mn, u;
  for (y = 0; y < H; y++) for (x = 0; x < W; x++){
    a2 = x - LO < 0 ? 0 : x - LO; b2 = x + LO > W - 1 ? W - 1 : x + LO;
    mn = 255;
    for (u = a2; u <= b2; u++){ if (gm[y * W + u] < mn) mn = gm[y * W + u]; }
    tmp[y * W + x] = mn;
  }
  for (y = 0; y < H; y++) for (x = 0; x < W; x++){
    a2 = y - LO < 0 ? 0 : y - LO; b2 = y + LO > H - 1 ? H - 1 : y + LO;
    mn = 255;
    for (u = a2; u <= b2; u++){ if (tmp[u * W + x] < mn) mn = tmp[u * W + x]; }
    lo[y * W + x] = mn;
  }
  function crisp(pxx, pyy){
    var xi = Math.round(pxx), yi = Math.round(pyy);
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) return false;
    var b = bg[((yi / STEP) | 0) * GW + ((xi / STEP) | 0)];
    var l = lo[yi * W + xi];
    if (b - l < b * 0.15) return false;         /* paper, and nothing else */
    return gm[yi * W + xi] < (b + l) / 2;
  }
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
  /* `dark` finds marks and reads the strip; `crisp` cuts letters out. Two
     jobs, two answers -- see where crisp is built for why they differ. */
  /* How far INSIDE the ink this pixel is, as a number rather than a yes/no.
     Positive is ink, negative is paper, and zero is where the edge actually
     runs. The edge of a stroke in a photograph is not a step -- it is a ramp
     several pixels wide, and `crisp` above answers a question about it with one
     bit, which throws the ramp away. The ramp is where the edge IS; keeping it
     is the difference between a letter's outline and a staircase of pixel
     corners. Anywhere there is no ink at all this answers far negative, so no
     edge can be found in blank paper. */
  function sign(pxx, pyy){
    var xi = Math.round(pxx), yi = Math.round(pyy);
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) return -1000;
    var b = bg[((yi / STEP) | 0) * GW + ((xi / STEP) | 0)];
    var l = lo[yi * W + xi];
    if (b - l < b * 0.15) return -1000;
    return (b + l) / 2 - gm[yi * W + xi];
  }
  return { warp: warp, marks: found, ink: m, w: W, h: H, crisp: crisp, sign: sign,
           dark: function(qx, qy){
             var xi = Math.round(qx), yi = Math.round(qy);
             return xi >= 0 && yi >= 0 && xi < W && yi < H && m[yi * W + xi] === 1;
           } };
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

/* ======================================================================
   26. the sheet, in the app
   ======================================================================
   Everything above this line knows nothing about Lingua: names in, PDF bytes
   out; a page of samples in, names and shapes out. Everything below it is the
   app -- the screens, and the moment a drawing becomes a letter. The same line
   www/import.js has, for the same reason, and it is load-bearing twice over:
   tools/sheet-spike/*.mjs eval THIS FILE bare, with no app around it, so
   nothing at the top level below here may name an app global without asking
   whether it is there first. A `FORM_OPEN.write = ...` sitting at column zero
   would take the whole spike down with a ReferenceError.

   What a person does with it:

     the room      what this chapter is: make one, or read one back
     make          type the names, get a PDF
     read          hand a photograph or a scan back, and see what came off it

   Three pages and not one screen with three jobs on it. Each is openForm(),
   which is a page you went to and not a sheet that slid up over where you
   were -- www/home.js's openForm comment is the whole argument.

   Nothing is redrawn. OWNER DECISION 2026-08-25:
   「画像データをそのまま取り込みたいのよ」
   「取り込んだやつを上から描き直してるからそうなるんでしょ？」
   The ink that comes off a box is put on the letter as it came -- it does not
   go through the app's pen, its width, or its lattice. */

/* Where the chapter is standing. Not the language's -- it is where you are in
   it, so shell.js's viewReset() drops it, exactly as it drops IMP. */
var SH = null;
function shBlank(){ return {names:'', got:null, why:'', from:''}; }
function shState(){ if(!SH) SH = shBlank(); return SH; }

/* The typed string -> the names, in order. Commas, and nothing else is a
   separator: a name is whatever somebody put between two of them, so a space
   is part of it and 7, 2, 25 is three names and not six.
   A trailing comma is somebody still typing and is not an empty box.
   Duplicates are kept -- `a,a,a` is three boxes, and that is decided:
   this is Pro, and Pro is where a letter may be added at all. */
function shNames(s){
  var xs = String(s || '').split(','), out = [], i, n;
  for(i = 0; i < xs.length; i++){
    n = xs[i].replace(/^\s+|\s+$/g, '');
    if(n) out.push(n);
  }
  return out;
}
/* How many sheets these names come to. Nothing typed is NO sheet, and it used
   to say one: shMake() refuses a sheet with no names on it (t('wr.none')), so
   the line under the field was promising a piece of paper the button would
   not give. It is a count, and a count that is wrong about zero is wrong. */
function shPages(n){ return n > 0 ? Math.ceil(n / shPerPage()) : 0; }

/* ---- the room ---------------------------------------------------------- */
/* The `?` is on THIS page and on neither of the other two.

   One thing is behind it and it is the ORDER -- type, save, print and write,
   scan and install -- so it belongs where the chapter starts, which is the
   only place somebody has not yet chosen which end they are at. On the making
   page and the reading page it was the same four steps a second and a third
   time, opened from a mark that looked like it had something else to say.
   「sheet のページに謎に同じこと書いてる？ある。それぞれのページには
   いらない。」 OWNER 2026-09-01, build 107, on a device.

   It is behind the mark and NOT on the screen: 「アプリ内に説明書くの禁止」,
   and the `?` in the bar is where a genuinely needed explanation goes -- which
   is what the `?` is for. www/home.js's HELP is the one mechanism and this
   registers with it rather than growing a second one.

   HELP is www/home.js's and may not be there at all: tools/sheet-spike/*.mjs
   eval this file with no app around it, and a bare `HELP.wr =` at the top
   level would take the spike down with a ReferenceError. Same guard as
   FORM_OPEN at the foot of this file, and for the same reason. */
if(typeof HELP !== 'undefined'){
  HELP.wr = function(){
    return {t:t('wr.help'), h:
      shStep(1, t('wr.s1'), t('wr.s1.d'))+
      shStep(2, t('wr.s2'), t('wr.s2.d'))+
      shStep(3, t('wr.s3'), t('wr.s3.d'))+
      shStep(4, t('wr.s4'), t('wr.s4.d'))};
  };
}
/* One step: its number, what is done, and the one line that says how. The
   number is written here rather than into the string, so no translation can
   put the steps out of order or lose one. */
function shStep(n, title, body){
  return '<div class="sec">'+n+'. '+esc(title)+'</div>'+
    '<div class="note">'+esc(body)+'</div>';
}
function openWrite(){
  openForm('write:', t('wr.title'), shRoomHTML(), null, shQ());
}
/* The mark, or nothing at all when this file is being run without the app
   around it. helpQ() is www/home.js's. */
function shQ(){ return (typeof helpQ === 'function') ? helpQ('wr') : ''; }
function shRoomHTML(){
  return '<div class="toc">'+
    '<button class="trow"' + DO('openWrOut') + '>'+
      '<span class="rn"></span><span class="rt">'+esc(t('wr.make'))+'</span>'+
      '<span class="lead"></span><span class="rv"></span>'+ICON_GO+'</button>'+
    '<button class="trow"' + DO('openWrIn') + '>'+
      '<span class="rn"></span><span class="rt">'+esc(t('wr.read'))+'</span>'+
      '<span class="lead"></span><span class="rv"></span>'+ICON_GO+'</button>'+
    '</div>';
}

/* ---- making one -------------------------------------------------------- */
function openWrOut(){
  openForm('wrout:', t('wr.make'), shOutHTML(), shPvDraw);
}
/* The count under the field is a count. It says how many boxes twenty names
   make and how many sheets that is, which is the one thing a person cannot
   work out by looking at what they typed. */
function shOutHTML(){
  var s = shState(), n = shNames(s.names).length;
  return '<div class="field"><label>'+esc(t('wr.names'))+'</label>'+
    '<textarea id="wr-names" placeholder="'+esc(t('wr.ph'))+'"' + IN('shTyped') + '>'+
    esc(s.names)+'</textarea></div>'+
    '<div class="mini" id="wr-mini">'+esc(tn('wr.boxes', n))+' · '+esc(tn('wr.pages', shPages(n)))+'</div>'+
    shPvHTML()+
    '<div class="barfix"><button class="btn ghost"' + DO('shMake') + '>'+
    esc(t('wr.out'))+'</button></div>';
}
/* ---- what will come out, before it comes out ----------------------------
   「自分の言語に入れたい文字　例 a,b,c みたいにしてカンマで区切ったら、どんな
   用紙が出てくるかを見せないと。今プレビューこんな感じだよって。」
   OWNER 2026-08-25.

   It is the PAGE, drawn from shBoxAt(), shMarks(), shCellAt(), shPack(),
   shLabelW() and shPic() -- the same six the file itself is written from. A
   preview that worked the layout out again would be a second copy of the
   sheet, and a copy always agrees: the day a box moves, the picture would go
   on showing where it used to be.

   The FIRST page. The line above it already says how many sheets there are,
   which is the one thing a picture of page one cannot say, and a canvas that
   grows with the names is a height nobody has measured on a phone.

   Paper is white in both themes, because it is paper: everything on it is the
   grey or the black the file prints and none of it is a colour of this app's.
   One thing on the page is deliberately not drawn -- the small `Lingua 1/1` at
   its head. Nothing can translate a word painted onto a canvas, so only
   `Lingua` may be painted at all (tools/i18n-check.mjs, PAINTS); it is on the
   paper, and it is not what a person is looking at this for. */
function shPvHTML(){
  return '<canvas id="wr-pv" style="width:100%;display:block;margin-top:14px"></canvas>';
}
function shPvGrey(v){
  var n = Math.round(v * 255);
  return 'rgb(' + n + ',' + n + ',' + n + ')';
}
var SH_PVFIT = 0;
function shPvDraw(){
  var c = document.getElementById('wr-pv'), w, dpr, W, S, H;
  if(!c) return;
  /* Nothing typed is nothing to show. 「打ったらどんな用紙が出てくるかを見せる」
     is the whole of this, and an empty page of white standing on the screen
     before a person has typed anything is not a sheet they are getting -- in
     the dark theme it is a lamp. */
  if(!shNames(shState().names).length){ c.style.display = 'none'; return; }
  c.style.display = 'block';
  w = c.getBoundingClientRect().width || c.offsetWidth || 0;
  /* Measured before the layout exists the answer is zero, and a canvas sized
     from zero shows nothing at all. geMount() in www/glyph.js is where that
     was learned; this is the same bounded retry and not a new rule. */
  if(!w){
    if(SH_PVFIT < 10 && window.requestAnimationFrame){
      SH_PVFIT++;
      requestAnimationFrame(shPvDraw);
      return;
    }
    w = 300;
  }
  SH_PVFIT = 0;
  dpr = window.devicePixelRatio || 1;
  W = Math.round(w * dpr);
  S = W / SH_W;                       /* pixels to the point */
  H = Math.round(SH_H * S);
  c.width = W; c.height = H;
  c.style.height = Math.round(SH_H * S / dpr) + 'px';
  shPvPage(c.getContext('2d'), S, W, H);
}
/* One page, at S pixels to the point. The page's y runs UP and a canvas runs
   DOWN, so it is flipped here and once only -- shBoxInk() has the same line
   for the same reason. */
function shPvPage(g, S, W, H){
  var names = shNames(shState().names), page = names.slice(0, shPerPage());
  var i, b, p, m, tile, bits, at, x, y;
  function Y(v){ return (SH_H - v) * S; }
  g.fillStyle = '#fff';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#000';
  m = shMarks();
  for(i = 0; i < m.length; i++)
    g.fillRect((m[i][0] - SH_MARK / 2) * S, Y(m[i][1] + SH_MARK / 2),
               SH_MARK * S, SH_MARK * S);
  /* Every box is the same box, so it is drawn once and stamped twenty times:
     441 dots a box and twenty boxes is 8820 of them on every keystroke. */
  tile = shPvBox(S);
  for(i = 0; i < page.length; i++){
    b = shBoxAt(i);
    g.drawImage(tile, b.x * S, Y(b.y + SH_BOX));
    p = shPic(page[i]);
    g.drawImage(p.cv, b.x * S, Y(b.y + SH_BOX + SH_LABEL_UP + SH_LABEL),
                shLabelW(p) * S, SH_LABEL * S);
  }
  /* The strip, which is how the paper says what it is. Null is the names
     refusing to fit, and shMake() says so in a sentence rather than writing a
     sheet that cannot be read back -- the picture simply stops here. */
  bits = shPack(page);
  if(!bits) return;
  g.fillStyle = '#000';
  for(y = 0; y < SH_CH; y++) for(x = 0; x < SH_CW; x++){
    if(!bits[y * SH_CW + x]) continue;
    at = shCellAt(x, y);
    g.fillRect(at[0] * S, Y(at[1] + SH_CELL), SH_CELL * S, SH_CELL * S);
  }
}
/* The empty box and its lattice, once. A dot is half a point on paper, which
   is a third of a pixel on a phone -- drawn at that it is nothing at all, so
   the floor is half a pixel. What the dots say on a screen is that there are
   dots; how heavy they are is a question for the printer. */
function shPvBox(S){
  var c = document.createElement('canvas'), g, side = Math.round(SH_BOX * S);
  var lw = Math.max(1, 0.5 * S), lin = SH_LAT_INSET / 800 * SH_BOX * S;
  var lst = (side - 2 * lin) / (SH_LAT_N - 1), d = Math.max(SH_DOT * S, 0.5), lx, ly;
  c.width = side; c.height = side;
  g = c.getContext('2d');
  g.strokeStyle = shPvGrey(SH_BOX_GREY);
  g.lineWidth = lw;
  g.strokeRect(lw / 2, lw / 2, side - lw, side - lw);
  g.fillStyle = shPvGrey(SH_DOT_GREY);
  for(ly = 0; ly < SH_LAT_N; ly++) for(lx = 0; lx < SH_LAT_N; lx++)
    g.fillRect(lin + lx * lst - d / 2, lin + ly * lst - d / 2, d, d);
  return c;
}

/* Typed into. The count under the field moves with it, and nothing else does
   -- rebuilding the page would put the caret back to the end of the line on
   every keystroke, which is www/post.js's lesson and not a new one. */
function shTyped(v){
  var s = shState(), e;
  s.names = String(v || '');
  e = document.getElementById('wr-mini');
  if(e){
    var n = shNames(s.names).length;
    e.innerHTML = esc(tn('wr.boxes', n)) + ' · ' + esc(tn('wr.pages', shPages(n)));
  }
  shPvDraw();
}
/* Each name as a small grey picture, one per box.

   The sheet's own font is Helvetica -- Type1, WinAnsi -- and it cannot say 水.
   A PDF font that could say every name a person might type is a font embedded
   in every sheet, which is the whole of otf5.js pointed at a piece of paper.
   So the name is drawn on a canvas here, where the phone already has the face
   for it, and rides in the file as a few hundred bytes of DeviceGray.
   shPageOps() has drawn `/Im<i>` over the box since the day it was written and
   this is the half that was missing: shMake() called shSheet(names, []), so
   `p` was null for every box and **not one name was printed on the sheet**.
   Twenty empty squares and a strip: the paper could still say what it was to
   the reader, and could not say anything at all to the person holding a pen.
   The strokes on it would then come back under the right names, which is what
   makes it silent -- nothing throws, nothing is lost, and every check in the
   gate is green, because tools/sheet-check.mjs draws its own page rather than
   printing one through shSheet().

   The size and the way it is drawn are the spike's, tools/sheet-spike/print.mjs,
   which is where a real sheet was printed from and written on. 64 tall is about
   four times the 14 points it lands at, so the print has detail to spend.
   The face is asked of the page: a canvas has no inheritance, so a family
   written out here would be the one place the stylesheet cannot reach
   (CLAUDE.md rule 17, and tools/face-check.mjs holds it). */
/* The picture. The screen draws this one as it is; the file wants its bytes,
   which is shPics() below -- so reading seven thousand pixels back happens
   once, when a sheet is written, and not on every keystroke of the preview. */
function shPic(nm){
  var H = 64, c = document.createElement('canvas'), g = c.getContext('2d'), f, w;
  f = '600 ' + Math.round(H * 0.8) + 'px ' + cssVar('--face-ui', 'sans-serif');
  g.font = f;
  w = Math.ceil(g.measureText(String(nm)).width);
  if(!(w > 0)) w = 8;
  /* Sizing a canvas clears everything set on its context, so the face is set
     again after and not before. */
  c.width = w; c.height = H;
  g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, H);
  g.fillStyle = '#000'; g.font = f;
  g.textBaseline = 'middle';
  g.fillText(String(nm), 0, H * 0.54);
  return {w: w, h: H, cv: c};
}
function shPics(names){
  var out = [], i, p, g, d, by, k;
  for(i = 0; i < names.length; i++){
    p = shPic(names[i]);
    g = p.cv.getContext('2d');
    try{ d = g.getImageData(0, 0, p.w, p.h).data; }catch(e){ out.push(null); continue; }
    by = [];
    for(k = 0; k < p.w * p.h; k++) by.push(String.fromCharCode(d[k * 4]));
    out.push({w: p.w, h: p.h, gray: by.join('')});
  }
  return out;
}
/* The PDF, and out. Two things happen and they are not the same thing: the
   file is WRITTEN, and then it is OFFERED.
   OWNER 2026-08-27「普通に共有画面みたいなやつから保存してそこでファイルに
   保存させてくれ」 -- said about a build where the write had already worked
   four times and the person still could not get at the file. **Writing it
   into Documents and saying nothing is not a download.**

   `LinguaShare.sheet` writes it into `Documents/Sheets/`, where iOS puts it in
   the device backup and the Files app can show it, and it NEVER OVERWRITES --
   the second sheet of a name is `<name> 2.pdf`. That stays exactly as it was:
   taking it away would be docs/DATA_SAFETY.md, because a sheet already sitting
   there may have been drawn on. `LinguaShare.shareFile` then hands that file
   to iOS's own share sheet, which is where "Save to Files" lives and where
   choosing the destination stops being this app's business.

   **Nothing says it was saved, and that is the point.** Once the share sheet
   is up, what somebody picks -- save, send, cancel -- never comes back here,
   so any sentence about it would be a guess. 「保存できてないのに保存しました
   とかやめてくんない？」 Only the ways it can fail BEFORE that speak: no
   bridge, a phone that files nothing, a refusal. Cancelling says nothing,
   because changing your mind is not a failure.

   **It does not rotate generations, and www/backup.js does. That difference is
   deliberate and it is not an inconsistency.** keep() rotates the last file to
   `.1` and that to `.2` because a backup is a REPLACEMENT: the new file says
   the same thing as the old one, only later, so letting the third one push the
   first off the end costs nothing anybody had. A sheet is not a replacement.
   Each one is a separate piece of paper, and the one already sitting there may
   have been opened in Files and written on -- rotating would be the app
   deleting what somebody drew, to make room for a blank. So nothing here moves
   anything: CLAUDE.md's Data rule, where automatic deletion, pruning and
   cleanup are forbidden unless a written spec asks for them, and none does.

   **What it says is the part that had to be got right.** The one way this
   chapter can hurt somebody is to say a sheet was written when none was: they
   go to Files, there is nothing there, and the letters they were going to draw
   go nowhere. www/wordsheet.js's CSV shipped exactly that -- `<a download>`
   does nothing in WKWebView and throws nothing either, so the `try` always
   passed and the app always said it had exported. This road never used that
   mechanism, and the remaining way to say it wrongly is to believe the phone
   answered when it only answered SOMETHING. So the proof is the NAME: the
   native side resolves with the name it filed the sheet under and rejects on
   every other path, and nothing but a name is read as a sheet on the phone.
   No bridge, a rejection, or an answer with no name in it all say the same
   thing, because to a person they are the same thing -- it is not there. */
function shMake(){
  var s = shState(), names = shNames(s.names), pdf, b64, p;
  if(!names.length){ toast(t('wr.none')); return; }
  pdf = shSheet(names, shPics(names));
  /* null is the packet refusing to fit the strip. A sheet that cannot name
     itself is not a sheet -- it comes back unreadable, and a misread sheet
     must be turned away rather than half-imported. */
  if(!pdf){ toast(t('wr.long')); return; }
  /* btoa() throws on a character over 255, and this is the one line in the
     chapter NO CHECK HAS EVER RUN: a browser has no bridge, so every walk
     turns back at the line below and this happens on a phone and nowhere
     else. Un-caught it would land outside the promise, so nothing would
     toast and the button would do nothing at all.
     Measured and it is not a fault today -- shSheet() over ASCII, kana,
     accented and emoji names comes back with nothing above char 122, and the
     pictures are bytes by construction. Caught because it is untested. */
  try{ b64 = btoa(pdf); }catch(e){ toast(t('wr.bad')); return; }
  p = sharePlug();
  if(!p){ toast(t('wr.nobridge')); return; }
  p('LinguaShare', 'sheet', {name:shFileName(), b64:b64})
    .then(function(r){
      /* The name the PHONE filed it under, which is not shFileName(): a sheet
         is never overwritten, so the second of a name is `<name> 2.pdf`.
         Handing the wrong one of two to the share sheet would give somebody
         the sheet they made last week. */
      if(!(r && r.file)){ toast(t('wr.nobridge')); return; }
      return p('LinguaShare', 'shareFile', {file: String(r.file)});
    })
    ['catch'](function(){ toast(t('wr.nobridge')); });
}
/* A name a person will recognise in the Files app. bkName()'s argument, and
   deliberately not bkName() itself: that one carries the language id because
   two backups of two languages must not overwrite each other, and a sheet is
   paper -- it is not filed against anything and does not point at a language.
   It names itself in its own strip. */
function shFileName(){
  var n = String(langName || '').replace(/[^\w \-]/g, '').replace(/\s+/g, ' ');
  return (n ? n.slice(0, 40) + ' ' : '') + 'sheet';
}

/* ---- reading one back -------------------------------------------------- */
function openWrIn(){
  openForm('wrin:', t('wr.read'), shInHTML(), shInMount);
}
/* Before a file: the one control. After one: WHAT CAME OFF IT, a row per box
   -- the picture that was read, beside the name that was printed over the box.

   It used to be the name and the word "drawn", and that is what the owner met:
   「あとsheet読み込んだら1と書いた文字を取り込みますって見せないと。なにが
   取り込まれたかわからん。せっかく取り込んで使えるようにするんだから見せない
   と。淡白にやるのやめてくれ。」 OWNER 2026-09-01, build 107, on a device.
   A word saying a box was drawn in is not what was drawn in it: two sheets
   read a week apart said the same eleven characters, and the one thing a
   person is about to commit to their alphabet was the thing not on the screen.

   It is NOT an explanation. 「アプリ内に説明書くの禁止」 stands and nothing
   here is prose; what was added is the ink itself.

   The comment that used to stand here said a picture was left out ON PURPOSE,
   because drawing an imported shape is www/glyph.js's one place and a copy
   here would be the second of something that already had one. The premise was
   right and the conclusion was wrong: inkCanvases() takes `stOf` for exactly
   this -- a shape that is NOT in LETTERS yet, which is what a post's face
   already is -- so the one place draws these too and there is no second copy.
   shInMount() hands it the box's rings. */
function shInHTML(){
  var s = shState(), out = '', i, g, n;
  out = '<label class="btn ghost shfile">'+esc(t('wr.in'))+
    '<input type="file" id="wr-file" accept="application/pdf,.pdf"></label>';
  if(s.why) return out + '<div class="note">'+esc(s.why)+'</div>';
  if(!s.got) return out;
  out += '<div class="mini" style="margin-top:14px">'+esc(s.from)+'</div>';
  for(i = 0; i < s.got.length; i++){
    g = s.got[i];
    /* The picture where there is one, and the word only where there is not:
       "drawn" printed beside the drawing is the same thing said twice, and a
       box that came back empty has nothing to show and must still say so. */
    out += '<div class="set">'+
      (g.sh.length
        /* A canvas carries no text, so the one word that was here before is
           what it is CALLED -- said to a screen reader and not printed beside
           the drawing it would be repeating. */
        ? '<canvas class="shink" data-i="'+i+'" aria-label="'+esc(t('wr.drawn'))+'"'+
            ' style="width:30px;height:30px;display:block;flex:0 0 auto"></canvas>'
        : '')+
      '<span class="sl">'+esc(g.nm)+'</span>'+
      (g.sh.length ? '' : '<span class="sv">'+esc(t('wr.empty'))+'</span>')+
      '</div>';
  }
  /* A sheet with nothing drawn on it says so and offers nothing to press.
     "Take in 0" is a button that does nothing, which is worse than no
     button -- and every empty box coming back empty is the reading side
     working, not failing: the printed lattice is not read as ink. */
  n = shTakeCount(s.got);
  if(!n) return out + '<div class="note">'+esc(t('wr.empty.all'))+'</div>';
  out += '<div class="barfix"><button class="btn ghost"' + DO('shTakeIn') + '>'+
    esc(tn('wr.take', n))+'</button></div>';
  return out;
}
/* Every box's ring, into the canvas standing in its row. The rings are on the
   READ, not on a letter -- nothing has been committed yet, and that is the
   whole point of the screen -- so they are handed over rather than looked up.
   inkCanvases() may not be there at all: tools/sheet-spike/*.mjs eval this
   file with no app around it, the same guard HELP and FORM_OPEN carry. */
function shInkMount(){
  if(typeof inkCanvases !== 'function') return;
  inkCanvases('canvas.shink', 48, 30, function(c){
    var s = shState(), k = parseInt(c.getAttribute('data-i'), 10);
    return (s.got && s.got[k] && s.got[k].sh && s.got[k].sh.length)? s.got[k].sh : null;
  });
}
function shTakeCount(got){
  var n = 0, i;
  for(i = 0; i < got.length; i++) if(got[i].sh.length) n++;
  return n;
}
/* The file input is the one control in the app that cannot go through the
   action tables -- they hand a listener the element's value, and a file
   input's value is a made-up path. www/import.js binds its own for the same
   reason, and this is that sentence and not a second rule. */
function shInMount(){
  var e = document.getElementById('wr-file');
  /* The pictures first, and before the guard below returns: a canvas has to be
     filled after the HTML exists and sized in device pixels, which is the same
     sentence geTiles() is written under, and inkCanvases() is that one place.
     `stOf` is its hook for a shape that is not a letter yet -- a post's face
     is the other caller -- so nothing here draws anything itself. */
  shInkMount();
  if(!e || e.getAttribute('data-wired')) return;
  e.setAttribute('data-wired', '1');
  e.addEventListener('change', function(){
    var f = e.files && e.files[0];
    if(!f) return;
    /* A PDF, and nothing else. OWNER DECISION 2026-08-25
       「一旦写真禁止で、普通に pdf で提出以外受け取らないで行こう。今後のアプデで追加しよ」
       -- and the reason is a shipping one rather than a technical one: the
       half that was never measured is exactly the photograph, a brush and a
       hard pencil on paper under a real camera. A scan has no camera in it.

       It is HERE and not in shTakeFile(), and that is the decision's own
       sentence: what changes is which files are offered and accepted, not the
       reader underneath. This listener is the one door a person comes in by --
       the picker offers PDFs and anything else that arrives is turned away
       with a sentence. Below it, shTakeFile() still reads a picture, because
       the day photographs come back is the day this one line goes. */
    if(!shIsPdf(f)){ shFail(t('wr.notpdf')); return; }
    var r = new FileReader();
    r.onload = function(){ shTakeFile(String(r.result || ''), f.name); };
    r.onerror = function(){ shFail(t('wr.bad')); };
    r.readAsDataURL(f);
  }, false);
}
/* What the picker was told to offer, asked again of what actually arrived.
   `accept` is a hint and not a fence -- a file can still reach here by another
   road on some phones, and on a desktop the chooser has an "all files" of its
   own. Both halves of the name are asked because neither is reliable alone:
   iOS hands over `application/pdf` and no useful name, and a file that came
   through Files with no type at all still ends in `.pdf`. */
function shIsPdf(f){
  var ty = String((f && f.type) || ''), nm = String((f && f.name) || '');
  return ty.indexOf('pdf') >= 0 || /\.pdf$/i.test(nm);
}
function shFail(why){
  var s = shState();
  s.got = null; s.why = why; s.from = '';
  openWrIn();
}
/* A data URL in, either a photograph or a PDF with one inside it. A PDF is
   opened here rather than rendered: /DCTDecode means "these bytes are already
   a JPEG", so a scan comes out of one without anything drawing a page.
   shPdfWhy() answers which of the four kinds arrived, so a PDF drawn on a
   screen is told apart from a PDF that could not be opened -- the phone has
   PDFKit and this does not, and "we cannot draw this one" is a different
   sentence from "this is broken". */
function shTakeFile(url, fname){
  var s = shState(), i = String(url).indexOf(','), head, b64, bytes, jpg, why;
  if(i < 0){ shFail(t('wr.bad')); return; }
  head = String(url).slice(0, i);
  b64 = String(url).slice(i + 1);
  if(head.indexOf('application/pdf') >= 0 || /\.pdf$/i.test(String(fname || ''))){
    try{ bytes = atob(b64); }catch(e){ shFail(t('wr.bad')); return; }
    why = shPdfWhy(bytes);
    jpg = shPdfJpeg(bytes);
    if(!jpg){ shPdfDraw(b64, why, String(fname || '')); return; }
    url = 'data:image/jpeg;base64,' + btoa(jpg);
  }
  s.from = String(fname || '');
  shLook(url);
}
/* A PDF with no photograph in it to take out. Two files arrive this way and
   they are the same problem: one where somebody wrote on the sheet with a
   pencil on a SCREEN, so the ink is drawn into the page rather than being
   pixels of a picture of it, and one whose page is a picture behind a filter
   this file cannot undo. Both need a renderer, this file is not one and never
   will be, and the phone has one.
   OWNER 2026-08-27「pdfkitのレンダラやろう」

   It is the ONE place a PDF becomes a picture by any road other than
   shPdfJpeg(), and everything from shLook() on is untouched -- the same
   threshold, the same marks, the same strip. A second road would be a page
   rendered two ways that could quietly disagree.

   Whether the page can be drawn is the RENDERER's to answer and not this
   file's. shPdfWhy() said which kind of file arrived, which is a different
   question, and asking it to decide who may try would put a guess in front of
   the only thing that actually knows. So everything with no JPEG in it is
   offered, including a file that is not a PDF at all -- CoreGraphics refuses
   that one, which is the answer.

   With no phone under it -- a browser, or a build made before the renderer --
   there is nothing to ask and what comes out is the sentence that was there
   before. */
function shPdfDraw(b64, why, fname){
  var p = sharePlug();
  if(!p){ shFail(why === 'drawn' ? t('wr.pdf.drawn') : t('wr.pdf.no')); return; }
  p('LinguaShare', 'renderPdf', {b64: b64, edge: SH_LOOK})
    .then(function(r){
      var jpg = r && r.jpeg;
      /* Answered, and with nothing. Not the same as being refused, and it is
         the same dead end either way. */
      if(!jpg){ shFail(t('wr.bad')); return; }
      shState().from = fname;
      shLook('data:image/jpeg;base64,' + jpg);
    })
    ['catch'](function(){ shFail(t('wr.bad')); });
}
/* How big a photograph is worth looking at. A corner mark is about a
   fortieth of the page, so 2200 pixels down the long edge leaves it 50 across
   -- and running twelve megapixels through a local threshold is a minute of
   somebody's phone for detail that is not used. Measured in the spike. */
var SH_LOOK = 2200;
function shLook(url){
  var im = new Image();
  im.onerror = function(){ shFail(t('wr.bad')); };
  im.onload = function(){
    var k = Math.min(1, SH_LOOK / Math.max(im.width, im.height));
    var W = Math.round(im.width * k), H = Math.round(im.height * k);
    var c = document.createElement('canvas'), g, px, i, v;
    c.width = W; c.height = H;
    g = c.getContext('2d');
    /* White behind it: a PNG with a transparent ground would otherwise be
       black everywhere, which is a page of ink and no marks. */
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.drawImage(im, 0, 0, W, H);
    try{ px = g.getImageData(0, 0, W, H).data; }
    catch(e){ shFail(t('wr.bad')); return; }
    for(i = 0; i < W * H; i++){
      v = (px[i*4] * 0.299 + px[i*4+1] * 0.587 + px[i*4+2] * 0.114) | 0;
      px[i*4] = px[i*4+1] = px[i*4+2] = v;
    }
    shPage(px, W, H);
  };
  im.src = url;
}
/* One page, read. The order of this is the spike's tools/sheet-spike/read.mjs
   and the numbers in it were each measured -- README.md in that folder says
   how. Nothing here is a new decision. */
function shPage(px, W, H){
  var s = shState(), scan = shScan(px, W, H), names, bb, e0, e1, RES, out = [], i;
  if(scan.fail){ shFail(scan.fail === 'marks' ? t('wr.marks') : t('wr.bad')); return; }
  names = shReadStrip(scan.warp, scan.dark);
  /* No names is a sheet that cannot say what it is, and it is REFUSED rather
     than half-read. Guessing the order would put somebody's 水 on the letter
     called `a`. */
  if(!names){ shFail(t('wr.strip')); return; }
  /* How finely a box is sampled is the PHOTOGRAPH's to say and not a
     constant: finer invents detail that is not there, coarser throws some
     away. Ask how many pixels wide a box actually came out. */
  bb = shBoxAt(0);
  e0 = scan.warp(bb.x, bb.y + bb.side);
  e1 = scan.warp(bb.x + bb.side, bb.y + bb.side);
  RES = Math.round(Math.sqrt((e1[0]-e0[0])*(e1[0]-e0[0]) + (e1[1]-e0[1])*(e1[1]-e0[1])));
  if(RES < 120) RES = 120;
  if(RES > 700) RES = 700;
  for(i = 0; i < names.length; i++) out.push({nm:names[i], sh:shBoxShape(scan, i, RES)});
  s.got = out; s.why = '';
  openWrIn();
}
/* One box, as rings in the app's own 800 square. The edge runs where the grey
   crosses half way between this paper and this ink, which is BETWEEN two
   samples -- pixel corners give a staircase nobody drew. The thinning is 1 of
   800, which drops only points sitting exactly on the line between their
   neighbours: the same straight edge written down twice. At 6 it moved a
   point 5.81 of 800, four tenths of the width of the stroke it was moving,
   and that is the app redrawing somebody's letter. */
function shBoxShape(scan, i, RES){
  var mask = shBoxInk(scan.warp, scan.crisp, i, RES),
      cl = shClean(mask, RES, Math.round(RES * RES * 0.0012), 3),
      fld, k = 800 / RES;
  if(!cl.kept) return [];
  fld = shBoxField(scan.warp, scan.sign, i, RES);
  return shEdge(fld, RES, cl.m).map(function(L){
    return shThin(L, RES / 800 * 1).map(function(p){
      return [Math.round(p[0] * k * 10) / 10, Math.round(p[1] * k * 10) / 10];
    });
  });
}
/* And the moment a drawing becomes a letter.

   It ADDS. Box `ka` becomes a NEW letter called `ka` -- nothing already in
   the alphabet is overwritten, renamed or touched, whatever it is called. Two
   letters called the same thing is what Pro is for, and it is the decided
   behaviour: 「a,a,a は三枠」.

   A NUMBER is the one thing that is not a name, and that is not an exception
   to the sentence above -- it is the same sentence about a different kind of
   sign. 「用紙を入れて数字なら数字に振り分けて」 OWNER 2026-09-01. A digit is
   a letter carrying a VALUE instead of a reading (www/numbers.js), and a
   value is what the BASE gives: one slot per value, made by numTopUp(). There
   is one seven and no road asks for a second, so `7,7,7` cannot be three
   boxes. A box called `7` IS the digit seven, and the slot that already holds
   seven is the only place it can go.

   What counts as a number is the language's own base and nothing else --
   0 to base-1, which is what one sign can write. `25` in base ten is two
   signs, so it is a name like any other and arrives as a letter called `25`;
   in base twenty it is the digit twenty-five. numTyped() and numInBase() are
   where that is said, and the box on a letter's page asks the same two.

   And it goes into that slot only while nothing is DRAWN on it -- the slot
   numTopUp() made and nobody has touched. A digit somebody has already drawn
   on is theirs: it is left exactly as it is, and the box arrives as an
   ordinary letter beside it. That is ltFreeSlot()'s answer to the same
   question and the duplicate the alphabet shows in red. Overwriting a drawing
   to make room for another is the one thing this may never do.

   `via` goes on here and is never worked out again afterwards. Absent means
   make, so not one letter that exists today is touched and there is no
   migration -- docs/DATA_MODEL.md's rule about the past, and the reason the
   field is written at the moment the letter arrives rather than read off the
   shape later. A letter with `sh` today is one that came in on a sheet; that
   will not stay true the moment anything else can produce one, which is
   exactly why the letter says so itself. */
function shTakeIn(){
  var s = shState(), n = 0, i, g, v, d;
  if(!s.got) return;
  for(i = 0; i < s.got.length; i++){
    g = s.got[i];
    if(!g.sh.length) continue;
    v = numTyped(g.nm);
    if(numInBase(v)){
      d = numByVal(v);
      /* Nothing holds this value yet, so the box IS that digit. No name goes
         on it: a digit says what it is WORTH, and ltName() reads that off the
         value rather than off a label. */
      if(!d){ ltNew({val:v, sh:g.sh, via:'write'}); n++; continue; }
      /* The slot is there and nothing is drawn on it. inkGeo() is the one
         place that knows a letter's shape may be `sh` as well as `st`, and a
         borrowed character is a shape too. */
      if(!inkGeo(d) && !d.ch){ d.sh = g.sh; d.via = 'write'; saveLetters(); n++; continue; }
      /* Otherwise that digit is somebody's work, and this falls through to a
         letter beside it rather than over it. */
    }
    ltNew({nm:g.nm, sh:g.sh, via:'write'});
    n++;
  }
  if(!n) return;                       /* the button is not there to press */
  SH = shBlank();
  toast(tn('wr.took', n));
  go('ltset', 'alpha');
}

/* Coming back to one of the three by the back button. FORM_OPEN is shell's
   and may not be there at all -- tools/sheet-spike/*.mjs eval this file with
   no app around it. */
if(typeof FORM_OPEN !== 'undefined'){
  FORM_OPEN.write = function(){ openWrite(); };
  FORM_OPEN.wrout = function(){ openWrOut(); };
  FORM_OPEN.wrin  = function(){ openWrIn(); };
}
