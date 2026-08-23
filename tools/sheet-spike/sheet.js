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
    /* the name over the box, and again faintly INSIDE it as something to
       trace. 0.86 grey: a person reads it, a threshold does not. */
    if (p && p.w && p.h){
      wide = 20 * p.w / p.h;
      o.push('q ' + shNum(wide) + ' 0 0 20 ' + shNum(b.x) + ' ' +
             shNum(b.y + SH_BOX + 6) + ' cm /Im' + i + ' Do Q');
      /* and again faintly inside, as something to trace -- fitted by BOTH
         sides. Scaling by height alone put `mountain` half a box past its own
         edge and over its neighbour. */
      var gh = SH_BOX * 0.72, gw = gh * p.w / p.h;
      if (gw > SH_BOX * 0.84){ gw = SH_BOX * 0.84; gh = gw * p.h / p.w; }
      o.push('q /G1 gs ' + shNum(gw) + ' 0 0 ' + shNum(gh) + ' ' +
             shNum(b.x + (SH_BOX - gw) / 2) + ' ' + shNum(b.y + (SH_BOX - gh) / 2) +
             ' cm /Im' + i + ' Do Q');
    }
    o.push('0.82 G 0.5 w ' + shNum(b.x) + ' ' + shNum(b.y) + ' ' +
           SH_BOX + ' ' + SH_BOX + ' re S');
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
