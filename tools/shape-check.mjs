/* A letter brought in on a sheet is ink already, and its holes are holes.
   ---------------------------------------------------------------------
   Every other shape in this app is a nib swept along a line. A letter drawn
   somewhere else and handed back on a sheet is neither that nor a filled
   stroke: it arrives as rings of outline in the same 800 square, and nothing
   may redraw it. 「取り込んだやつを上から描き直してるからそうなるんでしょ？」

   Two things about it can go wrong and neither one throws.

   A HOLE THAT FILLS IN. The font installs, the letter appears, and it is not
   a letter, it is a stain -- the ring of 火, the eye of a face, solid. So it
   is counted in pixels, through the real drawing code, on a canvas that fills
   NON-ZERO, which is the rule the font obeys. A canvas filled even-odd draws
   the holes correctly whether or not the winding is right, so proving it that
   way proves nothing: five of the sixteen cases in the edge follower were
   reversed once, silently, and an even-odd fill said everything was well. The
   hole is therefore asked for BOTH ways round -- wound against its outer and
   wound with it -- because which ring is a hole is settled here by
   containment and not by a winding somebody else got right.

   A CONTOUR THAT IS NOT CONVEX. spanAt in otf5.js takes the ink at a height
   as the min and max over a contour, which is only true where a contour meets
   a horizontal line in exactly one interval -- and it is what lets this font
   writer place a letter without rasterising anything. Hand it one imported
   ring, which is big and concave, and the letter does not fail: it gets
   FATTER at some heights than at others, in a font that installs. So every
   contour that leaves glyphContours is measured, corner by corner.

   And that nothing is swept: an imported letter inks exactly the area of the
   rings it came in as. A pen laid along them would be bigger, and it would be
   this app's pen rather than the person's.

   Run: node tools/shape-check.mjs                                        */
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
  SET.done = true; SET.theme = 'light'; SET.myfont = true;
  var out = {};

  function sq(a, b){ return [[a,a],[b,a],[b,b],[a,b]]; }
  function rev(r){ return r.slice().reverse(); }

  /* the real drawing code, on a canvas that fills non-zero -- which is what
     inkStrokes does and what a font rasteriser does */
  var N = 400, K = N / 800;
  function draw(sh){
    var c = document.createElement('canvas'); c.width = N; c.height = N;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, N, N);
    inkStrokes(x, sh, K, 0, 0, '#000');
    return x.getImageData(0, 0, N, N).data;
  }
  /* how much of a patch in AUTHORING units came out dark, inset so that no
     answer turns on one antialiased pixel at an edge */
  function darkIn(d, x0, y0, x1, y1){
    var a = Math.round(x0*K)+3, b = Math.round(y0*K)+3,
        c = Math.round(x1*K)-3, e = Math.round(y1*K)-3, n = 0, x, y;
    for (y = b; y <= e; y++) for (x = a; x <= c; x++)
      if (d[(y * N + x) * 4] < 128) n++;
    return n;
  }
  function box(x0, y0, x1, y1){
    return (Math.round(x1*K)-3 - (Math.round(x0*K)+3) + 1) *
           (Math.round(y1*K)-3 - (Math.round(y0*K)+3) + 1);
  }

  /* -- a ring with a hole, both ways round ------------------------------ */
  var ring = [sq(100,700), rev(sq(300,500))];
  var same = [sq(100,700), sq(300,500)];
  var d1 = draw(ring), d2 = draw(same);
  out.holeOpp  = darkIn(d1, 300, 300, 500, 500);
  out.holeSame = darkIn(d2, 300, 300, 500, 500);
  out.holeBox  = box(300, 300, 500, 500);
  /* and the ink around it is really there -- an empty canvas has an empty
     hole too, so the hole alone says nothing */
  out.inkOpp  = darkIn(d1, 120, 120, 280, 280);
  out.inkSame = darkIn(d2, 120, 120, 280, 280);
  out.inkBox  = box(120, 120, 280, 280);

  /* -- 回: a ring inside a hole is ink again ---------------------------- */
  var nest = [sq(50,750), rev(sq(150,650)), sq(250,550), rev(sq(350,450))];
  var d3 = draw(nest);
  out.n1 = darkIn(d3, 60, 60, 140, 140);      /* outer wall      -- ink   */
  out.n2 = darkIn(d3, 160, 160, 240, 240);     /* first hole      -- paper */
  out.n3 = darkIn(d3, 260, 260, 340, 340);     /* the ring inside -- ink   */
  out.n4 = darkIn(d3, 360, 360, 440, 440);     /* its own hole    -- paper */
  out.nBox = box(60, 60, 140, 140);

  /* -- a concave outer, which is what an imported ring actually is ------
        Every ring above is a square, and a square is already convex: hand
        one straight to the font and it comes back convex without a triangle
        being cut, so a check built only on those says nothing at all about
        the rule it exists for. An elbow with a hole in its long arm is the
        shape that has to be cut. */
  var elbow = [[[100,100],[400,100],[400,400],[700,400],[700,700],[100,700]],
               rev(sq(450,600))];
  var d4 = draw(elbow);
  out.e1 = darkIn(d4, 150, 150, 350, 350);   /* the standing arm -- ink   */
  out.e2 = darkIn(d4, 450, 150, 650, 350);   /* the notch        -- paper */
  out.e3 = darkIn(d4, 450, 450, 600, 600);   /* the hole         -- paper */
  out.eBox = box(150, 150, 350, 350);

  /* -- every contour convex, and nothing swept -------------------------- */
  function look(sh){
    var cs, bad = 0, area = 0, i;
    /* the same guard inkStrokes has: a road that stops being taken throws
       here and draws nothing there, and nothing there is the quiet half */
    try{ cs = LinguaFont.glyphContours(inkDef(sh), GPEN); }catch(e){ return {n:0, bad:0, area:0, threw:String(e)}; }
    for (i = 0; i < cs.length; i++){
      area += Math.abs(LinguaFont.signedArea(cs[i]));
      if (!convex(cs[i])) bad++;
    }
    return { n: cs.length, bad: bad, area: Math.round(area) };
  }
  function convex(c){
    var n = c.length, sign = 0, i, a, b, d, z;
    for (i = 0; i < n; i++){
      a = c[i]; b = c[(i+1) % n]; d = c[(i+2) % n];
      z = (b[0]-a[0]) * (d[1]-b[1]) - (b[1]-a[1]) * (d[0]-b[0]);
      if (!z) continue;
      if (sign && (z > 0) !== (sign > 0)) return false;
      sign = z;
    }
    return true;
  }
  out.ring = look(ring);
  out.same = look(same);
  out.nest = look(nest);
  out.plain = look([sq(100,700)]);
  out.elbow = look(elbow);
  out.elbowRaw = (function(){
    var raw = 0, i;
    for (i = 0; i < elbow.length; i++) if (!convex(elbow[i])) raw++;
    return raw;
  })();
  /* the same square as a stroke the app swept, for the size of the difference */
  var swept = LinguaFont.glyphContours({strokes:[{pts:sq(100,700), closed:true, fill:true}]}, GPEN),
      sa = 0, si;
  for (si = 0; si < swept.length; si++) sa += Math.abs(LinguaFont.signedArea(swept[si]));
  out.sweptArea = Math.round(sa);

  /* -- a line of ink can place it --------------------------------------- */
  var adv = inkAdv(ring);
  out.adv = adv ? { x0: Math.round(adv.x0), x1: Math.round(adv.x1) } : null;

  /* -- a drawn letter is untouched, and it is read BEFORE anything below
        turns one into a shape ------------------------------------------- */
  var drawn = LETTERS.filter(function(q){ return q.st && q.st.length; })[0];
  out.drawn = drawn ? look(drawn.st) : null;
  out.drawnWas = drawn ? JSON.stringify(LinguaFont.glyphContours({strokes:drawn.st}, GPEN)) : '';
  out.drawnNow = drawn ? JSON.stringify(LinguaFont.glyphContours(inkDef(drawn.st), GPEN)) : '';

  /* -- and it goes into the real font ----------------------------------- */
  var l = LETTERS[0];
  delete l.st;
  /* the sig is read with the letter already emptied of strokes, so that what
     moves it is the shape arriving and not the strokes leaving. Read before
     the delete it moved either way, and the claim below was green with the
     shape left out of scriptSig() altogether. */
  out.sigBefore = scriptSig();
  l.sh = ring;
  out.sigAfter = scriptSig();
  out.geo = (inkGeo(l) === l.sh);
  installScriptFont();
  out.built = SFONT.built;
  var f = LinguaFont.build([{name:'x', roman:'x', sh:elbow}],
            {mode:'center', pen:GPEN, side:geSide(),
             asc:geInkTop(), desc:geInkTop()-geInkSpan()-geStep()});
  var cs = f.metrics.x.contours, cb = 0, ci;
  for (ci = 0; ci < cs.length; ci++) if (!convex(cs[ci])) cb++;
  out.font = { n: cs.length, bad: cb, bytes: f.bytes.length };
  /* and the letter is in the typing face, so the Lingua keyboard can put it
     in a field -- a letter nothing can type is a letter that does not exist */
  out.typed = ltPuaOrder().filter(function(q){ return q.id === l.id; }).length;

  return out;
}, { s: seed.toString() });
await br.close();

