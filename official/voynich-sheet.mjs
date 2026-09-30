/* ---------------------------------------------------------------------------
   official/voynich-sheet.mjs — the app's writing sheet (www/sheet.js) for the
   Voynich letters, with Voynich EVA Hand A printed faintly UNDER each box, so
   the owner can trace the letters by hand and bring them back into the app.

   Run it:   node official/voynich-sheet.mjs --font <Voynich_EVA_Hand_A.ttf> [--out file.pdf]

   「いやもうそれ俺がなぞるから」「アプリでシートが出せるでしょ？そのシートに出して
   そのフォントを下に透過させて欲しい」 OWNER 2026-09-30.

   NOT a check, not in the gate, and nothing in www/ changes. The app's own
   sheet deliberately prints nothing inside a box -- a shape there is a shape
   somebody traces (the 水 in www/sheet.js) -- and for a person drawing their
   own script that stays right. This is the one case where tracing a shape is
   the point, so it is a tool of the official account's and not a screen.

   Everything that makes the sheet readable is the app's: the corner marks,
   the strip of names and the boxes come from shPack(), shPageOps() and
   shBoxAt(), so a traced sheet photographed and brought in through 書き取り
   reads back like any other. What this adds is one image per box, drawn
   before the box: the letter as the font draws it, at the scale the lattice
   was planned at (an o 5.5 steps tall, its foot on row 15, the letter's
   middle on column 10; a benched gallows wider than the lattice is narrowed
   to fit), in GREY. How grey is the reader's to say: shScan() calls a pixel
   ink when it is darker than 0.85 of the paper round it, so the letter is
   0.90 -- visible to a person, paper to the reader. The run proves it rather
   than trusting that sum: it draws the finished page, blank, and reads it
   with shScan() and shBoxShape(); every name has to come back and every box
   has to come back empty.

   The font is handed in and is not in this repository; the PDF it makes is
   written outside it (shots/ by default, which git ignores).
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, LAUNCH } from '../tools/browser.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const PORT = 8163;
const a = process.argv.slice(2);
const FONT = a.indexOf('--font') >= 0 ? a[a.indexOf('--font') + 1] : null;
const OUT = a.indexOf('--out') >= 0 ? a[a.indexOf('--out') + 1] : path.join(ROOT, 'shots', 'voynich-sheet.pdf');
if (!FONT) { console.error('--font <Voynich_EVA_Hand_A.ttf> is needed'); process.exit(1); }

/* The letters the official language has shapes for: EVA's a-z less b, u and
   w (the font has none), and the six composites. */
const NAMES = 'a c d e f g h i j k l m n o p q r s t v x y z ch sh cth ckh cph cfh'.split(' ');
const GREY = 0.90;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  r.end(body);
}).listen(PORT);
const br = await chromium.launch(LAUNCH);
const pg = await br.newPage();
await pg.goto(`http://localhost:${PORT}/`);
await pg.waitForSelector('#splash', { state: 'detached', timeout: 10000 });

