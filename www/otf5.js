/* otf5.js — build a real OpenType/CFF font from point-drawn skeletons, in ES5.
 *
 * Why this file exists at all: www/index.html has to run in an old WKWebView, so
 * everything in it is ES5. opentype.js cannot go there — its 2.0.0 dist is 516KB
 * of ES2015+ (73 arrow functions, 2454 const/let, 140 template literals). So the
 * font writer has to be hand-written.
 *
 * That sounds worse than it is, because of one property of the outliner: a stroke
 * is a convex nib swept along a segment, which is the convex hull of the nib at
 * both endpoints. EVERY contour this file emits is therefore a convex polygon —
 * straight lines only. The CFF charstrings need rmoveto, rlineto and endchar and
 * nothing else. No curve operators, no hints, no subroutines.
 *
 * Geometry is a straight port of tools/font-spike/build5.mjs lines 82-178 and its
 * profile()/spanAt() scanliner, deliberately including the scanline sampling, so
 * that the placement this produces is the same number build5 produced and not
 * merely a similar one. verify-otf5.mjs asserts that against build5's own output.
 *
 * Coordinate spaces, the thing that cost v3 a day:
 *   authoring space is y-DOWN, 0..cell in both axes, baseline along the bottom
 *   font space is y-UP, so fontY = BASE - authoringY
 *
 * Usage (browser or Node):
 *   var f = LinguaFont.build(glyphs, { mode: 'center', pen: { width: 60 } });
 *   f.bytes      Uint8Array of a complete .otf
 *   f.dataUrl()  data: URL ready for a @font-face src
 *   f.metrics    per-glyph { adv, dx, sx, xMin, xMax, lsb, rsb }
 *
 * glyphs: [{ name: 'a', roman: 'a', strokes: [ { closed: true, pts: [[x,y,'c'],...] } ] }]
 *   pts   [x, y] or [x, y, 'c'] where 'c' means round this corner into a curve
 *   roman null means the glyph has no cmap entry (a ligature target). Several
 *   codepoints may share one glyph: roman 'aA' maps both cases to the same
 *   drawing, which is what a script with no case distinction wants.
 */