var bad = [];
function say(ok, line){ console.log('  ' + (ok ? '' : 'FAILED  ') + line); if (!ok) bad.push(line); }

say(r.holeOpp === 0,
    'a hole wound against its outer stays paper: ' + r.holeOpp + ' of ' + r.holeBox + 'px inked');
say(r.holeSame === 0,
    'and wound WITH it, which is the mistake nobody sees: ' + r.holeSame + ' of ' + r.holeBox + 'px inked');
say(r.inkOpp === r.inkBox && r.inkSame === r.inkBox,
    'the wall around it is solid either way: ' + r.inkOpp + '/' + r.inkSame + ' of ' + r.inkBox + 'px');
say(r.n1 === r.nBox && r.n2 === 0 && r.n3 === r.nBox && r.n4 === 0,
    'and it alternates all the way down: ' + r.n1 + ' ' + r.n2 + ' ' + r.n3 + ' ' + r.n4 +
    ' of ' + r.nBox + 'px');
say(r.e1 === r.eBox && r.e2 === 0 && r.e3 === 0,
    'a concave outer inks its arm and neither its notch nor its hole: ' +
    r.e1 + '/' + r.eBox + ', ' + r.e2 + ', ' + r.e3 + 'px');

say(r.elbowRaw === 1,
    'the elbow really is concave to start with, or the line below proves nothing');
