/* ---------------------------------------------------------------------------
   tools/line-path.mjs — one line of a language, as a single <path>.

   Run it:   node tools/line-path.mjs
             node tools/line-path.mjs "kano tir mos"

   NOT a gate. An experiment, like feed-weight.mjs, and the thing it is
   working out is how a post gets frozen.

   tools/feed-weight.mjs said a feed should be one <svg> per post with every
   letter merged into a single <path>: three hundred nodes for a hundred
   posts, against nine thousand seven hundred for the obvious way. This is
   that merge, done against the app's real letters instead of made-up ones,
   and checked the only way it can honestly be checked.

   A line is not all one thing. A letter here is drawn (strokes of points on
   the 0..800 grid), or borrowed (a Unicode character somebody picked), or not
   yet anything. Only the drawn ones can be a path, so a line comes out as
   runs -- a merged path, a borrowed character, another merged path. That is
   still a handful of nodes per post rather than one per letter, which is the
   whole point, and it is worth knowing now rather than when a post refuses to
   render because somebody borrowed a Greek qoppa in the middle of a word.

   How it is checked. The line is drawn twice and the two drawings are
   compared as pixels. The merged one has every coordinate moved along by
   hand; the other keeps each letter's coordinates untouched and lets the
   renderer's own transform put it in place. So the comparison is my
   arithmetic against SVG's, and the merge is right when it is invisible.

   The first version of this check compared the merged path against itself,
   cut back up along its M commands. It agreed perfectly and would have agreed
   however wrong the offsets were.

   Two drawings of the same geometry do not rasterise identically -- one path
   of many subpaths is filled as one shape, a dozen transformed paths are
   composited one at a time -- so a fraction of a channel along the edges is
   expected and is reported rather than hidden:

     correct            528 pixels of 234,080 differ, worst by  44/255
     one letter +40      2,241 pixels,                 worst by 238/255

   Ink in the wrong place is not a subtle difference. That is what the
   tolerance is for and what it is set well inside of.
   --------------------------------------------------------------------------- */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { seed } from './fixture.mjs';

const req = createRequire(import.meta.url);
function loadChromium(){
  try { return req('playwright').chromium; } catch (e) {}
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return req(path.join(g, 'playwright')).chromium;
  } catch (e) {}
  console.error('playwright is not installed. npm i -g playwright');
  process.exit(2);
}
const chromium = loadChromium();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'shots');
const PORT = 8125;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const LINE = process.argv[2] || 'kano tir mos sar';

const srv = http.createServer((q, r) => {
  const f = path.join(WWW, q.url === '/' ? 'index.html' : q.url.split('?')[0]);
  let body;
  try { body = fs.readFileSync(f); } catch (e) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain',
                     'Cache-Control': 'no-store' });
  r.end(body);
}).listen(PORT);
fs.mkdirSync(OUT, { recursive: true });

const br = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
const pg = await br.newPage({ viewport: { width: 800, height: 400 } });
await pg.goto(`http://localhost:${PORT}/`);
await pg.evaluate((s) => {
  eval('(' + s + ')()');
  SET.done = true;
  /* The fixture's alphabet is three letters, which is honest about a
     half-built language and useless for looking at a line. Give every sound
     a drawn letter -- invented shapes, but the app's real letter records,
     its real lookup and its real stroke format. What is under test is the
     arithmetic and the drawing, not whether the shapes are handsome. */
  var made = [];
  SET.snd.forEach(function(u, i){
    var a = (i * 37) % 360, r = 260;
    function pt(k){
      var t = (a + k * 97) * Math.PI / 180;
      return [Math.round(400 + Math.cos(t) * r), Math.round(400 + Math.sin(t) * r)];
    }
    made.push({ id: 'x' + i, st: [{ pts: [pt(0), pt(1), pt(2)] }], ch: '', nm: '', snd: [u] });
  });
  /* one borrowed character in the middle, because a real line has them and
     they are the thing that cuts a run in two */
  made[3] = { id: 'x3', st: null, ch: '\u03D8', nm: '', snd: [SET.snd[3]] };
  LETTERS = made;
}, seed.toString());

