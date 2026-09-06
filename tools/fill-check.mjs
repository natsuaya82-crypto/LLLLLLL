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

const r = await pg.evaluate(async ({s}) => {
  eval('(' + s + ')()');
  SET.done = true; SET.theme = 'light'; SET.myfont = true;
  function wait(ms){ return new Promise(function(f){ setTimeout(f, ms); }); }
  /* A WIRE THAT ANSWERS. The Save in the bar is not saved until it is up
     (www/shell.js § keepSave -> netSaveNow), so a press with nothing on the
     other end never lands, never levels the buffer and never lets the screen
     go -- and this file would then be asking about a road that stopped
     half way. What is on the other end is not this check's subject: it
     answers everything, and whether a save that does NOT land stops is
     again-check's. */
  window.__SENT = [];
  netSend = function(method, p, body, tok, ok){
    window.__SENT.push(method + ' ' + p);
    setTimeout(function(){
      ok(method === 'POST' && p.indexOf('/rest/v1/language') === 0
         ? [{ id:'srv1' }] : []);
    }, 0);
  };
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
  /* **The BUTTON, not a function.** The drawing is a buffer now
     (www/shell.js § KEEP, www/glyph.js § geKeepOn): the Save stands in the
     bar and geSave() is gone. A check that calls a function goes green on the
     day the button stops being wired to it, so this stands on the screen the
     way editLetter() puts somebody there, leaves the drawing in the buffer
     the way a finger does (geKeepPut), and clicks what is in the corner. */
  editLetter(l.id); render();
  GE.st = [{ pts: tri, fill: true }];
  geKeepPut();
  document.querySelector('[data-do="keepPress"]').click();
  await wait(60);
  /* not `back` -- that is the app's back arrow, and a `var back` here hoists
     over it for the whole of this function */
  var readBack = (ltById(l.id) || {}).st || [];
  out.kept = !!(readBack[0] && readBack[0].fill);
  out.reopened = ink(readBack);

  /* ---- and it survives the way OUT, which is the arrow ----------------
     「戻るは保存しますか？のポップ使ってほしい。他で使ってるのそのまま流用。
     文字も単語も一緒」 OWNER 2026-09-05.

     The arrow used to write the drawing onto the letter as the screen was
     left (geLeft, 2026-08-27), and that decision is superseded: the arrow
     ASKS now, and 「はい」 is the same Save as the one in the bar
     (www/shell.js § keepAsked). What this file is about is unchanged --
     a fill dropped on the way to storage and a fill dropped on the way OUT
     of the editor are the same letter arriving thinner, and neither throws.

     So the arrow is asked three things: it writes nothing by itself, it
     throws nothing away, and the area is on the letter once the Yes has
     been pressed.

     Driven the way the app drives it: editGlyph() to get onto the screen,
     strokes onto GE, geKeepPut() for what the finger leaves in the buffer,
     then back(), which is what the arrow is wired to. */
  var l2 = LETTERS[1] || LETTERS[0];
  var sq2 = [P(5,5), P(15,5), P(15,15), P(5,15)];
  editGlyph(ltName(l2) || l2.id); render();
  GE.st = [{ pts: sq2, closed: true, fill: true }];
  geKeepPut();
  var lid2 = GE.lid;                       /* the Yes is about to let GE go */
  back();
  out.leftAsked = popOn();
  /* nothing written by the arrow alone, and the drawing still on the paper */
  out.leftQuiet = ((ltById(lid2) || {}).st || []).length === 0;
  out.leftHeld  = ink(geInk(GE.st));
  document.querySelector('[data-do="popYes"]').click();
  await wait(60);
  var kept = (ltById(lid2) || {}).st || [];
  out.leftKept  = kept.length;
  out.leftFill  = !!(kept[0] && kept[0].fill);
  out.leftInk   = ink(kept);
  out.leftWant  = ink([{ pts: sq2, closed: true, fill: true }]);
  /* and the screen is not still holding it: a drawing that is both written
     down and still in GE comes back twice the next time the editor opens */
  out.leftGone = (GE === null);

  /* ---- and it survives a step back and a step forward -----------------
     「進むはキーボードと同じで！」 OWNER 2026-08-27.

     A fill is a flag on a stroke, so it travels with the drawing on both
     stacks -- and that is exactly the kind of claim this file exists to
     stop trusting. Nothing about a dropped fill throws: the letter comes
     back a line where it was an area, on a canvas that renders. So it is
     counted in pixels through the real drawing code, on the way back and on
     the way forward again, the same as everything else here. */
  GE = newGE(l.id, ltName(l));
  GE.st = [{ pts: tri }]; GE.si = 0; GE.seal = true;
  var plain = ink(GE.st);
  geFill();                                  /* the button, not the flag */
  out.fFilled = ink(GE.st);
  geUndo();
  out.fBack = ink(GE.st);
  geRedo();
  out.fFwd  = ink(GE.st);
  out.fPlain = plain;
  /* and the flag itself, not only the pixels: a stroke that came back
     without it inks the same as one that never had it, and only one of
     those two is what somebody drew */
  out.fFlag = !!(GE.st[0] && GE.st[0].fill);

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
say(r.fFilled > r.fPlain * 2,
    'the fill button blackens the triangle: ' + r.fPlain + 'px -> ' + r.fFilled + 'px');
say(r.fBack === r.fPlain,
    'a step back takes the area off again -- ' + r.fBack + 'px');
say(r.fFwd === r.fFilled,
    'and the step forward gives the same area back -- ' + r.fFwd + 'px');
say(r.fFlag, 'and the stroke carries the flag again, not only the pixels');
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
say(r.kept, 'the flag is still on the stroke after the Save in the bar');
say(r.reopened === r.filled,
    'saved and read back it draws the same ' + r.reopened + 'px');
say(r.leftAsked, 'the arrow asks before it lets a drawing go');
say(r.leftQuiet, 'and writes nothing by itself');
say(r.leftHeld === r.leftWant,
    'and the area is still on the paper while it asks -- ' + r.leftHeld + 'px'
    + (r.leftHeld === r.leftWant ? '' : ' (wanted ' + r.leftWant + 'px)'));
say(r.leftKept > 0,
    'the Yes writes the drawing: ' + r.leftKept + ' stroke(s)');
say(r.leftFill, 'and it is still an area once written, not a line');
say(r.leftInk === r.leftWant,
    'and it draws the same ' + r.leftWant + 'px as it did on the screen'
    + (r.leftInk === r.leftWant ? '' : ' (kept: ' + r.leftInk + 'px)'));
say(r.leftGone, 'and the editor is not still holding a second copy of it');
say(!!r.green, 'the editor has a colour of its own for an area: ' + r.green);

if (bad.length) { console.error('\nfill: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nfill: an area is drawn, is not invented, and survives being saved.');
