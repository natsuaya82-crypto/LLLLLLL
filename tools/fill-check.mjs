/* An area is the inside of what somebody drew round, and it has to survive
   being put away.
   ---------------------------------------------------------------------
   Every other shape in this app is a nib swept along a line, and a filled
   stroke is the one that is not: `glyphContours` cuts the inside into
   triangles and adds them to the sweep. Nothing about that can throw -- a
   fill that is silently dropped gives a letter that is merely thinner, on a
   canvas that renders, in a font that installs, with every other check green.
   So it is counted in pixels, through the real drawing code, and asked for
   again after the letter has been saved and read back.

   「塗りボタンオン。緑色の線が出現。三点以上の囲われた部分が塗られる。
     それ以上はなにも起きない」

   Run: node tools/fill-check.mjs                                        */
import { seed } from './fixture.mjs';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
/* playwright the way the other browser checks load it. A bare
   `import { chromium } from 'playwright'` fails at module load on a machine
   where playwright is installed globally rather than into node_modules, and
   because npm test is an && chain, everything after this check stops running
   too -- this file and round-check were the only two not doing it, and they
   took press down with them. */
import fs from 'fs';
import { chromium, LAUNCH } from './browser.mjs';
/* and the browser itself, which may not be at the container's path either */

const br = await chromium.launch(LAUNCH);
const pg = await br.newPage({ viewport:{width:390,height:844} });
await pg.goto('file://' + path.join(dir,'..','www','index.html'));
await pg.waitForSelector('#splash', { state:'detached', timeout:10000 });