const out = await pg.evaluate((line) => {
  /* ---- the line, as the app already understands it ---------------------
     A word is roman letters; phIpa/wsUnits turn it into the units the
     writing system is built out of. Ask the app rather than guessing, so
     this stays true when the phonology changes. */
  var units = [];
  line.split(/\s+/).forEach(function(w, wi){
    if (wi) units.push(' ');
    /* the sounds of the word as the dictionary already records them */
    var rec = null, i;
    for (i = 0; i < WORDS.length; i++) if (WORDS[i].hw === w) rec = WORDS[i];
    var ph = (rec && rec.ph && rec.ph.length) ? rec.ph : w.split('');
    ph.forEach(function(u){ units.push(u); });
  });

  /* ---- what each unit can be written as -------------------------------- */
  var GRID = 800, GAP = 80;
  function inkOf(st){
    var x0 = 1e9, x1 = -1e9, i, j, p;
    for (i = 0; i < st.length; i++) for (j = 0; j < st[i].pts.length; j++) {
      p = st[i].pts[j];
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
    }
    return x1 < x0 ? null : { x0: x0, x1: x1 };
  }
  /* strokes -> "M x y L x y ..." at an offset. The only arithmetic in here. */
  function strokesToD(st, dx){
    var d = '', i, j, p;
    for (i = 0; i < st.length; i++) {
      for (j = 0; j < st[i].pts.length; j++) {
        p = st[i].pts[j];
        d += (j ? 'L' : 'M') + (p[0] + dx) + ' ' + p[1];
      }
    }
    return d;
  }

  /* ---- lay the line out, and cut it into runs --------------------------
     A run is as many drawn letters in a row as there are. A borrowed
     character ends one, because a character is text and text is not a path. */
  var runs = [], cur = null, x = 0, glyphs = 0, borrowed = 0, missing = 0;
  units.forEach(function(u){
    if (u === ' ') { x += GRID / 2; if (cur) { runs.push(cur); cur = null; } return; }
    var st = (typeof ltStrokes === 'function') ? ltStrokes(u) : null;
    var ch = (typeof ltChar === 'function') ? ltChar(u) : '';
    if (st && st.length) {
      var ink = inkOf(st);
      if (!ink) return;
      if (!cur) cur = { kind: 'path', d: '', at: [] };
      cur.at.push({ st: st, dx: x - ink.x0 });
      cur.d += strokesToD(st, x - ink.x0);
      x += (ink.x1 - ink.x0) + GAP;
      glyphs++;
    } else if (ch) {
      if (cur) { runs.push(cur); cur = null; }
      runs.push({ kind: 'text', ch: ch, x: x });
      x += GRID * 0.6;
      borrowed++;
    } else {
      missing++;
    }
  });
  if (cur) runs.push(cur);

  /* ---- draw it twice ---------------------------------------------------- */
  var W = Math.max(x, 1);
  function svg(inner){
    return '<svg viewBox="0 0 ' + W + ' ' + GRID + '" width="760" ' +
           'style="stroke:#111;fill:none;stroke-width:26;stroke-linecap:round;' +
           'stroke-linejoin:round;display:block">' + inner + '</svg>';
  }
  /* one node per letter: what you write first */
  var perGlyph = '', merged = '';
  runs.forEach(function(r){
    if (r.kind === 'text') {
      var t = '<text x="' + r.x + '" y="' + (GRID * 0.8) + '" font-size="' + GRID * 0.8 +
              '" style="fill:#111;stroke:none">' + r.ch + '</text>';
      perGlyph += t; merged += t;
    } else {
      /* The baseline is NOT this run's d cut back up: that would be the same
         arithmetic checked against itself, and it would agree however wrong
         the offsets were. Each letter keeps its own untouched coordinates and
         is put in place by the renderer's own transform. So what is being
         compared is my sums against SVG's. */
      r.at.forEach(function(g){
        perGlyph += '<g transform="translate(' + g.dx + ' 0)">' +
                    '<path d="' + strokesToD(g.st, 0) + '"/></g>';
      });
      merged += '<path d="' + r.d + '"/>';
    }
  });

  /* Both drawings go in the same box, one after the other, and each is
     photographed where the other stood. Side by side they sit on different
     subpixels and antialias differently, which reads as a difference in the
     merge when it is a difference in position. */
  window.__draw = function(which){
    document.body.innerHTML =
      '<div id="a" style="background:#fff;padding:10px">' +
      svg(which === 'merged' ? merged : perGlyph) + '</div>';
  };
  /* Compare the two drawings as pixels, in here, rather than as PNG files
     outside. A byte comparison of two PNGs answers a different question --
     encoders are free to vary -- and it cannot say how far apart they are
     when they do differ. This rasterises both at the same size and counts. */
  window.__diff = function(){
    var doc = function(inner){
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + GRID +
        '" width="1520" height="' + Math.round(1520 * GRID / W) + '">' +
        '<rect width="100%" height="100%" fill="#fff"/><g style="stroke:#111;fill:none;' +
        'stroke-width:26;stroke-linecap:round;stroke-linejoin:round">' + inner + '</g></svg>');
    };
    function load(src){
      return new Promise(function(res, rej){
        var im = new Image();
        im.onload = function(){ res(im); };
        im.onerror = rej;
        im.src = src;
      });
    }
    return Promise.all([load(doc(perGlyph)), load(doc(merged))]).then(function(ims){
      var w = ims[0].width, h = ims[0].height, d = [], i;
      for (i = 0; i < 2; i++) {
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var x = c.getContext('2d');
        x.drawImage(ims[i], 0, 0);
        d.push(x.getImageData(0, 0, w, h).data);
      }
      var off = 0, worst = 0, k, delta;
      for (k = 0; k < d[0].length; k += 4) {
        delta = Math.abs(d[0][k] - d[1][k]);
        if (delta) { off++; if (delta > worst) worst = delta; }
      }
      return { pixels: (w * h), differing: off, worst: worst };
    });
  };

  function nodes(which){
    window.__draw(which);
    return document.getElementById('a').getElementsByTagName('*').length;
  }
  var nPer = nodes('perGlyph'), nMer = nodes('merged');
  window.__draw('perGlyph');

  return {
    line: line,
    units: units.length,
    glyphs: glyphs, borrowed: borrowed, missing: missing,
    runs: runs.length,
    nodesPerGlyph: nPer, nodesMerged: nMer,
    bytes: merged.length
  };
}, LINE);