var LinguaFont = (function () {
  'use strict';

  // ---------------------------------------------------------------- geometry
  // FLAT_TOL is how far a flattened curve may sag from the true curve. Three units
  // out of 800 is invisible in a corner, but a circle is the one shape an eye
  // checks for roundness, and at editor scale (about one screen pixel per unit) a
  // 3-unit sag reads as a visible facet. Round strokes therefore get a tolerance
  // five times tighter; it costs a few dozen extra hulls and nothing else.
  var ROUND = 0.44, FLAT_TOL = 3, RING_TOL = 0.6;

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k]; }
  function len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]) || 1e-9; }  // no Math.hypot in ES5
  function unit(a) { return mul(a, 1 / len(a)); }

  function flattenQuad(p0, c, p1, out) {
    var dev = len(sub(mul(add(p0, p1), 0.5), c));
    var n = Math.max(2, Math.min(16, Math.ceil(Math.sqrt(dev / (2 * FLAT_TOL)))));
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
                u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
    }
  }

  // A skeleton stroke becomes a polyline. A vertex marked 'c' is not a point the
  // line passes through: the line is pulled back ROUND x the shorter leg on both
  // sides and a quad is flattened through the corner. That is the "curve button"
  // in the editor — one flag on one vertex, no extra points to place.
  // A stroke marked 'o' is round, and its points are on the ink like everyone
  // else's -- there is no invisible centre. Two points are the two ends of a
  // diameter, which is the smallest circle through them; a third point is one the
  // arc has to pass through, so it bends the line where you put it and says which
  // way round it goes. An 'o' stroke that is also closed ignores the arc's ends
  // and draws the whole circle the three points sit on.
  //
  // Three points is the exact edge of what stays honest here: a circle through
  // three lattice dots touches all three, so nothing moves off the grid you
  // tapped. A smooth line through four or more would have to leave it.
  function roundPoly(v, m, closed) {
    var A = [v[0][0], v[0][1]], B = [v[1][0], v[1][1]], C = m > 2 ? [v[2][0], v[2][1]] : null;
    var c, r, a0, a1, a2;
    if (!C) {                                   // two ends of a diameter
      c = mul(add(A, B), 0.5); r = len(sub(B, A)) / 2;
      if (r < 1e-6) return [A];
      a0 = Math.atan2(A[1] - c[1], A[0] - c[0]); a2 = a0 + Math.PI * 2; a1 = a0 + Math.PI;
      closed = true;
    } else {                                    // the circle through three points
      var d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]));
      if (Math.abs(d) < 1e-9) return null;      // collinear: let it stay a straight line
      var sa = A[0] * A[0] + A[1] * A[1], sb = B[0] * B[0] + B[1] * B[1],
          sc = C[0] * C[0] + C[1] * C[1];
      c = [(sa * (B[1] - C[1]) + sb * (C[1] - A[1]) + sc * (A[1] - B[1])) / d,
           (sa * (C[0] - B[0]) + sb * (A[0] - C[0]) + sc * (B[0] - A[0])) / d];
      r = len(sub(A, c));
      a0 = Math.atan2(A[1] - c[1], A[0] - c[0]);
      a1 = Math.atan2(B[1] - c[1], B[0] - c[0]);
      a2 = Math.atan2(C[1] - c[1], C[0] - c[0]);
      // go from A to C the way that passes through B, so the middle point alone
      // decides the direction and there is no hidden winding rule
      var TAU = Math.PI * 2, wrap = function (x) { return ((x % TAU) + TAU) % TAU; };
      var ccw = wrap(a1 - a0) < wrap(a2 - a0);
      a2 = ccw ? a0 + wrap(a2 - a0) : a0 - wrap(a0 - a2);
      if (closed) a2 = a0 + (ccw ? TAU : -TAU);
    }
    // sagitta r(1-cos t) = RING_TOL at the half-angle, so one segment per 2t
    var half = Math.acos(Math.max(-1, 1 - RING_TOL / r));
    var span = Math.abs(a2 - a0);
    var n = Math.max(2, Math.min(160, Math.ceil(span / (2 * half))));
    var out = [];
    for (var s = 0; s <= n; s++) {
      var th = a0 + (a2 - a0) * (s / n);
      out.push([c[0] + Math.cos(th) * r, c[1] + Math.sin(th) * r]);
    }
    return out;
  }

  function toPolyline(st) {
    var v = st.pts, m = v.length;
    if (m === 1) return [[v[0][0], v[0][1]]];
    if (st.k === 'o') {
      var round = roundPoly(v, m, !!st.closed);
      if (round) return round;
    }
    var closed = !!st.closed;
    var P = function (i) { var p = v[((i % m) + m) % m]; return [p[0], p[1]]; };
    var bends = function (i) {
      return v[((i % m) + m) % m][2] === 'c' && (closed || (i > 0 && i < m - 1));
    };
    var radius = function (i) {
      return Math.min(ROUND * len(sub(P(i - 1), P(i))), ROUND * len(sub(P(i + 1), P(i))));
    };
    var entry = function (i) { return add(P(i), mul(unit(sub(P(i - 1), P(i))), radius(i))); };
    var exit_ = function (i) { return add(P(i), mul(unit(sub(P(i + 1), P(i))), radius(i))); };
    var out = [];
    for (var i = 0; i < m; i++) {
      if (bends(i)) { var A = entry(i), B = exit_(i); out.push(A); flattenQuad(A, P(i), B, out); }
      else { out.push(P(i)); }
    }
    if (closed) out.push(out[0].slice());
    return out;
  }

  function nib(pen, n) {
    n = n || 12;
    var a = pen.width / 2, b = a * (pen.contrast === undefined ? 1 : pen.contrast);
    var th = (pen.angleDeg || 0) * Math.PI / 180, ca = Math.cos(th), sa = Math.sin(th);
    var pts = [];
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var x = Math.cos(t) * a, y = Math.sin(t) * b;
      pts.push([x * ca - y * sa, x * sa + y * ca]);
    }
    return pts;
  }

  function hull(pts) {
    var p = pts.slice().sort(function (u, w) { return u[0] - w[0] || u[1] - w[1]; });
    var cross = function (o, a, b) {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    };
    var i, lower = [];
    for (i = 0; i < p.length; i++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p[i]) <= 0) lower.pop();
      lower.push(p[i]);
    }
    var upper = [];
    for (i = p.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p[i]) <= 0) upper.pop();
      upper.push(p[i]);
    }
    var h = lower.slice(0, -1).concat(upper.slice(0, -1));
    var r = [];
    h.forEach(function (q0) {
      var q = [Math.round(q0[0]), Math.round(q0[1])];
      var last = r[r.length - 1];
      if (!last || last[0] !== q[0] || last[1] !== q[1]) r.push(q);
    });
    if (r.length > 2 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
    return r;
  }

  function signedArea(pts) {
    var a = 0;
    for (var i = 0; i < pts.length; i++) {
      var q = pts[(i + 1) % pts.length];
      a += pts[i][0] * q[1] - q[0] * pts[i][1];
    }
    return a / 2;
  }

  // Minkowski sum: the nib at A hulled with the nib at B is exactly the swept
  // stroke, because the nib is convex. Result is authoring space, y-DOWN, every
  // contour convex, all the same winding.
  function glyphContours(g, pen) {
    var N = nib(pen), out = [];
    g.strokes.forEach(function (st) {
      var line = toPolyline(st);
      var at = function (p) {
        return N.map(function (d) { return [p[0] + d[0], p[1] + d[1]]; });
      };
      if (line.length === 1) { out.push(hull(at(line[0]))); return; }
      for (var i = 0; i < line.length - 1; i++) {
        var a = line[i], b = line[i + 1];
        if (Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6) continue;
        out.push(hull(at(a).concat(at(b))));
      }
    });
    return out;
  }

  // ---------------------------------------------------------------- profile
  // Convex contours meet a horizontal line in exactly one interval, so the ink
  // edges at a height are just min/max over contours. No rasterising.
  var STEP = 8;

  function spanAt(c, y) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < c.length; i++) {
      var a = c[i], b = c[(i + 1) % c.length];
      if ((a[1] <= y) === (b[1] <= y)) continue;
      var x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
      if (x < lo) lo = x;
      if (x > hi) hi = x;
    }
    return lo === Infinity ? null : [lo, hi];
  }

  function extent(contours) {
    var y0 = Infinity, y1 = -Infinity;
    contours.forEach(function (c) {
      c.forEach(function (p) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
    });
    return [y0, y1];
  }

  // The band is the whole alphabet's vertical extent, not the glyph's own, so a
  // short glyph and a tall one are averaged over the same denominator.
  function profile(contours, band) {
    var e = extent(contours);
    var b0 = band ? band[0] : e[0], b1 = band ? band[1] : e[1];
    var rows = [], y;
    for (y = b0 + STEP / 2; y < b1; y += STEP) {
      var l = Infinity, r = -Infinity;
      for (var i = 0; i < contours.length; i++) {
        var s = spanAt(contours[i], y);
        if (!s) continue;
        if (s[0] < l) l = s[0];
        if (s[1] > r) r = s[1];
      }
      rows.push(l === Infinity ? { y: y, l: null, r: null } : { y: y, l: l, r: r });
    }
    var xMin = Infinity, xMax = -Infinity;
    rows.forEach(function (w) {
      if (w.l === null) return;
      if (w.l < xMin) xMin = w.l;
      if (w.r > xMax) xMax = w.r;
    });
    return { rows: rows, xMin: xMin, xMax: xMax };
  }

  // ---------------------------------------------------------------- bytes
  function W() { this.b = []; }
  W.prototype.u8 = function (v) { this.b.push(v & 0xFF); return this; };
  W.prototype.u16 = function (v) { this.b.push((v >> 8) & 0xFF, v & 0xFF); return this; };
  W.prototype.i16 = function (v) { return this.u16(v < 0 ? v + 0x10000 : v); };
  W.prototype.u32 = function (v) {
    this.b.push((v >>> 24) & 0xFF, (v >>> 16) & 0xFF, (v >>> 8) & 0xFF, v & 0xFF);
    return this;
  };
  W.prototype.i32 = function (v) { return this.u32(v < 0 ? v + 0x100000000 : v); };
  W.prototype.tag = function (s) {
    for (var i = 0; i < 4; i++) this.b.push(s.charCodeAt(i) & 0xFF);
    return this;
  };
  W.prototype.raw = function (arr) {
    for (var i = 0; i < arr.length; i++) this.b.push(arr[i] & 0xFF);
    return this;
  };
  W.prototype.str = function (s) {
    for (var i = 0; i < s.length; i++) this.b.push(s.charCodeAt(i) & 0xFF);
    return this;
  };
  W.prototype.utf16 = function (s) {
    for (var i = 0; i < s.length; i++) this.u16(s.charCodeAt(i));
    return this;
  };

  function pad4(a) { while (a.length % 4) a.push(0); return a; }

  function checksum(a) {
    var s = 0, i, n = a.length;
    for (i = 0; i + 3 < n; i += 4) {
      s = (s + ((a[i] << 24 >>> 0) + (a[i + 1] << 16) + (a[i + 2] << 8) + a[i + 3])) >>> 0;
    }
    var tail = 0, k = 0;
    for (; i < n; i++, k++) tail += a[i] * Math.pow(256, 3 - k);
    return (s + tail) >>> 0;
  }

  // ---------------------------------------------------------------- CFF
  function cffNum(v) {                       // DICT operand encoding
    v = Math.round(v);
    if (v >= -107 && v <= 107) return [v + 139];
    if (v >= 108 && v <= 1131) { var d = v - 108; return [(d >> 8) + 247, d & 0xFF]; }
    if (v >= -1131 && v <= -108) { var e = -v - 108; return [(e >> 8) + 251, e & 0xFF]; }
    // 29 = 32-bit. Always used for offsets so the Top DICT has a fixed length and
    // the layout can be computed in one pass instead of iterating to a fixpoint.
    return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  }
  function cffFixedNum(v) {
    v = Math.round(v);
    return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
  }
  function csNum(v) {                         // Type 2 charstring operand encoding
    v = Math.round(v);
    if (v >= -107 && v <= 107) return [v + 139];
    if (v >= 108 && v <= 1131) { var d = v - 108; return [(d >> 8) + 247, d & 0xFF]; }
    if (v >= -1131 && v <= -108) { var e = -v - 108; return [(e >> 8) + 251, e & 0xFF]; }
    var w = v < 0 ? v + 0x10000 : v;
    return [28, (w >> 8) & 0xFF, w & 0xFF];
  }

  function cffIndex(items) {
    var out = [], i, j;
    out.push((items.length >> 8) & 0xFF, items.length & 0xFF);
    if (!items.length) return out;
    var total = 1;
    for (i = 0; i < items.length; i++) total += items[i].length;
    var offSize = total <= 0xFF ? 1 : total <= 0xFFFF ? 2 : total <= 0xFFFFFF ? 3 : 4;
    out.push(offSize);
    var off = 1;
    var putOff = function (v) {
      for (j = offSize - 1; j >= 0; j--) out.push((v >> (j * 8)) & 0xFF);
    };
    putOff(off);
    for (i = 0; i < items.length; i++) { off += items[i].length; putOff(off); }
    for (i = 0; i < items.length; i++) {
      for (j = 0; j < items[i].length; j++) out.push(items[i][j] & 0xFF);
    }
    return out;
  }

  // One glyph -> one Type 2 charstring. Convex polygons only, so: width, then per
  // contour an rmoveto and a run of rlineto, then endchar. Nothing else is needed
  // and nothing else is emitted.
  function charstring(contours, adv) {
    var cs = [], x = 0, y = 0, first = true;
    if (!contours.length) { cs = cs.concat(csNum(adv)); cs.push(14); return cs; }  // endchar
    contours.forEach(function (c) {
      var dx = c[0][0] - x, dy = c[0][1] - y;
      if (first) { cs = cs.concat(csNum(adv)); first = false; }
      cs = cs.concat(csNum(dx), csNum(dy));
      cs.push(21);                                    // rmoveto
      x = c[0][0]; y = c[0][1];
      // the Type 2 stack is 48 deep; 20 pairs is a safe run length
      var i = 1;
      while (i < c.length) {
        var run = Math.min(20, c.length - i), k;
        for (k = 0; k < run; k++) {
          cs = cs.concat(csNum(c[i + k][0] - x), csNum(c[i + k][1] - y));
          x = c[i + k][0]; y = c[i + k][1];
        }
        cs.push(5);                                   // rlineto
        i += run;
      }
    });
    cs.push(14);                                      // endchar (contour closes implicitly)
    return cs;
  }

  function buildCFF(psName, names, charstrings, bbox) {
    // Every non-.notdef name goes in the String INDEX with SID 391+, so the 391
    // standard strings never have to be embedded just to spell "a".
    var strings = names.slice(1).map(function (n) {
      var a = [];
      for (var i = 0; i < n.length; i++) a.push(n.charCodeAt(i) & 0xFF);
      return a;
    });
    var nameIdx = cffIndex([(function () {
      var a = [];
      for (var i = 0; i < psName.length; i++) a.push(psName.charCodeAt(i) & 0xFF);
      return a;
    })()]);
    var strIdx = cffIndex(strings);
    var gsubrIdx = cffIndex([]);
    var csIdx = cffIndex(charstrings);

    var charset = [0];                                  // format 0
    for (var s = 0; s < names.length - 1; s++) {
      var sid = 391 + s;
      charset.push((sid >> 8) & 0xFF, sid & 0xFF);
    }
    var priv = [139, 20, 139, 21];                      // defaultWidthX 0, nominalWidthX 0

    var topDict = function (charsetOff, csOff, privOff) {
      var d = [];
      d = d.concat(cffFixedNum(bbox[0]), cffFixedNum(bbox[1]),
                   cffFixedNum(bbox[2]), cffFixedNum(bbox[3]));
      d.push(5);                                        // FontBBox
      d = d.concat(cffFixedNum(charsetOff)); d.push(15); // charset
      d = d.concat(cffFixedNum(csOff));      d.push(17); // CharStrings
      d = d.concat(cffFixedNum(priv.length), cffFixedNum(privOff)); d.push(18);  // Private
      return d;
    };
    var topIdx0 = cffIndex([topDict(0, 0, 0)]);
    var base = 4 + nameIdx.length + topIdx0.length + strIdx.length + gsubrIdx.length;
    var charsetOff = base;
    var csOff = charsetOff + charset.length;
    var privOff = csOff + csIdx.length;
    var topIdx = cffIndex([topDict(charsetOff, csOff, privOff)]);
    if (topIdx.length !== topIdx0.length) throw new Error('CFF Top DICT length moved');

    return [].concat([1, 0, 4, 4], nameIdx, topIdx, strIdx, gsubrIdx,
                     charset, csIdx, priv);
  }

  // ---------------------------------------------------------------- cmap
  // First claim on a codepoint wins. A duplicate would emit two segments with the
  // same start, which is an overlapping-range error in a format 4 subtable.
  function addCode(pairs, code, gid) {
    for (var i = 0; i < pairs.length; i++) if (pairs[i].code === code) return;
    pairs.push({ code: code, gid: gid });
  }

  function buildCmap(pairs) {                 // pairs: [{code, gid}] any order
    var p = pairs.slice().sort(function (a, b) { return a.code - b.code; });
    var segs = [], i;
    for (i = 0; i < p.length; i++) {
      var last = segs[segs.length - 1];
      if (last && p[i].code === last.end + 1) { last.end = p[i].code; last.gids.push(p[i].gid); }
      else segs.push({ start: p[i].code, end: p[i].code, gids: [p[i].gid] });
    }
    segs.push({ start: 0xFFFF, end: 0xFFFF, gids: null });
    var n = segs.length;
    var sub = new W();
    var glyphArr = [], rangeOff = [];
    // idRangeOffset is measured from its own slot, so it has to know how much of
    // glyphIdArray comes before this segment's chunk.
    for (i = 0; i < n; i++) {
      if (!segs[i].gids) { rangeOff.push(0); continue; }
      rangeOff.push((n - i) * 2 + glyphArr.length * 2);
      glyphArr = glyphArr.concat(segs[i].gids);
    }
    var length = 16 + n * 8 + glyphArr.length * 2;
    // entrySelector must be exactly log2(segCount) and searchRange 2x that power:
    // OTS rejects the table over an off-by-one here, which is how this was caught.
    var es = 0;
    while ((1 << (es + 1)) <= n) es++;
    var sr = (1 << es) * 2;
    sub.u16(4).u16(length).u16(0).u16(n * 2).u16(sr).u16(es).u16(n * 2 - sr);
    for (i = 0; i < n; i++) sub.u16(segs[i].end);
    sub.u16(0);
    for (i = 0; i < n; i++) sub.u16(segs[i].start);
    for (i = 0; i < n; i++) sub.i16(segs[i].gids ? 0 : 1);
    for (i = 0; i < n; i++) sub.u16(rangeOff[i]);
    for (i = 0; i < glyphArr.length; i++) sub.u16(glyphArr[i]);

    var t = new W();
    t.u16(0).u16(2);
    // encoding records must be sorted by platformID then encodingID, so Unicode (0)
    // comes before Windows (3). Both point at the same format 4 subtable.
    t.u16(0).u16(3).u32(4 + 2 * 8);          // Unicode BMP
    t.u16(3).u16(1).u32(4 + 2 * 8);          // Windows BMP
    t.raw(sub.b);
    return t.b;
  }

  // ---------------------------------------------------------------- GSUB
  // One feature, 'liga', one LookupType 4 subtable. Enough for s+h -> s_h, which
  // is how a digraph gets one cell like a Korean syllable block.
  function buildGSUB(ligs) {
    if (!ligs.length) return null;
    // group by first component
    var firsts = [], byFirst = {};
    ligs.forEach(function (L) {
      var k = String(L.sub[0]);
      if (!byFirst[k]) { byFirst[k] = []; firsts.push(L.sub[0]); }
      byFirst[k].push(L);
    });
    firsts.sort(function (a, b) { return a - b; });

    var setBlobs = firsts.map(function (f) {
      var set = byFirst[String(f)];
      var ligBlobs = set.map(function (L) {
        var w = new W();
        w.u16(L.by).u16(L.sub.length);
        for (var i = 1; i < L.sub.length; i++) w.u16(L.sub[i]);
        return w.b;
      });
      var head = new W();
      head.u16(ligBlobs.length);
      var off = 2 + ligBlobs.length * 2;
      ligBlobs.forEach(function (b) { head.u16(off); off += b.length; });
      var out = head.b;
      ligBlobs.forEach(function (b) { out = out.concat(b); });
      return out;
    });

    var cov = new W();
    cov.u16(1).u16(firsts.length);
    firsts.forEach(function (f) { cov.u16(f); });

    var subHead = new W();
    var subSize = 6 + setBlobs.length * 2;
    subHead.u16(1);                                   // format 1
    subHead.u16(subSize);                             // coverage offset (after the set offsets)
    subHead.u16(setBlobs.length);
    var so = subSize + cov.b.length;
    setBlobs.forEach(function (b) { subHead.u16(so); so += b.length; });
    var subtable = subHead.b.concat(cov.b);
    setBlobs.forEach(function (b) { subtable = subtable.concat(b); });

    var lookup = new W();
    lookup.u16(4).u16(0).u16(1).u16(8);               // type 4, flag 0, 1 subtable at +8
    var lookupBlob = lookup.b.concat(subtable);

    var lookupList = new W();
    lookupList.u16(1).u16(4);
    var lookupListBlob = lookupList.b.concat(lookupBlob);

    var feat = new W();
    feat.u16(0).u16(1).u16(0);                        // no params, 1 lookup, index 0
    var featList = new W();
    featList.u16(1).tag('liga').u16(8);
    var featListBlob = featList.b.concat(feat.b);

    var langSys = new W();
    langSys.u16(0).u16(0xFFFF).u16(1).u16(0);
    var script = new W();
    script.u16(4).u16(0);                             // DefaultLangSys at +4, no other langs
    var scriptBlob = script.b.concat(langSys.b);
    var scriptList = new W();
    scriptList.u16(1).tag('DFLT').u16(8);
    var scriptListBlob = scriptList.b.concat(scriptBlob);

    var hdr = new W();
    var sOff = 10, fOff = sOff + scriptListBlob.length, lOff = fOff + featListBlob.length;
    hdr.u32(0x00010000).u16(sOff).u16(fOff).u16(lOff);
    return hdr.b.concat(scriptListBlob, featListBlob, lookupListBlob);
  }

  // ---------------------------------------------------------------- name
  function buildName(records) {
    var t = new W(), i;
    var strings = [], off = 0, meta = [];
    records.forEach(function (r) {
      var s = new W().utf16(r.text).b;
      meta.push({ id: r.id, off: off, len: s.length });
      strings.push(s);
      off += s.length;
    });
    var count = meta.length * 2;                       // Windows + Macintosh
    t.u16(0).u16(count).u16(6 + count * 12);
    for (i = 0; i < meta.length; i++) {                // platform 3 (Windows), UTF-16BE
      t.u16(3).u16(1).u16(0x0409).u16(meta[i].id).u16(meta[i].len).u16(meta[i].off);
    }
    var macOff = off, macStrings = [];
    for (i = 0; i < meta.length; i++) {                // platform 1 (Macintosh), Roman
      var s = new W().str(records[i].text).b;
      t.u16(1).u16(0).u16(0).u16(records[i].id).u16(s.length).u16(macOff);
      macOff += s.length;
      macStrings.push(s);
    }
    strings.forEach(function (s) { t.raw(s); });
    macStrings.forEach(function (s) { t.raw(s); });
    return t.b;
  }

  // ---------------------------------------------------------------- assemble
  function assemble(tables) {
    var tags = [];
    for (var k in tables) if (tables.hasOwnProperty(k)) tags.push(k);
    tags.sort();
    var n = tags.length;
    var sr = 16, es = 0;
    while (sr * 2 <= n * 16) { sr *= 2; es++; }
    var dir = new W();
    dir.u32(0x4F54544F).u16(n).u16(sr).u16(es).u16(n * 16 - sr);

    var offset = 12 + n * 16, recs = [];
    tags.forEach(function (t) {
      var body = tables[t].slice();
      var realLen = body.length;
      pad4(body);
      recs.push({ tag: t, off: offset, len: realLen, body: body, sum: checksum(body) });
      offset += body.length;
    });
    recs.forEach(function (r) { dir.tag(r.tag).u32(r.sum).u32(r.off).u32(r.len); });
    var file = dir.b;
    var headOff = 0;
    recs.forEach(function (r) { if (r.tag === 'head') headOff = r.off; file = file.concat(r.body); });

    var adj = (0xB1B0AFBA - checksum(file)) >>> 0;     // head.checkSumAdjustment
    file[headOff + 8] = (adj >>> 24) & 0xFF;
    file[headOff + 9] = (adj >>> 16) & 0xFF;
    file[headOff + 10] = (adj >>> 8) & 0xFF;
    file[headOff + 11] = adj & 0xFF;
    return file;
  }

  // ---------------------------------------------------------------- build
  var DEFAULTS = {
    em: 1000, base: 800, asc: 800, desc: -200,
    cell: 800, fitMargin: 0.06,
    mode: 'center',                                   // 'asdrawn' | 'center' | 'fit'
    pen: { width: 60, angleDeg: 0, contrast: 1.0 },
    family: 'LinguaScript', style: 'Regular',
    ligatures: [],                                    // [{ sub: ['s','h'], by: 's_h' }]
  };

  function opt(o, k) { return o && o[k] !== undefined ? o[k] : DEFAULTS[k]; }

  function build(glyphDefs, o) {
    o = o || {};
    var EM = opt(o, 'em'), BASE = opt(o, 'base'), ASC = opt(o, 'asc'), DESC = opt(o, 'desc');
    var CELL = opt(o, 'cell'), MARGIN = opt(o, 'fitMargin'), mode = opt(o, 'mode');
    var PEN = opt(o, 'pen'), ligatures = opt(o, 'ligatures');

    var raw = glyphDefs.map(function (g) { return { g: g, cs: glyphContours(g, PEN) }; });
    var B0 = Infinity, B1 = -Infinity;
    raw.forEach(function (q) {
      var e = extent(q.cs);
      if (e[0] < B0) B0 = e[0];
      if (e[1] > B1) B1 = e[1];
    });
    var BAND = [B0, B1];

    var metrics = {}, index = {}, names = ['.notdef'], charstrings = [], advances = [];
    var bbox = [Infinity, Infinity, -Infinity, -Infinity];
    var cmapPairs = [];

    charstrings.push(charstring([], EM));
    advances.push({ adv: EM, lsb: 0 });

    raw.forEach(function (q0) {
      var cs = q0.cs, sx = 1;
      if (mode === 'fit') {
        // rescale the SKELETON before the nib sweep, so the stroke stays exactly
        // PEN.width. Scaling the outline afterwards would vary the pen per glyph,
        // which is the one thing the user ruled out.
        var pre = profile(q0.cs, BAND);
        var inner = CELL * (1 - 2 * MARGIN);
        var skel = Math.max(1, (pre.xMax - pre.xMin) - PEN.width);
        sx = Math.max(0.35, Math.min(2.2, (inner - PEN.width) / skel));
        cs = glyphContours({
          strokes: q0.g.strokes.map(function (st) {
            return { closed: st.closed, pts: st.pts.map(function (p) {
              return [(p[0] - pre.xMin) * sx + pre.xMin, p[1], p[2]]; }) };
          }),
        }, PEN);
      }
      var p = profile(cs, BAND);
      var dx = mode === 'asdrawn' ? 0
             : Math.round((CELL - (p.xMax - p.xMin)) / 2 - p.xMin);
      var adv = CELL;

      var contours = cs.map(function (c) {
        var nodes = signedArea(c) < 0 ? c : c.slice().reverse();
        return nodes.map(function (pt) {
          var X = Math.round(pt[0] + dx), Y = BASE - pt[1];         // y-down -> y-up
          if (X < bbox[0]) bbox[0] = X;
          if (Y < bbox[1]) bbox[1] = Y;
          if (X > bbox[2]) bbox[2] = X;
          if (Y > bbox[3]) bbox[3] = Y;
          return [X, Y];
        });
      });

      index[q0.g.name] = names.length;
      // every character of roman points at this glyph, so 'aA' covers both cases
      if (q0.g.roman) {
        for (var ri = 0; ri < q0.g.roman.length; ri++) {
          addCode(cmapPairs, q0.g.roman.charCodeAt(ri), names.length);
        }
      }
      names.push(q0.g.name);
      charstrings.push(charstring(contours, adv));
      advances.push({ adv: adv, lsb: Math.round(p.xMin + dx) });
      metrics[q0.g.name] = {
        adv: adv, dx: dx, sx: sx, xMin: p.xMin + dx, xMax: p.xMax + dx,
        lsb: Math.round(p.xMin + dx), rsb: Math.round(adv - (p.xMax + dx)),
        contours: contours,
      };
    });

    // In a square-cell script the space is one cell, like a full-width space.
    var spaceAdv = CELL;
    index.space = names.length;
    addCode(cmapPairs, 32, names.length);
    names.push('space');
    charstrings.push(charstring([], spaceAdv));
    advances.push({ adv: spaceAdv, lsb: 0 });

    if (bbox[0] === Infinity) bbox = [0, 0, 0, 0];

    var ligs = [];
    ligatures.forEach(function (L) {
      var subs = L.sub.map(function (n) { return index[n]; });
      if (index[L.by] === undefined) return;
      for (var i = 0; i < subs.length; i++) if (subs[i] === undefined) return;
      ligs.push({ sub: subs, by: index[L.by] });
    });

    // ---- tables
    var head = new W();
    var maxAdv = 0, minLsb = Infinity, minRsb = Infinity, maxExtent = -Infinity;
    advances.forEach(function (a, i) {
      if (a.adv > maxAdv) maxAdv = a.adv;
      if (a.lsb < minLsb) minLsb = a.lsb;
    });
    Object.keys(metrics).forEach(function (k) {
      var m = metrics[k];
      var rsb = m.rsb, ext = Math.round(m.xMax);
      if (rsb < minRsb) minRsb = rsb;
      if (ext > maxExtent) maxExtent = ext;
    });
    if (minLsb === Infinity) minLsb = 0;
    if (minRsb === Infinity) minRsb = 0;
    if (maxExtent === -Infinity) maxExtent = 0;

    head.u32(0x00010000).u32(0x00010000).u32(0).u32(0x5F0F3CF5)
        .u16(3).u16(EM)
        .u32(0).u32(0).u32(0).u32(0)                  // created / modified: zero, so the
        .i16(bbox[0]).i16(bbox[1]).i16(bbox[2]).i16(bbox[3])   // build is reproducible
        .u16(0).u16(8).i16(2).i16(0).i16(0);

    var hhea = new W();
    hhea.u32(0x00010000).i16(ASC).i16(DESC).i16(0).u16(maxAdv)
        .i16(minLsb).i16(minRsb).i16(maxExtent)
        .i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0)
        .u16(advances.length);

    var hmtx = new W();
    advances.forEach(function (a) { hmtx.u16(a.adv).i16(a.lsb); });

    var maxp = new W();
    maxp.u32(0x00005000).u16(names.length);

    var codes = cmapPairs.map(function (c) { return c.code; }).sort(function (a, b) { return a - b; });
    var os2 = new W();
    os2.u16(4).i16(Math.round(CELL)).u16(400).u16(5).u16(0)
       .i16(650).i16(600).i16(0).i16(-150)            // subscript
       .i16(650).i16(600).i16(0).i16(500)             // superscript
       .i16(50).i16(300)                              // strikeout
       .i16(0);                                       // sFamilyClass
    for (var pn = 0; pn < 10; pn++) os2.u8(0);        // panose
    os2.u32(1).u32(0).u32(0).u32(0);                  // unicode ranges: basic latin
    os2.str('LNGA');
    os2.u16(0x0040).u16(codes[0]).u16(codes[codes.length - 1])
       .i16(ASC).i16(DESC).i16(0).u16(ASC).u16(-DESC)
       .u32(1).u32(0)                                 // codepage: latin 1
       .i16(Math.round(EM * 0.5)).i16(ASC).u16(0).u16(32).u16(2);

    var post = new W();
    post.u32(0x00030000).u32(0).i16(-100).i16(50).u32(0)
        .u32(0).u32(0).u32(0).u32(0);

    var psName = opt(o, 'family') + '-' + opt(o, 'style');
    var nameT = buildName([
      { id: 1, text: opt(o, 'family') },
      { id: 2, text: opt(o, 'style') },
      { id: 3, text: psName + ';Lingua' },
      { id: 4, text: opt(o, 'family') + ' ' + opt(o, 'style') },
      { id: 5, text: 'Version 1.000' },
      { id: 6, text: psName },
    ]);

    var tables = {
      'CFF ': buildCFF(psName, names, charstrings, bbox),
      'OS/2': os2.b,
      cmap: buildCmap(cmapPairs),
      head: head.b,
      hhea: hhea.b,
      hmtx: hmtx.b,
      maxp: maxp.b,
      name: nameT,
      post: post.b,
    };
    var gsub = buildGSUB(ligs);
    if (gsub) tables.GSUB = gsub;

    var file = assemble(tables);
    var bytes = new Uint8Array(file.length);
    for (var i = 0; i < file.length; i++) bytes[i] = file[i];

    return {
      bytes: bytes,
      metrics: metrics,
      index: index,
      spaceAdv: spaceAdv,
      numGlyphs: names.length,
      base64: function () { return toBase64(bytes); },
      dataUrl: function () { return 'data:font/otf;base64,' + toBase64(bytes); },
    };
  }

  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  function toBase64(bytes) {
    var out = '', i;
    for (i = 0; i + 2 < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    var rem = bytes.length - i;
    if (rem === 1) {
      var a = bytes[i] << 16;
      out += B64[(a >> 18) & 63] + B64[(a >> 12) & 63] + '==';
    } else if (rem === 2) {
      var b = (bytes[i] << 16) | (bytes[i + 1] << 8);
      out += B64[(b >> 18) & 63] + B64[(b >> 12) & 63] + B64[(b >> 6) & 63] + '=';
    }
    return out;
  }

  return {
    build: build,
    toBase64: toBase64,
    glyphContours: glyphContours,
    toPolyline: toPolyline,
    profile: profile,
    signedArea: signedArea,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LinguaFont;