say(r.ring.bad === 0 && r.same.bad === 0 && r.nest.bad === 0 && r.plain.bad === 0 &&
    r.elbow.bad === 0,
    'every contour handed on is convex, which is what spanAt is allowed to assume: ' +
    (r.ring.bad + r.same.bad + r.nest.bad + r.plain.bad + r.elbow.bad) + ' of ' +
    (r.ring.n + r.same.n + r.nest.n + r.plain.n + r.elbow.n) + ' are not');
say(Math.abs(r.elbow.area - 247500) < 1200,
    'and the elbow covers its own area and no more: ' + r.elbow.area + ' of 247500 units');
say(Math.abs(r.ring.area - 320000) < 1200,
    'and they cover the rings and no more: ' + r.ring.area + ' of 320000 units');
say(Math.abs(r.plain.area - 360000) < 1200 && r.sweptArea > r.plain.area * 1.05,
    'nothing is swept: ' + r.plain.area + ' units as brought in, ' + r.sweptArea +
    ' with this app’s pen laid along it');
say(!!r.adv && r.adv.x0 === 100 && r.adv.x1 === 700,
    'a line of ink knows where it stands: ' + (r.adv ? r.adv.x0 + '..' + r.adv.x1 : 'nowhere'));

say(r.geo, 'inkGeo answers with the shape when a letter has one');
say(r.sigAfter !== r.sigBefore,
    'and the font is rebuilt when a shape arrives, with nothing else moving');
say(r.built, 'installScriptFont built a font with it in');
say(r.font.n > 0 && r.font.bad === 0,
    'the real font writer emits ' + r.font.n + ' contours, none of them concave, ' +
    r.font.bytes + ' bytes');
say(r.typed === 1, 'and the Lingua keyboard can type it');

say(!!r.drawn && r.drawn.bad === 0 && r.drawnWas === r.drawnNow && !!r.drawnWas,
    'a letter drawn in the app still goes down its own road, contour for ' +
    'contour: ' + (r.drawn ? r.drawn.n : 0) + ' of them, swept by the pen');

if (bad.length) { console.error('\nshape: ' + bad.length + ' failed'); process.exit(1); }
console.log('\nshape: a letter brought in on a sheet is ink already -- its holes are\n' +
            '       holes whichever way they were walked, every contour it hands the\n' +
            '       font is convex, and nothing was redrawn with this app’s pen.');