const diff = await pg.evaluate(() => window.__diff());
await pg.evaluate(() => window.__draw('perGlyph'));
fs.writeFileSync(path.join(OUT, 'line-per-glyph.png'), await (await pg.$('#a')).screenshot());
await pg.evaluate(() => window.__draw('merged'));
fs.writeFileSync(path.join(OUT, 'line-merged.png'), await (await pg.$('#a')).screenshot());
/* Two drawings of the same geometry do not rasterise identically: one path
   of many subpaths is filled as one shape, and a dozen transformed paths are
   composited one at a time, so their antialiased edges differ. What cannot
   differ is where the ink is. A letter in the wrong place lights up thousands
   of pixels at the full 255; edges disagreeing by a fraction of a channel
   along 0.2% of the picture is the renderer, not the sums. */
const same = diff.worst < 128 && diff.differing < diff.pixels / 100;

await br.close();
srv.close();

console.log(`"${out.line}"\n`);
console.log(`  units          ${out.units}`);
console.log(`  drawn          ${out.glyphs}`);
console.log(`  borrowed       ${out.borrowed}   (a character, not a path — ends a run)`);
console.log(`  not written    ${out.missing}`);
console.log(`  runs           ${out.runs}`);
console.log(`  nodes          ${out.nodesPerGlyph} per glyph -> ${out.nodesMerged} merged`);
console.log(`  merged path    ${out.bytes} bytes`);
console.log(`  pixels         ${diff.differing} of ${diff.pixels} differ` +
            (diff.differing ? `, worst by ${diff.worst}/255` : ''));
console.log(`\n  ${same ? 'identical: the merge is invisible, which is what correct looks like'
                       : 'DIFFERENT — the merged line does not draw what the letters draw'}`);
console.log('  shots/line-per-glyph.png  shots/line-merged.png');
process.exit(same ? 0 : 1);