const font = 'data:font/ttf;base64,' + fs.readFileSync(FONT).toString('base64');
const got = await pg.evaluate(async ({ font, names, GREY }) => {
  var ff = new FontFace('EvaHandSheet', 'url(' + font + ')');
  await ff.load(); document.fonts.add(ff);

  /* ---- the letter under a box: 400 x 400 for the 800 square ---- */
  var R = 400, U = R / 800;
  function inkBox(ctx, w, h) {
    var d = ctx.getImageData(0, 0, w, h).data, x0 = w, x1 = -1, y0 = h, y1 = -1, x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 100) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { x0: x0, x1: x1, y0: y0, y1: y1 };
  }
  function probe(t, px) {
    var c = document.createElement('canvas'); c.width = 1600; c.height = 800;
    var g = c.getContext('2d'); g.font = px + 'px EvaHandSheet'; g.fillText(t, 300, 500);
    var b = inkBox(g, 1600, 800); b.base = 500; b.left = 300; return b;
  }
  var o = probe('o', 200);
  var px = 200 * (5.5 * 36 * U) / (o.y1 - o.y0 + 1);           /* an o 5.5 steps tall */
  o = probe('o', px);
  var footY = (40 + 36 * 15.3) * U, span = (800 - 2 * 32) * U;  /* the o's ink foot; the widest allowed */
  function under(t) {
    var b = probe(t, px), w = b.x1 - b.x0 + 1, k = w > span ? span / w : 1;
    var c = document.createElement('canvas'); c.width = R; c.height = R;
    var g = c.getContext('2d');
    g.save();
    g.translate(R / 2, footY - (o.y1 - o.base));                  /* o's foot on row 15.3 */
    g.scale(k, 1);
    g.font = px + 'px EvaHandSheet';
    g.fillText(t, -((b.x0 + b.x1) / 2 - b.left), 0);             /* the ink's middle on column 10 */
    g.restore();
    var d = g.getImageData(0, 0, R, R).data, s = '', i, v;
    for (i = 0; i < R * R; i++) {
      v = Math.round(255 - (d[i * 4 + 3] / 255) * (255 - GREY * 255));
      s += String.fromCharCode(v);
    }
    return { w: R, h: R, gray: s, k: k };
  }

  /* ---- the PDF: shSheet()'s own assembly, with one image more a box ---- */
  var pics = shPics(names), per = shPerPage(), n = names.length;
  var pages = Math.max(1, Math.ceil(n / per)), obj = [], kids = [], unders = [], narrowed = [];
  function add(s) { obj.push(s); return obj.length; }
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  for (var pgi = 0; pgi < pages; pgi++) {
    var count = Math.min(per, n - pgi * per), bits = shPack(names.slice(pgi * per, pgi * per + count));
    if (!bits) return { fail: 'shPack refused the names' };
    var mine = [], ims = [], pre = [], j;
    for (j = 0; j < count; j++) {
      var p = pics[pgi * per + j] || null;
      mine.push(p);
      if (p && p.w && p.h)
        ims.push('/Im' + j + ' ' + add('<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h +
          ' /ColorSpace /DeviceGray /BitsPerComponent 8 /Length ' + p.gray.length + ' >>\nstream\n' + p.gray + '\nendstream') + ' 0 R');
      var u = under(names[pgi * per + j]);
      if (u.k < 1) narrowed.push(names[pgi * per + j] + ' x' + Math.round(u.k * 100) / 100);
      unders.push(u);
      ims.push('/Gj' + j + ' ' + add('<< /Type /XObject /Subtype /Image /Width ' + u.w + ' /Height ' + u.h +
        ' /ColorSpace /DeviceGray /BitsPerComponent 8 /Length ' + u.gray.length + ' >>\nstream\n' + u.gray + '\nendstream') + ' 0 R');
      var bx = shBoxAt(pgi * per + j);
      pre.push('q ' + shNum(bx.side) + ' 0 0 ' + shNum(bx.side) + ' ' + shNum(bx.x) + ' ' + shNum(bx.y) + ' cm /Gj' + j + ' Do Q');
    }
    var body = pre.join('\n') + '\n' + shPageOps(pgi * per, count, mine, bits, pgi, pages);
    var cid = add('<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream');
    var pid = add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + shNum(SH_W) + ' ' + shNum(SH_H) +
      '] /Resources << /Font << /F1 3 0 R >> /XObject << ' + ims.join(' ') + ' >> >> /Contents ' + cid + ' 0 R >>');
    kids.push(pid + ' 0 R');
  }
  obj[1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages + ' >>';
  var out = '%PDF-1.4\n', off = [], i, s;
  for (i = 0; i < obj.length; i++) { off.push(out.length); out += (i + 1) + ' 0 obj\n' + obj[i] + '\nendobj\n'; }
  var xref = out.length;
  out += 'xref\n0 ' + (obj.length + 1) + '\n0000000000 65535 f \n';
  for (i = 0; i < off.length; i++) { s = '0000000000' + off[i]; out += s.slice(s.length - 10) + ' 00000 n \n'; }
  out += 'trailer\n<< /Size ' + (obj.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';

  /* ---- the proof: each page blank, drawn and read back by the app ---- */
  var K = 2, W = Math.round(SH_W * K), H = Math.round(SH_H * K), reads = [];
  for (pgi = 0; pgi < pages; pgi++) {
    count = Math.min(per, n - pgi * per);
    bits = shPack(names.slice(pgi * per, pgi * per + count));
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), Y = function (y) { return (SH_H - y) * K; };
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    for (j = 0; j < count; j++) {
      var bb = shBoxAt(pgi * per + j), uu = unders[pgi * per + j];
      var ic = document.createElement('canvas'); ic.width = uu.w; ic.height = uu.h;
      var ig = ic.getContext('2d'), id = ig.createImageData(uu.w, uu.h);
      for (i = 0; i < uu.w * uu.h; i++) { var v = uu.gray.charCodeAt(i);
        id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
      ig.putImageData(id, 0, 0);
      g.drawImage(ic, bb.x * K, Y(bb.y + bb.side), bb.side * K, bb.side * K);
      g.strokeStyle = 'rgb(209,209,209)'; g.lineWidth = 0.5 * K;
      g.strokeRect(bb.x * K, Y(bb.y + bb.side), bb.side * K, bb.side * K);
    }
    g.fillStyle = '#000';
    shMarks().forEach(function (m) { g.fillRect((m[0] - SH_MARK / 2) * K, Y(m[1] + SH_MARK / 2), SH_MARK * K, SH_MARK * K); });
    for (var yy = 0; yy < SH_CH; yy++) for (var xx = 0; xx < SH_CW; xx++) {
      if (!bits[yy * SH_CW + xx]) continue;
      var at = shCellAt(xx, yy);
      g.fillRect(at[0] * K, Y(at[1] + SH_CELL), SH_CELL * K, SH_CELL * K);
    }
    var scan = shScan(g.getImageData(0, 0, W, H).data, W, H);
    if (scan.fail) { reads.push({ page: pgi + 1, fail: scan.fail }); continue; }
    var nm = shReadStrip(scan.warp, scan.dark) || [], inked = [];
    for (j = 0; j < nm.length; j++) if (shBoxShape(scan, j, 300).length) inked.push(nm[j]);
    reads.push({ page: pgi + 1, names: nm.join(' '), inked: inked });
    if (pgi === 0) reads.png = c.toDataURL('image/png');
  }
  var bin = [];
  for (i = 0; i < out.length; i++) bin.push(out.charCodeAt(i) & 255);
  return { pdf: bin, reads: reads, narrowed: narrowed, png: reads.png };
}, { font, names: NAMES, GREY });
await br.close(); srv.close();
if (got.fail) { console.error(got.fail); process.exit(1); }

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(got.pdf));
const png = OUT.replace(/\.pdf$/, '-p1.png');
fs.writeFileSync(png, Buffer.from(got.png.split(',')[1], 'base64'));
let bad = 0;
for (const r of got.reads) {
  if (r.fail) { console.log(`page ${r.page}: the reader could not find the page (${r.fail})`); bad++; continue; }
  console.log(`page ${r.page}: names read back: ${r.names}`);
  console.log(`page ${r.page}: boxes read as ink with nothing drawn: ${r.inked.length ? r.inked.join(' ') : 'none'}`);
  if (r.inked.length) bad++;
}
if (got.narrowed.length) console.log('narrowed to fit the lattice: ' + got.narrowed.join(', '));
console.log(path.relative(ROOT, OUT) + '  ' + path.relative(ROOT, png));
process.exit(bad ? 1 : 0);