const r = await pg.evaluate(({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.theme = 'light'; SET.myfont = true;
  var o = GGRID.inset, D = geStep(), P = function(i,j){ return [o+i*D, o+j*D]; };
  var out = {};

  /* how much of a 200px square the real drawing code blackens */
  function ink(st){
    var c = document.createElement('canvas'); c.width = 200; c.height = 200;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 200, 200);
    inkStrokes(x, st, 200/800, 0, 0, '#000');
    var d = x.getImageData(0, 0, 200, 200).data, n = 0, i;
    for (i = 0; i < d.length; i += 4) if (d[i] < 128) n++;
    return n;
  }

  var tri = [P(4,4), P(16,4), P(10,16)];
  out.outline = ink([{ pts: tri }]);
  out.filled  = ink([{ pts: tri, fill: true }]);

  /* two points have no inside, and asking for one must not change them */
  var line = [P(4,4), P(16,4)];
  out.line     = ink([{ pts: line }]);
  out.lineFill = ink([{ pts: line, fill: true }]);

  /* An enclosure drawn as SEVERAL strokes, which is how a square gets drawn
     on a lattice: a side at a time, each one ending where the next begins.
     Every one of them carries the fill flag, because the button was on for
     all of them -- and the editor paints every one of them green, so it says
     an area is there.

     Each stroke's own ring is two points, and two points have no inside. So
     the letter came back with the green line right round it and nothing
     inside it: 「塗りも囲いにしてるのに塗られないけど？」 OWNER 2026-08-27.
     The photograph had five dots -- four corners and one part-way down the
     right-hand side, where two strokes met.

     What is asked for here is that the pieces are read as the one line they
     make. Not "close enough": the SAME ink as the same ring drawn in one go,
     because that is the shape somebody drew either way. */
  var ring = [P(4,4), P(16,4), P(16,12), P(16,16), P(4,16)];
  function sides(f){
    var o = [], i;
    for (i = 0; i < ring.length; i++) {
      o.push({ pts: [ring[i], ring[(i + 1) % ring.length]], fill: f || undefined });
    }
    return o;
  }
  out.pieces     = ink(sides(false));
  out.piecesFill = ink(sides(true));
  out.oneGo      = ink([{ pts: ring, closed: true, fill: true }]);

  /* and it is "as if drawn in one go" all the way, not only when the pieces
     happen to shut. Take the fill off ONE side of the ring and what is left
     marked is a chain of four that runs r3 r4 r0 r1 r2 and stops -- so it
     inks what that open line inks, which is what a single stroke through the
     same five points has always inked. A stroke that was never marked is not
     part of the area and does not join to one: the side whose fill was taken
     off is still DRAWN, as the plain line it now is, which is why it is in
     the comparison beside the chain. */
  var half = sides(true); delete half[2].fill;
  out.partial = ink(half);
  out.partialOne = ink([{ pts: [ring[3], ring[4], ring[0], ring[1], ring[2]],
                          fill: true },
                        { pts: [ring[2], ring[3]] }]);

  /* a shape that crosses itself is still a drawing and must come back */
  var bow = [P(4,4), P(16,16), P(16,4), P(4,16)];
  out.bow     = ink([{ pts: bow }]);
  out.bowFill = ink([{ pts: bow, fill: true }]);

  /* No seam. The inside is cut into triangles, and a canvas that fills each
     contour on its own leaves a pale hairline along every cut -- two edges
     antialiasing against each other never reach the coverage of one solid
     area. Read the middle row of a filled square: every pixel between the
     edges has to be the full ink, not 3/4 of it. */
  var sq = [P(4,4), P(16,4), P(16,16), P(4,16)];
  (function(){
    var c = document.createElement('canvas'); c.width = 200; c.height = 200;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 200, 200);
    inkStrokes(x, [{ pts: sq, closed: true, fill: true }], 200/800, 0, 0, '#000');
    var d = x.getImageData(0, 100, 200, 1).data, i, lo = 999, hi = -1, pale = 0;
    for (i = 0; i < 200; i++) if (d[i*4] < 250) { if (i < lo) lo = i; hi = i; }
    for (i = lo + 3; i <= hi - 3; i++) if (d[i*4] > 8) pale++;
    out.seam = pale;
    out.span = hi - lo;
  })();

  /* saved, read back, and drawn again -- a flag dropped on the way to
     storage looks exactly like a fill that was never asked for */
  var l = LETTERS[0];
  GE = newGE(l.id, ltName(l));
  GE.st = [{ pts: tri, fill: true }];
  geSave();
  var back = (ltById(l.id) || {}).st || [];
  out.kept = !!(back[0] && back[0].fill);
  out.reopened = ink(back);

  /* and the editor shows an area in its own colour, not the letter's */
  out.green = cssVar('--fill') || '';
  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.filled > r.outline * 2,
    'a triangle inks ' + r.outline + 'px drawn and ' + r.filled + 'px filled');
say(r.lineFill === r.line,
    'two points have no inside: ' + r.line + 'px either way');
say(r.bowFill > r.bow,
    'a stroke that crosses itself still inks: ' + r.bow + ' -> ' + r.bowFill + 'px');
say(r.piecesFill > r.pieces * 2,
    'an enclosure drawn as five strokes inks ' + r.pieces + 'px drawn and '
    + r.piecesFill + 'px filled');
say(r.piecesFill === r.oneGo,
    'drawn a side at a time or in one go it is the same ' + r.oneGo + 'px'
    + (r.piecesFill === r.oneGo ? '' : ' (pieces: ' + r.piecesFill + 'px)'));
say(r.partial === r.partialOne,
    'the fill off one side leaves the chain that is left, ' + r.partialOne
    + 'px, and it is the same either way'
    + (r.partial === r.partialOne ? '' : ' (pieces: ' + r.partial + 'px)'));
say(r.seam === 0,
    'a filled square is solid across all ' + r.span + 'px of it, no seam at a cut');
say(r.kept, 'the flag is still on the stroke after geSave()');
say(r.reopened === r.filled,
    'saved and read back it draws the same ' + r.reopened + 'px');
say(!!r.green, 'the editor has a colour of its own for an area: ' + r.green);

if (bad.length) { console.error('\nfill: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nfill: an area is drawn, is not invented, and survives being saved.');
